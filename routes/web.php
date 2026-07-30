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
    Route::post('/preview-packaging', [ProductController::class, 'previewPackaging'])->name('inventory.preview-packaging');
    Route::get('/product-units', [ProductController::class, 'productUnits'])->name('inventory.product-units');
    Route::get('/measurement-options', [ProductController::class, 'measurementOptions'])->name('inventory.measurement-options');
    Route::post('/adjust', [InventoryController::class, 'adjust'])->name('inventory.adjust');
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

Route::prefix('returns')->group(function () {
    Route::get('/sale', fn () => Inertia::render('returns/ReturnPage', ['type' => 'sale']))->name('returns.sale.create');
    Route::get('/purchase', fn () => Inertia::render('returns/ReturnPage', ['type' => 'purchase']))->name('returns.purchase.create');
});

Route::prefix('expenses')->group(function () {
    Route::get('/', [\App\Http\Controllers\ExpenseController::class, 'index'])->name('expenses.index');
    Route::get('/new', [\App\Http\Controllers\ExpenseController::class, 'create'])->name('expenses.create');
    Route::post('/', [\App\Http\Controllers\ExpenseController::class, 'store'])->name('expenses.store');
    Route::get('/categories', fn () => Inertia::render('expenses/ExpenseCategories'))->name('expenses.categories');
    Route::post('/categories', [\App\Http\Controllers\ExpenseController::class, 'storeCategory'])->name('expenses.categories.store');
    Route::get('/{id}', [\App\Http\Controllers\ExpenseController::class, 'show'])->name('expenses.show');
    Route::get('/{id}/edit', [\App\Http\Controllers\ExpenseController::class, 'edit'])->name('expenses.edit');
    Route::put('/{id}', [\App\Http\Controllers\ExpenseController::class, 'update'])->name('expenses.update');
    Route::delete('/{id}', [\App\Http\Controllers\ExpenseController::class, 'destroy'])->name('expenses.destroy');
});

Route::prefix('contacts')->group(function () {
    Route::get('/', [ContactController::class, 'index'])->name('contacts.index');
    Route::get('/add', [ContactController::class, 'create'])->name('contacts.create');
    Route::post('/', [ContactController::class, 'store'])->name('contacts.store');
    Route::get('/{id}', [ContactController::class, 'show'])->name('contacts.show');
    Route::put('/{id}', [ContactController::class, 'update'])->name('contacts.update');
    Route::delete('/{id}', [ContactController::class, 'destroy'])->name('contacts.destroy');
});

Route::prefix('payments')->group(function () {
    Route::get('/', [\App\Http\Controllers\PaymentController::class, 'index'])->name('payments.index');
    Route::post('/', [\App\Http\Controllers\PaymentController::class, 'store'])->name('payments.store');
    Route::post('/customer-payment', [\App\Http\Controllers\PaymentController::class, 'storeCustomerPayment'])->name('payments.customer.store');
    Route::post('/supplier-payment', [\App\Http\Controllers\PaymentController::class, 'storeSupplierPayment'])->name('payments.supplier.store');
    Route::get('/{id}/print', [\App\Http\Controllers\PaymentController::class, 'printPayment'])->name('payments.print');
    Route::delete('/{id}', [\App\Http\Controllers\PaymentController::class, 'destroy'])->name('payments.destroy');
});

