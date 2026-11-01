<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8">
<title>{{ $sale->invoice_number }} — {{ $settings['business']['business_name'] ?? 'Invenos' }}</title>
<style>
    @page { margin: 22px 26px 28px; }
    * { box-sizing: border-box; }
    html, body { background: #ffffff; }
    body { font-family: DejaVu Sans, sans-serif; font-size: 11px; color: #111827; margin: 0; }
    .brand-bar { height: 5px; background: #0f766e; margin-bottom: 18px; }
    table { width: 100%; border-collapse: collapse; }
    .header td { vertical-align: top; }
    .biz-name { font-size: 19px; font-weight: bold; letter-spacing: -0.3px; }
    .muted { color: #6b7280; }
    .small { font-size: 9.5px; }
    .doc-title { text-align: right; font-size: 15px; font-weight: bold; letter-spacing: 1px; color: #0f766e; }
    .meta { text-align: right; font-size: 10px; margin-top: 4px; }
    .meta span { display: block; }
    .section { margin-top: 12px; }
    .label { font-size: 8.5px; text-transform: uppercase; letter-spacing: 0.6px; color: #6b7280; margin-bottom: 2px; }
    .party { font-size: 12px; font-weight: bold; }
    .items thead th { font-size: 8.5px; text-transform: uppercase; letter-spacing: 0.5px; color: #374151; border-bottom: 1.5px solid #111827; padding: 6px 4px; text-align: left; }
    .items tbody td { border-bottom: 1px solid #e5e7eb; padding: 6px 4px; vertical-align: top; }
    .items tbody tr:nth-child(even) td { background: #f9fafb; }
    .right { text-align: right; }
    .center { text-align: center; }
    .totals { width: 46%; margin-left: 54%; margin-top: 12px; border: 1px solid #e5e7eb; border-top: 3px solid #0f766e; padding: 8px 12px; }
    .totals td { padding: 3px 0; }
    .totals .grand td { border-top: 1px solid #d1d5db; font-size: 13px; font-weight: bold; padding-top: 6px; }
    .badge { display: inline-block; padding: 2px 7px; border-radius: 8px; font-size: 9px; font-weight: bold; }
    .paid { background: #d1fae5; color: #065f46; }
    .unpaid { background: #fee2e2; color: #991b1b; }
    .partial { background: #fef3c7; color: #92400e; }
    .terms { margin-top: 10px; font-size: 9.5px; color: #6b7280; }
    .signatures { margin-top: 20px; }
    .signatures td { width: 33%; text-align: center; padding-top: 26px; }
    .sig-line { border-top: 1px solid #9ca3af; margin: 0 12px; padding-top: 4px; font-size: 9px; color: #4b5563; }
    .footer { position: fixed; bottom: -14px; left: 0; right: 0; text-align: center; font-size: 8.5px; color: #9ca3af; }
</style>
</head>
<body>
<div class="brand-bar"></div>

<table class="header">
    <tr>
        <td width="62%">
            <div class="biz-name">{{ $settings['business']['business_name'] ?? 'Invenos' }}</div>
            @if(!empty($settings['business']['address']))<div class="muted small">{{ $settings['business']['address'] }}</div>@endif
            @if(!empty($settings['business']['phone']))<div class="muted small">{{ $settings['business']['phone'] }}</div>@endif
            @if(!empty($settings['business']['email']))<div class="muted small">{{ $settings['business']['email'] }}</div>@endif
            @if(!empty($settings['business']['website']))<div class="muted small">{{ $settings['business']['website'] }}</div>@endif
        </td>
        <td width="38%">
            <div class="doc-title">{{ $settings['receipt']['sale_title'] ?? 'SALE INVOICE' }}</div>
            <div class="meta">
                <span><strong>{{ $sale->invoice_number }}</strong></span>
                <span>{{ \Illuminate\Support\Carbon::parse($sale->date)->format('d M Y') }}</span>
                <span class="badge {{ $sale->payment_status === 'paid' ? 'paid' : ($sale->payment_status === 'partial' ? 'partial' : 'unpaid') }}">{{ strtoupper($sale->payment_status) }}</span>
            </div>
        </td>
    </tr>
</table>

<div class="section">
    <table>
        <tr>
            <td width="60%">
                <div class="label">Billed To</div>
                <div class="party">{{ $sale->customer->name ?? $sale->customer_name }}</div>
                @if($sale->customer?->phone)<div class="muted small">{{ $sale->customer->phone }}</div>@endif
                @if($sale->customer?->address)<div class="muted small">{{ $sale->customer->address }}</div>@endif
            </td>
            <td width="40%" class="right">
                <div class="label">Prepared By</div>
                <div class="small">{{ $sale->created_by ?: 'System' }}</div>
                @if($sale->source)<div class="muted small">Source: {{ ucfirst($sale->source) }}</div>@endif
            </td>
        </tr>
    </table>
</div>

<table class="items section">
    <thead>
        <tr>
            <th width="5%">#</th>
            <th width="43%">Product</th>
            <th width="12%">Unit</th>
            <th width="10%" class="right">Qty</th>
            <th width="15%" class="right">Price</th>
            <th width="15%" class="right">Total</th>
        </tr>
    </thead>
    <tbody>
        @foreach($sale->items as $i => $item)
        <tr>
            <td class="muted">{{ $i + 1 }}</td>
            <td>{{ $item->product_name }}</td>
            <td class="muted">{{ $item->packaging_name ?: 'Unit' }}</td>
            <td class="right">{{ rtrim(rtrim(number_format((float) $item->base_quantity, 3, '.', ''), '0'), '.') }}</td>
            <td class="right">{{ number_format((float) $item->unit_price, 0) }}</td>
            <td class="right">{{ number_format((float) $item->total, 0) }}</td>
        </tr>
        @endforeach
    </tbody>
</table>

<table class="totals">
    <tr><td class="muted">Subtotal</td><td class="right">{{ number_format((float) $sale->subtotal, 0) }}</td></tr>
    @if((float) $sale->discount > 0)
    <tr><td class="muted">Discount</td><td class="right">-{{ number_format((float) $sale->discount, 0) }}</td></tr>
    @endif
    <tr class="grand"><td>Total</td><td class="right">{{ $settings['business']['currency_symbol'] ?? 'Rs.' }} {{ number_format((float) $sale->grand_total, 0) }}</td></tr>
    <tr><td class="muted">Paid</td><td class="right">{{ number_format((float) $sale->amount_paid, 0) }}</td></tr>
    @if((float) $sale->outstanding_balance > 0)
    <tr><td class="muted">Outstanding</td><td class="right">{{ number_format((float) $sale->outstanding_balance, 0) }}</td></tr>
    @endif
</table>

@if(!empty($sale->notes) || !empty($settings['receipt']['footer_text']))
<div class="terms">
    @if(!empty($sale->notes))<div><strong>Notes:</strong> {{ $sale->notes }}</div>@endif
    @if(!empty($settings['receipt']['footer_text']))<div>{{ $settings['receipt']['footer_text'] }}</div>@endif
</div>
@endif

<table class="signatures">
    <tr>
        <td><div class="sig-line">Customer Signature</div></td>
        <td><div class="sig-line">Authorized Signature</div></td>
        <td><div class="sig-line">Received By</div></td>
    </tr>
</table>

<div class="footer">
    {{ $settings['business']['business_name'] ?? 'Invenos' }} · {{ $sale->invoice_number }} · Generated {{ now()->format('d M Y H:i') }}
</div>
</body>
</html>
