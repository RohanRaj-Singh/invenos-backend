<?php

namespace App\Http\Controllers;

use App\Models\Expense;
use App\Models\ExpenseCategory;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class ExpenseController extends Controller
{
    public function index(): Response
    {
        $expenses = Expense::with('category')
            ->orderBy('date', 'desc')
            ->orderBy('created_at', 'desc')
            ->take(50)
            ->get()
            ->toArray();

        $categories = ExpenseCategory::orderBy('name')->get()->toArray();

        return Inertia::render('expenses/ExpenseList', [
            'expenses' => $expenses,
            'categories' => $categories,
        ]);
    }

    public function create(): Response
    {
        $categories = ExpenseCategory::orderBy('name')->get()->toArray();

        return Inertia::render('expenses/ExpenseForm', [
            'categories' => $categories,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $request->validate([
            'amount' => 'required|numeric|min:0.01',
            'category_id' => 'required|integer|exists:expense_categories,id',
            'paid_to' => 'nullable|string|max:255',
            'payment_method' => 'nullable|string|max:50',
            'notes' => 'nullable|string|max:2000',
            'date' => 'nullable|date',
        ]);

        $expense = Expense::create([
            'expense_number' => 'EXP-' . now()->format('ymd') . '-' . str_pad((string) random_int(1, 9999), 4, '0', STR_PAD_LEFT),
            'date' => $data['date'] ?? now()->format('Y-m-d'),
            'category_id' => $data['category_id'],
            'amount' => $data['amount'],
            'paid_to' => $data['paid_to'] ?? '',
            'payment_method' => $data['payment_method'] ?? 'cash',
            'notes' => $data['notes'] ?? null,
            'created_by' => auth()->user()?->name ?? 'System',
        ]);

        return redirect()->route('expenses.index')
            ->with('success', 'Expense recorded successfully.');
    }

    public function show(int $id): Response
    {
        $expense = Expense::with('category')->findOrFail($id);

        return Inertia::render('expenses/ExpenseDetail', [
            'expense' => $expense->toArray(),
        ]);
    }

    public function edit(int $id): Response
    {
        $expense = Expense::with('category')->findOrFail($id);
        $categories = ExpenseCategory::orderBy('name')->get()->toArray();

        return Inertia::render('expenses/ExpenseForm', [
            'expense' => $expense->toArray(),
            'categories' => $categories,
        ]);
    }

    public function update(Request $request, int $id): RedirectResponse
    {
        $expense = Expense::findOrFail($id);

        $data = $request->validate([
            'amount' => 'required|numeric|min:0.01',
            'category_id' => 'required|integer|exists:expense_categories,id',
            'paid_to' => 'nullable|string|max:255',
            'payment_method' => 'nullable|string|max:50',
            'notes' => 'nullable|string|max:2000',
            'date' => 'nullable|date',
        ]);

        $expense->update([
            'amount' => $data['amount'],
            'category_id' => $data['category_id'],
            'paid_to' => $data['paid_to'] ?? '',
            'payment_method' => $data['payment_method'] ?? 'cash',
            'notes' => $data['notes'] ?? null,
            'date' => $data['date'],
        ]);

        return redirect()->route('expenses.index')
            ->with('success', 'Expense updated successfully.');
    }

    public function storeCategory(Request $request): Response
    {
        $data = $request->validate(['name' => 'required|string|max:255|unique:expense_categories,name']);
        ExpenseCategory::create([
            'name' => $data['name'],
            'description' => '',
            'color' => '#78716c',
            'active' => true,
        ]);
        $categories = ExpenseCategory::orderBy('name')->get()->toArray();

        return Inertia::render('expenses/ExpenseForm', [
            'categories' => $categories,
        ]);
    }

    public function listCategories(): Response
    {
        $categories = ExpenseCategory::orderBy('name')->get();
        return Inertia::render('expenses/ExpenseCategories', [
            'categories' => $categories->toArray(),
        ]);
    }

    public function destroy(int $id): RedirectResponse
    {
        Expense::findOrFail($id)->delete();

        return redirect()->route('expenses.index')
            ->with('success', 'Expense deleted.');
    }
}
