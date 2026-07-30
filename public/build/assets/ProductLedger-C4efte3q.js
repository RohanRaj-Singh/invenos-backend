import { i as __toESM, t as require_react } from "./react-DCO0ASPG.js";
import { t as ReportToolbar } from "./ReportToolbar-BJ2ZrMm8.js";
import { t as Minus } from "./minus-jjDOQ6-9.js";
import { t as TrendingDown } from "./trending-down-CfQNbrbW.js";
import { t as TrendingUp } from "./trending-up-CRrMyRfV.js";
import { t as require_jsx_runtime } from "./jsx-runtime-BjJQA5sn.js";
import { Ot as usePage, _t as Package, it as formatDate, rt as formatCurrency } from "./app-DQEL3DJY.js";
import { t as ReportLayout } from "./ReportLayout-647vA4sZ.js";
import { t as SummaryCards } from "./SummaryCards-BppIOUfw.js";
import { t as ReportTable } from "./ReportTable-BrSW-XVm.js";
//#region resources/js/Pages/reports/ProductLedger.tsx
var import_react = /* @__PURE__ */ __toESM(require_react(), 1);
var import_jsx_runtime = require_jsx_runtime();
function ProductLedgerPage() {
	const { props } = usePage();
	const report = props.report || {
		product: null,
		movements: [],
		summary: {}
	};
	const product = report.product;
	const summary = report.summary || {};
	const movements = report.movements || [];
	const cards = (0, import_react.useMemo)(() => [
		{
			label: "Current Stock",
			value: (summary.current_stock || 0).toLocaleString()
		},
		{
			label: "Stock Value",
			value: formatCurrency(summary.stock_value || 0),
			positive: true
		},
		{
			label: "Total Purchased",
			value: (summary.total_purchased || 0).toLocaleString(),
			positive: true
		},
		{
			label: "Total Sold",
			value: (summary.total_sold || 0).toLocaleString(),
			negative: true
		},
		{
			label: "Sale Returns",
			value: (summary.total_sale_returned || 0).toLocaleString(),
			positive: true
		},
		{
			label: "Adj / Ret Out",
			value: (Math.abs(summary.total_purchase_returned || 0) + Math.abs(summary.total_adjusted || 0)).toLocaleString()
		}
	], [summary]);
	const columns = [
		{
			key: "date",
			header: "Date",
			render: (r) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "text-xs font-medium",
				children: formatDate(r.date) || "—"
			}),
			sortable: true
		},
		{
			key: "type",
			header: "Type",
			render: (r) => {
				const cfg = {
					"purchase": {
						label: "Purchase",
						icon: TrendingUp,
						cls: "text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30"
					},
					"sale": {
						label: "Sale",
						icon: TrendingDown,
						cls: "text-blue-600 bg-blue-50 dark:bg-blue-950/30"
					},
					"sale-return": {
						label: "Sale Return",
						icon: TrendingUp,
						cls: "text-amber-600 bg-amber-50 dark:bg-amber-950/30"
					},
					"purchase-return": {
						label: "Purchase Return",
						icon: TrendingDown,
						cls: "text-red-600 bg-red-50 dark:bg-red-950/30"
					},
					"adjustment": {
						label: "Adjustment",
						icon: Minus,
						cls: "text-purple-600 bg-purple-50 dark:bg-purple-950/30"
					}
				}[r.type] || {
					label: r.type,
					icon: Minus,
					cls: "text-muted-foreground bg-muted/50"
				};
				const Icon = cfg.icon;
				return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
					className: `inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold ${cfg.cls}`,
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, { className: "size-3" }),
						" ",
						cfg.label
					]
				});
			}
		},
		{
			key: "quantity",
			header: "Qty In/Out",
			render: (r) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
				className: `text-sm font-semibold tabular-nums ${r.quantity > 0 ? "text-emerald-600" : r.quantity < 0 ? "text-red-500" : ""}`,
				children: [r.quantity > 0 ? "+" : "", r.quantity.toLocaleString()]
			}),
			className: "text-right",
			sortable: true,
			sortValue: (r) => r.quantity
		},
		{
			key: "running_balance",
			header: "Running Balance",
			render: (r) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "text-sm font-semibold tabular-nums",
				children: r.running_balance.toLocaleString()
			}),
			className: "text-right",
			sortable: true,
			sortValue: (r) => r.running_balance
		},
		{
			key: "reference",
			header: "Reference",
			render: (r) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("code", {
				className: "text-[10px] font-mono bg-muted px-1 py-0.5 rounded",
				children: r.reference || "—"
			})
		},
		{
			key: "notes",
			header: "Notes",
			render: (r) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "text-xs text-muted-foreground",
				children: r.notes || "—"
			})
		}
	];
	if (!product) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ReportLayout, {
		title: "Product Ledger",
		subtitle: "Complete inventory audit trail for any product",
		icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Package, { className: "size-5 text-primary" }),
		toolbar: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ReportToolbar, { onPrint: () => window.print() }),
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "text-center py-24 text-sm text-muted-foreground",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Package, { className: "size-12 mx-auto mb-3 text-muted-foreground/20" }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "Select a product to view its complete inventory timeline." }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-xs mt-1",
					children: "Navigate from the Stock Report or a product detail page."
				})
			]
		})
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(ReportLayout, {
		title: product.name || `Product #${product.id}`,
		subtitle: `SKU: ${product.sku || "—"} · ${product.category?.name || "Uncategorized"} · Complete inventory audit trail`,
		icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Package, { className: "size-5 text-primary" }),
		toolbar: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ReportToolbar, { onPrint: () => window.print() }),
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SummaryCards, { cards }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "rounded-xl border border-border bg-muted/30 p-3 sm:p-4",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center gap-2 sm:gap-4 flex-wrap text-xs text-muted-foreground",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "font-medium",
							children: "Opening"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TrendingUp, { className: "size-3 text-emerald-500" }),
						" ",
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: "text-emerald-600 font-medium",
							children: ["+", summary.total_purchased || 0]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TrendingDown, { className: "size-3 text-red-500" }),
						" ",
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: "text-red-500 font-medium",
							children: ["-", summary.total_sold || 0]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TrendingUp, { className: "size-3 text-amber-500" }),
						" ",
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: "text-amber-600 font-medium",
							children: ["+", summary.total_sale_returned || 0]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TrendingDown, { className: "size-3 text-red-400" }),
						" ",
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: "text-red-400 font-medium",
							children: ["-", summary.total_purchase_returned || 0]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Minus, { className: "size-3 text-purple-500" }),
						" ",
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-purple-600 font-medium",
							children: summary.total_adjusted || 0
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: "font-bold text-foreground",
							children: [
								"= ",
								summary.current_stock || 0,
								" Current"
							]
						})
					]
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ReportTable, {
				columns,
				data: movements,
				keyExtractor: (r) => String(r.id),
				pageSize: 25,
				searchable: true,
				searchPlaceholder: "Search by reference or notes...",
				onSearch: (data, q) => data.filter((r) => (r.reference || "").toLowerCase().includes(q) || (r.notes || "").toLowerCase().includes(q)),
				emptyMessage: "No inventory movements found for this product."
			})
		]
	});
}
//#endregion
export { ProductLedgerPage as default };
