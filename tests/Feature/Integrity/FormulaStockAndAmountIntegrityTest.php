<?php

namespace Tests\Feature\Integrity;

use App\Domains\Composition\DTOs\CompositionItemData;
use App\Domains\Composition\DTOs\SaveCompositionData;
use App\Domains\Composition\Services\CompositionService;
use App\Domains\Returns\DTOs\ReturnCreateData;
use App\Domains\Returns\DTOs\ReturnItemData;
use App\Domains\Returns\Services\ReturnService;
use App\Domains\Sales\DTOs\CreateSaleData;
use App\Domains\Sales\DTOs\SaleItemData;
use App\Domains\Sales\Services\SaleService;
use App\Models\Contact;
use App\Models\InventoryTransaction;
use App\Models\Product;
use App\Models\ProductComposition;
use App\Models\Sale;
use App\Models\SellingUnit;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Validation\ValidationException;
use Tests\TestCase;

/**
 * P11 integrity regressions: server-side enforcement of stock and money rules
 * that were previously only guarded by the UI.
 */
class FormulaStockAndAmountIntegrityTest extends TestCase
{
    use RefreshDatabase;

    private function admin(): User
    {
        return User::factory()->create(['role' => 'admin', 'active' => true]);
    }

    private function product(string $name, string $unit = 'g', float $stock = 0, float $price = 100): Product
    {
        $product = Product::create([
            'name' => $name,
            'sku' => 'P11-'.uniqid(),
            'base_unit_id' => $unit,
            'track_inventory' => true,
            'stock_quantity' => $stock,
            'status' => $stock > 0 ? 'in-stock' : 'out-of-stock',
            'allow_negative_stock' => false,
        ]);

        SellingUnit::create([
            'product_id' => $product->id,
            'name' => $unit,
            'unit_id' => $unit,
            'quantity' => 1,
            'sale_price' => $price,
            'is_default' => true,
        ]);

        return $product;
    }

    private function formula(Product $formula, Product $ingredient): ProductComposition
    {
        return app(CompositionService::class)->save(new SaveCompositionData(
            productId: $formula->id,
            kind: ProductComposition::KIND_CONSUMPTION,
            items: [new CompositionItemData(
                componentProductId: $ingredient->id,
                quantityBase: 10,
                displayUnitId: $ingredient->base_unit_id,
            )],
            name: 'P11 Formula',
            outputQuantity: 1,
            outputUnitId: $formula->base_unit_id,
        ), 'tester');
    }

    public function test_stock_adjustment_rejects_a_formula_only_product(): void
    {
        $admin = $this->admin();
        $formula = $this->product('Formula Only', 'g', 0, 500);
        $ingredient = $this->product('Ingredient', 'g', 100, 5);
        $this->formula($formula, $ingredient);

        $this->actingAs($admin)
            ->post('/inventory/adjust', [
                'product_id' => $formula->id,
                'type' => 'adjustment',
                'quantity' => 50,
            ])
            ->assertSessionHasErrors('product_id');

        $this->assertSame(0.0, (float) $formula->fresh()->stock_quantity);
        $this->assertSame(0, InventoryTransaction::where('product_id', $formula->id)->count());
    }

    public function test_stock_adjustment_still_works_for_a_physical_product(): void
    {
        $admin = $this->admin();
        $ingredient = $this->product('Physical Ingredient', 'g', 100, 5);

        $this->actingAs($admin)
            ->post('/inventory/adjust', [
                'product_id' => $ingredient->id,
                'type' => 'adjustment',
                'quantity' => 25,
            ])
            ->assertSessionHasNoErrors();

        $this->assertSame(125.0, (float) $ingredient->fresh()->stock_quantity);
    }

