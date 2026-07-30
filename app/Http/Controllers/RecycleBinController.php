<?php

namespace App\Http\Controllers;

use App\Models\Consultation;
use App\Models\Contact;
use App\Models\Prescription;
use App\Models\Product;
use App\Models\Sale;
use App\Models\PurchaseBill;
use App\Models\User;
use App\Services\Lifecycle\RecordLifecycleService;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Inertia\Response;

class RecycleBinController extends Controller
{
    public function __construct(
        private readonly RecordLifecycleService $lifecycle,
    ) {}

    public function index(): Response
    {
        $this->authorize('lifecycle.view-recycle-bin');

        $type = request('type', 'all');
        $search = request('search', '');

        $items = collect();

        if ($type === 'all' || $type === 'products') {
            $query = Product::onlyTrashed();
            if ($search) {
                $query->where(function ($q) use ($search) {
                    $q->where('name', 'like', "%{$search}%")
                      ->orWhere('sku', 'like', "%{$search}%");
                });
            }
            $query->get()->each(function ($p) use (&$items) {
                $items->push([
                    'id' => $p->id,
                    'type' => 'product',
                    'name' => $p->name,
                    'identifier' => $p->sku,
                    'deleted_at' => $p->deleted_at,
                    'deleted_by' => $p->deletedBy?->name ?? '—',
                    'reason' => $p->delete_reason,
                    'impact' => 'No inventory impact',
                ]);
            });
        }

        if ($type === 'all' || $type === 'contacts') {
            $query = Contact::onlyTrashed();
            if ($search) {
                $query->where('name', 'like', "%{$search}%");
            }
            $query->get()->each(function ($c) use (&$items) {
                $items->push([
                    'id' => $c->id,
                    'type' => 'contact',
                    'name' => $c->name,
                    'identifier' => $c->phone,
                    'deleted_at' => $c->deleted_at,
                    'deleted_by' => $c->deletedBy?->name ?? '—',
                    'reason' => $c->delete_reason,
                    'impact' => 'Historical transactions preserved',
                ]);
            });
        }

        if ($type === 'all' || $type === 'sales') {
            $query = Sale::onlyTrashed();
            if ($search) {
                $query->where('invoice_number', 'like', "%{$search}%");
            }
            $query->get()->each(function ($s) use (&$items) {
                $items->push([
                    'id' => $s->id,
                    'type' => 'sale',
                    'name' => $s->invoice_number,
                    'identifier' => $s->customer_name ?? '—',
                    'deleted_at' => $s->deleted_at,
                    'deleted_by' => $s->deletedBy?->name ?? '—',
                    'reason' => $s->delete_reason,
                    'impact' => 'Inventory reversed',
                ]);
            });
        }

        if ($type === 'all' || $type === 'purchases') {
            $query = PurchaseBill::onlyTrashed();
            if ($search) {
                $query->where('invoice_ref', 'like', "%{$search}%");
            }
            $query->get()->each(function ($p) use (&$items) {
                $items->push([
                    'id' => $p->id,
                    'type' => 'purchase',
                    'name' => $p->invoice_ref,
                    'identifier' => $p->supplier_name ?? '—',
                    'deleted_at' => $p->deleted_at,
                    'deleted_by' => $p->deletedBy?->name ?? '—',
                    'reason' => $p->delete_reason,
                    'impact' => 'Inventory reduced',
                ]);
            });
        }

        if ($type === 'all' || $type === 'consultations') {
            $query = Consultation::onlyTrashed()->with('patient');
            if ($search) {
                $query->where(function ($q) use ($search) {
                    $q->where('id', 'like', "%{$search}%")
                      ->orWhereHas('patient', fn($pq) => $pq->where('name', 'like', "%{$search}%"));
                });
            }
            $query->get()->each(function ($c) use (&$items) {
                $saleInvoice = $c->sale?->invoice_number;
                $impactParts = [];
                if ($saleInvoice) {
                    $impactParts[] = "Sale {$saleInvoice} reversed";
                }
                $impactParts[] = 'Inventory restored';
                $items->push([
                    'id' => $c->id,
                    'type' => 'consultation',
                    'name' => 'Visit #' . $c->id . ' — ' . ($c->patient?->name ?? 'Unknown'),
                    'identifier' => $c->diagnosis ? \Illuminate\Support\Str::limit($c->diagnosis, 60) : '—',
                    'deleted_at' => $c->deleted_at,
                    'deleted_by' => $c->deletedBy?->name ?? '—',
                    'reason' => $c->delete_reason,
                    'impact' => implode(', ', $impactParts),
                ]);
            });
        }

        if ($type === 'all' || $type === 'prescriptions') {
            $query = Prescription::onlyTrashed()->with('patient');
            if ($search) {
                $query->where(function ($q) use ($search) {
                    $q->where('id', 'like', "%{$search}%")
                      ->orWhereHas('patient', fn($pq) => $pq->where('name', 'like', "%{$search}%"));
                });
            }
            $query->get()->each(function ($p) use (&$items) {
                $items->push([
                    'id' => $p->id,
                    'type' => 'prescription',
                    'name' => 'Prescription #' . $p->id . ' — ' . ($p->patient?->name ?? 'Unknown'),
                    'identifier' => $p->prescribed_by ?? '—',
                    'deleted_at' => $p->deleted_at,
                    'deleted_by' => $p->deletedBy?->name ?? '—',
                    'reason' => $p->delete_reason,
                    'impact' => 'No inventory impact',
                ]);
            });
        }

        $sorted = $items->sortByDesc('deleted_at')->values();

        return Inertia::render('utilities/RecycleBin', [
            'items' => $sorted,
            'filters' => ['type' => $type, 'search' => $search],
        ]);
    }

