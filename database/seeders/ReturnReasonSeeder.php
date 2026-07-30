<?php

namespace Database\Seeders;

use App\Models\ReturnReason;
use Illuminate\Database\Seeder;

class ReturnReasonSeeder extends Seeder
{
    public function run(): void
    {
        $reasons = [
            // Sale return reasons
            ['type' => 'sale', 'code' => 'damaged', 'label' => 'Damaged', 'sort_order' => 1],
            ['type' => 'sale', 'code' => 'wrong-item', 'label' => 'Wrong Item', 'sort_order' => 2],
            ['type' => 'sale', 'code' => 'changed-mind', 'label' => 'Customer Changed Mind', 'sort_order' => 3],
            ['type' => 'sale', 'code' => 'expired', 'label' => 'Expired', 'sort_order' => 4],
            ['type' => 'sale', 'code' => 'warranty', 'label' => 'Warranty', 'sort_order' => 5],
            ['type' => 'sale', 'code' => 'quality', 'label' => 'Quality Issue', 'sort_order' => 6],
            ['type' => 'sale', 'code' => 'other', 'label' => 'Other', 'sort_order' => 99],

            // Purchase return reasons
            ['type' => 'purchase', 'code' => 'supplier-damage', 'label' => 'Supplier Damage', 'sort_order' => 1],
            ['type' => 'purchase', 'code' => 'wrong-product', 'label' => 'Wrong Product', 'sort_order' => 2],
            ['type' => 'purchase', 'code' => 'expired', 'label' => 'Expired', 'sort_order' => 3],
            ['type' => 'purchase', 'code' => 'short-qty', 'label' => 'Short Quantity', 'sort_order' => 4],
            ['type' => 'purchase', 'code' => 'quality', 'label' => 'Quality Issue', 'sort_order' => 5],
            ['type' => 'purchase', 'code' => 'over-delivery', 'label' => 'Over Delivery', 'sort_order' => 6],
            ['type' => 'purchase', 'code' => 'other', 'label' => 'Other', 'sort_order' => 99],
        ];

        foreach ($reasons as $reason) {
            ReturnReason::firstOrCreate(
                ['type' => $reason['type'], 'code' => $reason['code']],
                $reason,
            );
        }

        $this->command->info('Seeded ' . count($reasons) . ' return reasons.');
    }
}
