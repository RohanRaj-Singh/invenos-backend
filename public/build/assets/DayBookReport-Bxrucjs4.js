import { i as __toESM, t as require_react } from "./react-DCO0ASPG.js";
import { t as createLucideIcon } from "./createLucideIcon--nD-f_FR.js";
import { t as BookOpen } from "./book-open-CFGJU452.js";
import { t as CircleCheck } from "./circle-check-DoVrqruV.js";
import { t as Clock } from "./clock-zPxdzOK3.js";
import { t as DollarSign } from "./dollar-sign-DFlcCTeu.js";
import { t as ReportToolbar } from "./ReportToolbar-BJ2ZrMm8.js";
import { t as Info } from "./info-afhqMDHO.js";
import { t as RotateCcw } from "./rotate-ccw-DB3zy8KA.js";
import { t as Sparkles } from "./sparkles-L4t5n-If.js";
import { t as TrendingDown } from "./trending-down-CfQNbrbW.js";
import { t as TrendingUp } from "./trending-up-CRrMyRfV.js";
import { t as TriangleAlert } from "./triangle-alert-D5zO2woV.js";
import { t as cn } from "./utils-Bim8RyS4.js";
import { t as require_jsx_runtime } from "./jsx-runtime-BjJQA5sn.js";
import { Dt as router3, Et as Link_default, Ot as usePage, dt as ShoppingCart, ft as ShoppingBag, rt as formatCurrency, st as Wallet, xt as ChevronRight } from "./app-DQEL3DJY.js";
import { n as CardContent, t as Card } from "./card-D1ktOUWx.js";
import { t as ReportLayout } from "./ReportLayout-647vA4sZ.js";
import { t as SummaryCards } from "./SummaryCards-BppIOUfw.js";
import { t as ReportTable } from "./ReportTable-BrSW-XVm.js";
/**
* @license lucide-react v1.26.0 - ISC
*
* This source code is licensed under the ISC license.
* See the LICENSE file in the root directory of this source tree.
*/
var ArrowLeftRight = createLucideIcon("arrow-left-right", [
	["path", {
		d: "M8 3 4 7l4 4",
		key: "9rb6wj"
	}],
	["path", {
		d: "M4 7h16",
		key: "6tx8e3"
	}],
	["path", {
		d: "m16 21 4-4-4-4",
		key: "siv7j2"
	}],
	["path", {
		d: "M20 17H4",
		key: "h6l3hr"
	}]
]);
//#endregion
//#region resources/js/Pages/reports/DayBookReport.tsx
var import_react = /* @__PURE__ */ __toESM(require_react(), 1);
var import_jsx_runtime = require_jsx_runtime();
var EVENT_FILTERS = [
	{
		key: "all",
		label: "All"
	},
	{
		key: "sales",
		label: "Sales"
	},
	{
		key: "purchases",
		label: "Purchases"
	},
	{
		key: "returns",
		label: "Returns"
	},
	{
		key: "expenses",
		label: "Expenses"
	},
	{
		key: "payments",
		label: "Payments"
	},
	{
		key: "adjustments",
		label: "Adjustments"
	}
];
function filterEvents(events, filter) {
	switch (filter) {
		case "sales": return events.filter((e) => e.category === "Sale");
		case "purchases": return events.filter((e) => e.category === "Purchase");
		case "returns": return events.filter((e) => e.category === "SaleReturn" || e.category === "PurchaseReturn");
		case "expenses": return events.filter((e) => e.category === "Expense");
		case "payments": return events.filter((e) => e.category === "Payment");
		case "adjustments": return events.filter((e) => e.category === "Adjustment");
		default: return events;
	}
}
function DayBookReportPage() {
	const { props } = usePage();
	const report = props.report || {
		events: [],
		summary: {},
		cash_summary: {},
		highlights: {},
		health: {},
		closing_summary: {},
		trends: {}
	};
	const filters = props.filters || {};
	const events = report.events || [];
	const summary = report.summary || {};
	const cash = report.cash_summary || {};
	const highlights = report.highlights || {};
	const health = report.health || {};
	const closing = report.closing_summary || {};
	const trends = report.trends || {};
	const [eventFilter, setEventFilter] = (0, import_react.useState)("all");
	const [showCashBreakdown, setShowCashBreakdown] = (0, import_react.useState)(false);
	const filteredEvents = (0, import_react.useMemo)(() => filterEvents(events, eventFilter), [events, eventFilter]);
	const cardDefs = (0, import_react.useMemo)(() => [
		{
			label: "Net Sales",
			value: formatCurrency(summary.net_sales || 0),
			positive: (summary.net_sales || 0) >= 0,
			trend: trends.net_sales
		},
		{
			label: "Net Purchases",
			value: formatCurrency(summary.net_purchases || 0),
			negative: true,
			trend: trends.total_purchases
		},
		{
			label: "Expenses",
			value: formatCurrency(summary.total_expenses || 0),
			negative: (summary.total_expenses || 0) > 0,
			trend: trends.total_expenses
		},
		{
			label: "Gross Profit",
			value: formatCurrency(summary.gross_profit || 0),
			positive: (summary.gross_profit || 0) >= 0,
			negative: (summary.gross_profit || 0) < 0
		},
		{
			label: "Net Profit",
			value: formatCurrency(summary.net_profit || 0),
			positive: (summary.net_profit || 0) >= 0,
			negative: (summary.net_profit || 0) < 0
		},
		{
			label: "Transactions",
			value: String(summary.transaction_count || 0)
		}
	], [summary, trends]);
	const typeIcon = (type, size = "size-3.5") => {
		const s = size;
		switch (type) {
			case "Sale": return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ShoppingCart, { className: s });
			case "Sale Return": return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(RotateCcw, { className: s });
			case "Purchase": return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ShoppingBag, { className: s });
			case "Purchase Return": return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(RotateCcw, { className: s });
			case "Expense": return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Wallet, { className: s });
			case "Payment Received": return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TrendingUp, { className: s });
			case "Payment Made": return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TrendingDown, { className: s });
			case "Stock Adjustment": return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowLeftRight, { className: s });
			default: return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DollarSign, { className: s });
		}
	};
	const typeColor = (type) => {
		return {
			"Sale": "text-blue-600 bg-blue-50 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800",
			"Sale Return": "text-amber-600 bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800",
			"Purchase": "text-red-600 bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800",
			"Purchase Return": "text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800",
			"Expense": "text-orange-600 bg-orange-50 dark:bg-orange-950/30 border-orange-200 dark:border-orange-800",
			"Payment Received": "text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800",
			"Payment Made": "text-red-600 bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800",
			"Stock Adjustment": "text-purple-600 bg-purple-50 dark:bg-purple-950/30 border-purple-200 dark:border-purple-800"
		}[type] || "text-muted-foreground bg-muted/50";
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(ReportLayout, {
		title: "Day Book",
		subtitle: "Complete daily business performance report",
		icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(BookOpen, { className: "size-5 text-primary" }),
		toolbar: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ReportToolbar, {
			csvExportUrl: "/reports/day-book/export/csv",
			shareUrl: "/reports/share/day-book",
			reportTitle: "Day Book",
			currentFilters: { preset: filters.preset || "today" },
			onPrint: () => window.print()
		}),
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "flex items-center gap-1.5 flex-wrap",
				children: [
					{
						value: "today",
						label: "Today"
					},
					{
						value: "yesterday",
						label: "Yesterday"
					},
					{
						value: "thisWeek",
						label: "This Week"
					},
					{
						value: "lastWeek",
						label: "Last Week"
					},
					{
						value: "thisMonth",
						label: "This Month"
					},
					{
						value: "lastMonth",
						label: "Last Month"
					},
					{
						value: "quarter",
						label: "This Quarter"
					},
					{
						value: "year",
						label: "This Year"
					}
				].map((p) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					onClick: () => router3.get("/reports/day-book", { preset: p.value }, { preserveState: true }),
					className: cn("text-xs font-medium px-3 py-1.5 rounded-lg border transition-colors", (filters.preset || "thisMonth") === p.value ? "bg-foreground text-background border-foreground" : "bg-background text-muted-foreground border-border hover:text-foreground"),
					children: p.label
				}, p.value))
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-center gap-2 mb-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Sparkles, { className: "size-4 text-primary" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "text-sm font-semibold text-foreground tracking-tight",
					children: "Today's Performance"
				})]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SummaryCards, { cards: cardDefs })] }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-center gap-2 mb-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DollarSign, { className: "size-4 text-primary" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "text-sm font-semibold text-foreground tracking-tight",
					children: "Cash Summary"
				})]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Card, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardContent, {
				className: "p-4 sm:p-5",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "grid grid-cols-2 sm:grid-cols-4 gap-4",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-center gap-1 text-[10px] text-muted-foreground font-medium uppercase tracking-wider",
								children: ["Opening Balance", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									onClick: () => setShowCashBreakdown(!showCashBreakdown),
									className: "text-muted-foreground/50 hover:text-muted-foreground",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Info, { className: "size-3" })
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: cn("text-lg font-bold mt-0.5 tabular-nums", (cash.opening_balance || 0) >= 0 ? "text-foreground" : "text-red-500"),
								children: formatCurrency(cash.opening_balance || 0)
							}),
							showCashBreakdown && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "mt-2 text-[10px] text-muted-foreground bg-muted/50 rounded-lg p-2.5 space-y-1",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: cash.opening_explanation || "Based on total cash activity before the selected period." }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex justify-between pt-1 border-t border-border/40",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Total Cash In (prior)" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
											className: "text-emerald-600 font-medium",
											children: ["+", formatCurrency(cash.cash_in_before || 0)]
										})]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex justify-between",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Total Cash Out (prior)" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
											className: "text-red-500 font-medium",
											children: ["-", formatCurrency(cash.cash_out_before || 0)]
										})]
									})
								]
							})
						] }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "text-[10px] text-muted-foreground font-medium uppercase tracking-wider",
							children: "Cash Received"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "text-lg font-bold text-emerald-600 mt-0.5 tabular-nums",
							children: ["+", formatCurrency(cash.cash_received || 0)]
						})] }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "text-[10px] text-muted-foreground font-medium uppercase tracking-wider",
							children: "Cash Paid"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "text-lg font-bold text-red-500 mt-0.5 tabular-nums",
							children: ["-", formatCurrency(cash.cash_paid || 0)]
						})] }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "text-[10px] text-muted-foreground font-medium uppercase tracking-wider",
							children: "Closing Balance"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: cn("text-lg font-bold mt-0.5 tabular-nums", (cash.closing_balance || 0) >= 0 ? "text-emerald-600" : "text-red-500"),
							children: formatCurrency(cash.closing_balance || 0)
						})] })
					]
				})
			}) })] }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-center gap-2 mb-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TrendingUp, { className: "size-4 text-primary" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "text-sm font-semibold text-foreground tracking-tight",
					children: "Today's Highlights"
				})]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "grid grid-cols-2 sm:grid-cols-4 gap-3",
				children: [
					highlights.largest_sale && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Card, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardContent, {
						className: "p-3.5",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-center gap-1 text-[10px] text-muted-foreground font-medium uppercase tracking-wider mb-1",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ShoppingCart, { className: "size-3" }), " Largest Sale"]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "text-sm font-bold text-foreground tabular-nums",
								children: formatCurrency(highlights.largest_sale.amount)
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "text-[10px] text-muted-foreground truncate mt-0.5",
								children: highlights.largest_sale.party
							}),
							highlights.largest_sale.route && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link_default, {
								href: highlights.largest_sale.route,
								className: "text-[10px] text-primary hover:underline inline-flex items-center gap-0.5 mt-1",
								children: ["View ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronRight, { className: "size-2.5" })]
							})
						]
					}) }),
					highlights.largest_purchase && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Card, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardContent, {
						className: "p-3.5",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-center gap-1 text-[10px] text-muted-foreground font-medium uppercase tracking-wider mb-1",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ShoppingBag, { className: "size-3" }), " Largest Purchase"]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "text-sm font-bold text-foreground tabular-nums",
								children: formatCurrency(highlights.largest_purchase.amount)
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "text-[10px] text-muted-foreground truncate mt-0.5",
								children: highlights.largest_purchase.party
							}),
							highlights.largest_purchase.route && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link_default, {
								href: highlights.largest_purchase.route,
								className: "text-[10px] text-primary hover:underline inline-flex items-center gap-0.5 mt-1",
								children: ["View ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronRight, { className: "size-2.5" })]
							})
						]
					}) }),
					highlights.highest_expense && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Card, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardContent, {
						className: "p-3.5",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-center gap-1 text-[10px] text-muted-foreground font-medium uppercase tracking-wider mb-1",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Wallet, { className: "size-3" }), " Highest Expense"]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "text-sm font-bold text-foreground tabular-nums",
								children: formatCurrency(highlights.highest_expense.amount)
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "text-[10px] text-muted-foreground truncate mt-0.5",
								children: highlights.highest_expense.party
							})
						]
					}) }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Card, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardContent, {
						className: "p-3.5",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "text-[10px] text-muted-foreground font-medium uppercase tracking-wider mb-1",
							children: "Period Activity"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "space-y-0.5 text-xs text-foreground",
							children: [
								highlights.return_count > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", { children: [highlights.return_count, " return(s)"] }),
								highlights.payment_count > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", { children: [highlights.payment_count, " payment(s)"] }),
								highlights.adjustment_count > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", { children: [highlights.adjustment_count, " adjustment(s)"] }),
								highlights.new_customers > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", { children: [highlights.new_customers, " new customer(s)"] }),
								!highlights.return_count && !highlights.payment_count && !highlights.adjustment_count && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-muted-foreground",
									children: "No notable activity"
								})
							]
						})]
					}) })
				]
			})] }),
			(health.insights?.length > 0 || health.warnings?.length > 0) && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-center gap-2 mb-3",
				children: [health.warnings?.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TriangleAlert, { className: "size-4 text-amber-500" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CircleCheck, { className: "size-4 text-emerald-500" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "text-sm font-semibold text-foreground tracking-tight",
					children: "Business Health"
				})]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "grid grid-cols-1 sm:grid-cols-2 gap-2",
				children: [health.insights?.map((i, idx) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-start gap-2.5 rounded-lg bg-emerald-50/70 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/50 p-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CircleCheck, { className: "size-4 text-emerald-500 mt-0.5 shrink-0" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-xs text-emerald-800 dark:text-emerald-300 leading-relaxed",
						children: i.message
					})]
				}, `insight-${idx}`)), health.warnings?.map((w, idx) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: cn("flex items-start gap-2.5 rounded-lg p-3", w.type === "danger" ? "bg-red-50/70 dark:bg-red-950/20 border border-red-200 dark:border-red-800/50" : "bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800/50"),
					children: [w.type === "danger" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TriangleAlert, { className: "size-4 text-red-500 mt-0.5 shrink-0" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TriangleAlert, { className: "size-4 text-amber-500 mt-0.5 shrink-0" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: cn("text-xs leading-relaxed", w.type === "danger" ? "text-red-800 dark:text-red-300" : "text-amber-800 dark:text-amber-300"),
						children: w.message
					})]
				}, `warn-${idx}`))]
			})] }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center gap-2 mb-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Clock, { className: "size-4 text-primary" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "text-sm font-semibold text-foreground tracking-tight",
						children: "Event Timeline"
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "flex items-center gap-1.5 flex-wrap mb-3",
					children: EVENT_FILTERS.map((f) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						onClick: () => setEventFilter(f.key),
						className: cn("text-[11px] font-medium px-2.5 py-1.5 rounded-lg border transition-colors", eventFilter === f.key ? "bg-foreground text-background border-foreground" : "bg-background text-muted-foreground border-border hover:text-foreground"),
						children: [
							f.label,
							" (",
							filterEvents(events, f.key).length,
							")"
						]
					}, f.key))
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ReportTable, {
					columns: [
						{
							key: "time",
							header: "Time",
							render: (r) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-xs font-mono text-muted-foreground",
								children: r.time || "—"
							})
						},
						{
							key: "type",
							header: "Type",
							render: (r) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: `inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-semibold border ${typeColor(r.type)}`,
								children: [
									typeIcon(r.type),
									" ",
									r.type
								]
							}),
							sortable: true,
							sortValue: (r) => r.type
						},
						{
							key: "ref",
							header: "Reference",
							render: (r) => r.route ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link_default, {
								href: r.route,
								className: "text-[10px] font-mono bg-muted px-1 py-0.5 rounded text-primary hover:underline",
								children: r.ref
							}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("code", {
								className: "text-[10px] font-mono bg-muted px-1 py-0.5 rounded",
								children: r.ref
							})
						},
						{
							key: "description",
							header: "Description",
							render: (r) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-xs text-foreground",
								children: r.description
							})
						},
						{
							key: "party",
							header: "Party",
							render: (r) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-xs text-muted-foreground",
								children: r.party || "—"
							})
						},
						{
							key: "amount",
							header: "Amount",
							render: (r) => {
								if (!r.is_financial) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-[10px] text-muted-foreground italic",
									children: "Operational"
								});
								return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: cn("text-sm font-semibold tabular-nums", r.amount > 0 ? "text-emerald-600" : "text-red-500"),
									children: r.amount > 0 ? formatCurrency(r.amount) : "—"
								});
							},
							className: "text-right",
							sortable: true,
							sortValue: (r) => r.amount
						},
						{
							key: "user",
							header: "User",
							render: (r) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-[10px] text-muted-foreground",
								children: r.user
							})
						}
					],
					data: filteredEvents,
					keyExtractor: (r) => `${r.date}-${r.ref}-${r.type}`,
					pageSize: 25,
					searchable: true,
					searchPlaceholder: "Search by reference, type, party...",
					onSearch: (data, q) => data.filter((r) => r.ref.toLowerCase().includes(q) || r.type.toLowerCase().includes(q) || r.party.toLowerCase().includes(q) || r.description.toLowerCase().includes(q)),
					emptyMessage: "No events found for this filter and date range."
				})
			] }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Card, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardContent, {
				className: "p-4",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center justify-between flex-wrap gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center gap-4 text-xs text-muted-foreground",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [closing.total_transactions || 0, " total events"] }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "text-emerald-600",
								children: [closing.financial_events || 0, " financial"]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "text-muted-foreground/60",
								children: [closing.operational_events || 0, " operational"]
							})
						]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center gap-4 text-xs",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: ["Money In: ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "font-semibold text-emerald-600",
								children: formatCurrency(closing.total_money_in || 0)
							})] }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: ["Money Out: ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "font-semibold text-red-500",
								children: formatCurrency(closing.total_money_out || 0)
							})] }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: ["Closing: ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: cn("font-bold", (closing.closing_balance || 0) >= 0 ? "text-emerald-600" : "text-red-500"),
								children: formatCurrency(closing.closing_balance || 0)
							})] })
						]
					})]
				}), closing.generated_at && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "text-[10px] text-muted-foreground/50 mt-2",
					children: ["Generated at ", closing.generated_at]
				})]
			}) })
		]
	});
}
//#endregion
export { DayBookReportPage as default };
