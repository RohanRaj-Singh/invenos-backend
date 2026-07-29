import { i as __toESM, t as require_react } from "./react-DCO0ASPG.js";
import { t as RotateCcw } from "./rotate-ccw-DB3zy8KA.js";
import { t as cn } from "./utils-Bim8RyS4.js";
import { t as require_jsx_runtime } from "./jsx-runtime-BjJQA5sn.js";
import { at as formatCurrency, ft as ShoppingCart } from "./app-BLMvu7I3.js";
import { i as CardTitle, n as CardContent, r as CardHeader, t as Card } from "./card-DQfOgTjC.js";
//#region resources/js/Pages/dashboard/components/RecentActivity.tsx
var import_react = /* @__PURE__ */ __toESM(require_react(), 1);
var import_jsx_runtime = require_jsx_runtime();
var activityConfig = {
	sale: {
		icon: ShoppingCart,
		bgClass: "bg-blue-50 dark:bg-blue-500/10",
		iconClass: "text-blue-600 dark:text-blue-400"
	},
	return: {
		icon: RotateCcw,
		bgClass: "bg-orange-50 dark:bg-orange-500/10",
		iconClass: "text-orange-600 dark:text-orange-400"
	}
};
function timeAgo(dateStr) {
	const now = /* @__PURE__ */ new Date();
	const d = new Date(dateStr);
	const diffMs = now.getTime() - d.getTime();
	const diffDays = Math.floor(diffMs / 864e5);
	if (diffDays === 0) return "Today";
	if (diffDays === 1) return "Yesterday";
	if (diffDays < 7) return `${diffDays} days ago`;
	if (diffDays < 30) return `${Math.floor(diffDays / 7)}w ago`;
	return d.toLocaleDateString("en-PK", {
		day: "numeric",
		month: "short"
	});
}
function RecentActivity({ recentSales = [] }) {
	const items = (0, import_react.useMemo)(() => {
		return recentSales.slice(0, 8).map((s) => ({
			id: `act-sale-${s.id}`,
			type: "sale",
			title: "Sale Created",
			description: `${s.customer_name || "Walk-in Customer"} — ${s.source || "POS"}`,
			timeAgo: timeAgo(s.date),
			amount: s.grand_total
		}));
	}, [recentSales]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardHeader, {
		className: "flex-row items-center justify-between",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardTitle, { children: "Recent Activity" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: "text-xs text-muted-foreground",
			children: "Live"
		})]
	}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardContent, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "space-y-0",
		children: items.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "text-center py-8 text-sm text-muted-foreground",
			children: "No recent activity."
		}) : items.map((event, idx) => {
			const config = activityConfig[event.type] || activityConfig.sale;
			const Icon = config.icon;
			return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "relative flex gap-3 pb-4 last:pb-0",
				children: [
					!(idx === items.length - 1) && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "absolute left-[17px] top-9 bottom-0 w-px bg-border" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: cn("relative z-10 flex items-center justify-center size-9 rounded-full shrink-0", config.bgClass, config.iconClass),
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, { className: "size-4" })
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "flex-1 min-w-0 pt-1",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-start justify-between gap-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-sm font-medium text-foreground",
								children: event.title
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-xs text-muted-foreground mt-0.5",
								children: event.description
							})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "text-right shrink-0",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-sm font-semibold text-foreground",
									children: formatCurrency(event.amount)
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-[11px] text-muted-foreground mt-0.5",
									children: event.timeAgo
								})]
							})]
						})
					})
				]
			}, event.id);
		})
	}) })] });
}
//#endregion
export { RecentActivity as default };
