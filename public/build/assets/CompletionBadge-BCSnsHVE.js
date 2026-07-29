import { r as __exportAll } from "./react-DCO0ASPG.js";
import { t as cn } from "./utils-Bim8RyS4.js";
import { t as require_jsx_runtime } from "./jsx-runtime-BjJQA5sn.js";
import { Et as router3 } from "./app-fzdHvqQg.js";
//#region resources/js/Pages/inventory/components/CompletionBadge.tsx
var CompletionBadge_exports = /* @__PURE__ */ __exportAll({
	computeCompletionStatus: () => computeCompletionStatus,
	default: () => CompletionBadge
});
var import_jsx_runtime = require_jsx_runtime();
var completionConfig = {
	complete: {
		label: "Complete",
		color: "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800",
		dot: "bg-emerald-500"
	},
	"needs-pricing": {
		label: "Needs Pricing",
		color: "bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400 border-amber-200 dark:border-amber-800",
		dot: "bg-amber-500"
	},
	"needs-packaging": {
		label: "Needs Packaging",
		color: "bg-orange-50 text-orange-600 dark:bg-orange-500/10 dark:text-orange-400 border-orange-200 dark:border-orange-800",
		dot: "bg-orange-500"
	},
	"missing-details": {
		label: "Missing Details",
		color: "bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400 border-red-200 dark:border-red-800",
		dot: "bg-red-500"
	}
};
function computeCompletionStatus(product) {
	if (!product.name || !product.sku || !product.category && !product.category_id) return "missing-details";
	if (!(product.selling_units && product.selling_units.length > 0)) return "needs-packaging";
	if (!(product.selling_units.some((u) => (u.sale_price || 0) > 0) || (product.selling_price || 0) > 0)) return "needs-pricing";
	return "complete";
}
function CompletionBadge({ product, size = "md" }) {
	const config = completionConfig[computeCompletionStatus(product)];
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
		onClick: (e) => {
			e.stopPropagation();
			router3.visit(`/inventory/product/${product.id}`);
		},
		className: cn("inline-flex items-center gap-1 rounded-full border font-medium whitespace-nowrap transition-colors hover:opacity-80 cursor-pointer", size === "sm" ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-0.5 text-[11px]", config.color),
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: cn("rounded-full", size === "sm" ? "size-1" : "size-1.5", config.dot) }), config.label]
	});
}
//#endregion
export { CompletionBadge_exports as n, computeCompletionStatus as r, CompletionBadge as t };
