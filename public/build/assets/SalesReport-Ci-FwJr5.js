import { i as __toESM, t as require_react } from "./react-DCO0ASPG.js";
import { t as ReportToolbar } from "./ReportToolbar-Bz_3cMrv.js";
import { t as TrendingUp } from "./trending-up-CRrMyRfV.js";
import { t as cn } from "./utils-Bim8RyS4.js";
import { t as require_jsx_runtime } from "./jsx-runtime-BjJQA5sn.js";
import { Dt as router3, Ot as usePage, _t as Package, ct as Users, dt as ShoppingCart, it as formatDate, rt as formatCurrency } from "./app-DxiW8KTt.js";
import { t as ReportLayout } from "./ReportLayout-647vA4sZ.js";
import { t as SummaryCards } from "./SummaryCards-dGWtU2Mx.js";
import { t as ReportTable } from "./ReportTable-DnYaxygU.js";
import { StatusBadge } from "./StatusBadge-CC0s9xUX.js";
import { DateFilter } from "./DateFilter-BVlWF9lc.js";
//#region resources/js/Pages/reports/SalesReport.tsx
var import_react = /* @__PURE__ */ __toESM(require_react(), 1);
var import_jsx_runtime = require_jsx_runtime();
function SalesReportPage() {
	const { props } = usePage();
	const report = props.report || {
		sales: [],
		meta: null,
		summary: {}
	};
	const sales = report.sales || [];
	const summary = report.summary || {};
	const filters = props.filters || {};
	const [showBreakdown, setShowBreakdown] = (0, import_react.useState)(false);
	const [topProductsData, setTopProductsData] = (0, import_react.useState)([]);
	const [customerData, setCustomerData] = (0, import_react.useState)([]);
	const [loadingBreakdown, setLoadingBreakdown] = (0, import_react.useState)(false);
	const handleDateChange = (preset, from, to) => {
		router3.get("/reports/sales", {
			preset,
			date_from: from,
			date_to: to
		}, { preserveState: true });
	};
	const cards = (0, import_react.useMemo)(() => [
		{
			label: "Total Sales",
			value: String(summary.total_sales || 0)
		},
		{
			label: "Revenue",
			value: formatCurrency(summary.total_revenue || 0),
			positive: true
		},
		{
			label: "Returns",
			value: formatCurrency(summary.total_returns || 0),
			negative: (summary.total_returns || 0) > 0
		},
		{
			label: "Net Revenue",
			value: formatCurrency(summary.net_revenue || 0),
			positive: true
		},
		{
			label: "Avg Order",
			value: formatCurrency(summary.average_order || 0)
		},
		{
			label: "Collected",
			value: formatCurrency(summary.total_paid || 0),
			positive: true
		}
	], [summary]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(ReportLayout, {
		title: "Sales Register",
		subtitle: "All sales transactions with summaries",
		icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ShoppingCart, { className: "size-5 text-primary" }),
		toolbar: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ReportToolbar, {
			csvExportUrl: "/reports/sales/export/csv",
			shareUrl: "/reports/share/sales",
			reportTitle: "Sales Report",
			currentFilters: {
				preset: filters.preset || "thisMonth",
				date_from: filters.date_from || "",
				date_to: filters.date_to || ""
			},
			onPrint: () => window.print()
		}),
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DateFilter, {
				value: filters.preset || "thisMonth",
				onChange: handleDateChange
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SummaryCards, { cards }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "flex items-center gap-2",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
					onClick: () => setShowBreakdown(!showBreakdown),
					className: cn("inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium transition-colors", showBreakdown ? "bg-foreground text-background border-foreground" : "bg-background text-muted-foreground border-border hover:text-foreground"),
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TrendingUp, { className: "size-3.5" }), showBreakdown ? "Hide Breakdown" : "Show Breakdown"]
				})
			}),
			showBreakdown && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "space-y-5",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center gap-2 mb-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Package, { className: "size-4 text-muted-foreground" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
						className: "text-xs font-semibold text-muted-foreground uppercase tracking-wider",
						children: "Top Products"
					})]
				}), topProductsData.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ReportTable, {
					columns: [
						{
							key: "product_name",
							header: "Product",
							render: (r) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "font-medium",
								children: r.product_name
							}),
							sortable: true,
							sortValue: (r) => r.product_name
						},
						{
							key: "total_qty",
							header: "Qty Sold",
							render: (r) => r.total_qty.toLocaleString(),
							className: "text-right",
							sortable: true,
							sortValue: (r) => r.total_qty
						},
						{
							key: "invoice_count",
							header: "Invoices",
							render: (r) => String(r.invoice_count),
							className: "text-center"
						},
						{
							key: "total_revenue",
							header: "Revenue",
							render: (r) => formatCurrency(r.total_revenue),
							className: "text-right font-semibold",
							sortable: true,
							sortValue: (r) => r.total_revenue
						}
					],
					data: topProductsData,
					keyExtractor: (r) => r.product_name,
					pageSize: 10,
					emptyMessage: "No product data available."
				}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "text-sm text-muted-foreground py-4 text-center",
					children: "No data — try a wider date range."
				})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center gap-2 mb-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Users, { className: "size-4 text-muted-foreground" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
						className: "text-xs font-semibold text-muted-foreground uppercase tracking-wider",
						children: "By Customer"
					})]
				}), customerData.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ReportTable, {
					columns: [
						{
							key: "customer_name",
							header: "Customer",
							render: (r) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "font-medium",
								children: r.customer_name
							}),
							sortable: true,
							sortValue: (r) => r.customer_name
						},
						{
							key: "invoice_count",
							header: "Invoices",
							render: (r) => String(r.invoice_count),
							className: "text-center"
						},
						{
							key: "total_revenue",
							header: "Revenue",
							render: (r) => formatCurrency(r.total_revenue),
							className: "text-right font-semibold",
							sortable: true,
							sortValue: (r) => r.total_revenue
						},
						{
							key: "total_paid",
							header: "Collected",
							render: (r) => formatCurrency(r.total_paid),
							className: "text-right",
							sortable: true,
							sortValue: (r) => r.total_paid
						}
					],
					data: customerData,
					keyExtractor: (r) => r.customer_name,
					pageSize: 10,
					emptyMessage: "No customer data available."
				}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "text-sm text-muted-foreground py-4 text-center",
					children: "No data — try a wider date range."
				})] })]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ReportTable, {
				columns: [
					{
						key: "invoice_number",
						header: "Invoice",
						render: (r) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "font-medium font-mono text-xs",
							children: r.invoice_number
						}),
						sortable: true,
						sortValue: (r) => r.invoice_number
					},
					{
						key: "date",
						header: "Date",
						render: (r) => formatDate(r.date),
						sortable: true
					},
					{
						key: "customer",
						header: "Customer",
						render: (r) => r.customer?.name || r.customer_name || "Walk-in",
						sortable: true,
						sortValue: (r) => r.customer?.name || r.customer_name || ""
					},
					{
						key: "grand_total",
						header: "Total",
						render: (r) => formatCurrency(r.grand_total),
						className: "text-right font-semibold",
						sortable: true,
						sortValue: (r) => r.grand_total
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
				data: sales,
				keyExtractor: (r) => String(r.id),
				pageSize: 25,
				searchable: true,
				searchPlaceholder: "Search by invoice or customer...",
				onSearch: (data, q) => data.filter((r) => r.invoice_number.toLowerCase().includes(q) || (r.customer?.name || r.customer_name || "").toLowerCase().includes(q)),
				emptyMessage: "No sales found in this date range."
			})
		]
	});
}
//#endregion
export { SalesReportPage as default };
