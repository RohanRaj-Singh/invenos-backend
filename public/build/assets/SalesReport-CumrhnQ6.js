import { t as require_jsx_runtime } from "./jsx-runtime-BjJQA5sn.js";
import { at as formatCurrency, ft as ShoppingCart } from "./app-BLMvu7I3.js";
import { createTabularReport } from "./TabularReportPage-CyXZ-mg-.js";
import { o as getSalesReport } from "./reports-data-CBYZ41r3.js";
import { StatusBadge } from "./StatusBadge-CC0s9xUX.js";
//#region resources/js/Pages/reports/SalesReport.tsx
var import_jsx_runtime = require_jsx_runtime();
var SalesReport_default = createTabularReport({
	title: "Sales Report",
	subtitle: "All sales transactions with summaries",
	icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ShoppingCart, { className: "size-5 text-primary" }),
	getData: (range) => getSalesReport(range),
	columns: [
		{
			key: "invoice",
			header: "Invoice",
			render: (r) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "font-medium",
				children: r.invoice
			}),
			sortable: true,
			sortValue: (r) => r.invoice
		},
		{
			key: "date",
			header: "Date",
			render: (r) => r.date,
			sortable: true
		},
		{
			key: "customer",
			header: "Customer",
			render: (r) => r.customer,
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
		const totalRev = data.reduce((s, r) => s + r.total, 0);
		const totalPaid = data.reduce((s, r) => s + r.paid, 0);
		return [
			{
				label: "Total Sales",
				value: String(data.length)
			},
			{
				label: "Total Revenue",
				value: formatCurrency(totalRev),
				positive: true
			},
			{
				label: "Total Collected",
				value: formatCurrency(totalPaid),
				positive: true
			},
			{
				label: "Avg Sale",
				value: formatCurrency(data.length > 0 ? Math.round(totalRev / data.length) : 0)
			}
		];
	},
	showPaymentMethod: true,
	searchable: true,
	searchPlaceholder: "Search by invoice or customer...",
	onSearch: (data, q) => data.filter((r) => r.invoice.toLowerCase().includes(q) || r.customer.toLowerCase().includes(q)),
	emptyMessage: "No sales found in this date range."
});
//#endregion
export { SalesReport_default as default };
