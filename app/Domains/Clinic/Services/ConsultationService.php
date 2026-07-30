<?php

namespace App\Domains\Clinic\Services;

use App\Domains\Clinic\DTOs\StoreConsultationData;
use App\Domains\Sales\DTOs\CreateSaleData;
use App\Domains\Sales\Services\SaleService;
use App\Models\Consultation;
use App\Models\Prescription;
use App\Models\PrescriptionItem;
use App\Models\FinancialTransaction;
use Illuminate\Support\Facades\DB;

/**
 * Orchestrates the full consultation workflow:
 *
 *   1. Create Sale (via SaleService — handles inventory, billing)
 *   2. Create Consultation record
 *   3. Create Prescription with clinical instructions linked to sale_items
 *   4. Record payment
 *
 * This is the ONLY service the ClinicController talks to.
 * It delegates inventory/billing to existing services.
 */
class ConsultationService
{
    public function __construct(
        private readonly SaleService $saleService,
    ) {}

    public function create(StoreConsultationData $data): Consultation
    {
        return DB::transaction(function () use ($data) {
            // ───────────────────────────────────────────────────
            // 1. Build the sale items array
            //    Only medication items — the consultation fee is stored
            //    on the consultation record, not as a sale item (no product to deduct).
            // ───────────────────────────────────────────────────
            $saleItemData = array_map(
                fn ($med) => $med->toSaleItemData(),
                $data->medicationItems,
            );

            // ───────────────────────────────────────────────────
            // 2. Create invoice number
            // ───────────────────────────────────────────────────
            $prefix = 'CLN-';
            $count = DB::table('sales')
                ->where('invoice_number', 'like', $prefix . '%')
                ->count() + 1;
            $invoiceNumber = $prefix . str_pad((string) $count, 5, '0', STR_PAD_LEFT);

            // Ensure uniqueness
            while (DB::table('sales')->where('invoice_number', $invoiceNumber)->exists()) {
                $count++;
                $invoiceNumber = $prefix . str_pad((string) $count, 5, '0', STR_PAD_LEFT);
            }

            // ───────────────────────────────────────────────────
            // 3. Resolve patient as customer for the sale
            // ───────────────────────────────────────────────────
            $patient = \App\Models\Contact::lockForUpdate()->findOrFail($data->patientId);

            // ───────────────────────────────────────────────────
            // 4. Create the sale via SaleService (only if there are items)
            //    Handles: product lookup, selling unit conversion,
            //    inventory deduction, COGS calculation, running balance.
            // ───────────────────────────────────────────────────
            $sale = null;
            if (!empty($saleItemData)) {
                $saleData = CreateSaleData::fromRequest([
                    'invoice_number' => $invoiceNumber,
                    'customer_id' => $patient->id,
                    'customer_name' => $patient->name,
                    'date' => $data->date,
                    'items' => $saleItemData,
                    'discount' => 0,
                    'amount_paid' => $data->amountPaid,
                    'payment_method' => $data->paymentMethod,
                    'payment_status' => $data->paymentStatus,
                    'source' => 'clinic',
                    'notes' => "Clinic visit — {$data->diagnosis}",
                    'created_by' => $data->createdBy,
                ]);

                $sale = $this->saleService->create($saleData);
            }

            // ───────────────────────────────────────────────────
            // 5. Create Consultation record linked to the Sale
            // ───────────────────────────────────────────────────
            $consultation = Consultation::create([
                'patient_id' => $data->patientId,
                'doctor_id' => auth()->id() ?: null,
                'visit_date' => $data->date,
                'type' => 'General Consultation',
                'diagnosis' => $data->diagnosis,
                'notes' => $data->notes,
                'consultation_fee' => $data->consultationFee,
                'status' => 'completed',
                'sale_id' => $sale?->id,
                'created_by' => $data->createdBy,
            ]);

            // ───────────────────────────────────────────────────
            // 6. Create Prescription with clinical instructions
            //    Each instruction links to its corresponding sale_item.
            // ───────────────────────────────────────────────────
            if (!empty($data->medicationItems) && $sale) {
                $prescription = Prescription::create([
                    'consultation_id' => $consultation->id,
                    'patient_id' => $data->patientId,
                    'prescribed_by' => $data->createdBy,
                    'date' => $data->date,
                ]);

                $saleItems = $sale->items;

                foreach ($data->medicationItems as $i => $med) {
                    $saleItem = $saleItems[$i] ?? null;
                    if (!$saleItem) continue;

                    PrescriptionItem::create([
                        'prescription_id' => $prescription->id,
                        'sale_item_id' => $saleItem->id,
                        'dosage' => $med->dosage,
                        'frequency' => $med->frequency,
                        'duration' => $med->duration,
                        'instructions' => $med->instructions,
                    ]);
                }
            }

            // ───────────────────────────────────────────────────
            // 7. Load and return
            // ───────────────────────────────────────────────────
            return $consultation->load([
                'prescriptions.items.saleItem.product',
                'prescriptions.images',
                'sale.items',
                'patient',
            ]);
        });
    }

    public function get(int $id): Consultation
    {
        return Consultation::with([
            'prescriptions.items.saleItem.product',
            'prescriptions.images',
            'sale.items',
            'patient',
            'doctor',
        ])->findOrFail($id);
    }

    public function patientConsultations(int $patientId, int $limit = 20): array
    {
        return Consultation::withTrashed()
            ->with([
                'prescriptions' => fn($q) => $q->withTrashed(),
                'sale' => fn($q) => $q->withTrashed(),
                'sale.items',
            ])
            ->where('patient_id', $patientId)
            ->orderBy('created_at', 'desc')
            ->take($limit)
            ->get()
            ->toArray();
    }

    public function patientPrescriptions(int $patientId, int $limit = 20): array
    {
        return Prescription::withTrashed()
            ->with([
                'items' => fn($q) => $q->withTrashed(),
                'items.saleItem.product',
                'images',
                'consultation',
            ])
            ->where('patient_id', $patientId)
            ->orderBy('date', 'desc')
            ->take($limit)
            ->get()
            ->toArray();
    }
}
