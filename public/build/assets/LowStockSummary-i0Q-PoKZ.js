import { i as __toESM, t as require_react } from "./react-DCO0ASPG.js";
import { t as ArrowRight } from "./arrow-right-BaJB_osx.js";
import { t as TriangleAlert } from "./triangle-alert-D5zO2woV.js";
import { t as cn } from "./utils-Bim8RyS4.js";
import { t as require_jsx_runtime } from "./jsx-runtime-BjJQA5sn.js";
import { Et as router3, vt as Package } from "./app-DfjygdMU.js";
import { i as CardTitle, n as CardContent, r as CardHeader, t as Card } from "./card-DQfOgTjC.js";
//#region resources/js/Pages/dashboard/components/LowStockSummary.tsx
var import_react = /* @__PURE__ */ __toESM(require_react(), 1);
var import_jsx_runtime = require_jsx_runtime();
function LowStockSummary({ lowStock = [] }) {
	const items = (0, import_react.useMemo)(() => {
		return lowStock.filter((p) => p.status === "low-stock" || p.status === "out-of-stock" || p.stock_quantity <= 10).sort((a, b) => a.stock_quantity - b.stock_quantity).slice(0, 5);
	}, [lowStock]);
	if (items.length === 0) return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardHeader, {
		className: "flex-row items-center justify-between",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardTitle, {
			className: "flex items-center gap-2",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Package, { className: "size-4 text-emerald-600" }), "Stock Status"]
		})
	}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardContent, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex flex-col items-center justify-center py-6 text-sm text-muted-foreground",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Package, { className: "size-8 text-emerald-500/30 mb-2" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "font-medium text-emerald-600",
				children: "All items in stock"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-xs mt-0.5",
				children: "No low stock alerts"
			})
		]
	}) })] });
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardHeader, {
		className: "flex-row items-center justify-between",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardTitle, {
			className: "flex items-center gap-2",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TriangleAlert, { className: "size-4 text-amber-600" }), "Low Stock"]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
			onClick: () => router3.visit("/inventory"),
			className: "text-xs text-primary hover:underline inline-flex items-center gap-1",
			children: ["View All ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowRight, { className: "size-3" })]
		})]
	}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardContent, {
		className: "pt-0",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "space-y-2",
			children: items.map((product) => {
				const isOut = product.status === "out-of-stock" || product.stock_quantity === 0;
				return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
					onClick: () => router3.visit(`/inventory/product/${product.id}`),
					className: "w-full flex items-center justify-between py-2.5 px-3 rounded-lg hover:bg-muted/50 transition-colors",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center gap-3 min-w-0",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: cn("size-8 rounded-lg flex items-center justify-center shrink-0", isOut ? "bg-red-50 dark:bg-red-500/10" : "bg-amber-50 dark:bg-amber-500/10"),
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Package, { className: cn("size-4", isOut ? "text-red-600" : "text-amber-600") })
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "min-w-0",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "text-sm font-medium truncate",
								children: product.name
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "text-xs text-muted-foreground",
								children: product.sku
							})]
						})]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "text-right shrink-0 ml-3",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: cn("text-sm font-bold", isOut ? "text-red-600" : "text-amber-600"),
							children: product.stock_quantity
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "text-[10px] text-muted-foreground",
							children: product.base_unit || "units"
						})]
					})]
				}, product.id);
			})
		})
	})] });
}
//#endregion
export { LowStockSummary as default };
