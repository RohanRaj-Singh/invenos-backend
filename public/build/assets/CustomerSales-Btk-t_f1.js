import { a as __toESM, n as require_react, t as require_jsx_runtime } from "./jsx-runtime-Do9val7F.js";
import { Mt as usePage, it as formatCurrency, ut as Users } from "./app-ByfccPpi.js";
import { ReportLayout } from "./ReportLayout-DdP4OPZk.js";
import { ReportToolbar } from "./ReportToolbar-D5XyEnOP.js";
import { SummaryCards } from "./SummaryCards-BN_jySwx.js";
import { ReportTable } from "./ReportTable-C-viJnE3.js";
//#region resources/js/Pages/reports/CustomerSales.tsx
var import_react = /* @__PURE__ */ __toESM(require_react(), 1);
var import_jsx_runtime = require_jsx_runtime();
function CustomerSalesPage() {
	const { props } = usePage();
	const rows = (props.report || {}).rows || [];
	const cards = (0, import_react.useMemo)(() => {
		const revenue = rows.reduce((s, r) => s + Number(r.total_revenue || 0), 0);
		const paid = rows.reduce((s, r) => s + Number(r.total_paid || 0), 0);
		const invoices = rows.reduce((s, r) => s + Number(r.invoice_count || 0), 0);
		return [
			{
				label: "Customers",
				value: String(rows.length)
			},
			{
				label: "Invoices",
				value: String(invoices)
			},
			{
				label: "Revenue",
				value: formatCurrency(revenue),
				positive: revenue > 0
			},
			{
				label: "Outstanding",
				value: formatCurrency(Math.max(0, revenue - paid)),
				negative: revenue - paid > .01
			}
		];
	}, [rows]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(ReportLayout, {
		title: "Sales by Customer",
		subtitle: "Revenue and settlement grouped by customer",
		icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Users, { className: "size-5 text-primary" }),
		toolbar: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ReportToolbar, { onPrint: () => window.print() }),
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SummaryCards, { cards }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ReportTable, {
			columns: [
				{
					key: "customer_name",
					header: "Customer",
					render: (r) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "font-medium",
						children: r.customer_name || "Walk-in Customer"
					}),
					sortable: true,
					sortValue: (r) => r.customer_name || ""
				},
				{
					key: "invoice_count",
					header: "Invoices",
					render: (r) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "tabular-nums",
						children: Number(r.invoice_count).toLocaleString()
					}),
					className: "text-right",
					sortable: true,
					sortValue: (r) => Number(r.invoice_count)
				},
				{
					key: "total_discount",
					header: "Discount",
					render: (r) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "tabular-nums text-muted-foreground",
						children: formatCurrency(Number(r.total_discount || 0))
					}),
					className: "text-right",
					sortable: true,
					sortValue: (r) => Number(r.total_discount || 0)
				},
				{
					key: "total_revenue",
					header: "Revenue",
					render: (r) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "font-semibold tabular-nums",
						children: formatCurrency(Number(r.total_revenue || 0))
					}),
					className: "text-right",
					sortable: true,
					sortValue: (r) => Number(r.total_revenue || 0)
				},
				{
					key: "total_paid",
					header: "Paid",
					render: (r) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "tabular-nums",
						children: formatCurrency(Number(r.total_paid || 0))
					}),
					className: "text-right",
					sortable: true,
					sortValue: (r) => Number(r.total_paid || 0)
				},
				{
					key: "balance",
					header: "Balance",
					render: (r) => {
						const balance = Number(r.total_revenue || 0) - Number(r.total_paid || 0);
						return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: `tabular-nums ${balance > .01 ? "font-semibold text-red-500" : "text-muted-foreground"}`,
							children: formatCurrency(balance)
						});
					},
					className: "text-right"
				}
			],
			data: rows,
			keyExtractor: (r) => String(r.customer_id),
			pageSize: 25,
			searchable: true,
			searchPlaceholder: "Search by customer...",
			onSearch: (data, q) => data.filter((r) => (r.customer_name || "").toLowerCase().includes(q)),
			emptyMessage: "No customer sales found for the selected filters."
		})]
	});
}
//#endregion
export { CustomerSalesPage as default };
