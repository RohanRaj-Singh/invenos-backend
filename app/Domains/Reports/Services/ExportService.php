<?php

namespace App\Domains\Reports\Services;

use Illuminate\Http\Response as IlluminateResponse;
use Symfony\Component\HttpFoundation\BinaryFileResponse;
use PhpOffice\PhpSpreadsheet\Spreadsheet;
use PhpOffice\PhpSpreadsheet\Writer\Xlsx;
use Barryvdh\DomPDF\Facade\Pdf;

/**
 * Shared export service for all report types.
 *
 * Every report provides its columns, rows, and title — the exporter
 * handles CSV, Excel, and PDF. The ShareService can generate a PDF
 * and trigger native sharing via the Web Share API.
 */
class ExportService
{
    /**
     * Export data as CSV (streamed directly to browser).
     */
    public function csv(array $rows, array $headers, string $filename): IlluminateResponse
    {
        $callback = function () use ($rows, $headers) {
            $file = fopen('php://output', 'w');
            fwrite($file, "\xEF\xBB\xBF");
            fputcsv($file, $headers);
            foreach ($rows as $row) {
                fputcsv($file, array_values($row));
            }
            fclose($file);
        };

        return response()->stream($callback, 200, [
            'Content-Type' => 'text/csv; charset=UTF-8',
            'Content-Disposition' => "attachment; filename=\"{$filename}.csv\"",
        ]);
    }

    /**
     * Export data as Excel (.xlsx).
     */
    public function excel(array $rows, array $headers, string $filename): BinaryFileResponse
    {
        $spreadsheet = new Spreadsheet();
        $sheet = $spreadsheet->getActiveSheet();

        $col = 'A';
        foreach ($headers as $header) {
            $sheet->setCellValue($col . '1', $header);
            $sheet->getStyle($col . '1')->getFont()->setBold(true);
            $col++;
        }

        $rowNum = 2;
        foreach ($rows as $row) {
            $col = 'A';
            foreach (array_values($row) as $value) {
                $sheet->setCellValue($col . $rowNum, $value);
                $col++;
            }
            $rowNum++;
        }

        $writer = new Xlsx($spreadsheet);
        $tempFile = tempnam(sys_get_temp_dir(), 'export_') . '.xlsx';
        $writer->save($tempFile);

        return response()->download($tempFile, "{$filename}.xlsx")->deleteFileAfterSend(true);
    }

    /**
     * Export data as PDF using a Blade view.
     */
    public function pdf(string $view, array $data, string $filename): BinaryFileResponse
    {
        $pdf = Pdf::loadView($view, $data);
        return $pdf->download("{$filename}.pdf");
    }

    /**
     * Generate a PDF and return the temp file path for sharing.
     * The caller is responsible for cleanup.
     */
    public function pdfTempFile(string $view, array $data, string $filename): string
    {
        $pdf = Pdf::loadView($view, $data);
        $tempPath = tempnam(sys_get_temp_dir(), 'report_') . '.pdf';
        file_put_contents($tempPath, $pdf->output());
        return $tempPath;
    }

    /**
     * Build a standard report data structure from raw data.
     */
    public function buildReportData(string $title, string $subtitle, array $filters, array $columns, array $rows, array $summary = []): array
    {
        return compact('title', 'subtitle', 'filters', 'columns', 'rows', 'summary');
    }

    /**
     * Build header-value rows from a flat array of models/objects.
     */
    public function buildRows(array $data, array $fields, array $labels): array
    {
        $rows = [];
        foreach ($data as $item) {
            $row = [];
            foreach ($fields as $field) {
                $row[$field] = data_get($item, $field, '—');
            }
            $rows[] = $row;
        }
        return [$rows, $labels ?: $fields];
    }
}