Route::prefix('reports')->group(function () {
    Route::get('/', [ReportController::class, 'index'])->name('reports.index');
    // Sales reports
    Route::get('/sales', [ReportController::class, 'salesRegister'])->name('reports.sales');
    Route::get('/sales/by-customer', [ReportController::class, 'salesByCustomer'])->name('reports.sales.by-customer');
    Route::get('/sales/top-products', [ReportController::class, 'topProducts'])->name('reports.sales.top-products');
    // Purchase reports
    Route::get('/purchases', [ReportController::class, 'purchaseRegister'])->name('reports.purchases');
    // Inventory reports
    Route::get('/stock', [ReportController::class, 'stockSummary'])->name('reports.stock');
    Route::get('/stock/ledger', [ReportController::class, 'stockLedger'])->name('reports.stock.ledger');
    Route::get('/stock/low-stock', [ReportController::class, 'lowStock'])->name('reports.stock.low-stock');
    // Contact reports
    Route::get('/customers/ledger', [ReportController::class, 'customerLedger'])->name('reports.customers.ledger');
    Route::get('/suppliers/ledger', [ReportController::class, 'supplierLedger'])->name('reports.suppliers.ledger');
    // Day Book
    Route::get('/day-book', [ReportController::class, 'dayBook'])->name('reports.day-book');
    // Financial Overview
    Route::get('/financial-overview', [ReportController::class, 'financialOverview'])->name('reports.financial-overview');
    // Product reports
    Route::get('/product-ledger', [ReportController::class, 'productTimeline'])->name('reports.product-ledger');
    // Exports (CSV)
    Route::get('/sales/export/csv', [ReportController::class, 'exportSalesCsv'])->name('reports.sales.export.csv');
    Route::get('/purchases/export/csv', [ReportController::class, 'exportPurchasesCsv'])->name('reports.purchases.export.csv');
    Route::get('/stock/export/csv', [ReportController::class, 'exportStockCsv'])->name('reports.stock.export.csv');
    Route::get('/stock/ledger/export/csv', [ReportController::class, 'exportStockLedgerCsv'])->name('reports.stock.ledger.export.csv');
    Route::get('/stock/low-stock/export/csv', [ReportController::class, 'exportLowStockCsv'])->name('reports.stock.low-stock.export.csv');
    Route::get('/day-book/export/csv', [ReportController::class, 'exportDayBookCsv'])->name('reports.day-book.export.csv');
    // Legacy / backup pages (still use closure for pages that need frontend-only for now)
    Route::get('/cash-flow', fn () => \Inertia\Inertia::render('reports/CashFlowReport'))->name('reports.cash-flow');
    Route::get('/pnl', fn () => \Inertia\Inertia::render('reports/PnLReport'))->name('reports.pnl');
    Route::get('/balance-sheet', fn () => \Inertia\Inertia::render('reports/BalanceSheetReport'))->name('reports.balance-sheet');
    Route::get('/party', fn () => \Inertia\Inertia::render('reports/PartyReport'))->name('reports.party');
    // Share & export endpoints
    Route::get('/share/{report}', [\App\Http\Controllers\ReportShareController::class, 'share'])->name('reports.share');
    Route::get('/share/download/{path}', [\App\Http\Controllers\ReportShareController::class, 'download'])->name('reports.share.download');
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
    Route::get('/users', fn () => Inertia::render('settings/UsersList'))->name('settings.users');
    Route::get('/users/new', fn () => Inertia::render('settings/UserForm'))->name('settings.users.create');
    Route::get('/users/{id}', fn (string $id) => Inertia::render('settings/UserForm', ['id' => $id]))->name('settings.users.show');
    Route::get('/users/{id}/permissions', fn (string $id) => Inertia::render('settings/Permissions', ['id' => $id]))->name('settings.users.permissions');
    Route::get('/backup', [\App\Http\Controllers\BackupController::class, 'index'])->name('settings.backup');
    Route::post('/backup', [\App\Http\Controllers\BackupController::class, 'create'])->name('settings.backup.create');
    Route::post('/backup/restore', [\App\Http\Controllers\BackupController::class, 'restore'])->name('settings.backup.restore');
    Route::get('/backup/download/{filename}', [\App\Http\Controllers\BackupController::class, 'download'])->name('settings.backup.download');
    Route::delete('/backup/{filename}', [\App\Http\Controllers\BackupController::class, 'destroy'])->name('settings.backup.delete');
    Route::get('/about', fn () => Inertia::render('settings/AboutSystem'))->name('settings.about');
});

Route::prefix('clinic')->group(function () {
    Route::get('/', [ClinicController::class, 'index'])->name('clinic.index');
    Route::get('/patient/{id}', [ClinicController::class, 'show'])->name('clinic.patient');
    Route::get('/patient/{id}/visit', [ClinicController::class, 'createVisit'])->name('clinic.visit');
    Route::post('/visits', [ClinicController::class, 'storeVisit'])->name('clinic.visits.store');
    Route::get('/visit/{id}', [ClinicController::class, 'showVisit'])->name('clinic.visit.show');
    // Lifecycle operations
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

// Utilities — Recycle Bin, Audit Log, System Health
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
