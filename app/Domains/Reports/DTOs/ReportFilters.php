<?php

namespace App\Domains\Reports\DTOs;

use Illuminate\Http\Request;

class ReportFilters
{
    public function __construct(
        public readonly ?string $dateFrom = null,
        public readonly ?string $dateTo = null,
        public readonly ?int $contactId = null,
        public readonly ?int $productId = null,
        public readonly ?int $categoryId = null,
        public readonly ?string $type = null,
        public readonly ?string $status = null,
        public readonly ?string $search = null,
        public readonly int $perPage = 25,
        public readonly string $sortBy = 'date',
        public readonly string $sortDir = 'desc',
    ) {}

    public static function fromRequest(Request $request): self
    {
        return new self(
            dateFrom: $request->get('date_from') ?: $request->get('from'),
            dateTo: $request->get('date_to') ?: $request->get('to'),
            contactId: $request->integer('contact_id', 0) ?: ($request->integer('customer_id', 0) ?: ($request->integer('supplier_id', 0) ?: null)),
            productId: $request->integer('product_id', 0) ?: null,
            categoryId: $request->integer('category_id', 0) ?: null,
            type: $request->get('type'),
            status: $request->get('status'),
            search: $request->get('search'),
            perPage: $request->integer('per_page', 25),
            sortBy: $request->get('sort_by', 'date'),
            sortDir: $request->get('sort_dir', 'desc'),
        );
    }

    public function toArray(): array
    {
        return [
            'date_from' => $this->dateFrom,
            'date_to' => $this->dateTo,
            'contact_id' => $this->contactId,
            'product_id' => $this->productId,
            'category_id' => $this->categoryId,
            'type' => $this->type,
            'status' => $this->status,
            'search' => $this->search,
            'per_page' => $this->perPage,
            'sort_by' => $this->sortBy,
            'sort_dir' => $this->sortDir,
        ];
    }
}
