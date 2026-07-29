import { t as require_jsx_runtime } from "./jsx-runtime-BjJQA5sn.js";
import { at as formatCurrency, pt as ShoppingBag } from "./app-DGjxHKeP.js";
import { createTabularReport } from "./TabularReportPage-AVBhNF9F.js";
import { a as getPurchaseReport } from "./reports-data-DcXL9oIt.js";
import { StatusBadge } from "./StatusBadge-CC0s9xUX.js";
//#region resources/js/Pages/reports/PurchaseReport.tsx
var import_jsx_runtime = require_jsx_runtime();
var PurchaseReport_default = createTabularReport({
	title: "Purchase Report",
	subtitle: "All purchase transactions with summaries",
	icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ShoppingBag, { className: "size-5 text-primary" }),
	getData: (range) => getPurchaseReport(range),
	columns: [
		{
			key: "ref",
			header: "Ref",
			render: (r) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "font-medium",
				children: r.ref
			}),
			sortable: true,
			sortValue: (r) => r.ref
		},
		{
			key: "date",
			header: "Date",
			render: (r) => r.date,
			sortable: true
		},
		{
			key: "supplier",
			header: "Supplier",
			render: (r) => r.supplier,
			sortable: true
		},
		{
			key: "items",
			header: "Items",
			render: (r) => String(r.items),
			className: "text-center"
		},
		{
			key: "total",
			header: "Total",
			render: (r) => formatCurrency(r.total),
			className: "text-right font-semibold",
			sortable: true,
			sortValue: (r) => r.total
		},
		{
			key: "paid",
			header: "Paid",
			render: (r) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "text-emerald-600",
				children: formatCurrency(r.paid)
			}),
			className: "text-right",
			sortable: true,
			sortValue: (r) => r.paid
		},
		{
			key: "status",
			header: "Status",
			render: (r) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(StatusBadge, { status: r.status })
		}
	],
	keyExtractor: (r) => r.id,
	summaryCards: (data) => {
		const totalVal = data.reduce((s, r) => s + r.total, 0);
		const totalPaid = data.reduce((s, r) => s + r.paid, 0);
		return [
			{
				label: "Total Purchases",
				value: String(data.length)
			},
			{
				label: "Total Value",
				value: formatCurrency(totalVal),
				negative: true
			},
			{
				label: "Total Paid",
				value: formatCurrency(totalPaid)
			},
			{
				label: "Avg Purchase",
				value: formatCurrency(data.length > 0 ? Math.round(totalVal / data.length) : 0)
			}
		];
	},
	showPaymentMethod: true,
	searchable: true,
	searchPlaceholder: "Search by ref or supplier...",
	onSearch: (data, q) => data.filter((r) => r.ref.toLowerCase().includes(q) || r.supplier.toLowerCase().includes(q)),
	emptyMessage: "No purchases found in this date range."
});
//#endregion
export { PurchaseReport_default as default };
