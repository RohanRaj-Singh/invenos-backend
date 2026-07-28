<?php

namespace App\Domains\Clinic\DTOs;

class StoreConsultationData
{
    public function __construct(
        public readonly int $patientId,
        public readonly string $diagnosis,
        public readonly string $notes,
        public readonly float $consultationFee,
        public readonly string $date,
        public readonly array $medicationItems,     // array of MedicationItemData
        public readonly string $paymentMethod,
        public readonly float $amountPaid,
        public readonly string $paymentStatus,
        public readonly string $createdBy,
    ) {}

    public static function fromRequest(array $data): self
    {
        $medications = [];
        foreach ($data['medications'] ?? $data['sale_items'] ?? [] as $item) {
            $medications[] = MedicationItemData::fromArray($item);
        }

        return new self(
            patientId: (int) $data['patient_id'],
            diagnosis: $data['diagnosis'] ?? '',
            notes: $data['notes'] ?? '',
            consultationFee: (float) ($data['consultation_fee'] ?? 0),
            date: $data['date'] ?? now()->format('Y-m-d'),
            medicationItems: $medications,
            paymentMethod: $data['payment_method'] ?? 'cash',
            amountPaid: (float) ($data['amount_paid'] ?? 0),
            paymentStatus: $data['payment_status'] ?? 'paid',
            createdBy: $data['created_by'] ?? auth()->user()->name ?? 'System',
        );
    }
}