    public function test_sale_rejects_a_line_total_above_quantity_times_price(): void
    {
        $product = $this->product('Priced', 'piece', 10, 100);

        $this->expectException(ValidationException::class);

        app(SaleService::class)->create(new CreateSaleData(
            invoiceNumber: 'INV-P11-'.uniqid(),
            customerId: 0,
            customerName: 'Walk-in',
            date: '2026-11-15',
            items: [new SaleItemData($product->id, 'Priced', 2, 1, 2, 100, 5000, 'piece', 0, 'General')],
            discount: 0,
            amountPaid: 5000,
            paymentMethod: 'cash',
            paymentStatus: 'paid',
            source: 'pos',
            notes: null,
            createdBy: 'tester',
        ));
    }

    public function test_sale_rejects_a_discount_above_the_subtotal(): void
    {
        $product = $this->product('Discounted', 'piece', 10, 100);

        $this->expectException(ValidationException::class);

        app(SaleService::class)->create(new CreateSaleData(
            invoiceNumber: 'INV-P11-'.uniqid(),
            customerId: 0,
            customerName: 'Walk-in',
            date: '2026-11-15',
            items: [new SaleItemData($product->id, 'Discounted', 1, 1, 1, 100, 100, 'piece', 0, 'General')],
            discount: 500,
            amountPaid: 0,
            paymentMethod: 'cash',
            paymentStatus: 'paid',
            source: 'pos',
            notes: null,
            createdBy: 'tester',
        ));
    }

    public function test_payment_status_is_derived_from_the_money_not_the_client(): void
    {
        $product = $this->product('Settled', 'piece', 10, 100);

        $sale = app(SaleService::class)->create(new CreateSaleData(
            invoiceNumber: 'INV-P11-'.uniqid(),
            customerId: 0,
            customerName: 'Walk-in',
            date: '2026-11-15',
            items: [new SaleItemData($product->id, 'Settled', 1, 1, 1, 100, 100, 'piece', 0, 'General')],
            discount: 0,
            amountPaid: 40,
            paymentMethod: 'cash',
            // The client claims a fully settled sale.
            paymentStatus: 'paid',
            source: 'pos',
            notes: null,
            createdBy: 'tester',
        ));

        $this->assertSame('partial', $sale->payment_status);
        $this->assertSame(60.0, (float) $sale->outstanding_balance);
    }

    public function test_return_value_cannot_exceed_the_original_sale(): void
    {
        $customer = Contact::create([
            'type' => 'person', 'roles' => ['customer'], 'name' => 'R1', 'phone' => '0300-9',
        ]);
        $product = $this->product('Returnable', 'piece', 10, 100);

        $sale = app(SaleService::class)->create(new CreateSaleData(
            invoiceNumber: 'INV-P11-'.uniqid(),
            customerId: $customer->id,
            customerName: 'R1',
            date: '2026-11-15',
            items: [new SaleItemData($product->id, 'Returnable', 1, 1, 1, 100, 100, 'piece', 0, 'General')],
            discount: 0,
            amountPaid: 100,
            paymentMethod: 'cash',
            paymentStatus: 'paid',
            source: 'pos',
            notes: null,
            createdBy: 'tester',
        ));

        $saleItem = $sale->items()->firstOrFail();

        $this->expectException(\InvalidArgumentException::class);

        app(ReturnService::class)->createReturn(
            new ReturnCreateData(
                type: 'SALE',
                referenceId: $sale->id,
                referenceType: 'sale',
                returnNumber: '',
                returnDate: '2026-11-16',
                contactId: $customer->id,
                contactName: 'R1',
                reasonId: null,
                reasonNote: 'over value',
                items: [new ReturnItemData(
                    referenceItemId: (int) $saleItem->id,
                    referenceItemType: 'sale_item',
                    productId: $product->id,
                    productName: 'Returnable',
                    sellingUnitId: null,
                    packagingName: 'piece',
                    quantity: 1,
                    baseQuantity: 1,
                    unitPrice: 100,
                    total: 900,
                    reasonId: null,
                    notes: null,
                    restock: true,
                )],
                subtotal: 900,
                discount: 0,
                grandTotal: 900,
                refundAmount: 900,
                refundMethod: 'cash',
                notes: null,
                createdBy: 'tester',
            ),
        );
    }

