<?php

namespace App\Http\Controllers;

use App\Domains\Payments\DTOs\RecordPaymentData;
use App\Domains\Payments\Services\PaymentService;
use Illuminate\Http\RedirectResponse;
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
        $payments = $this->paymentService->search($search, $type);
        $outstanding = $this->paymentService->getOutstandingBalances();

        return Inertia::render('payments/PaymentsList', [
            'payments' => $payments->items(),
            'outstanding' => $outstanding,
            'meta' => [
                'current_page' => $payments->currentPage(),
                'last_page' => $payments->lastPage(),
                'per_page' => $payments->perPage(),
                'total' => $payments->total(),
            ],
            'filters' => ['search' => $search, 'type' => $type],
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
}
