import { i as __toESM, t as require_react } from "./react-DCO0ASPG.js";
import { t as ReportToolbar } from "./ReportToolbar-Bz_3cMrv.js";
import { t as TriangleAlert } from "./triangle-alert-D5zO2woV.js";
import { t as require_jsx_runtime } from "./jsx-runtime-BjJQA5sn.js";
import { Ot as usePage } from "./app-DxiW8KTt.js";
import { t as ReportLayout } from "./ReportLayout-647vA4sZ.js";
import { t as SummaryCards } from "./SummaryCards-dGWtU2Mx.js";
import { t as ReportTable } from "./ReportTable-DnYaxygU.js";
import { StatusBadge } from "./StatusBadge-CC0s9xUX.js";
//#region resources/js/Pages/reports/LowStockReport.tsx
var import_react = /* @__PURE__ */ __toESM(require_react(), 1);
var import_jsx_runtime = require_jsx_runtime();
function LowStockReportPage() {
	const { props } = usePage();
	const products = (props.report || {
		products: [],
		meta: null
	}).products || [];
	const cards = (0, import_react.useMemo)(() => {
		const lowStock = products.filter((p) => p.status === "low-stock");
		const outOfStock = products.filter((p) => p.status === "out-of-stock");
		const totalShortfall = products.reduce((s, p) => s + Math.max(0, (p.low_stock_threshold || 0) - p.stock_quantity), 0);
		return [
			{
				label: "Products to Reorder",
				value: String(products.length),
				negative: products.length > 0
			},
			{
				label: "Low Stock",
				value: String(lowStock.length),
				negative: lowStock.length > 0
			},
			{
				label: "Out of Stock",
				value: String(outOfStock.length),
				negative: outOfStock.length > 0
			},
			{
				label: "Total Shortfall",
				value: totalShortfall.toLocaleString(),
				negative: totalShortfall > 0
			}
		];
	}, [products]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(ReportLayout, {
		title: "Low Stock Report",
		subtitle: "Products that need reordering — below or at their minimum stock threshold",
		icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TriangleAlert, { className: "size-5 text-primary" }),
		toolbar: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ReportToolbar, {
			csvExportUrl: "/reports/stock/low-stock/export/csv",
			onPrint: () => window.print()
		}),
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SummaryCards, { cards }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ReportTable, {
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
					key: "stock_quantity",
					header: "In Stock",
					render: (r) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: `text-sm font-semibold tabular-nums ${r.stock_quantity <= 0 ? "text-red-500" : r.stock_quantity <= (r.low_stock_threshold || 0) ? "text-amber-500" : "text-foreground"}`,
						children: r.stock_quantity.toLocaleString()
					}),
					className: "text-right",
					sortable: true
				},
				{
					key: "low_stock_threshold",
					header: "Threshold",
					render: (r) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "text-sm text-muted-foreground tabular-nums",
						children: (r.low_stock_threshold || 0).toLocaleString()
					}),
					className: "text-right"
				},
				{
					key: "status",
					header: "Status",
					render: (r) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(StatusBadge, {
						status: r.status,
						kind: "stock"
					}),
					sortable: true
				},
				{
					key: "shortfall",
					header: "Shortfall",
					render: (r) => {
						const shortfall = Math.max(0, (r.low_stock_threshold || 0) - r.stock_quantity);
						return shortfall > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-sm font-semibold text-red-500 tabular-nums",
							children: shortfall.toLocaleString()
						}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-xs text-muted-foreground",
							children: "—"
						});
					},
					className: "text-right"
				}
			],
			data: products,
			keyExtractor: (r) => String(r.id),
			pageSize: 25,
			searchable: true,
			searchPlaceholder: "Search by product name or SKU...",
			onSearch: (data, q) => data.filter((r) => r.name.toLowerCase().includes(q) || (r.sku || "").toLowerCase().includes(q)),
			emptyMessage: "All products are adequately stocked. No reorder alerts."
		})]
	});
}
//#endregion
export { LowStockReportPage as default };
