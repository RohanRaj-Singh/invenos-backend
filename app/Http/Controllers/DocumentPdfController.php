<?php

namespace App\Http\Controllers;

use App\Domains\Settings\Services\SettingService;
use App\Models\Sale;
use Barryvdh\DomPDF\Facade\Pdf;

class DocumentPdfController extends Controller
{
    public function invoice(int $id)
    {
        $sale = Sale::with(['items', 'customer'])->findOrFail($id);
        $settings = app(SettingService::class)->get();

        $pdf = Pdf::loadView('documents.invoice', compact('sale', 'settings'))->setPaper('a4');

        return $pdf->download("{$sale->invoice_number}.pdf");
    }
}
