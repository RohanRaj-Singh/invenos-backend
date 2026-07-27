<?php

namespace App\Domains\Contracts;

/**
 * Service Contracts — define the application backbone.
 *
 * These interfaces describe every major business operation.
 * Implementations belong in the respective Domain/Services directories.
 * Controllers and API routes consume these interfaces, keeping
 * business logic isolated from HTTP concerns.
 */

// ─── Inventory ───

interface InventoryServiceInterface
{
    // adjustStock(int $productId, string $type, int $quantity, ?string $notes): InventoryTransaction
    // getStockLevel(int $productId): int
    // recalculateStatus(Product $product): void
}

// ─── Sales ───

interface SaleServiceInterface
{
    // create(array $data, User $user): Sale
    // processReturn(array $data, User $user): Sale
    // getCustomerStatement(int $contactId, string $from, string $to): array
}

// ─── Purchasing ───

interface PurchaseServiceInterface
{
    // create(array $data, User $user): PurchaseBill
    // processReturn(array $data, User $user): PurchaseBill
    // getSupplierStatement(int $contactId, string $from, string $to): array
}

// ─── Contacts ───

interface ContactServiceInterface
{
    // create(array $data): Contact
    // update(int $id, array $data): Contact
    // getTransactions(int $contactId): Collection
    // getStatement(int $contactId, string $from, string $to): array
}

// ─── Payments ───

interface PaymentServiceInterface
{
    // record(array $data): FinancialTransaction
    // getContactBalance(int $contactId): float
    // syncBalance(int $contactId): void
}

// ─── Expenses ───

interface ExpenseServiceInterface
{
    // create(array $data): Expense
    // update(int $id, array $data): Expense
    // delete(int $id): bool
    // getStats(): array
}

// ─── Reports ───

interface ReportServiceInterface
{
    // getDayBook(string $from, string $to): array
    // getCashFlow(string $from, string $to): array
    // getProfitLoss(string $from, string $to): array
    // getStockReport(): Collection
    // getSalesReport(string $from, string $to): Collection
    // getPurchaseReport(string $from, string $to): Collection
    // getPartyStatement(string $from, string $to, string $partyName, ?string $partyType): array
}

// ─── Settings ───

interface SettingServiceInterface
{
    // get(): AppSettings
    // update(array $data): AppSettings
    // reset(): AppSettings
}

// ─── Dashboard ───

interface DashboardServiceInterface
{
    // getStats(?string $from, ?string $to): DashboardStats
    // getActivity(int $limit): Collection
}
