import { i as __toESM, t as require_react } from "./react-DCO0ASPG.js";
import { t as ReportToolbar } from "./ReportToolbar-D8SR0LvN.js";
import { t as require_jsx_runtime } from "./jsx-runtime-BjJQA5sn.js";
import { Ot as usePage, _t as Package, rt as formatCurrency } from "./app-CwPUaRAl.js";
import { t as ReportLayout } from "./ReportLayout-647vA4sZ.js";
import { t as SummaryCards } from "./SummaryCards-D7455BBE.js";
import { t as ReportTable } from "./ReportTable-D008XYvR.js";
import { StatusBadge } from "./StatusBadge-CC0s9xUX.js";
//#region resources/js/Pages/reports/StockReport.tsx
var import_react = /* @__PURE__ */ __toESM(require_react(), 1);
var import_jsx_runtime = require_jsx_runtime();
function StockReportPage() {
	const { props } = usePage();
	const report = props.report;
	const products = report?.products || [];
	const summary = report?.summary || {
		total_products: 0,
		total_stock: 0,
		low_stock: 0,
		out_of_stock: 0,
		total_value: 0
	};
	const byCategory = report?.by_category || [];
	const cards = (0, import_react.useMemo)(() => [
		{
			label: "Total Products",
			value: String(summary.total_products)
		},
		{
			label: "Total Stock",
			value: summary.total_stock.toLocaleString()
		},
		{
			label: "Inventory Value",
			value: formatCurrency(summary.total_value),
			positive: true
		},
		{
			label: "Low Stock",
			value: String(summary.low_stock),
			negative: summary.low_stock > 0
		},
		{
			label: "Out of Stock",
			value: String(summary.out_of_stock),
			negative: summary.out_of_stock > 0
		}
	], [summary]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(ReportLayout, {
		title: "Stock Summary",
		subtitle: "Current inventory levels and valuation by category",
		icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Package, { className: "size-5 text-primary" }),
		toolbar: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ReportToolbar, {
			csvExportUrl: "/reports/stock/export/csv",
			shareUrl: "/reports/share/stock",
			reportTitle: "Stock Report",
			onPrint: () => window.print()
		}),
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SummaryCards, { cards }),
			byCategory.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2",
				children: byCategory.map((cat) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "rounded-xl border border-border bg-card p-3",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "text-[10px] text-muted-foreground font-medium uppercase tracking-wider",
							children: cat.category
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "text-sm font-semibold text-foreground mt-1",
							children: [cat.products, " products"]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "text-xs text-muted-foreground mt-0.5",
							children: formatCurrency(cat.value)
						})
					]
				}, cat.category))
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ReportTable, {
				columns: [
					{
						key: "name",
						header: "Product",
						render: (r) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "font-medium",
							children: r.name
						}),
						sortable: true,
						sortValue: (r) => r.name
					},
					{
						key: "sku",
						header: "SKU",
						render: (r) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("code", {
							className: "text-[11px] font-mono bg-muted px-1 py-0.5 rounded",
							children: r.sku || "—"
						})
					},
					{
						key: "category",
						header: "Category",
						render: (r) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-xs text-muted-foreground",
							children: r.category?.name || "—"
						}),
						sortable: true,
						sortValue: (r) => r.category?.name || ""
					},
					{
						key: "stock",
						header: "Stock",
						render: (r) => r.stock_quantity.toLocaleString(),
						className: "text-right font-semibold",
						sortable: true,
						sortValue: (r) => r.stock_quantity
					},
					{
						key: "threshold",
						header: "Threshold",
						render: (r) => (r.low_stock_threshold || 0).toLocaleString(),
						className: "text-right text-muted-foreground"
					},
					{
						key: "status",
						header: "Status",
						render: (r) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(StatusBadge, {
							status: r.status,
							kind: "stock"
						}),
						sortable: true,
						sortValue: (r) => r.status
					}
				],
				data: products,
				keyExtractor: (r) => String(r.id),
				pageSize: 25,
				searchable: true,
				searchPlaceholder: "Search by product name or SKU...",
				onSearch: (data, q) => data.filter((r) => r.name.toLowerCase().includes(q) || (r.sku || "").toLowerCase().includes(q)),
				emptyMessage: "No products found."
			})
		]
	});
}
//#endregion
export { StockReportPage as default };
