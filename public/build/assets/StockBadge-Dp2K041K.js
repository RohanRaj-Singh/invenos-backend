import { r as __exportAll } from "./react-DCO0ASPG.js";
import { t as cn } from "./utils-Bim8RyS4.js";
import { t as require_jsx_runtime } from "./jsx-runtime-BjJQA5sn.js";
//#region resources/js/Pages/inventory/components/StockBadge.tsx
var StockBadge_exports = /* @__PURE__ */ __exportAll({ default: () => StockBadge });
var import_jsx_runtime = require_jsx_runtime();
var config = {
	"in-stock": {
		label: "In Stock",
		class: "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800"
	},
	"low-stock": {
		label: "Low Stock",
		class: "bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400 border-amber-200 dark:border-amber-800"
	},
	"out-of-stock": {
		label: "Out of Stock",
		class: "bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400 border-red-200 dark:border-red-800"
	}
};
function StockBadge({ status, size = "sm" }) {
	const c = config[status];
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
		className: cn("inline-flex items-center gap-1 rounded-full border font-medium whitespace-nowrap", size === "sm" ? "px-2.5 py-0.5 text-[11px]" : "px-1.5 py-0 text-[10px]", c.class),
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: cn("rounded-full", size === "sm" ? "size-1.5" : "size-1", status === "in-stock" ? "bg-emerald-500" : status === "low-stock" ? "bg-amber-500" : "bg-red-500") }), c.label]
	});
}
//#endregion
export { StockBadge_exports as n, StockBadge as t };
