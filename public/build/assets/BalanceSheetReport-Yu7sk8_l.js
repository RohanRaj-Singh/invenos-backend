import { t as require_jsx_runtime } from "./jsx-runtime-Do9val7F.js";
import { t as createLucideIcon } from "./createLucideIcon-CtLNniWl.js";
import { t as cn } from "./utils-Bim8RyS4.js";
import { Dt as usePage, tt as formatCurrency } from "./app-CO4ODFtf.js";
import { i as CardTitle, n as CardContent, r as CardHeader, t as Card } from "./card-1EYOepvR.js";
import { ReportLayout } from "./ReportLayout-BfXKmJuA.js";
import { ReportToolbar } from "./ReportToolbar-D_g_ZwrD.js";
import { SummaryCards } from "./SummaryCards-0iOqnAO9.js";
import { ReportRow } from "./ReportRow-C9jiEyEv.js";
import { n as DateRangeFilter, t as useReportDateRange } from "./useReportDateRange-BLKeZQY3.js";
/**
* @license lucide-react v1.26.0 - ISC
*
* This source code is licensed under the ISC license.
* See the LICENSE file in the root directory of this source tree.
*/
var Scale = createLucideIcon("scale", [
	["path", {
		d: "M12 3v18",
		key: "108xh3"
	}],
	["path", {
		d: "m19 8 3 8a5 5 0 0 1-6 0zV7",
		key: "zcdpyk"
	}],
	["path", {
		d: "M3 7h1a17 17 0 0 0 8-2 17 17 0 0 0 8 2h1",
		key: "1yorad"
	}],
	["path", {
		d: "m5 8 3 8a5 5 0 0 1-6 0zV7",
		key: "eua70x"
	}],
	["path", {
		d: "M7 21h10",
		key: "1b0cd5"
	}]
]);
//#endregion
//#region resources/js/Pages/reports/BalanceSheetReport.tsx
var import_jsx_runtime = require_jsx_runtime();
function BalanceSheetReport() {
	const { props } = usePage();
	const report = props.report || {};
	const range = useReportDateRange("/reports/balance-sheet", props.filters || {}, { only: ["report", "filters"] });
	const assets = report.assets || {};
	const liabilities = report.liabilities || {};
	const equity = report.equity || {};
	const totals = report.totals || {};
	const balanced = totals.balanced !== false;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(ReportLayout, {
		title: "Financial Position",
		subtitle: `Management view${report.period?.to ? ` — as of ${report.period.to}` : ""}`,
		icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Scale, { className: "size-5 text-primary" }),
		toolbar: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ReportToolbar, { onPrint: () => window.print() }),
		pending: range.pending,
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DateRangeFilter, {
				preset: range.preset,
				from: range.from,
				to: range.to,
				onPreset: (p) => range.apply(p),
				onFromChange: range.setFrom,
				onToChange: range.setTo,
				onApplyCustom: () => range.apply("custom", range.from, range.to),
				pending: range.pending
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SummaryCards, { cards: [
				{
					label: "Total Assets",
					value: formatCurrency(assets.total_assets ?? 0),
					positive: true
				},
				{
					label: "Total Liabilities",
					value: formatCurrency(liabilities.total_liabilities ?? 0),
					negative: (liabilities.total_liabilities ?? 0) > 0
				},
				{
					label: "Total Equity",
					value: formatCurrency(equity.total_equity ?? 0)
				},
				{
					label: "Difference",
					value: formatCurrency(Math.abs(totals.difference ?? 0)),
					negative: !balanced
				}
			] }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "grid md:grid-cols-2 gap-4",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardHeader, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardTitle, { children: "Assets" }) }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardContent, {
					className: "space-y-2",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ReportRow, {
							label: "Cash & Bank",
							value: formatCurrency(assets.cash_and_bank ?? 0)
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ReportRow, {
							label: "Inventory (at cost)",
							value: formatCurrency(assets.inventory ?? 0)
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ReportRow, {
							label: "Accounts Receivable",
							value: formatCurrency(assets.accounts_receivable ?? 0)
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "border-t border-border pt-2",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ReportRow, {
								label: "Total Assets",
								value: formatCurrency(assets.total_assets ?? 0),
								bold: true
							})
						})
					]
				})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardHeader, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardTitle, { children: "Liabilities & Equity" }) }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardContent, {
					className: "space-y-2",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ReportRow, {
							label: "Accounts Payable",
							value: formatCurrency(liabilities.accounts_payable ?? 0)
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ReportRow, {
							label: "Owner Capital (derived)",
							value: formatCurrency(equity.owner_capital ?? 0)
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ReportRow, {
							label: "Retained Earnings (estimated)",
							value: formatCurrency(equity.retained_earnings ?? 0)
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "border-t border-border pt-2",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ReportRow, {
								label: "Total Liabilities + Equity",
								value: formatCurrency(totals.liabilities_plus_equity ?? 0),
								bold: true
							})
						})
					]
				})] })]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: cn("rounded-lg border p-3 text-xs leading-relaxed", balanced ? "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-800 dark:bg-emerald-950/20 dark:text-emerald-300" : "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-800 dark:bg-amber-950/20 dark:text-amber-300"),
				children: balanced ? "Assets equal liabilities plus equity." : `Unreconciled difference: ${formatCurrency(Math.abs(totals.difference ?? 0))}. This is a management view — capital contributions, drawings and loans are not recorded.`
			})
		]
	});
}
//#endregion
export { BalanceSheetReport as default };
