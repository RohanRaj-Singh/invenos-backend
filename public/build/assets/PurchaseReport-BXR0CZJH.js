import { i as __toESM, t as require_react } from "./react-DCO0ASPG.js";
import { t as ReportToolbar } from "./ReportToolbar-Bz_3cMrv.js";
import { t as require_jsx_runtime } from "./jsx-runtime-BjJQA5sn.js";
import { Ot as usePage, ft as ShoppingBag, it as formatDate, rt as formatCurrency } from "./app-DxiW8KTt.js";
import { t as ReportLayout } from "./ReportLayout-647vA4sZ.js";
import { t as SummaryCards } from "./SummaryCards-dGWtU2Mx.js";
import { t as ReportTable } from "./ReportTable-DnYaxygU.js";
import { StatusBadge } from "./StatusBadge-CC0s9xUX.js";
//#region resources/js/Pages/reports/PurchaseReport.tsx
var import_react = /* @__PURE__ */ __toESM(require_react(), 1);
var import_jsx_runtime = require_jsx_runtime();
function PurchaseReportPage() {
	const { props } = usePage();
	const report = props.report || {
		bills: [],
		meta: null,
		summary: {}
	};
	const bills = report.bills || [];
	const summary = report.summary || {};
	const cards = (0, import_react.useMemo)(() => [
		{
			label: "Total Purchases",
			value: String(summary.total_purchases || 0)
		},
		{
			label: "Total Value",
			value: formatCurrency(summary.total_value || 0),
			negative: true
		},
		{
			label: "Returns",
			value: formatCurrency(summary.total_returns || 0),
			positive: (summary.total_returns || 0) > 0
		},
		{
			label: "Net Purchases",
			value: formatCurrency(summary.net_purchases || 0),
			negative: true
		},
		{
			label: "Avg Purchase",
			value: formatCurrency(summary.average_purchase || 0)
		},
		{
			label: "Paid",
			value: formatCurrency(summary.total_paid || 0)
		}
	], [summary]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(ReportLayout, {
		title: "Purchase Register",
		subtitle: "All purchase bills with summaries",
		icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ShoppingBag, { className: "size-5 text-primary" }),
		toolbar: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ReportToolbar, {
			csvExportUrl: "/reports/purchases/export/csv",
			shareUrl: "/reports/share/purchases",
			reportTitle: "Purchase Report",
			onPrint: () => window.print()
		}),
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SummaryCards, { cards }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ReportTable, {
			columns: [
				{
					key: "invoice_ref",
					header: "Reference",
					render: (r) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "font-medium font-mono text-xs",
						children: r.invoice_ref
					}),
					sortable: true,
					sortValue: (r) => r.invoice_ref
				},
				{
					key: "date",
					header: "Date",
					render: (r) => formatDate(r.date),
					sortable: true
				},
				{
					key: "supplier",
					header: "Supplier",
					render: (r) => r.supplier?.name || r.supplier_name || "—",
					sortable: true,
					sortValue: (r) => r.supplier?.name || r.supplier_name || ""
				},
				{
					key: "total_amount",
					header: "Total",
					render: (r) => formatCurrency(r.total_amount),
					className: "text-right font-semibold",
					sortable: true,
					sortValue: (r) => r.total_amount
				},
				{
					key: "amount_paid",
					header: "Paid",
					render: (r) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "text-emerald-600",
						children: formatCurrency(r.amount_paid)
					}),
					className: "text-right",
					sortable: true,
					sortValue: (r) => r.amount_paid
				},
				{
					key: "payment_status",
					header: "Status",
					render: (r) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(StatusBadge, { status: r.payment_status })
				}
			],
			data: bills,
			keyExtractor: (r) => String(r.id),
			pageSize: 25,
			searchable: true,
			searchPlaceholder: "Search by reference or supplier...",
			onSearch: (data, q) => data.filter((r) => r.invoice_ref.toLowerCase().includes(q) || (r.supplier?.name || r.supplier_name || "").toLowerCase().includes(q)),
			emptyMessage: "No purchases found in this date range."
		})]
	});
}
//#endregion
export { PurchaseReportPage as default };
