import { i as __toESM, t as require_react } from "./react-DCO0ASPG.js";
import { t as Building2 } from "./building-2-DGTQudO_.js";
import { t as DollarSign } from "./dollar-sign-DFlcCTeu.js";
import { t as ReportToolbar } from "./ReportToolbar-D8SR0LvN.js";
import { t as TrendingUp } from "./trending-up-CRrMyRfV.js";
import { t as cn } from "./utils-Bim8RyS4.js";
import { t as require_jsx_runtime } from "./jsx-runtime-BjJQA5sn.js";
import { Ct as ChartColumn, Ot as usePage, _t as Package, ct as Users, rt as formatCurrency } from "./app-CwPUaRAl.js";
import { t as ReportLayout } from "./ReportLayout-647vA4sZ.js";
import { t as SummaryCards } from "./SummaryCards-D7455BBE.js";
//#region resources/js/Pages/reports/FinancialOverview.tsx
var import_react = /* @__PURE__ */ __toESM(require_react(), 1);
var import_jsx_runtime = require_jsx_runtime();
function FinancialOverviewPage() {
	const { props } = usePage();
	const report = props.report || {
		summary: {},
		income: {},
		expenses: {},
		cash_flow: {},
		outstanding: {}
	};
	const s = report.summary || {};
	const income = report.income || {};
	const expenses = report.expenses || {};
	const cashFlow = report.cash_flow || {};
	const outstanding = report.outstanding || {};
	const cards = (0, import_react.useMemo)(() => [
		{
			label: "Gross Profit",
			value: formatCurrency(s.gross_profit || 0),
			positive: (s.gross_profit || 0) >= 0,
			negative: (s.gross_profit || 0) < 0
		},
		{
			label: "Net Profit",
			value: formatCurrency(s.net_profit || 0),
			positive: (s.net_profit || 0) >= 0,
			negative: (s.net_profit || 0) < 0
		},
		{
			label: "Cash Balance",
			value: formatCurrency(s.cash_balance || 0),
			positive: (s.cash_balance || 0) >= 0,
			negative: (s.cash_balance || 0) < 0
		},
		{
			label: "Inventory Value",
			value: formatCurrency(s.inventory_value || 0),
			positive: true
		},
		{
			label: "Receivables",
			value: formatCurrency(s.receivables || 0),
			positive: (s.receivables || 0) > 0
		},
		{
			label: "Payables",
			value: formatCurrency(s.payables || 0),
			negative: (s.payables || 0) > 0
		}
	], [s]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(ReportLayout, {
		title: "Financial Overview",
		subtitle: "Where your money is — income, expenses, cash, and outstanding",
		icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChartColumn, { className: "size-5 text-primary" }),
		toolbar: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ReportToolbar, { onPrint: () => window.print() }),
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SummaryCards, { cards }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "rounded-xl border border-border overflow-hidden",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "bg-gradient-to-r from-emerald-500/10 to-transparent px-4 py-3 border-b border-border",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center gap-2 text-sm font-semibold text-foreground",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TrendingUp, { className: "size-4 text-emerald-500" }), " Profit & Loss Summary"]
					})
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "p-4 grid grid-cols-1 sm:grid-cols-3 gap-4",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "space-y-2",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "text-[10px] text-muted-foreground font-medium uppercase tracking-wider",
									children: "Income"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex justify-between text-sm",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "text-muted-foreground",
										children: "Total Sales"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "font-semibold",
										children: formatCurrency(income.sales || 0)
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex justify-between text-sm",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "text-muted-foreground",
										children: "Sale Returns"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
										className: "font-semibold text-red-500",
										children: ["-", formatCurrency(income.sale_returns || 0)]
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex justify-between text-sm font-bold border-t border-border/40 pt-1",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Net Sales" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "text-emerald-600",
										children: formatCurrency(income.net_sales || 0)
									})]
								})
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "space-y-2",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "text-[10px] text-muted-foreground font-medium uppercase tracking-wider",
									children: "Costs"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex justify-between text-sm",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "text-muted-foreground",
										children: "Purchases"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "font-semibold",
										children: formatCurrency(expenses.purchases || 0)
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex justify-between text-sm",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "text-muted-foreground",
										children: "Operating Expenses"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "font-semibold text-red-500",
										children: formatCurrency(expenses.operating_expenses || 0)
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex justify-between text-sm font-bold border-t border-border/40 pt-1",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Total Costs" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "text-red-500",
										children: formatCurrency(expenses.total_expenses || 0)
									})]
								})
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "space-y-2",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "text-[10px] text-muted-foreground font-medium uppercase tracking-wider",
									children: "Summary"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex justify-between text-sm",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "text-muted-foreground",
										children: "Gross Profit"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: cn("font-semibold", (s.gross_profit || 0) >= 0 ? "text-emerald-600" : "text-red-500"),
										children: formatCurrency(s.gross_profit || 0)
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex justify-between text-sm",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "text-muted-foreground",
										children: "Gross Margin"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
										className: "font-semibold",
										children: [s.gross_margin_pct || 0, "%"]
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex justify-between text-sm font-bold border-t border-border/40 pt-1",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Net Profit" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: (s.net_profit || 0) >= 0 ? "text-emerald-600" : "text-red-500",
										children: formatCurrency(s.net_profit || 0)
									})]
								})
							]
						})
					]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "grid grid-cols-1 sm:grid-cols-3 gap-4",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "rounded-xl border border-border overflow-hidden",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "bg-gradient-to-r from-blue-500/10 to-transparent px-4 py-3 border-b border-border",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-center gap-2 text-sm font-semibold text-foreground",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DollarSign, { className: "size-4 text-blue-500" }), " Cash Flow"]
							})
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "p-4 space-y-2",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex justify-between text-sm",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "text-muted-foreground",
										children: "Cash In"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "font-semibold text-emerald-600",
										children: formatCurrency(cashFlow.cash_in || 0)
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex justify-between text-sm",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "text-muted-foreground",
										children: "Cash Out"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "font-semibold text-red-500",
										children: formatCurrency(cashFlow.cash_out || 0)
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex justify-between text-sm font-bold border-t border-border/40 pt-1",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Net Cash" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: (cashFlow.net_cash || 0) >= 0 ? "text-emerald-600" : "text-red-500",
										children: formatCurrency(cashFlow.net_cash || 0)
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "mt-3 pt-3 border-t border-border/40",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex items-center gap-2 text-xs text-muted-foreground mb-2",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Package, { className: "size-3.5" }), " Inventory Value"]
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "text-lg font-bold text-foreground tabular-nums",
										children: formatCurrency(s.inventory_value || 0)
									})]
								})
							]
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "rounded-xl border border-border overflow-hidden",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "bg-gradient-to-r from-amber-500/10 to-transparent px-4 py-3 border-b border-border",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-center gap-2 text-sm font-semibold text-foreground",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Users, { className: "size-4 text-amber-500" }), " Outstanding"]
							})
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "p-4 space-y-2",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex justify-between text-sm",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
										className: "text-muted-foreground flex items-center gap-1.5",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Users, { className: "size-3.5" }), " Customer Receivables"]
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "font-semibold text-emerald-600",
										children: formatCurrency(outstanding.receivables || 0)
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex justify-between text-sm",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
										className: "text-muted-foreground flex items-center gap-1.5",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Building2, { className: "size-3.5" }), " Supplier Payables"]
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "font-semibold text-red-500",
										children: formatCurrency(outstanding.payables || 0)
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex justify-between text-sm font-bold border-t border-border/40 pt-1",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Net Position" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: (outstanding.net_position || 0) >= 0 ? "text-emerald-600" : "text-red-500",
										children: formatCurrency(outstanding.net_position || 0)
									})]
								}),
								(s.cash_balance || 0) > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "mt-3 pt-3 border-t border-border/40",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex items-center gap-2 text-xs text-muted-foreground mb-2",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DollarSign, { className: "size-3.5" }), " Current Cash Balance"]
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: cn("text-lg font-bold tabular-nums", (s.cash_balance || 0) >= 0 ? "text-emerald-600" : "text-red-500"),
										children: formatCurrency(s.cash_balance || 0)
									})]
								})
							]
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "rounded-xl border border-border overflow-hidden",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "bg-gradient-to-r from-purple-500/10 to-transparent px-4 py-3 border-b border-border",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-center gap-2 text-sm font-semibold text-foreground",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChartColumn, { className: "size-4 text-purple-500" }), " Key Metrics"]
							})
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "p-4 space-y-2",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex justify-between text-sm",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "text-muted-foreground",
										children: "Gross Margin"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
										className: "font-semibold",
										children: [s.gross_margin_pct || 0, "%"]
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex justify-between text-sm",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "text-muted-foreground",
										children: "Total Sales"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "font-semibold",
										children: formatCurrency(s.total_sales || 0)
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex justify-between text-sm",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "text-muted-foreground",
										children: "Total Purchases"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "font-semibold",
										children: formatCurrency(s.total_purchases || 0)
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex justify-between text-sm",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "text-muted-foreground",
										children: "Expenses"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "font-semibold text-red-500",
										children: formatCurrency(s.total_expenses || 0)
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex justify-between text-sm border-t border-border/40 pt-1",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "text-muted-foreground",
										children: "Sale Returns"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "font-semibold text-amber-500",
										children: formatCurrency(s.sale_returns || 0)
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex justify-between text-sm",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "text-muted-foreground",
										children: "Purchase Returns"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "font-semibold text-emerald-600",
										children: formatCurrency(s.purchase_returns || 0)
									})]
								})
							]
						})]
					})
				]
			})
		]
	});
}
//#endregion
export { FinancialOverviewPage as default };
