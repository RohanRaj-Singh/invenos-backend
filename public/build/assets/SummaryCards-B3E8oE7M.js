import { r as __exportAll } from "./react-DCO0ASPG.js";
import { t as cn } from "./utils-Bim8RyS4.js";
import { t as require_jsx_runtime } from "./jsx-runtime-BjJQA5sn.js";
import { n as CardContent, t as Card } from "./card-D1ktOUWx.js";
import { n as TrendIndicator } from "./TrendBadge-CM1T1zJu.js";
//#region resources/js/Pages/reports/components/SummaryCards.tsx
var SummaryCards_exports = /* @__PURE__ */ __exportAll({ SummaryCards: () => SummaryCards });
var import_jsx_runtime = require_jsx_runtime();
function SummaryCards({ cards, columns = 4 }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: cn("grid gap-3", {
			2: "grid-cols-1 sm:grid-cols-2",
			3: "grid-cols-1 sm:grid-cols-3",
			4: "grid-cols-2 sm:grid-cols-4",
			5: "grid-cols-2 sm:grid-cols-5"
		}[columns]),
		children: cards.map((card, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Card, {
			size: "sm",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardContent, {
				className: "p-4",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "text-[11px] text-muted-foreground uppercase tracking-wider mb-1",
						children: card.label
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: cn("text-xl font-bold tracking-tight", card.positive && "text-emerald-600 dark:text-emerald-400", card.negative && "text-red-600 dark:text-red-400"),
						children: card.value
					}),
					card.trend && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "mt-1.5",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TrendIndicator, {
							current: card.trend.current,
							previous: card.trend.previous,
							format: card.trend.format
						})
					}),
					card.subtitle && !card.trend && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "text-xs text-muted-foreground mt-1",
						children: card.subtitle
					})
				]
			})
		}, `${card.label}-${i}`))
	});
}
//#endregion
export { SummaryCards_exports as n, SummaryCards as t };
