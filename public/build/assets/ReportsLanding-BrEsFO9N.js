import { t as Banknote } from "./banknote-B76zKt2w.js";
import { t as BookOpen } from "./book-open-CFGJU452.js";
import { t as ClipboardList } from "./clipboard-list-vYbzP_6F.js";
import { t as TrendingUp } from "./trending-up-CRrMyRfV.js";
import { t as cn } from "./utils-Bim8RyS4.js";
import { t as require_jsx_runtime } from "./jsx-runtime-BjJQA5sn.js";
import { Ct as ChartColumn, Et as router3, ft as ShoppingCart, pt as ShoppingBag, ut as Users, vt as Package } from "./app-fzdHvqQg.js";
import { i as CardTitle, n as CardContent, t as Card } from "./card-DQfOgTjC.js";
//#region resources/js/Pages/reports/ReportsLanding.tsx
var import_jsx_runtime = require_jsx_runtime();
var CATEGORIES = [
	{
		name: "Financial Reports",
		color: "text-emerald-600 dark:text-emerald-400",
		reports: [
			{
				id: "daybook",
				title: "Day Book",
				description: "Complete daily transaction log with sales, purchases, returns and expenses",
				icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(BookOpen, { className: "size-5" }),
				href: "/reports/day-book",
				color: "text-emerald-600"
			},
			{
				id: "cashflow",
				title: "Cash Flow",
				description: "Cash inflows, outflows, opening and closing balances",
				icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Banknote, { className: "size-5" }),
				href: "/reports/cash-flow",
				color: "text-blue-600"
			},
			{
				id: "pnl",
				title: "Profit & Loss",
				description: "Revenue, COGS, expenses and net profit calculation",
				icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TrendingUp, { className: "size-5" }),
				href: "/reports/pnl",
				color: "text-purple-600"
			},
			{
				id: "balance-sheet",
				title: "Balance Sheet",
				description: "Assets, liabilities, capital and equity overview",
				icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ClipboardList, { className: "size-5" }),
				href: "/reports/balance-sheet",
				color: "text-indigo-600"
			}
		]
	},
	{
		name: "Sales Reports",
		color: "text-blue-600 dark:text-blue-400",
		reports: [{
			id: "sales",
			title: "Sales Report",
			description: "All sales transactions with totals and summaries",
			icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ShoppingCart, { className: "size-5" }),
			href: "/reports/sales",
			color: "text-blue-600"
		}]
	},
	{
		name: "Purchase Reports",
		color: "text-amber-600 dark:text-amber-400",
		reports: [{
			id: "purchases",
			title: "Purchase Report",
			description: "All purchase transactions with supplier details",
			icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ShoppingBag, { className: "size-5" }),
			href: "/reports/purchases",
			color: "text-amber-600"
		}]
	},
	{
		name: "Inventory Reports",
		color: "text-sky-600 dark:text-sky-400",
		reports: [{
			id: "stock",
			title: "Stock Report",
			description: "Current inventory levels, values and stock status",
			icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Package, { className: "size-5" }),
			href: "/reports/stock",
			color: "text-sky-600"
		}]
	},
	{
		name: "Party Reports",
		color: "text-rose-600 dark:text-rose-400",
		reports: [{
			id: "party",
			title: "Party Statement",
			description: "Customer and supplier statements with balances",
			icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Users, { className: "size-5" }),
			href: "/reports/party",
			color: "text-rose-600"
		}]
	}
];
function ReportsLanding() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-8",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex items-start gap-3",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "size-12 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center shrink-0",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChartColumn, { className: "size-6 text-primary" })
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
				className: "text-xl sm:text-2xl font-semibold tracking-tight",
				children: "Reports"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-sm text-muted-foreground mt-1",
				children: "Business intelligence and performance analysis"
			})] })]
		}), CATEGORIES.map((cat) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex items-center gap-2 mb-4",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: cn("text-xs font-semibold uppercase tracking-wider", cat.color),
				children: cat.name
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "h-px flex-1 bg-border" })]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4",
			children: cat.reports.map((report) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				onClick: () => router3.visit(report.href),
				className: "w-full text-left group",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Card, {
					size: "sm",
					className: "transition-all hover:shadow-md hover:border-primary/20 active:scale-[0.99] h-full",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardContent, {
						className: "p-5",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-start gap-4",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: cn("size-10 rounded-lg flex items-center justify-center shrink-0 bg-muted group-hover:bg-primary/10 transition-colors", report.color),
								children: report.icon
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex-1 min-w-0",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardTitle, {
									className: "text-sm font-semibold",
									children: report.title
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-xs text-muted-foreground mt-1 leading-relaxed",
									children: report.description
								})]
							})]
						})
					})
				})
			}, report.id))
		})] }, cat.name))]
	});
}
//#endregion
export { ReportsLanding as default };
