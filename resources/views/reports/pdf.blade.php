<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="utf-8">
    <title>{{ $title ?? 'Report' }} — {{ $settings['business']['business_name'] ?? 'Invenos' }}</title>
    <style>
        @page { margin: 15mm 18mm; size: A4 portrait; }
        * { box-sizing: border-box; }
        body {
            background: #f3f4f6;
            font-family: 'DejaVu Sans', sans-serif;
            font-size: 11px;
            color: #374151;
            margin: 0;
            padding: 0;
        }
        .print-paper {
            max-width: 210mm;
            width: calc(100% - 64px);
            margin: 32px auto;
            padding: 12mm 18mm 25mm 18mm;
            background: #fff;
        }
        .brand-header {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
        }
        .brand-name {
            font-size: 18px;
            font-weight: 700;
            color: #111827;
        }
        .brand-details {
            font-size: 10px;
            color: #6b7280;
            margin-top: 2px;
            line-height: 1.6;
        }
        .brand-details span { margin-right: 12px; }
        .doc-title {
            font-size: 15px;
            font-weight: 700;
            color: #374151;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            text-align: right;
            margin-bottom: 2px;
        }
        .doc-meta {
            font-size: 10px;
            color: #6b7280;
            text-align: right;
        }
        hr.brand-divider {
            border: none;
            border-top: 2px solid #111827;
            margin: 8px 0 16px 0;
        }
        .section-heading {
            font-size: 10px;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            color: #374151;
            margin: 18px 0 6px 0;
            padding-bottom: 3px;
            border-bottom: 1.5px solid #e5e7eb;
        }
        .summary-grid {
            display: flex;
            flex-wrap: wrap;
            border: 1px solid #e5e7eb;
            margin-bottom: 14px;
        }
        .summary-grid .cell {
            flex: 1 0 25%;
            padding: 7px 10px;
            border-right: 1px solid #f3f4f6;
            border-bottom: 1px solid #f3f4f6;
        }
        .summary-grid .cell:nth-child(4n) { border-right: none; }
        .summary-grid .s-label {
            font-size: 7.5px;
            text-transform: uppercase;
            letter-spacing: 0.4px;
            color: #9ca3af;
            font-weight: 600;
        }
        .summary-grid .s-value {
            font-size: 13px;
            font-weight: 700;
            margin-top: 1px;
        }
        .emerald { color: #059669; }
        .red { color: #dc2626; }

        table.data {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 4px;
        }
        table.data thead th {
            padding: 6px 8px;
            text-align: left;
            font-size: 9px;
            font-weight: 600;
            text-transform: uppercase;
            letter-spacing: 0.3px;
            color: #6b7280;
            border-bottom: 2px solid #111827;
        }
        table.data tbody td {
            padding: 5px 8px;
            border-bottom: 1px solid #e5e7eb;
            font-size: 10px;
            vertical-align: top;
        }
        .text-right { text-align: right; }
        .text-center { text-align: center; }

        .badge {
            display: inline-block;
            padding: 1px 8px;
            border-radius: 10px;
            font-size: 8px;
            font-weight: 600;
            border: 1px solid;
        }
        .badge-paid { background: #ecfdf5; color: #047857; border-color: #a7f3d0; }
        .badge-partial { background: #fffbeb; color: #b45309; border-color: #fde68a; }
        .badge-unpaid { background: #fef2f2; color: #b91c1c; border-color: #fecaca; }
        .badge-completed { background: #ecfdf5; color: #047857; border-color: #a7f3d0; }
        .badge-cancelled { background: #fef2f2; color: #b91c1c; border-color: #fecaca; }
        .badge-pending { background: #fffbeb; color: #b45309; border-color: #fde68a; }
        .badge-received { background: #eff6ff; color: #1d4ed8; border-color: #bfdbfe; }
        .badge-in-stock { background: #ecfdf5; color: #047857; border-color: #a7f3d0; }
        .badge-low-stock { background: #fffbeb; color: #b45309; border-color: #fde68a; }
        .badge-out-of-stock { background: #fef2f2; color: #b91c1c; border-color: #fecaca; }

        .footer {
            margin-top: 24px;
            padding-top: 8px;
            border-top: 1px solid #e5e7eb;
            font-size: 9px;
            color: #9ca3af;
            text-align: center;
        }
        @media print {
            body { background: #fff !important; }
            .print-paper { margin: 0 !important; padding: 0 !important; max-width: 100% !important; width: 100% !important; box-shadow: none !important; }
        }
    </style>
</head>
<body>
<div class="print-paper">

    <!-- Brand header -->
    <div class="brand-header">
        <div>
            <div class="brand-name">{{ $settings['business']['business_name'] ?? 'Invenos' }}</div>
            <div class="brand-details">
                @if(!empty($settings['business']['address']))<span>{{ $settings['business']['address'] }}</span>@endif
                @if(!empty($settings['business']['phone']))<span>{{ $settings['business']['phone'] }}</span>@endif
                @if(!empty($settings['business']['email']))<span>{{ $settings['business']['email'] }}</span>@endif
            </div>
        </div>
        <div>
            <div class="doc-title">{{ $title ?? 'Report' }}</div>
            <div class="doc-meta">{{ $subtitle ?? '' }}</div>
            <div class="doc-meta">{{ date('d M Y, h:i A') }}</div>
        </div>
    </div>
    <hr class="brand-divider">

    <!-- Summary cards -->
    @if(!empty($summary))
    @php
        $numeric = array_filter($summary, fn($v) => is_numeric($v));
        $chunks = array_chunk(array_slice($numeric, 0, 8), 4, true);
        // Count-type keys render as plain numbers; everything else is currency.
        $countKeys = ['total_products','total_stock','low_stock','out_of_stock','negative_stock','opening_stock','closing_stock','purchased','sold','sale_returns','purchase_returns','adjustments','return_count','invoice_count','transaction_count','total_transactions','financial_events','operational_events','payment_count','adjustment_count','negative_stock_count'];
    @endphp
    @foreach($chunks as $chunk)
    <div class="summary-grid">
        @foreach($chunk as $label => $value)
        <div class="cell">
            <div class="s-label">{{ ucwords(str_replace('_', ' ', $label)) }}</div>
            <div class="s-value {{ in_array($label, ['net_profit','gross_profit']) && $value >= 0 ? 'emerald' : (in_array($label, ['total_expenses','cash_paid']) && $value > 0 ? 'red' : '') }}">
                @if(in_array($label, $countKeys))
                    {{ number_format((float)$value) }}
                @else
                    Rs {{ number_format((float)$value) }}
                @endif
            </div>
        </div>
        @endforeach
    </div>
    @endforeach
    @endif

    <!-- Stock movement -->
    @if(!empty($movement) && $title === 'Stock Report')
    <div class="section-heading">Inventory Movement</div>
    <table class="data" style="max-width:360px;">
        <tbody>
            <tr><td>Opening Stock</td><td class="text-right">{{ number_format($movement['opening_stock'] ?? 0) }}</td></tr>
            <tr><td>Purchased</td><td class="text-right">+{{ number_format($movement['purchased'] ?? 0) }}</td></tr>
            <tr><td>Sold</td><td class="text-right">&minus;{{ number_format($movement['sold'] ?? 0) }}</td></tr>
            <tr><td>Sale Returns</td><td class="text-right">+{{ number_format($movement['sale_returns'] ?? 0) }}</td></tr>
            <tr><td>Purchase Returns</td><td class="text-right">&minus;{{ number_format($movement['purchase_returns'] ?? 0) }}</td></tr>
            <tr><td>Adjustments</td><td class="text-right">{{ (($movement['adjustments'] ?? 0) >= 0 ? '+' : '&minus;') . number_format(abs($movement['adjustments'] ?? 0)) }}</td></tr>
            <tr><td>Closing Stock</td><td class="text-right">{{ number_format($movement['closing_stock'] ?? 0) }}</td></tr>
        </tbody>
    </table>
    @endif

    <!-- Inventory attention -->
    @if(!empty($attention) && $title === 'Stock Report')
    <div class="section-heading">Needs Attention</div>
    @foreach(['negative' => 'Negative Stock', 'out_of_stock' => 'Out of Stock', 'low_stock' => 'Low Stock'] as $key => $label)
        @if(!empty($attention[$key]))
        <div style="font-size:10px;font-weight:600;margin:8px 0 3px;text-transform:uppercase;color:#6b7280;">{{ $label }}</div>
        <table class="data" style="margin-bottom:8px;">
            @foreach($attention[$key] as $a)
            <tr>
                <td>{{ $a['name'] }}</td>
                <td class="text-right">{{ number_format($a['stock_quantity']) }} {{ $a['unit'] }}</td>
            </tr>
            @endforeach
        </table>
        @endif
    @endforeach
    @endif

    <!-- Events timeline (Day Book) -->
    @if(!empty($events))
    <div class="section-heading">Event Timeline</div>
    <table class="data">
        <thead>
            <tr>
                <th style="width:12%">Time</th>
                <th style="width:14%">Type</th>
                <th style="width:16%">Reference</th>
                <th>Description</th>
                <th style="width:14%">Party</th>
                <th style="width:14%;text-align:right;">Amount</th>
            </tr>
        </thead>
        <tbody>
            @foreach($events as $e)
            <tr>
                <td>{{ $e['time'] }}</td>
                <td>{{ $e['type'] }}</td>
                <td>{{ $e['ref'] }}</td>
                <td>{{ mb_substr($e['description'], 0, 50) }}</td>
                <td>{{ mb_substr($e['party'], 0, 20) }}</td>
                <td class="text-right">
                    @if($e['is_financial'] && $e['amount'] > 0)
                        <span class="emerald">Rs {{ number_format($e['amount']) }}</span>
                    @elseif($e['is_financial'] && $e['amount'] < 0)
                        <span class="red">(Rs {{ number_format(abs($e['amount'])) }})</span>
                    @else
                        <span style="color:#9ca3af;">—</span>
                    @endif
                </td>
            </tr>
            @endforeach
        </tbody>
    </table>
    @endif

    <!-- Sales Report -->
    @if($title === 'Sales Report' && !empty($rows))
    <div class="section-heading">Sales</div>
    <table class="data">
        <thead><tr>
            <th style="width:16%">Invoice</th>
            <th style="width:14%">Date</th>
            <th>Customer</th>
            <th style="width:14%;text-align:right;">Total</th>
            <th style="width:14%;text-align:right;">Paid</th>
            <th style="width:12%;text-align:center;">Status</th>
        </tr></thead>
        <tbody>
            @foreach($rows as $r)
            @php
                $ts = strtotime($r['date']);
                $date = ($ts !== false && $ts > 0) ? date('d M Y', $ts) : $r['date'];
            @endphp
            <tr>
                <td>{{ $r['invoice'] }}</td>
                <td>{{ $date }}</td>
                <td>{{ $r['customer'] }}</td>
                <td class="text-right">Rs {{ number_format((float)$r['total'], 0) }}</td>
                <td class="text-right">Rs {{ number_format((float)$r['paid'], 0) }}</td>
                <td class="text-center"><span class="badge badge-{{ $r['status'] }}">{{ ucfirst($r['status']) }}</span></td>
            </tr>
            @endforeach
        </tbody>
    </table>
    @endif

    <!-- Purchase Report -->
    @if($title === 'Purchase Report' && !empty($rows))
    <div class="section-heading">Purchases</div>
    <table class="data">
        <thead><tr>
            <th style="width:16%">Reference</th>
            <th style="width:14%">Date</th>
            <th>Supplier</th>
            <th style="width:14%;text-align:right;">Total</th>
            <th style="width:14%;text-align:right;">Paid</th>
            <th style="width:12%;text-align:center;">Status</th>
        </tr></thead>
        <tbody>
            @foreach($rows as $r)
            @php
                $ts = strtotime($r['date']);
                $date = ($ts !== false && $ts > 0) ? date('d M Y', $ts) : $r['date'];
            @endphp
            <tr>
                <td>{{ $r['ref'] }}</td>
                <td>{{ $date }}</td>
                <td>{{ $r['supplier'] }}</td>
                <td class="text-right">Rs {{ number_format((float)$r['total'], 0) }}</td>
                <td class="text-right">Rs {{ number_format((float)$r['paid'], 0) }}</td>
                <td class="text-center"><span class="badge badge-{{ $r['status'] }}">{{ ucfirst($r['status']) }}</span></td>
            </tr>
            @endforeach
        </tbody>
    </table>
    @endif

    <!-- Stock Report -->
    @if($title === 'Stock Report' && !empty($rows))
    <div class="section-heading">Products</div>
    <table class="data">
        <thead><tr>
            <th style="width:26%">Product</th>
            <th style="width:12%">SKU</th>
            <th style="width:16%">Category</th>
            <th style="width:8%;text-align:right;">Stock</th>
            <th style="width:14%;text-align:right;">Value</th>
            <th style="width:12%;text-align:center;">Status</th>
        </tr></thead>
        <tbody>
            @foreach($rows as $r)
            <tr>
                <td>{{ $r['product'] }}</td>
                <td>{{ $r['sku'] }}</td>
                <td>{{ $r['category'] }}</td>
                <td class="text-right">{{ number_format((float)$r['stock']) }}</td>
                <td class="text-right">Rs {{ number_format((float)($r['value'] ?? 0)) }}</td>
                <td class="text-center"><span class="badge badge-{{ $r['status'] }}">{{ ucfirst($r['status']) }}</span></td>
            </tr>
            @endforeach
        </tbody>
    </table>
    @endif

    <!-- Closing summary -->
    @if(!empty($closing))
    @php $closingVals = array_filter($closing, fn($v) => is_numeric($v)); @endphp
    @if(count($closingVals) > 0)
    <div class="section-heading">Closing Summary</div>
    <div class="summary-grid">
        @foreach(array_slice($closingVals, 0, 4) as $k => $v)
        <div class="cell">
            <div class="s-label">{{ ucwords(str_replace('_', ' ', $k)) }}</div>
            <div class="s-value {{ in_array($k, ['closing_balance','closing_cash']) && $v >= 0 ? 'emerald' : (in_array($k, ['total_money_out']) ? 'red' : '') }}">
                @if(in_array($k, $countKeys ?? []))
                    {{ number_format((float)$v) }}
                @else
                    {{ is_numeric($v) ? 'Rs ' . number_format((float)$v) : $v }}
                @endif
            </div>
        </div>
        @endforeach
    </div>
    @endif
    @endif

    <!-- Footer -->
    <div class="footer">
        Generated by {{ $settings['business']['business_name'] ?? 'Invenos' }} POS — {{ date('d M Y, h:i A') }}
    </div>

</div>
</body>
</html>