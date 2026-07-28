<?php

namespace App\Http\Controllers;

use App\Domains\Contacts\DTOs\CreateContactData;
use App\Domains\Contacts\Services\ContactService;
use App\Http\Requests\Contacts\CreateContactRequest;
use Illuminate\Http\RedirectResponse;
use Inertia\Inertia;
use App\Models\FinancialTransaction;
use Inertia\Response;

class ContactController extends Controller
{
    public function __construct(
        private readonly ContactService $contactService,
    ) {}

    public function index(): Response
    {
        $query = request('search', '');
        $role = request('role', 'all');

        $contacts = $this->contactService->search(
            query: $query,
            role: $role,
            perPage: 25,
        );

        return Inertia::render('contacts/ContactsList', [
            'contacts' => $contacts->items(),
            'meta' => [
                'current_page' => $contacts->currentPage(),
                'last_page' => $contacts->lastPage(),
                'per_page' => $contacts->perPage(),
                'total' => $contacts->total(),
            ],
            'filters' => ['search' => $query, 'role' => $role],
        ]);
    }

    public function create(): Response
    {
        return Inertia::render('contacts/AddContact');
    }

    public function store(CreateContactRequest $request): RedirectResponse
    {
        $data = CreateContactData::fromRequest($request->validated());
        $contact = $this->contactService->create($data);

        // If a _redirect_url is provided (e.g., from clinic module), use it instead
        if ($redirectUrl = $request->input('_redirect_url')) {
            return redirect($redirectUrl)
                ->with('success', 'Contact created successfully.');
        }

        return redirect()->route('contacts.show', $contact->id)
            ->with('success', 'Contact created successfully.');
    }

    public function show(int $id): Response
    {
        $contact = $this->contactService->get($id);

        $transactions = FinancialTransaction::with('sale')
            ->where('contact_id', $id)
            ->orderBy('date', 'desc')
            ->orderBy('created_at', 'desc')
            ->take(50)
            ->get()
            ->toArray();

        return Inertia::render('contacts/ContactDetail', [
            'contact' => $contact->toArray(),
            'transactions' => $transactions,
        ]);
    }

    public function update(CreateContactRequest $request, int $id): RedirectResponse
    {
        $contact = $this->contactService->update($id, $request->validated());

        return redirect()->route('contacts.show', $contact->id)
            ->with('success', 'Contact updated successfully.');
    }

    public function destroy(int $id): RedirectResponse
    {
        $this->contactService->delete($id);

        return redirect()->route('contacts.index')
            ->with('success', 'Contact deleted successfully.');
    }
}
