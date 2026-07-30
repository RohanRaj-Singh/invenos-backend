import { i as __toESM, t as require_react } from "./react-DCO0ASPG.js";
import { t as ReportToolbar } from "./ReportToolbar-Bz_3cMrv.js";
import { t as TrendingUp } from "./trending-up-CRrMyRfV.js";
import { t as require_jsx_runtime } from "./jsx-runtime-BjJQA5sn.js";
import { tt as formatCurrency } from "./app-DxiW8KTt.js";
import { n as CardContent, t as Card } from "./card-D1ktOUWx.js";
import { t as ReportLayout } from "./ReportLayout-647vA4sZ.js";
import { t as SummaryCards } from "./SummaryCards-dGWtU2Mx.js";
import { ReportRow } from "./ReportRow-DkPqdZ89.js";
import { r as useReportFilters, t as ReportFilterBar } from "./ReportFilters-DDa6usea.js";
import { r as getProfitLoss } from "./reports-data-UVuBc6nM.js";
//#region resources/js/Pages/reports/PnLReport.tsx
var import_react = /* @__PURE__ */ __toESM(require_react(), 1);
var import_jsx_runtime = require_jsx_runtime();
function PnLReport() {
	const { filters, setFilters, setPreset } = useReportFilters();
	const data = (0, import_react.useMemo)(() => getProfitLoss({
		from: filters.dateFrom,
		to: filters.dateTo
	}), [filters.dateFrom, filters.dateTo]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(ReportLayout, {
		title: "Profit & Loss",
		subtitle: "Revenue, costs and profitability analysis",
		icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TrendingUp, { className: "size-5 text-primary" }),
		toolbar: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ReportToolbar, { onPrint: () => window.print() }),
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ReportFilterBar, {
				filters,
				setFilters,
				setPreset
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SummaryCards, { cards: [
				{
					label: "Gross Revenue",
					value: formatCurrency(data.revenue),
					positive: true
				},
				{
					label: "Sale Returns",
					value: formatCurrency(data.saleReturns),
					negative: data.saleReturns > 0
				},
				{
					label: "Net Revenue",
					value: formatCurrency(data.netRevenue),
					positive: data.netRevenue >= 0
				},
				{
					label: "Gross Profit",
					value: formatCurrency(data.grossProfit),
					positive: data.grossProfit >= 0,
					negative: data.grossProfit < 0
				}
			] }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Card, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardContent, {
				className: "p-6",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "space-y-3",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ReportRow, {
							label: "Gross Revenue",
							value: formatCurrency(data.revenue)
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ReportRow, {
							label: "Sale Returns",
							value: formatCurrency(data.saleReturns),
							negative: true
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "border-t border-border pt-2",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ReportRow, {
								label: "Net Revenue",
								value: formatCurrency(data.netRevenue),
								bold: true,
								positive: data.netRevenue >= 0
							})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ReportRow, {
							label: "Cost of Goods Sold",
							value: formatCurrency(data.cogs),
							negative: true
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "border-t border-border pt-2",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ReportRow, {
								label: "Gross Profit",
								value: formatCurrency(data.grossProfit),
								bold: true,
								positive: data.grossProfit >= 0
							})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ReportRow, {
							label: "Operating Expenses",
							value: formatCurrency(data.totalExpenses),
							negative: true
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "border-t-2 border-foreground pt-2",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ReportRow, {
								label: "Net Profit / Loss",
								value: formatCurrency(data.netProfit),
								bold: true,
								positive: data.netProfit >= 0,
								negative: data.netProfit < 0,
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
