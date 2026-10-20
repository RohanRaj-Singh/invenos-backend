import { i as __exportAll, t as require_jsx_runtime } from "./jsx-runtime-Do9val7F.js";
import { t as cn } from "./utils-Bim8RyS4.js";
//#region resources/js/Pages/inventory/components/ArchivedBadge.tsx
var ArchivedBadge_exports = /* @__PURE__ */ __exportAll({ default: () => ArchivedBadge });
var import_jsx_runtime = require_jsx_runtime();
/**
* Marks a product that is archived — hidden from new transactions, pickers,
* valuation and alerts. Amber matches the Archive action it comes from.
*/
function ArchivedBadge({ size = "sm" }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
		className: cn("inline-flex items-center gap-1 rounded-full border font-medium whitespace-nowrap", "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-800", size === "sm" ? "px-2.5 py-0.5 text-[11px]" : "px-1.5 py-0 text-[10px]"),
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: cn("rounded-full bg-amber-500", size === "sm" ? "size-1.5" : "size-1") }), "Archived"]
	});
}
//#endregion
export { ArchivedBadge_exports as n, ArchivedBadge as t };
