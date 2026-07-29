import { t as require_jsx_runtime } from "./jsx-runtime-BjJQA5sn.js";
import { at as formatCurrency, vt as Package } from "./app-DCc201bC.js";
import { createTabularReport } from "./TabularReportPage-DxjJZYEO.js";
import { s as getStockReport } from "./reports-data-BRN2f5ah.js";
import { StatusBadge } from "./StatusBadge-CC0s9xUX.js";
//#region resources/js/Pages/reports/StockReport.tsx
var import_jsx_runtime = require_jsx_runtime();
var StockReport_default = createTabularReport({
	title: "Stock Report",
	subtitle: "Current inventory levels and valuation",
	icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Package, { className: "size-5 text-primary" }),
	getData: () => getStockReport(),
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
				children: r.sku
			})
		},
		{
			key: "category",
			header: "Category",
			render: (r) => r.category,
			sortable: true
		},
		{
			key: "stock",
			header: "Stock",
			render: (r) => r.stock.toLocaleString(),
			className: "text-right font-semibold",
			sortable: true,
			sortValue: (r) => r.stock
		},
		{
			key: "threshold",
			header: "Threshold",
			render: (r) => r.threshold.toLocaleString(),
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
		},
		{
			key: "value",
			header: "Value",
			render: (r) => formatCurrency(r.value),
			className: "text-right font-semibold",
			sortable: true,
			sortValue: (r) => r.value
		}
	],
	keyExtractor: (r) => r.id,
	summaryCards: (data) => {
		const totalValue = data.reduce((s, r) => s + r.value, 0);
		const lowStockCount = data.filter((r) => r.status === "low-stock").length;
		const outOfStockCount = data.filter((r) => r.status === "out-of-stock").length;
		return [
			{
				label: "Total Products",
				value: String(data.length)
			},
			{
				label: "Inventory Value",
				value: formatCurrency(totalValue),
				positive: true
			},
			{
				label: "Low Stock Items",
				value: String(lowStockCount),
				negative: lowStockCount > 0
			},
			{
				label: "Out of Stock",
				value: String(outOfStockCount),
				negative: outOfStockCount > 0
			}
		];
	},
	searchable: true,
	searchPlaceholder: "Search by product name or SKU...",
	onSearch: (data, q) => data.filter((r) => r.name.toLowerCase().includes(q) || r.sku.toLowerCase().includes(q)),
	emptyMessage: "No products found."
});
//#endregion
export { StockReport_default as default };
