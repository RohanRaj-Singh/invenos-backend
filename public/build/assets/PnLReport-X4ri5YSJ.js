import { t as ReportToolbar } from "./ReportToolbar-BIq7ONQJ.js";
import { t as TrendingUp } from "./trending-up-CRrMyRfV.js";
import { t as require_jsx_runtime } from "./jsx-runtime-BjJQA5sn.js";
import { Ot as router3, kt as usePage, rt as formatCurrency } from "./app-Us-FuJbD.js";
import { n as CardContent, t as Card } from "./card-D1ktOUWx.js";
import { t as ReportLayout } from "./ReportLayout-647vA4sZ.js";
import { t as SummaryCards } from "./SummaryCards-D4MuljZV.js";
import { ReportRow } from "./ReportRow-DkPqdZ89.js";
import { DateFilter } from "./DateFilter-BVlWF9lc.js";
//#region resources/js/Pages/reports/PnLReport.tsx
var import_jsx_runtime = require_jsx_runtime();
function PnLReport() {
	const { props } = usePage();
	const report = props.report || {
		revenue: 0,
		sale_returns: 0,
		net_revenue: 0,
		cogs: 0,
		gross_profit: 0,
		gross_margin_pct: 0,
		total_expenses: 0,
		net_profit: 0
	};
	props.filters;
	const currentPreset = "thisMonth";
	const handleDateChange = (_preset, from, to) => {
		router3.get("/reports/pnl", {
			date_from: from,
			date_to: to
		}, { preserveState: true });
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(ReportLayout, {
		title: "Profit & Loss",
		subtitle: "Revenue, costs and profitability analysis",
		icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TrendingUp, { className: "size-5 text-primary" }),
		toolbar: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ReportToolbar, { onPrint: () => window.print() }),
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DateFilter, {
				value: currentPreset,
				onChange: handleDateChange
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SummaryCards, { cards: [
				{
					label: "Gross Revenue",
					value: formatCurrency(report.revenue),
					positive: true
				},
				{
					label: "Net Revenue",
					value: formatCurrency(report.net_revenue),
					positive: report.net_revenue >= 0
				},
				{
					label: "Gross Profit",
					value: formatCurrency(report.gross_profit),
					positive: report.gross_profit >= 0,
					negative: report.gross_profit < 0
				},
				{
					label: "Net Profit",
					value: formatCurrency(report.net_profit),
					positive: report.net_profit >= 0,
					negative: report.net_profit < 0
				}
			] }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Card, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardContent, {
				className: "p-6",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "space-y-3",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ReportRow, {
							label: "Gross Revenue",
							value: formatCurrency(report.revenue)
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ReportRow, {
							label: "Sale Returns",
							value: formatCurrency(report.sale_returns),
							negative: true
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "border-t border-border pt-2",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ReportRow, {
								label: "Net Revenue",
								value: formatCurrency(report.net_revenue),
								bold: true,
								positive: report.net_revenue >= 0
							})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ReportRow, {
							label: "Cost of Goods Sold",
							value: formatCurrency(report.cogs),
							negative: true
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "border-t border-border pt-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ReportRow, {
								label: "Gross Profit",
								value: formatCurrency(report.gross_profit),
								bold: true,
								positive: report.gross_profit >= 0
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ReportRow, {
								label: "Gross Margin",
								value: `${report.gross_margin_pct}%`
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ReportRow, {
							label: "Operating Expenses",
							value: formatCurrency(report.total_expenses),
							negative: true
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "border-t-2 border-foreground pt-2",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ReportRow, {
								label: "Net Profit / Loss",
								value: formatCurrency(report.net_profit),
								bold: true,
								positive: report.net_profit >= 0,
								negative: report.net_profit < 0,
								large: true
							})
						})
					]
				})
			}) })
		]
	});
}
//#endregion
export { PnLReport as default };
