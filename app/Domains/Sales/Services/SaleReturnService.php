<?php

namespace App\Domains\Sales\Services;

use App\Domains\Sales\DTOs\CreateSaleReturnData;
use App\Models\Sale;
use Illuminate\Pagination\LengthAwarePaginator;

class SaleReturnService
{
    public function search(string $query = '', int $perPage = 25): LengthAwarePaginator
    {
        return Sale::with('customer')
            ->where('invoice_number', 'like', 'RET-%')
            ->where(function ($q) use ($query) {
                if ($query) {
                    $q->where('invoice_number', 'like', "%{$query}%")
                      ->orWhere('customer_name', 'like', "%{$query}%");
                }
            })
            ->orderBy('created_at', 'desc')
            ->paginate($perPage);
    }

    /**
     * @deprecated Legacy stock writer. Use ReturnService::createReturn/completeReturn.
     */
    public function create(CreateSaleReturnData $data): Sale
    {
        throw new \LogicException('Legacy sale return writer disabled. Use ReturnService.');
    }

    public function get(int $id): Sale
    {
        return Sale::with('items')->findOrFail($id);
    }
}
