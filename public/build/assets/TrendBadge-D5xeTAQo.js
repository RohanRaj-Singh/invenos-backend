import { r as __exportAll } from "./react-DCO0ASPG.js";
import { t as Minus } from "./minus-jjDOQ6-9.js";
import { t as TrendingDown } from "./trending-down-CfQNbrbW.js";
import { t as TrendingUp } from "./trending-up-CRrMyRfV.js";
import { t as cn } from "./utils-Bim8RyS4.js";
import { t as require_jsx_runtime } from "./jsx-runtime-BjJQA5sn.js";
import { rt as formatCurrency } from "./app-CwPUaRAl.js";
//#region resources/js/Pages/reports/components/TrendBadge.tsx
var TrendBadge_exports = /* @__PURE__ */ __exportAll({
	TrendBadge: () => TrendBadge,
	TrendIndicator: () => TrendIndicator
});
var import_jsx_runtime = require_jsx_runtime();
function TrendBadge({ current, previous, label, format = "currency", className }) {
	const change = current - previous;
	const changePct = previous !== 0 ? Math.round(change / previous * 1e3) / 10 : current > 0 ? 100 : 0;
	const direction = change > 0 ? "up" : change < 0 ? "down" : "flat";
	const formatVal = (v) => format === "currency" ? formatCurrency(v) : v.toLocaleString();
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: cn("space-y-1", className),
		children: [
			label && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "text-[11px] text-muted-foreground uppercase tracking-wider",
				children: label
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "text-xl font-bold tracking-tight",
				children: formatVal(current)
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: cn("inline-flex items-center gap-1 text-xs font-medium rounded-md px-1.5 py-0.5", direction === "up" ? "text-emerald-700 bg-emerald-50 dark:bg-emerald-950/30 dark:text-emerald-400" : direction === "down" ? "text-red-700 bg-red-50 dark:bg-red-950/30 dark:text-red-400" : "text-muted-foreground bg-muted/50"),
				children: [direction === "up" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TrendingUp, { className: "size-3" }) : direction === "down" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TrendingDown, { className: "size-3" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Minus, { className: "size-3" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: direction === "flat" ? "No change" : `${changePct > 0 ? "+" : ""}${changePct}% vs previous` })]
			})
		]
	});
}
function TrendIndicator({ current, previous, format = "currency" }) {
	const change = current - previous;
	const changePct = previous !== 0 ? Math.round(change / previous * 1e3) / 10 : 0;
	const direction = change > 0 ? "up" : change < 0 ? "down" : "flat";
	if (previous === 0 && current === 0) return null;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
		className: cn("inline-flex items-center gap-0.5 text-xs font-medium", direction === "up" ? "text-emerald-600" : direction === "down" ? "text-red-500" : "text-muted-foreground"),
		children: [direction === "up" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TrendingUp, { className: "size-3" }) : direction === "down" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TrendingDown, { className: "size-3" }) : null, changePct !== 0 && `${changePct > 0 ? "+" : ""}${changePct}%`]
	});
}
//#endregion
export { TrendIndicator as n, TrendBadge_exports as t };
