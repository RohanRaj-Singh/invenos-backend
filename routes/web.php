<?php

use App\Domains\Composition\Services\CompositionReturnRecoveryService;
use App\Http\Controllers\AuditLogController;
use App\Http\Controllers\BackupController;
use App\Http\Controllers\ClinicController;
use App\Http\Controllers\CompositionController;
use App\Http\Controllers\ContactController;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\DocumentPdfController;
use App\Http\Controllers\ExpenseController;
use App\Http\Controllers\InventoryController;
use App\Http\Controllers\PaymentController;
use App\Http\Controllers\PrescriptionImageController;
use App\Http\Controllers\ProductController;
use App\Http\Controllers\ProductionController;
use App\Http\Controllers\ProductionReportController;
use App\Http\Controllers\PurchaseController;
use App\Http\Controllers\PurchaseReturnController;
use App\Http\Controllers\RecycleBinController;
use App\Http\Controllers\ReportController;
use App\Http\Controllers\ReportShareController;
use App\Http\Controllers\ReturnWorkflowController;
use App\Http\Controllers\SaleController;
use App\Http\Controllers\SaleReturnController;
use App\Http\Controllers\SettingsController;
use App\Http\Controllers\SystemHealthController;
use App\Models\PurchaseBill;
use App\Models\Sale;
use Illuminate\Support\Facades\Gate;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::middleware('auth')->group(function () {

    Route::get('/', [DashboardController::class, 'index'])->name('dashboard');

    Route::prefix('inventory')->group(function () {
        Route::get('/', [InventoryController::class, 'index'])->name('inventory.index');
        Route::get('/movements', [InventoryController::class, 'movements'])->name('inventory.movements');
        Route::get('/low-stock', [InventoryController::class, 'lowStock'])->name('inventory.low-stock');
        Route::get('/valuation', [InventoryController::class, 'valuation'])->name('inventory.valuation');
        Route::post('/adjust', [InventoryController::class, 'adjust'])->name('inventory.adjust');
        Route::get('/add', [ProductController::class, 'create'])->name('inventory.create');
        Route::post('/', [ProductController::class, 'store'])->name('inventory.store');
        Route::get('/product/{id}', [ProductController::class, 'show'])->name('inventory.show');
        Route::get('/product/{id}/edit', [ProductController::class, 'edit'])->name('inventory.edit');
        Route::put('/product/{id}', [ProductController::class, 'update'])->name('inventory.update');
        Route::delete('/product/{id}', [ProductController::class, 'destroy'])->name('inventory.destroy');
        Route::post('/product/{id}/archive', [ProductController::class, 'archive'])->name('inventory.archive');
        Route::post('/product/{id}/unarchive', [ProductController::class, 'unarchive'])->name('inventory.unarchive');
        Route::get('/generate-sku', [ProductController::class, 'generateSku'])->name('inventory.generate-sku');

        Route::get('/product/{product}/compositions', [CompositionController::class, 'index'])->name('inventory.compositions.index');
        Route::get('/product/{product}/composition', [CompositionController::class, 'active'])->name('inventory.composition.active');
        Route::get('/product/{product}/composition/{composition}', [CompositionController::class, 'show'])->name('inventory.composition.show');
        Route::post('/product/{product}/composition', [CompositionController::class, 'store'])->name('inventory.composition.store');
        Route::post('/product/{product}/composition/preview', [CompositionController::class, 'preview'])->name('inventory.composition.preview');
        Route::post('/product/{product}/composition/cost-preview', [CompositionController::class, 'costPreview'])->name('inventory.composition.cost_preview');
        Route::post('/product/{product}/composition/{composition}/execute', [CompositionController::class, 'execute'])->name('inventory.composition.execute');
        Route::put('/product/{product}/composition/{composition}', [CompositionController::class, 'update'])->name('inventory.composition.update');
        Route::delete('/product/{product}/composition/{composition}', [CompositionController::class, 'deactivate'])->name('inventory.composition.deactivate');
        Route::get('/composition/components', [CompositionController::class, 'searchComponents'])->name('inventory.composition.components');
        Route::get('/composition/units', [CompositionController::class, 'unitOptions'])->name('inventory.composition.units');
        Route::post('/composition/draft-preview', [CompositionController::class, 'draftPreview'])->name('inventory.composition.draft_preview');
    });

    Route::prefix('production')->group(function () {
        Route::get('/', [ProductionController::class, 'index'])->name('production.index');
        Route::get('/create', [ProductionController::class, 'create'])->name('production.create');
        Route::post('/', [ProductionController::class, 'store'])->name('production.store');
        Route::get('/{id}', [ProductionController::class, 'show'])->name('production.show');
        Route::put('/{id}', [ProductionController::class, 'update'])->name('production.update');
        Route::post('/{id}/start', [ProductionController::class, 'start'])->name('production.start');
        Route::post('/{id}/cancel', [ProductionController::class, 'cancel'])->name('production.cancel');
        Route::post('/{id}/execute', [ProductionController::class, 'execute'])->name('production.execute');
        Route::post('/{id}/reverse', [ProductionController::class, 'reverse'])->name('production.reverse');
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
        Route::get('/{id}/pdf', [DocumentPdfController::class, 'invoice'])->name('sales.pdf');
        Route::get('/{id}', [SaleController::class, 'show'])->name('sales.show');
        Route::delete('/{id}', [SaleController::class, 'destroy'])->name('sales.destroy');
    });

    Route::prefix('expenses')->group(function () {
        Route::get('/', [ExpenseController::class, 'index'])->name('expenses.index');
        Route::get('/new', [ExpenseController::class, 'create'])->name('expenses.create');
        Route::post('/', [ExpenseController::class, 'store'])->name('expenses.store');
        Route::get('/categories', [ExpenseController::class, 'listCategories'])->name('expenses.categories');
        Route::get('/{id}', [ExpenseController::class, 'show'])->name('expenses.show');
    });

    Route::prefix('contacts')->group(function () {
        Route::get('/', [ContactController::class, 'index'])->name('contacts.index');
        Route::get('/create', [ContactController::class, 'create'])->name('contacts.create');
        Route::get('/add', function () {
            return redirect('/contacts/create');
        });
        Route::post('/', [ContactController::class, 'store'])->name('contacts.store');
        Route::get('/{id}', [ContactController::class, 'show'])->name('contacts.show');
        Route::put('/{id}', [ContactController::class, 'update'])->name('contacts.update');
        Route::get('/{id}/edit', [ContactController::class, 'edit'])->name('contacts.edit');
        Route::post('/{id}/ledger', [ContactController::class, 'ledger'])->name('contacts.ledger');
        Route::delete('/{id}', [ContactController::class, 'destroy'])->name('contacts.destroy');
    });

    Route::prefix('payments')->group(function () {
        Route::get('/', [PaymentController::class, 'index'])->name('payments.index');
        Route::post('/', [PaymentController::class, 'store'])->name('payments.store');
        Route::post('/customer', [PaymentController::class, 'storeCustomerPayment'])->name('payments.customer.store');
        Route::post('/supplier', [PaymentController::class, 'storeSupplierPayment'])->name('payments.supplier.store');
        Route::delete('/{id}', [PaymentController::class, 'destroy'])->name('payments.destroy');
        Route::get('/print/receipt/{id}', [PaymentController::class, 'printReceipt'])->name('payments.print');
    });

    Route::prefix('returns')->group(function () {
        Route::get('/sale', function (CompositionReturnRecoveryService $recoveries) {
            $sales = Sale::with('items.product', 'customer')
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
                // Per-sale-line material recovery capability for composition
                // sales. Display only — the server re-resolves eligibility,
                // units and costs when a return is submitted.
                'recoveryContext' => $recoveries->contextForSales($sales),
                'canCreateReturn' => Gate::allows('returns.create'),
            ]);
        })->name('returns.sale.create');
        Route::get('/purchase', function () {
            $bills = PurchaseBill::with('items.product', 'supplier')
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

        // Canonical return workflow
        Route::post('/sale', [ReturnWorkflowController::class, 'storeSale'])->name('returns.sale.store');
        Route::post('/purchase', [ReturnWorkflowController::class, 'storePurchase'])->name('returns.purchase.store');
        Route::get('/{id}', [ReturnWorkflowController::class, 'show'])->name('returns.show');
        Route::post('/{id}/complete', [ReturnWorkflowController::class, 'complete'])->name('returns.complete');
        Route::post('/{id}/cancel', [ReturnWorkflowController::class, 'cancel'])->name('returns.cancel');
        Route::post('/{id}/reverse', [ReturnWorkflowController::class, 'reverse'])->name('returns.reverse');
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
        Route::post('/prescriptions/{prescription}/images', [PrescriptionImageController::class, 'store']);
        Route::get('/prescriptions/{prescription}/images', [PrescriptionImageController::class, 'index']);
        Route::delete('/prescription-images/{id}', [PrescriptionImageController::class, 'destroy']);
        Route::get('/prescription-images/{id}/download', [PrescriptionImageController::class, 'download']);
    });

    // Reports
    Route::prefix('reports')->group(function () {
        Route::get('/', [ReportController::class, 'index'])->name('reports.index');
        Route::get('/sales', [ReportController::class, 'salesRegister'])->name('reports.sales');
        Route::get('/sales/by-customer', [ReportController::class, 'salesByCustomer'])->name('reports.sales.by-customer');
        Route::get('/sales/top-products', [ReportController::class, 'topProducts'])->name('reports.sales.top-products');
        Route::get('/purchases', [ReportController::class, 'purchaseRegister'])->name('reports.purchases');
        Route::get('/stock', [ReportController::class, 'stockSummary'])->name('reports.stock');
        Route::get('/stock/print', [ReportController::class, 'printStock'])->name('reports.stock.print');
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
        Route::get('/stock/export/excel', [ReportController::class, 'exportStockExcel'])->name('reports.stock.export.excel');
        Route::get('/stock/ledger/export/csv', [ReportController::class, 'exportStockLedgerCsv'])->name('reports.stock.ledger.export.csv');
        Route::get('/stock/low-stock/export/csv', [ReportController::class, 'exportLowStockCsv'])->name('reports.stock.low-stock.export.csv');
        Route::get('/day-book/export/csv', [ReportController::class, 'exportDayBookCsv'])->name('reports.day-book.export.csv');
        Route::get('/component-usage', [ProductionReportController::class, 'componentUsage'])->name('reports.component-usage');
        Route::get('/production-history', [ProductionReportController::class, 'productionHistory'])->name('reports.production-history');
        // Share & export endpoints
        Route::get('/share/{report}', [ReportShareController::class, 'share'])->name('reports.share');
        Route::get('/share/download/{path}', [ReportShareController::class, 'download'])->name('reports.share.download');
        // Legacy / backup pages
        Route::get('/cash-flow', [ReportController::class, 'cashFlow'])->name('reports.cash-flow');
        Route::get('/pnl', [ReportController::class, 'profit'])->name('reports.pnl');
        Route::get('/balance-sheet', [ReportController::class, 'balanceSheet'])->name('reports.balance-sheet');
        Route::get('/party', [ReportController::class, 'party'])->name('reports.party');
    });

    Route::prefix('settings')->group(function () {
        Route::get('/', [SettingsController::class, 'index'])->name('settings.index');
        Route::put('/', [SettingsController::class, 'update'])->name('settings.update');
        Route::get('/business', [SettingsController::class, 'edit'])->name('settings.business')->defaults('group', 'business');
        Route::put('/business', [SettingsController::class, 'update'])->name('settings.business.update');
        Route::get('/pos', fn () => Inertia::render('settings/POS'))->name('settings.pos');
        Route::get('/inventory', fn () => Inertia::render('settings/Inventory'))->name('settings.inventory');
        Route::get('/sales', fn () => Inertia::render('settings/Sales'))->name('settings.sales');
        Route::get('/composition', [SettingsController::class, 'edit'])->name('settings.composition')->defaults('group', 'composition');
        Route::get('/purchases', fn () => Inertia::render('settings/Purchases'))->name('settings.purchases');
        Route::get('/receipt', fn () => Inertia::render('settings/Receipt'))->name('settings.receipt');
        Route::get('/users', [SettingsController::class, 'users'])->middleware('can:settings.update')->name('settings.users');
        Route::post('/users', [SettingsController::class, 'storeUser'])->middleware('can:settings.update')->name('settings.users.store');
        Route::put('/users/{id}', [SettingsController::class, 'updateUser'])->middleware('can:settings.update')->name('settings.users.update');
        Route::get('/permissions', [SettingsController::class, 'permissions'])->middleware('can:settings.update')->name('settings.permissions');
        Route::post('/permissions/user/{id}', [SettingsController::class, 'updateUserPermissions'])->middleware('can:settings.update')->name('settings.permissions.update');
        Route::get('/backup', [BackupController::class, 'index'])->name('settings.backup');
        Route::post('/backup', [BackupController::class, 'store'])->name('settings.backup.create');
        Route::post('/backup/inspect', [BackupController::class, 'inspectUpload'])->name('settings.backup.inspect');
        Route::post('/backup/restore/{restoreRun}', [BackupController::class, 'restore'])->name('settings.backup.restore');
        Route::get('/backup/{backup}/download', [BackupController::class, 'download'])->name('settings.backup.download');
        Route::post('/backup/{backup}/verify', [BackupController::class, 'verify'])->name('settings.backup.verify');
        Route::post('/backup/{backup}/inspect', [BackupController::class, 'inspectBackup'])->name('settings.backup.inspect.local');
        Route::delete('/backup/{backup}', [BackupController::class, 'destroy'])->name('settings.backup.delete');
        Route::get('/about', fn () => Inertia::render('settings/AboutSystem'))->name('settings.about');
    });

    // Utilities
    Route::middleware('auth')->prefix('utilities')->group(function () {
        Route::get('/recycle-bin', [RecycleBinController::class, 'index'])->name('utilities.recycle-bin');
        Route::post('/recycle-bin/{type}/{id}/restore', [RecycleBinController::class, 'restore'])->name('utilities.recycle-bin.restore');
        Route::delete('/recycle-bin/{type}/{id}', [RecycleBinController::class, 'permanentDelete'])->name('utilities.recycle-bin.permanent-delete');
        Route::get('/audit-log', [AuditLogController::class, 'index'])->name('utilities.audit-log');
        Route::get('/system-health', [SystemHealthController::class, 'index'])->name('utilities.system-health');
    });

}); // ← end auth middleware

// Guest-only routes (login, register, password reset)
require __DIR__.'/auth.php';

Route::get('/api/dashboard/metrics', [DashboardController::class, 'metrics'])
    ->middleware('auth')
    ->name('api.dashboard.metrics');
