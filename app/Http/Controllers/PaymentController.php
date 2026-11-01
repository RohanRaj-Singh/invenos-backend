<?php

namespace App\Http\Controllers;

use App\Domains\Payments\DTOs\RecordPaymentData;
use App\Domains\Payments\Services\PaymentService;
use App\Models\Contact;
use App\Models\FinancialTransaction;
use App\Domains\Settings\Services\SettingService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Inertia\Response;

class PaymentController extends Controller
{
    public function __construct(
        private readonly PaymentService $paymentService,
    ) {}

    public function index(): Response
    {
        $search = request('search', '');
        $type = request('type', '');
        $dateFrom = request('date_from', '');
        $dateTo = request('date_to', '');
        $payments = $this->paymentService->search($search, $type, $dateFrom, $dateTo);
        $outstanding = $this->paymentService->getOutstandingBalances();

        $contacts = Contact::select('id', 'name', 'phone', 'current_balance')
            ->orderBy('name')
            ->get()
            ->toArray();

        return Inertia::render('payments/PaymentsList', [
            'payments' => $payments->items(),
            'outstanding' => $outstanding,
            'contacts' => $contacts,
            'meta' => [
                'current_page' => $payments->currentPage(),
                'last_page' => $payments->lastPage(),
                'per_page' => $payments->perPage(),
                'total' => $payments->total(),
            ],
            'filters' => ['search' => $search, 'type' => $type, 'date_from' => $dateFrom, 'date_to' => $dateTo],
        ]);
    }

    public function storeCustomerPayment(): RedirectResponse
    {
        $data = RecordPaymentData::fromRequest(request()->validate([
            'transaction_type' => 'required|in:sale',
            'transaction_id' => 'required|integer|exists:sales,id',
            'amount' => 'required|numeric|min:1',
            'method' => 'required|string',
            'reference' => 'nullable|string',
            'date' => 'nullable|date',
            'created_by' => 'required|string',
        ]));
        $this->paymentService->recordCustomerPayment($data);
        return back()->with('success', 'Payment recorded successfully.');
    }

    public function storeSupplierPayment(): RedirectResponse
    {
        $data = RecordPaymentData::fromRequest(request()->validate([
            'transaction_type' => 'required|in:purchase',
            'transaction_id' => 'required|integer|exists:purchase_bills,id',
            'amount' => 'required|numeric|min:1',
            'method' => 'required|string',
            'reference' => 'nullable|string',
            'date' => 'nullable|date',
            'created_by' => 'required|string',
        ]));
        $this->paymentService->recordSupplierPayment($data);
        return back()->with('success', 'Payment recorded successfully.');
    }

    public function store(): RedirectResponse
    {
        $data = request()->validate([
            'direction' => 'required|in:in,out',
            'contact_id' => 'required|integer|exists:contacts,id',
            'amount' => 'required|numeric|min:1',
            'method' => 'required|string',
            'reference' => 'required|string',
            'description' => 'nullable|string',
            'date' => 'required|date',
            'created_by' => 'required|string',
        ]);

        $contact = Contact::findOrFail($data['contact_id']);

        \Illuminate\Support\Facades\DB::transaction(function () use ($data, $contact) {
            $type = $data['direction'] === 'in' ? 'collection' : 'payout';

            app(\App\Domains\Ledger\CashLedgerService::class)->record([
                'type' => $type,
                'contact_id' => $contact->id,
                'direction' => $data['direction'],
                'amount' => $data['amount'],
                'method' => $data['method'],
                'reference' => $data['reference'],
                'description' => $data['description'] ?? null,
                'date' => $data['date'],
                'source_type' => 'manual',
                'event_key' => $type . ':' . $contact->id . ':' . $data['reference'],
                'created_by' => $data['created_by'],
            ]);

            // Settlements move the balance toward zero; refunds move it away
            // from zero. PartyBalance owns that rule.
            \App\Domains\Ledger\PartyBalance::applyCash($contact, $type, (float) $data['amount']);
        });

        return back()->with('success', 'Payment recorded successfully.');
    }

    public function printPayment(int $id): Response
    {
        $payment = FinancialTransaction::with('contact')->findOrFail($id);
        $settings = app(SettingService::class)->get();

        return Inertia::render('payments/PaymentPrint', [
            'payment' => $payment->toArray(),
            'settings' => $settings,
        ]);
    }

    public function destroy(int $id): RedirectResponse
    {
        $this->authorize('lifecycle.permanent-delete');

        DB::transaction(function () use ($id) {
            $transaction = FinancialTransaction::with('contact')->lockForUpdate()->findOrFail($id);

            abort_unless(
                app(\App\Domains\Ledger\CashLedgerService::class)->isCashType($transaction->type),
                422,
                'Only cash movements can be reversed.'
            );

            // Restore the linked document's paid amount.
            if ($transaction->linked_sale_id && ($sale = \App\Models\Sale::lockForUpdate()->find($transaction->linked_sale_id))) {
                $paid = max(0.0, (float) $sale->amount_paid - (float) $transaction->amount);
                $outstanding = max(0.0, (float) $sale->grand_total - $paid);
                $sale->update([
                    'amount_paid' => $paid,
                    'outstanding_balance' => $outstanding,
                    'payment_status' => $outstanding <= 0 ? 'paid' : ($paid > 0 ? 'partial' : 'unpaid'),
                ]);
            }

            if ($transaction->linked_purchase_id && ($bill = \App\Models\PurchaseBill::lockForUpdate()->find($transaction->linked_purchase_id))) {
                $paid = max(0.0, (float) $bill->amount_paid - (float) $transaction->amount);
                $outstanding = max(0.0, (float) $bill->total_amount - $paid);
                $bill->update([
                    'amount_paid' => $paid,
                    'outstanding_balance' => $outstanding,
                    'payment_status' => $outstanding <= 0 ? 'paid' : ($paid > 0 ? 'partial' : 'unpaid'),
                ]);
            }

            \App\Domains\Ledger\PartyBalance::reverseCash(
                $transaction->contact,
                $transaction->type,
                (float) $transaction->amount,
            );

            app(\App\Domains\Ledger\CashLedgerService::class)->reverse(
                $transaction,
                'Payment reversed',
                auth()->user()?->name,
            );
        });

        return back()->with('success', 'Payment reversed. Contact balance and invoice restored.');
    }
}
