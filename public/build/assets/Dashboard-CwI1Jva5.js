import { i as __toESM, t as require_react } from "./react-DCO0ASPG.js";
import { t as Banknote } from "./banknote-B76zKt2w.js";
import { t as DollarSign } from "./dollar-sign-DFlcCTeu.js";
import { t as PackagePlus } from "./package-plus-BjX_WD8A.js";
import { t as RotateCcw } from "./rotate-ccw-DB3zy8KA.js";
import { t as Sparkles } from "./sparkles-L4t5n-If.js";
import { t as getBusinessSettings } from "./settings-B-1z6X8M.js";
import { t as cn } from "./utils-Bim8RyS4.js";
import { t as require_jsx_runtime } from "./jsx-runtime-BjJQA5sn.js";
import { Dt as router3, Ot as usePage, dt as ShoppingCart, ft as ShoppingBag, nt as getGreeting, st as Wallet, t as useAuth, tt as formatCurrency } from "./app-DRCb4nuk.js";
import { n as CardContent, t as Card } from "./card-D1ktOUWx.js";
import StatsCard from "./StatsCard-BXMh08rz.js";
import RecentActivity from "./RecentActivity-M3i2pl6A.js";
import LowStockSummary from "./LowStockSummary-Cv-uAzQc.js";
import SalesTrendChart from "./SalesTrendChart-BBZOhh3c.js";
//#region resources/js/Pages/dashboard/Dashboard.tsx
var import_react = /* @__PURE__ */ __toESM(require_react(), 1);
var import_jsx_runtime = require_jsx_runtime();
var QUICK_ACTIONS = [
	{
		id: "new-sale",
		label: "New Sale",
		desc: "Start a POS transaction",
		icon: ShoppingCart,
		href: "/sales/pos",
		color: "blue"
	},
	{
		id: "new-purchase",
		label: "New Purchase",
		desc: "Record supplier order",
		icon: ShoppingBag,
		href: "/purchases/new",
		color: "amber"
	},
	{
		id: "add-product",
		label: "Add Product",
		desc: "Add to inventory",
		icon: PackagePlus,
		href: "/inventory/add",
		color: "purple"
	},
	{
		id: "payment-in",
		label: "Payment In",
		desc: "Receive payment",
		icon: Banknote,
		href: "/payments",
		color: "green"
	},
	{
		id: "add-expense",
		label: "Add Expense",
		desc: "Record expense",
		icon: Wallet,
		href: "/expenses/new",
		color: "red"
	},
	{
		id: "process-return",
		label: "Process Return",
		desc: "Sale or purchase return",
		icon: RotateCcw,
		href: "/sales/returns",
		color: "orange"
	}
];
var ACTION_COLORS = {
	blue: {
		bg: "bg-blue-50 dark:bg-blue-500/10",
		icon: "text-blue-600 dark:text-blue-400",
		hover: "hover:border-blue-200 dark:hover:border-blue-800"
	},
	amber: {
		bg: "bg-amber-50 dark:bg-amber-500/10",
		icon: "text-amber-600 dark:text-amber-400",
		hover: "hover:border-amber-200 dark:hover:border-amber-800"
	},
	purple: {
		bg: "bg-purple-50 dark:bg-purple-500/10",
		icon: "text-purple-600 dark:text-purple-400",
		hover: "hover:border-purple-200 dark:hover:border-purple-800"
	},
	green: {
		bg: "bg-emerald-50 dark:bg-emerald-500/10",
		icon: "text-emerald-600 dark:text-emerald-400",
		hover: "hover:border-emerald-200 dark:hover:border-emerald-800"
	},
	red: {
		bg: "bg-red-50 dark:bg-red-500/10",
		icon: "text-red-600 dark:text-red-400",
		hover: "hover:border-red-200 dark:hover:border-red-800"
	},
	orange: {
		bg: "bg-orange-50 dark:bg-orange-500/10",
		icon: "text-orange-600 dark:text-orange-400",
		hover: "hover:border-orange-200 dark:hover:border-orange-800"
	}
};
function getDateRange(mode) {
	const now = /* @__PURE__ */ new Date();
	const today = now.toISOString().split("T")[0];
	const yesterday = (/* @__PURE__ */ new Date(now.getTime() - 864e5)).toISOString().split("T")[0];
	switch (mode) {
		case "today": return {
			from: today,
			to: today
		};
		case "yesterday": return {
			from: yesterday,
			to: yesterday
		};
		case "last7": return {
			from: (/* @__PURE__ */ new Date(now.getTime() - 6 * 864e5)).toISOString().split("T")[0],
			to: today
		};
		case "thisMonth": return {
			from: new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0],
			to: today
		};
		case "custom": return {
			from: today,
			to: today
		};
	}
}
function DashboardPage() {
	const { props } = usePage();
	const { metrics, financial, inventory, profit } = props;
	const auth = useAuth();
	const business = getBusinessSettings();
	const [dateMode, setDateMode] = (0, import_react.useState)("today");
	const [customFrom, setCustomFrom] = (0, import_react.useState)("");
	const [customTo, setCustomTo] = (0, import_react.useState)("");
	const dateRange = (0, import_react.useMemo)(() => {
		if (dateMode === "custom") return {
			from: customFrom || (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
			to: customTo || (/* @__PURE__ */ new Date()).toISOString().split("T")[0]
		};
		return getDateRange(dateMode);
	}, [
		dateMode,
		customFrom,
		customTo
	]);
	const todayMetrics = {
		salesTotal: metrics?.today_sales ?? 0,
		returnsTotal: metrics?.today_returns ?? 0,
		netSales: metrics?.today_net_sales ?? 0,
		purchasesTotal: metrics?.today_purchases ?? 0,
		expensesTotal: metrics?.today_expenses ?? 0,
		monthSales: metrics?.month_sales ?? 0,
		monthExpenses: metrics?.month_expenses ?? 0,
		lowStockItems: metrics?.low_stock_items ?? 0,
		outstandingReceivables: metrics?.outstanding_receivables ?? 0
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-5",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "space-y-3 mb-2",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-center justify-between",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h1", {
					className: "text-lg sm:text-xl font-semibold flex items-center gap-2",
					children: [
						getGreeting(),
						", ",
						auth.user?.name || business.businessName,
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Sparkles, { className: "size-4 text-amber-400" })
					]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-xs text-muted-foreground mt-0.5",
					children: (/* @__PURE__ */ new Date()).toLocaleDateString("en-PK", {
						weekday: "long",
						day: "numeric",
						month: "long",
						year: "numeric"
					})
				})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
					className: "hidden sm:flex items-center gap-1.5 text-[10px] text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10 px-2 py-1 rounded-full font-medium",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "size-1.5 rounded-full bg-emerald-500" }), "Live"]
				})]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-center gap-1.5 flex-wrap",
				children: [[
					"today",
					"yesterday",
					"last7",
					"thisMonth",
					"custom"
				].map((mode) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					onClick: () => setDateMode(mode),
					className: cn("text-[11px] font-medium px-3 py-1.5 rounded-lg border transition-colors", dateMode === mode ? "bg-foreground text-background border-foreground" : "bg-background text-muted-foreground border-border hover:text-foreground"),
					children: mode === "today" ? "Today" : mode === "yesterday" ? "Yesterday" : mode === "last7" ? "7 Days" : mode === "thisMonth" ? "Month" : "Custom"
				}, mode)), dateMode === "custom" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center gap-1.5",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							type: "date",
							value: customFrom,
							onChange: (e) => setCustomFrom(e.target.value),
							className: "h-7 px-2 rounded border border-input bg-background text-[11px] outline-none"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-[11px] text-muted-foreground",
							children: "to"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							type: "date",
							value: customTo,
							onChange: (e) => setCustomTo(e.target.value),
							className: "h-7 px-2 rounded border border-input bg-background text-[11px] outline-none"
						})
					]
				})]
			})]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "space-y-5",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "grid grid-cols-3 sm:grid-cols-3 lg:grid-cols-6 gap-3",
					children: QUICK_ACTIONS.map((action) => {
						const Icon = action.icon;
						const colors = ACTION_COLORS[action.color];
						return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							onClick: () => router3.visit(action.href),
							className: cn("flex flex-col items-center justify-center gap-1.5 sm:gap-2", "p-3 sm:p-4 rounded-2xl border border-border transition-all active:scale-[0.97]", "sm:hover:shadow-sm sm:hover:border-primary/20", colors.hover),
							title: action.desc,
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: cn("flex items-center justify-center size-10 sm:size-12 rounded-xl", colors.bg, colors.icon),
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, { className: "size-5 sm:size-6" })
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-[11px] text-center font-medium text-foreground leading-tight",
								children: action.label
							})]
						}, action.id);
					})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h2", {
					className: "text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3",
					children: ["Today's Business", /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
						className: "font-normal lowercase ml-1 text-muted-foreground/60",
						children: ["· ", dateMode === "today" ? "Today" : dateRange.from === dateRange.to ? dateRange.from : `${dateRange.from} to ${dateRange.to}`]
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "grid grid-cols-2 lg:grid-cols-4 gap-3",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(StatsCard, {
							label: "Sales",
							value: formatCurrency(todayMetrics.salesTotal),
							icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DollarSign, { className: "size-4" }),
							trendLabel: "Today",
							accentClass: "text-blue-600"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(StatsCard, {
							label: "Purchases",
							value: formatCurrency(todayMetrics.purchasesTotal),
							icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ShoppingBag, { className: "size-4" }),
							trendLabel: "Today",
							accentClass: "text-amber-600"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(StatsCard, {
							label: "Returns",
							value: formatCurrency(todayMetrics.returnsTotal),
							icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(RotateCcw, { className: "size-4" }),
							trendLabel: "Today",
							accentClass: "text-orange-600"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(StatsCard, {
							label: "Expenses",
							value: formatCurrency(todayMetrics.expensesTotal),
							icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Wallet, { className: "size-4" }),
							trendLabel: "Today",
							accentClass: "text-red-600"
						})
					]
				})] }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3",
					children: "Business Overview"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "grid grid-cols-2 lg:grid-cols-4 gap-3",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Card, {
							size: "sm",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardContent, {
								className: "p-4",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "text-[11px] text-muted-foreground uppercase tracking-wider mb-1",
										children: "Total Revenue"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "text-xl font-bold tracking-tight text-emerald-600",
										children: formatCurrency(todayMetrics.monthSales)
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "text-[11px] text-muted-foreground mt-1",
										children: ["Net of returns: ", formatCurrency(todayMetrics.monthSales - todayMetrics.returnsTotal)]
									})
								]
							})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Card, {
							size: "sm",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardContent, {
								className: "p-4",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "text-[11px] text-muted-foreground uppercase tracking-wider mb-1",
										children: "Inventory Value"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "text-xl font-bold tracking-tight",
										children: formatCurrency(inventory?.total_value ?? 0)
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "text-[11px] text-muted-foreground mt-1",
										children: [inventory?.total_products ?? 0, " products"]
									})
								]
							})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Card, {
							size: "sm",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardContent, {
								className: "p-4",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "text-[11px] text-muted-foreground uppercase tracking-wider mb-1",
										children: "Pending Payments"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "text-xl font-bold tracking-tight text-amber-600",
										children: formatCurrency(financial?.outstanding_receivables ?? 0)
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "text-[11px] text-muted-foreground mt-1",
										children: "Outstanding receivables"
									})
								]
							})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Card, {
							size: "sm",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardContent, {
								className: "p-4",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "text-[11px] text-muted-foreground uppercase tracking-wider mb-1",
										children: "This Month"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "text-xl font-bold tracking-tight",
										children: formatCurrency(todayMetrics.monthExpenses)
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "text-[11px] text-muted-foreground mt-1",
										children: "Expenses this month"
									})
								]
							})
						})
					]
				})] }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "grid grid-cols-1 lg:grid-cols-2 gap-5",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(LowStockSummary, { lowStock: props.lowStock }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(RecentActivity, { recentSales: metrics?.recent_sales })]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SalesTrendChart, { dateRange })
			]
		})]
	});
}
//#endregion
export { DashboardPage as default };