    public function test_overlapping_return_values_cannot_both_complete(): void
    {
        $customer = Contact::create([
            'type' => 'person', 'roles' => ['customer'], 'name' => 'R2', 'phone' => '0300-8',
        ]);
        $product = $this->product('Overlap', 'piece', 10, 100);

        $sale = app(SaleService::class)->create(new CreateSaleData(
            invoiceNumber: 'INV-P11-'.uniqid(),
            customerId: $customer->id,
            customerName: 'R2',
            date: '2026-11-15',
            items: [new SaleItemData($product->id, 'Overlap', 2, 1, 2, 100, 200, 'piece', 0, 'General')],
            discount: 0,
            amountPaid: 200,
            paymentMethod: 'cash',
            paymentStatus: 'paid',
            source: 'pos',
            notes: null,
            createdBy: 'tester',
        ));

        $saleItem = $sale->items()->firstOrFail();

        $makeReturn = function (float $qty, float $value) use ($sale, $saleItem, $customer, $product) {
            return new ReturnCreateData(
                type: 'SALE',
                referenceId: $sale->id,
                referenceType: 'sale',
                returnNumber: '',
                returnDate: '2026-11-16',
                contactId: $customer->id,
                contactName: 'R2',
                reasonId: null,
                reasonNote: 'overlap',
                items: [new ReturnItemData(
                    referenceItemId: (int) $saleItem->id,
                    referenceItemType: 'sale_item',
                    productId: $product->id,
                    productName: 'Overlap',
                    sellingUnitId: null,
                    packagingName: 'piece',
                    quantity: $qty,
                    baseQuantity: $qty,
                    unitPrice: 100,
                    total: $value,
                    reasonId: null,
                    notes: null,
                    restock: true,
                )],
                subtotal: $value,
                discount: 0,
                grandTotal: $value,
                refundAmount: $value,
                refundMethod: 'cash',
                notes: null,
                createdBy: 'tester',
            );
        };

        $service = app(ReturnService::class);

        // Both drafts pass creation-time validation against the live document.
        $first = $service->createReturn($makeReturn(1, 200));
        $second = $service->createReturn($makeReturn(1, 200));

        $service->completeReturn($first->id);

        try {
            $service->completeReturn($second->id);
            $this->fail('Completion must re-validate the remaining document value.');
        } catch (\InvalidArgumentException $exception) {
            $this->assertStringContainsString('Cannot complete return', $exception->getMessage());
        }

        $this->assertSame('pending', $second->fresh()->status);
        $this->assertSame(200.0, (float) $sale->fresh()->return_total);
    }

    public function test_formula_checkout_deducts_ingredients_and_leaves_formula_stock_untouched(): void
    {
        $formula = $this->product('Checkout Formula', 'g', 0, 500);
        $ingredient = $this->product('Checkout Ingredient', 'g', 100, 5);
        $this->formula($formula, $ingredient);

        app(SaleService::class)->create(new CreateSaleData(
            invoiceNumber: 'INV-P11-'.uniqid(),
            customerId: 0,
            customerName: 'Walk-in',
            date: '2026-11-15',
            items: [new SaleItemData($formula->id, 'Checkout Formula', 2, 1, 2, 500, 1000, 'g', 0, 'General')],
            discount: 0,
            amountPaid: 1000,
            paymentMethod: 'cash',
            paymentStatus: 'paid',
            source: 'pos',
            notes: null,
            createdBy: 'tester',
        ));

        $this->assertSame(80.0, (float) $ingredient->fresh()->stock_quantity);
        $this->assertSame(0.0, (float) $formula->fresh()->stock_quantity);
        $this->assertSame(
            0,
            InventoryTransaction::where('product_id', $formula->id)->count(),
            'A formula must never move its own stock.'
        );
        $this->assertSame(
            1,
            Sale::query()->whereHas('items')->count()
        );
    }
}
