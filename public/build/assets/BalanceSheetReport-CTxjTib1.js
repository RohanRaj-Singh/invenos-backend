import { t as ClipboardList } from "./clipboard-list-vYbzP_6F.js";
import { t as ReportToolbar } from "./ReportToolbar-D8SR0LvN.js";
import { t as require_jsx_runtime } from "./jsx-runtime-BjJQA5sn.js";
import { E as mockProducts, f as financialTransactions, tt as formatCurrency } from "./app-CwPUaRAl.js";
import { n as CardContent, t as Card } from "./card-D1ktOUWx.js";
import { t as ReportLayout } from "./ReportLayout-647vA4sZ.js";
import { t as SummaryCards } from "./SummaryCards-D7455BBE.js";
import { ReportRow } from "./ReportRow-DkPqdZ89.js";
//#region resources/js/Pages/reports/BalanceSheetReport.tsx
var import_jsx_runtime = require_jsx_runtime();
function BalanceSheetReport() {
	const inventoryValue = mockProducts.reduce((s, p) => {
		const cost = p.purchaseConfig ? p.purchaseConfig.cost / (p.purchaseConfig.quantity || 1) : 0;
		return s + p.stockQuantity * cost;
	}, 0);
	const cashBalance = financialTransactions.filter((t) => t.direction === "in").reduce((s, t) => s + t.amount, 0) - financialTransactions.filter((t) => t.direction === "out").reduce((s, t) => s + t.amount, 0);
	const liabilities = Math.max(0, -Math.min(0, cashBalance)) * .3;
	const capital = cashBalance + inventoryValue - liabilities;
	const totalAssets = cashBalance + inventoryValue;
	const totalLiabilitiesEquity = liabilities + capital;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(ReportLayout, {
		title: "Balance Sheet",
		subtitle: "Statement of financial position (prototype)",
		icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ClipboardList, { className: "size-5 text-primary" }),
		toolbar: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ReportToolbar, { onPrint: () => window.print() }),
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SummaryCards, { cards: [
			{
				label: "Total Assets",
				value: formatCurrency(Math.round(totalAssets)),
				positive: true
			},
			{
				label: "Total Liabilities",
				value: formatCurrency(Math.round(liabilities)),
				negative: true
			},
			{
				label: "Capital",
				value: formatCurrency(Math.round(capital)),
				positive: true
			}
		] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "grid grid-cols-1 lg:grid-cols-2 gap-5",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Card, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardContent, {
				className: "p-5 space-y-3",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
						className: "text-sm font-semibold text-foreground mb-2",
						children: "Assets"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ReportRow, {
						label: "Cash & Bank",
						value: formatCurrency(Math.round(cashBalance))
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ReportRow, {
						label: "Inventory",
						value: formatCurrency(Math.round(inventoryValue))
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ReportRow, {
						label: "Accounts Receivable",
						value: formatCurrency(0)
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "border-t border-border pt-2",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ReportRow, {
							label: "Total Assets",
							value: formatCurrency(Math.round(totalAssets)),
							bold: true
						})
					})
				]
			}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Card, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardContent, {
				className: "p-5 space-y-3",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
						className: "text-sm font-semibold text-foreground mb-2",
						children: "Liabilities & Equity"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ReportRow, {
						label: "Accounts Payable",
						value: formatCurrency(Math.round(liabilities))
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ReportRow, {
						label: "Short-term Debt",
						value: formatCurrency(0)
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "border-t border-border pt-2",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ReportRow, {
							label: "Total Liabilities",
							value: formatCurrency(Math.round(liabilities)),
							bold: true
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ReportRow, {
						label: "Owner's Capital",
						value: formatCurrency(Math.round(capital))
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ReportRow, {
						label: "Retained Earnings",
						value: formatCurrency(0)
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "border-t border-border pt-2",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ReportRow, {
							label: "Total Equity",
							value: formatCurrency(Math.round(capital)),
							bold: true
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "border-t-2 border-foreground pt-2",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ReportRow, {
							label: "Liabilities + Equity",
							value: formatCurrency(Math.round(totalLiabilitiesEquity)),
							bold: true
						})
					})
				]
			}) })]
		})]
	});
}
//#endregion
export { BalanceSheetReport as default };
