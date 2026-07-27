<?php

namespace Tests\Feature\Purchases;

use App\Domains\Purchasing\DTOs\CreatePurchaseData;
use App\Domains\Purchasing\DTOs\PurchaseItemData;
use App\Domains\Purchasing\Services\PurchaseService;
use App\Models\Contact;
use App\Models\Product;
use App\Models\InventoryTransaction;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PurchasesTest extends TestCase
{
    use RefreshDatabase;

    public function test_can_create_purchase(): void
    {
        $supplier = Contact::create(["type" => "organization", "roles" => ["supplier"], "name" => "Supplier A", "phone" => "0300-1111111"]);
        $product = Product::create(["name" => "Test Product", "sku" => "TST-" . uniqid(), "base_unit_id" => "piece", "stock_quantity" => 10]);

        $data = new CreatePurchaseData(
            invoiceRef: "PUR-" . uniqid(),
            supplierId: $supplier->id,
            date: "2026-07-26",
            items: [
                new PurchaseItemData(
                    productId: $product->id,
                    productName: $product->name,
                    purchasePackQty: 10,
                    purchaseQuantity: 5,
                    unitCost: 100,
                    totalCost: 5000,
                    packName: "Carton",
                ),
            ],
            discount: null,
            amountPaid: 5000,
            paymentMethod: "cash",
            paymentStatus: "paid",
            status: "received",
            notes: null,
            createdBy: "Test",
        );

        $service = app(PurchaseService::class);
        $purchase = $service->create($data);

        $this->assertDatabaseHas("purchase_bills", ["id" => $purchase->id]);
        $this->assertDatabaseHas("purchase_bill_items", ["purchase_bill_id" => $purchase->id]);
    }

    public function test_purchase_increases_inventory(): void
    {
        $supplier = Contact::create(["type" => "organization", "roles" => ["supplier"], "name" => "Supplier B", "phone" => "0300-2222222"]);
        $product = Product::create(["name" => "Stock Item", "sku" => "STK-" . uniqid(), "base_unit_id" => "piece", "stock_quantity" => 5]);

        $data = new CreatePurchaseData(
            invoiceRef: "PUR-INV-" . uniqid(),
            supplierId: $supplier->id,
            date: "2026-07-26",
            items: [
                new PurchaseItemData(productId: $product->id, productName: $product->name, purchasePackQty: 10, purchaseQuantity: 3, unitCost: 50, totalCost: 1500, packName: "Box"),
            ],
            discount: null, amountPaid: 1500, paymentMethod: "cash", paymentStatus: "paid", status: "received", notes: null, createdBy: "Test",
        );

        $service = app(PurchaseService::class);
        $service->create($data);

        // Stock should be 5 + (10 * 3) = 35
        $product->refresh();
        $this->assertEquals(35, $product->stock_quantity);

        // Inventory transaction should exist
        $this->assertEquals(1, InventoryTransaction::where("product_id", $product->id)->count());
        $this->assertEquals(35, InventoryTransaction::first()->running_balance);
    }

    public function test_invalid_supplier_rejected(): void
    {
        $customer = Contact::create(["type" => "person", "roles" => ["customer"], "name" => "Not Supplier", "phone" => "0300-3333333"]);
        $product = Product::create(["name" => "Prod", "sku" => "PRD-" . uniqid(), "base_unit_id" => "piece"]);

        $this->expectException(\InvalidArgumentException::class);

        $data = new CreatePurchaseData(
            invoiceRef: "PUR-BAD-" . uniqid(), supplierId: $customer->id, date: "2026-07-26",
            items: [new PurchaseItemData(productId: $product->id, productName: "Prod", purchasePackQty: 1, purchaseQuantity: 1, unitCost: 10, totalCost: 10)],
            discount: null, amountPaid: 10, paymentMethod: "cash", paymentStatus: "paid", status: "received", notes: null, createdBy: "Test",
        );

        app(PurchaseService::class)->create($data);
    }

    public function test_can_search_purchases(): void
    {
        $supplier = Contact::create(["type" => "organization", "roles" => ["supplier"], "name" => "Search Supplier", "phone" => "0300-4444444"]);
        $product = Product::create(["name" => "Search Product", "sku" => "SRC-" . uniqid(), "base_unit_id" => "piece"]);

        $data = new CreatePurchaseData(
            invoiceRef: "PUR-SRC-" . uniqid(), supplierId: $supplier->id, date: "2026-07-26",
            items: [new PurchaseItemData(productId: $product->id, productName: "Search Product", purchasePackQty: 1, purchaseQuantity: 1, unitCost: 10, totalCost: 10)],
            discount: null, amountPaid: 10, paymentMethod: "cash", paymentStatus: "paid", status: "received", notes: null, createdBy: "Test",
        );

        app(PurchaseService::class)->create($data);
        $results = app(PurchaseService::class)->search(query: "Search Supplier");
        $this->assertEquals(1, $results->total());
    }

    public function test_http_create(): void
    {
        $supplier = Contact::create(["type" => "organization", "roles" => ["supplier"], "name" => "HTTP Supplier", "phone" => "0300-5555555"]);
        $product = Product::create(["name" => "HTTP Product", "sku" => "HTP-" . uniqid(), "base_unit_id" => "piece"]);

        $response = $this->post("/purchases", [
            "invoice_ref" => "PUR-HTTP-" . uniqid(),
            "supplier_id" => $supplier->id,
            "date" => "2026-07-26",
            "items" => [[
                "product_id" => $product->id,
                "product_name" => $product->name,
                "purchase_pack_qty" => 5,
                "purchase_quantity" => 2,
                "unit_cost" => 100,
                "total_cost" => 1000,
            ]],
            "amount_paid" => 1000,
        ]);

        $response->assertSessionHas("success");
    }
}
