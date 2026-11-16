<?php

namespace App\Domains\Purchasing\Services;

use App\Domains\Purchasing\DTOs\CreatePurchaseReturnData;
use App\Models\PurchaseBill;
use Illuminate\Pagination\LengthAwarePaginator;

class PurchaseReturnService
{
    public function search(string $query = '', int $perPage = 25): LengthAwarePaginator
    {
        return PurchaseBill::with('supplier')
            ->where('invoice_ref', 'like', 'PRET-%')
            ->where(function ($q) use ($query) {
                if ($query) {
                    $q->where('invoice_ref', 'like', "%{$query}%")
                      ->orWhere('supplier_name', 'like', "%{$query}%");
                }
            })
            ->orderBy('created_at', 'desc')
            ->paginate($perPage);
    }

    /**
     * @deprecated Legacy stock writer. Use ReturnService::createReturn/completeReturn.
     */
    public function create(CreatePurchaseReturnData $data): PurchaseBill
    {
        throw new \LogicException('Legacy purchase return writer disabled. Use ReturnService.');
    }

    public function get(int $id): PurchaseBill
    {
        return PurchaseBill::with('items', 'supplier')->findOrFail($id);
    }
}
