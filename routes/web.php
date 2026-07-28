<?php

use App\Http\Controllers\ClinicController;
use App\Http\Controllers\ContactController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\InventoryController;
use App\Http\Controllers\ProductController;
use App\Http\Controllers\PurchaseController;
use App\Http\Controllers\SaleController;
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
    Route::get('/generate-sku', [ProductController::class, 'generateSku'])->name('inventory.generate-sku');
    Route::post('/preview-packaging', [ProductController::class, 'previewPackaging'])->name('inventory.preview-packaging');
    Route::get('/product-units', [ProductController::class, 'productUnits'])->name('inventory.product-units');
    Route::post('/adjust', [InventoryController::class, 'adjust'])->name('inventory.adjust');
});

Route::prefix('purchases')->group(function () {
    Route::get('/', [PurchaseController::class, 'index'])->name('purchases.index');
    Route::get('/new', [PurchaseController::class, 'create'])->name('purchases.create');
    Route::post('/', [PurchaseController::class, 'store'])->name('purchases.store');
    Route::get('/{id}/print', [PurchaseController::class, 'printBill'])->name('purchases.print');
    Route::get('/{id}', [PurchaseController::class, 'show'])->name('purchases.show');
    Route::delete('/{id}', [PurchaseController::class, 'destroy'])->name('purchases.destroy');
});

Route::prefix('sales')->group(function () {
    Route::get('/', [SaleController::class, 'index'])->name('sales.index');
    Route::post('/', [SaleController::class, 'store'])->name('sales.store');
    Route::get('/pos', [SaleController::class, 'create'])->name('sales.pos');
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

Route::get('/payments', fn () => Inertia::render('payments/PaymentsList'))->name('payments.index');

Route::prefix('reports')->group(function () {
    Route::get('/', fn () => Inertia::render('reports/ReportsLanding'))->name('reports.index');
    Route::get('/day-book', fn () => Inertia::render('reports/DayBookReport'))->name('reports.day-book');
    Route::get('/cash-flow', fn () => Inertia::render('reports/CashFlowReport'))->name('reports.cash-flow');
    Route::get('/pnl', fn () => Inertia::render('reports/PnLReport'))->name('reports.pnl');
    Route::get('/balance-sheet', fn () => Inertia::render('reports/BalanceSheetReport'))->name('reports.balance-sheet');
    Route::get('/sales', fn () => Inertia::render('reports/SalesReport'))->name('reports.sales');
    Route::get('/purchases', fn () => Inertia::render('reports/PurchaseReport'))->name('reports.purchases');
    Route::get('/stock', fn () => Inertia::render('reports/StockReport'))->name('reports.stock');
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
});

// Prescription Image API
Route::middleware('auth')->prefix('api')->group(function () {
    Route::post('/prescriptions/{prescription}/images', [\App\Http\Controllers\PrescriptionImageController::class, 'store']);
    Route::get('/prescriptions/{prescription}/images', [\App\Http\Controllers\PrescriptionImageController::class, 'index']);
    Route::delete('/prescription-images/{id}', [\App\Http\Controllers\PrescriptionImageController::class, 'destroy']);
    Route::get('/prescription-images/{id}/download', [\App\Http\Controllers\PrescriptionImageController::class, 'download']);
});

}); // ← end auth middleware

// Guest-only routes (login, register, password reset)
require __DIR__.'/auth.php';

Route::get('/api/dashboard/metrics', [DashboardController::class, 'metrics'])->name('api.dashboard.metrics');
