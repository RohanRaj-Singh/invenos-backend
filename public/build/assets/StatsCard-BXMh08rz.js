import { t as TrendingDown } from "./trending-down-CfQNbrbW.js";
import { t as TrendingUp } from "./trending-up-CRrMyRfV.js";
import { t as cn } from "./utils-Bim8RyS4.js";
import { t as require_jsx_runtime } from "./jsx-runtime-BjJQA5sn.js";
import { n as CardContent, t as Card } from "./card-D1ktOUWx.js";
//#region resources/js/Pages/dashboard/components/StatsCard.tsx
var import_jsx_runtime = require_jsx_runtime();
function StatsCard({ label, value, icon, trend, trendLabel, accentClass = "text-primary" }) {
	const isPositive = trend !== void 0 && trend >= 0;
	const isNegative = trend !== void 0 && trend < 0;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Card, {
		className: "overflow-hidden",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardContent, {
			className: "p-0",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "p-5",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-start justify-between mb-3",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-xs font-medium text-muted-foreground uppercase tracking-wider",
							children: label
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: cn("flex items-center justify-center size-9 rounded-lg shrink-0", accentClass.includes("text-") ? accentClass.replace("text-", "bg-") + "/10" : "bg-primary/10", accentClass ? accentClass.replace("text-", "") : "text-primary"),
							children: icon
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "text-2xl font-semibold tracking-tight",
						children: value
					}),
					(trend !== void 0 || trendLabel) && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center gap-1.5 mt-1.5",
						children: [trend !== void 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: cn("inline-flex items-center gap-0.5 text-xs font-medium", isPositive && "text-emerald-600 dark:text-emerald-400", isNegative && "text-red-600 dark:text-red-400"),
							children: [
								isPositive ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TrendingUp, { className: "size-3" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TrendingDown, { className: "size-3" }),
								Math.abs(trend),
								"%"
							]
						}), trendLabel && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-xs text-muted-foreground",
							children: trendLabel
						})]
					})
				]
			})
		})
	});
}
//#endregion
export { StatsCard as default };