    public function restore(string $type, int $id): RedirectResponse
    {
        $this->authorize('lifecycle.restore-recycle-bin');

        $record = $this->findRecord($type, $id, true);
        if (!$record) {
            return back()->with('error', 'Record not found.');
        }

        try {
            $this->lifecycle->restore($record, auth()->user());
            return back()->with('success', class_basename($record) . ' restored successfully.');
        } catch (\Throwable $e) {
            return back()->with('error', $e->getMessage());
        }
    }

    public function permanentDelete(string $type, int $id): RedirectResponse
    {
        $this->authorize('lifecycle.permanent-delete');

        $record = $this->findRecord($type, $id, true);
        if (!$record) {
            return back()->with('error', 'Record not found.');
        }

        try {
            $this->lifecycle->permanentlyDelete($record, auth()->user());
            return back()->with('success', class_basename($record) . ' permanently deleted.');
        } catch (\Throwable $e) {
            return back()->with('error', $e->getMessage());
        }
    }

    private function findRecord(string $type, int $id, bool $withTrashed = false): mixed
    {
        // Normalise plural → singular from frontend
        $key = match ($type) {
            'products', 'product' => 'product',
            'contacts', 'contact' => 'contact',
            'sales', 'sale' => 'sale',
            'purchases', 'purchase' => 'purchase',
            'consultations', 'consultation' => 'consultation',
            'prescriptions', 'prescription' => 'prescription',
            default => null,
        };

        return match ($key) {
            'product' => $withTrashed ? Product::withTrashed()->find($id) : Product::find($id),
            'contact' => $withTrashed ? Contact::withTrashed()->find($id) : Contact::find($id),
            'sale' => $withTrashed ? Sale::withTrashed()->find($id) : Sale::find($id),
            'purchase' => $withTrashed ? PurchaseBill::withTrashed()->find($id) : PurchaseBill::find($id),
            'consultation' => $withTrashed ? Consultation::withTrashed()->with('sale.items.product', 'prescriptions.items')->find($id) : Consultation::with('sale.items.product', 'prescriptions.items')->find($id),
            'prescription' => $withTrashed ? Prescription::withTrashed()->with('items.saleItem.product')->find($id) : Prescription::with('items.saleItem.product')->find($id),
            default => null,
        };
    }
}
