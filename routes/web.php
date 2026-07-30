<?php

use App\Http\Controllers\ClinicController;
use App\Http\Controllers\ContactController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\InventoryController;
use App\Http\Controllers\ProductController;
use App\Http\Controllers\PurchaseController;
use App\Http\Controllers\PurchaseReturnController;
use App\Http\Controllers\ReportController;
use App\Http\Controllers\SaleController;
use App\Http\Controllers\SaleReturnController;
use App\Http\Controllers\SettingsController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::middleware('auth')->group(function () {

Route::get('/', [DashboardController::class, 'index'])->name('dashboard');

Route::prefix('inventory')->group(function () {
    Route::get('/', [InventoryController::class, 'index'])->name('inventory.index');
    Route::get('/movements', [InventoryController::class, 'movements'])->name('inventory.movements');
    Route::get('/low-stock', [InventoryController::class, 'lowStock'])->name('inventory.low-stock');
    Route::get('/valuation', [InventoryController::class, 'valuation'])->name('inventory.valuation');
    Route::get('/add', [ProductController::class, 'create'])->name('inventory.create');
    Route::post('/', [ProductController::class, 'store'])->name('inventory.store');
    Route::get('/product/{id}', [ProductController::class, 'show'])->name('inventory.show');
    Route::get('/product/{id}/edit', [ProductController::class, 'edit'])->name('inventory.edit');
    Route::put('/product/{id}', [ProductController::class, 'update'])->name('inventory.update');
    Route::delete('/product/{id}', [ProductController::class, 'destroy'])->name('inventory.destroy');
    Route::post('/product/{id}/archive', [ProductController::class, 'archive'])->name('inventory.archive');
    Route::get('/generate-sku', [ProductController::class, 'generateSku'])->name('inventory.generate-sku');
});

Route::prefix('purchases')->group(function () {
    Route::get('/', [PurchaseController::class, 'index'])->name('purchases.index');
    Route::get('/new', [PurchaseController::class, 'create'])->name('purchases.create');
    Route::post('/', [PurchaseController::class, 'store'])->name('purchases.store');
    Route::get('/returns', [PurchaseReturnController::class, 'index'])->name('purchases.returns.index');
    Route::get('/returns/{id}', [PurchaseReturnController::class, 'show'])->name('purchases.returns.show');
    Route::get('/{id}/print', [PurchaseController::class, 'printBill'])->name('purchases.print');
    Route::get('/{id}', [PurchaseController::class, 'show'])->name('purchases.show');
    Route::delete('/{id}', [PurchaseController::class, 'destroy'])->name('purchases.destroy');
});

Route::prefix('sales')->group(function () {
    Route::get('/', [SaleController::class, 'index'])->name('sales.index');
    Route::post('/', [SaleController::class, 'store'])->name('sales.store');
    Route::get('/pos', [SaleController::class, 'create'])->name('sales.pos');
    Route::get('/returns', [SaleReturnController::class, 'index'])->name('sales.returns.index');
    Route::get('/returns/{id}', [SaleReturnController::class, 'show'])->name('sales.returns.show');
    Route::get('/{id}/print', [SaleController::class, 'printInvoice'])->name('sales.print');
    Route::get('/{id}', [SaleController::class, 'show'])->name('sales.show');
    Route::delete('/{id}', [SaleController::class, 'destroy'])->name('sales.destroy');
});

Route::prefix('expenses')->group(function () {
    Route::get('/', [\App\Http\Controllers\ExpenseController::class, 'index'])->name('expenses.index');
    Route::get('/new', [\App\Http\Controllers\ExpenseController::class, 'create'])->name('expenses.create');
    Route::post('/', [\App\Http\Controllers\ExpenseController::class, 'store'])->name('expenses.store');
    Route::get('/categories', [\App\Http\Controllers\ExpenseController::class, 'listCategories'])->name('expenses.categories');
    Route::get('/{id}', [\App\Http\Controllers\ExpenseController::class, 'show'])->name('expenses.show');
});

Route::prefix('contacts')->group(function () {
    Route::get('/', [ContactController::class, 'index'])->name('contacts.index');
    Route::get('/create', [ContactController::class, 'create'])->name('contacts.create');
    Route::post('/', [ContactController::class, 'store'])->name('contacts.store');
    Route::get('/{id}', [ContactController::class, 'show'])->name('contacts.show');
    Route::put('/{id}', [ContactController::class, 'update'])->name('contacts.update');
    Route::get('/{id}/edit', [ContactController::class, 'edit'])->name('contacts.edit');
    Route::post('/{id}/ledger', [ContactController::class, 'ledger'])->name('contacts.ledger');
    Route::delete('/{id}', [ContactController::class, 'destroy'])->name('contacts.destroy');
});

Route::prefix('payments')->group(function () {
    Route::get('/', [\App\Http\Controllers\PaymentController::class, 'index'])->name('payments.index');
    Route::post('/', [\App\Http\Controllers\PaymentController::class, 'store'])->name('payments.store');
    Route::post('/customer', [\App\Http\Controllers\PaymentController::class, 'storeCustomerPayment'])->name('payments.customer.store');
    Route::post('/supplier', [\App\Http\Controllers\PaymentController::class, 'storeSupplierPayment'])->name('payments.supplier.store');
    Route::delete('/{id}', [\App\Http\Controllers\PaymentController::class, 'destroy'])->name('payments.destroy');
    Route::get('/print/receipt/{id}', [\App\Http\Controllers\PaymentController::class, 'printReceipt'])->name('payments.print');
});

Route::prefix('returns')->group(function () {
    Route::get('/sale', function () {
        $sales = \App\Models\Sale::with('items.product', 'customer')
            ->orderBy('created_at', 'desc')
            ->limit(50)
            ->get();
        return Inertia::render('returns/ReturnPage', [
            'transactions' => $sales->toArray(),
            'type' => 'sale',
            'strategy' => 'sale-return',
            'title' => 'Sale Return',
            'isPurchase' => false,
            'backPath' => '/sales',
        ]);
    })->name('returns.sale.create');
    Route::get('/purchase', function () {
        $bills = \App\Models\PurchaseBill::with('items.product', 'supplier')
            ->orderBy('created_at', 'desc')
            ->limit(50)
            ->get();
        return Inertia::render('returns/ReturnPage', [
            'transactions' => $bills->toArray(),
            'type' => 'purchase',
            'strategy' => 'purchase-return',
            'title' => 'Purchase Return',
            'isPurchase' => true,
            'backPath' => '/purchases',
        ]);
    })->name('returns.purchase.create');
});

Route::prefix('clinic')->group(function () {
    Route::get('/', [ClinicController::class, 'index'])->name('clinic.index');
    Route::get('/patient/{id}', [ClinicController::class, 'show'])->name('clinic.patient');
    Route::get('/patient/{id}/visit', [ClinicController::class, 'createVisit'])->name('clinic.visit');
    Route::post('/visits', [ClinicController::class, 'storeVisit'])->name('clinic.visits.store');
    Route::get('/visit/{id}', [ClinicController::class, 'showVisit'])->name('clinic.visit.show');
    Route::delete('/consultations/{id}', [ClinicController::class, 'destroyConsultation'])->name('clinic.consultations.destroy');
    Route::post('/consultations/{id}/restore', [ClinicController::class, 'restoreConsultation'])->name('clinic.consultations.restore');
    Route::delete('/prescriptions/{id}', [ClinicController::class, 'destroyPrescription'])->name('clinic.prescriptions.destroy');
    Route::post('/prescriptions/{id}/restore', [ClinicController::class, 'restorePrescription'])->name('clinic.prescriptions.restore');
});

// Prescription Image API
Route::middleware('auth')->prefix('api')->group(function () {
    Route::post('/prescriptions/{prescription}/images', [\App\Http\Controllers\PrescriptionImageController::class, 'store']);
    Route::get('/prescriptions/{prescription}/images', [\App\Http\Controllers\PrescriptionImageController::class, 'index']);
    Route::delete('/prescription-images/{id}', [\App\Http\Controllers\PrescriptionImageController::class, 'destroy']);
    Route::get('/prescription-images/{id}/download', [\App\Http\Controllers\PrescriptionImageController::class, 'download']);
});

// Reports
Route::prefix('reports')->group(function () {
    Route::get('/', [ReportController::class, 'index'])->name('reports.index');
    Route::get('/sales', [ReportController::class, 'salesRegister'])->name('reports.sales');
    Route::get('/sales/by-customer', [ReportController::class, 'salesByCustomer'])->name('reports.sales.by-customer');
    Route::get('/sales/top-products', [ReportController::class, 'topProducts'])->name('reports.sales.top-products');
    Route::get('/purchases', [ReportController::class, 'purchaseRegister'])->name('reports.purchases');
    Route::get('/stock', [ReportController::class, 'stockSummary'])->name('reports.stock');
    Route::get('/stock/ledger', [ReportController::class, 'stockLedger'])->name('reports.stock.ledger');
    Route::get('/stock/low-stock', [ReportController::class, 'lowStock'])->name('reports.stock.low-stock');
    Route::get('/customers/ledger', [ReportController::class, 'customerLedger'])->name('reports.customers.ledger');
    Route::get('/suppliers/ledger', [ReportController::class, 'supplierLedger'])->name('reports.suppliers.ledger');
    Route::get('/day-book', [ReportController::class, 'dayBook'])->name('reports.day-book');
    Route::get('/financial-overview', [ReportController::class, 'financialOverview'])->name('reports.financial-overview');
    Route::get('/product-ledger', [ReportController::class, 'productTimeline'])->name('reports.product-ledger');
    Route::get('/sales/export/csv', [ReportController::class, 'exportSalesCsv'])->name('reports.sales.export.csv');
    Route::get('/purchases/export/csv', [ReportController::class, 'exportPurchasesCsv'])->name('reports.purchases.export.csv');
    Route::get('/stock/export/csv', [ReportController::class, 'exportStockCsv'])->name('reports.stock.export.csv');
    Route::get('/stock/ledger/export/csv', [ReportController::class, 'exportStockLedgerCsv'])->name('reports.stock.ledger.export.csv');
    Route::get('/stock/low-stock/export/csv', [ReportController::class, 'exportLowStockCsv'])->name('reports.stock.low-stock.export.csv');
    Route::get('/day-book/export/csv', [ReportController::class, 'exportDayBookCsv'])->name('reports.day-book.export.csv');
    // Share & export endpoints
    Route::get('/share/{report}', [\App\Http\Controllers\ReportShareController::class, 'share'])->name('reports.share');
    Route::get('/share/download/{path}', [\App\Http\Controllers\ReportShareController::class, 'download'])->name('reports.share.download');
    // Legacy / backup pages
    Route::get('/cash-flow', fn () => Inertia::render('reports/CashFlowReport'))->name('reports.cash-flow');
    Route::get('/pnl', fn () => Inertia::render('reports/PnLReport'))->name('reports.pnl');
    Route::get('/balance-sheet', fn () => Inertia::render('reports/BalanceSheetReport'))->name('reports.balance-sheet');
    Route::get('/party', fn () => Inertia::render('reports/PartyReport'))->name('reports.party');
});

Route::prefix('settings')->group(function () {
    Route::get('/', [SettingsController::class, 'index'])->name('settings.index');
    Route::put('/', [SettingsController::class, 'update'])->name('settings.update');
    Route::get('/business', [SettingsController::class, 'edit'])->name('settings.business')->defaults('group', 'business');
    Route::put('/business', [SettingsController::class, 'update'])->name('settings.business.update');
    Route::get('/pos', fn () => Inertia::render('settings/POS'))->name('settings.pos');
    Route::get('/inventory', fn () => Inertia::render('settings/Inventory'))->name('settings.inventory');
    Route::get('/sales', fn () => Inertia::render('settings/Sales'))->name('settings.sales');
    Route::get('/purchases', fn () => Inertia::render('settings/Purchases'))->name('settings.purchases');
    Route::get('/receipt', fn () => Inertia::render('settings/Receipt'))->name('settings.receipt');
    Route::get('/users', [SettingsController::class, 'users'])->name('settings.users');
    Route::post('/users', [SettingsController::class, 'storeUser'])->name('settings.users.store');
    Route::put('/users/{id}', [SettingsController::class, 'updateUser'])->name('settings.users.update');
    Route::get('/permissions', [SettingsController::class, 'permissions'])->name('settings.permissions');
    Route::post('/permissions/user/{id}', [SettingsController::class, 'updateUserPermissions'])->name('settings.permissions.update');
    Route::get('/backup', [\App\Http\Controllers\BackupController::class, 'index'])->name('settings.backup');
    Route::post('/backup', [\App\Http\Controllers\BackupController::class, 'create'])->name('settings.backup.create');
    Route::delete('/backup/{filename}', [\App\Http\Controllers\BackupController::class, 'destroy'])->name('settings.backup.delete');
    Route::get('/about', fn () => Inertia::render('settings/AboutSystem'))->name('settings.about');
});

// Utilities
Route::middleware('auth')->prefix('utilities')->group(function () {
    Route::get('/recycle-bin', [\App\Http\Controllers\RecycleBinController::class, 'index'])->name('utilities.recycle-bin');
    Route::post('/recycle-bin/{type}/{id}/restore', [\App\Http\Controllers\RecycleBinController::class, 'restore'])->name('utilities.recycle-bin.restore');
    Route::delete('/recycle-bin/{type}/{id}', [\App\Http\Controllers\RecycleBinController::class, 'permanentDelete'])->name('utilities.recycle-bin.permanent-delete');
    Route::get('/audit-log', [\App\Http\Controllers\AuditLogController::class, 'index'])->name('utilities.audit-log');
    Route::get('/system-health', [\App\Http\Controllers\SystemHealthController::class, 'index'])->name('utilities.system-health');
});

}); // ← end auth middleware

// Guest-only routes (login, register, password reset)
require __DIR__.'/auth.php';

Route::get('/api/dashboard/metrics', [DashboardController::class, 'metrics'])->name('api.dashboard.metrics');