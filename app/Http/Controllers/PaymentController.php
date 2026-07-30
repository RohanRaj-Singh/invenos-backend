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
            FinancialTransaction::create([
                'type' => $data['direction'] === 'in' ? 'collection' : 'payout',
                'contact_id' => $contact->id,
                'direction' => $data['direction'],
                'amount' => $data['amount'],
                'method' => $data['method'],
                'reference' => $data['reference'],
                'description' => $data['description'] ?? null,
                'date' => $data['date'],
                'created_by' => $data['created_by'],
            ]);

            // Update contact balance:
            // Money In (customer pays us) → balance decreases
            // Money Out (we pay supplier) → balance decreases
            $contact->decrement('current_balance', $data['amount']);
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

            // Reverse the contact balance that was decremented when the payment was created
            if ($transaction->contact) {
                $transaction->contact->increment('current_balance', $transaction->amount);
            }

            $transaction->delete();
        });

        return back()->with('success', 'Payment deleted. Contact balance restored.');
    }
}
