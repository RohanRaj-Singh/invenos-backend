import { t as require_jsx_runtime } from "./jsx-runtime-BjJQA5sn.js";
import { t as Badge } from "./badge-BfSUOZdI.js";
//#region resources/js/Pages/reports/components/StatusBadge.tsx
var import_jsx_runtime = require_jsx_runtime();
var STATUS_STYLES = {
	paid: "text-emerald-600 dark:text-emerald-400",
	partial: "text-amber-600 dark:text-amber-400",
	unpaid: "text-red-600 dark:text-red-400"
};
var BADGE_STYLES = {
	"in-stock": "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400",
	"low-stock": "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400",
	"out-of-stock": "bg-red-50 text-red-700 border-red-200 dark:bg-red-500/10 dark:text-red-400"
};
var BADGE_LABELS = {
	"in-stock": "In Stock",
	"low-stock": "Low",
	"out-of-stock": "Out"
};
function StatusBadge({ status, kind = "payment" }) {
	if (kind === "stock") {
		const cls = BADGE_STYLES[status];
		if (!cls) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: status });
		return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
			variant: "outline",
			className: `text-[10px] px-1.5 py-0 h-5 ${cls}`,
			children: BADGE_LABELS[status] || status
		});
	}
	const cls = STATUS_STYLES[status];
	if (!cls) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
		className: "text-xs font-medium",
		children: status
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
		className: `text-xs font-medium ${cls}`,
		children: status
	});
}
//#endregion
export { StatusBadge };
