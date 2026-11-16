import { a as __toESM, n as require_react, t as require_jsx_runtime } from "./jsx-runtime-Do9val7F.js";
import { t as TrendingUp } from "./trending-up-wta7gaFR.js";
import { Mt as usePage, it as formatCurrency } from "./app-C7AUNtSc.js";
import { ReportLayout } from "./ReportLayout-DdPv5xpK.js";
import { ReportToolbar } from "./ReportToolbar-DkFXNV3_.js";
import { SummaryCards } from "./SummaryCards-DMXMwOZs.js";
import { ReportTable } from "./ReportTable-CP_op9dT.js";
//#region resources/js/Pages/reports/TopProducts.tsx
var import_react = /* @__PURE__ */ __toESM(require_react(), 1);
var import_jsx_runtime = require_jsx_runtime();
function TopProductsPage() {
	const { props } = usePage();
	const rows = (props.report || {}).products || [];
	const cards = (0, import_react.useMemo)(() => {
		const revenue = rows.reduce((s, r) => s + Number(r.total_revenue || 0), 0);
		const qty = rows.reduce((s, r) => s + Number(r.total_qty || 0), 0);
		return [
			{
				label: "Products",
				value: String(rows.length)
			},
			{
				label: "Units Sold",
				value: qty.toLocaleString()
			},
			{
				label: "Revenue",
				value: formatCurrency(revenue),
				positive: revenue > 0
			},
			{
				label: "Best Seller",
				value: rows.length > 0 ? rows[0].product_name : "—"
			}
		];
	}, [rows]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(ReportLayout, {
		title: "Top Products",
		subtitle: "Best selling products by revenue in the selected period",
		icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TrendingUp, { className: "size-5 text-primary" }),
		toolbar: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ReportToolbar, { onPrint: () => window.print() }),
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SummaryCards, { cards }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ReportTable, {
			columns: [
				{
					key: "product_name",
					header: "Product",
					render: (r) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "font-medium",
						children: r.product_name || "—"
					}),
					sortable: true,
					sortValue: (r) => r.product_name || ""
				},
				{
					key: "total_qty",
					header: "Qty Sold",
					render: (r) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "tabular-nums",
						children: Number(r.total_qty || 0).toLocaleString()
					}),
					className: "text-right",
					sortable: true,
					sortValue: (r) => Number(r.total_qty || 0)
				},
				{
					key: "invoice_count",
					header: "Invoices",
					render: (r) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "tabular-nums text-muted-foreground",
						children: Number(r.invoice_count || 0).toLocaleString()
					}),
					className: "text-right",
					sortable: true,
					sortValue: (r) => Number(r.invoice_count || 0)
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
				}
			],
			data: rows,
			keyExtractor: (r) => String(r.product_id),
			pageSize: 25,
			searchable: true,
			searchPlaceholder: "Search by product...",
			onSearch: (data, q) => data.filter((r) => (r.product_name || "").toLowerCase().includes(q)),
			emptyMessage: "No product sales found for the selected filters."
		})]
	});
}
//#endregion
export { TopProductsPage as default };
