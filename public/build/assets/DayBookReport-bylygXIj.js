import { t as BookOpen } from "./book-open-CFGJU452.js";
import { t as require_jsx_runtime } from "./jsx-runtime-BjJQA5sn.js";
import { at as formatCurrency } from "./app-fzdHvqQg.js";
import { createTabularReport } from "./TabularReportPage-tfFMQl84.js";
import { creditColumn, debitColumn } from "./helpers-CQzhe3yj.js";
import { n as getDayBook } from "./reports-data-DYx4qQ2d.js";
//#region resources/js/Pages/reports/DayBookReport.tsx
var import_jsx_runtime = require_jsx_runtime();
var columns = [
	{
		key: "date",
		header: "Date",
		render: (r) => r.date,
		sortable: true
	},
	{
		key: "type",
		header: "Type",
		render: (r) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: "font-medium",
			children: r.type
		}),
		sortable: true
	},
	{
		key: "description",
		header: "Description",
		render: (r) => r.description
	},
	{
		key: "ref",
		header: "Reference",
		render: (r) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("code", {
			className: "text-[11px] font-mono bg-muted px-1 py-0.5 rounded",
			children: r.ref
		})
	},
	debitColumn((r) => r.debit),
	creditColumn((r) => r.credit)
];
var DayBookReport_default = createTabularReport({
	title: "Day Book",
	subtitle: "Complete daily transaction log",
	icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(BookOpen, { className: "size-5 text-primary" }),
	getData: (range) => getDayBook(range).rows,
	columns,
	keyExtractor: (r) => `${r.ref}-${r.type}`,
	summaryCards: (data) => {
		const totalDebit = data.reduce((s, r) => s + r.debit, 0);
		const totalCredit = data.reduce((s, r) => s + r.credit, 0);
		return [
			{
				label: "Total Debit",
				value: formatCurrency(totalDebit),
				positive: true
			},
			{
				label: "Total Credit",
				value: formatCurrency(totalCredit),
				negative: true
			},
			{
				label: "Net Difference",
				value: formatCurrency(Math.abs(totalDebit - totalCredit)),
				subtitle: totalDebit >= totalCredit ? "Debit exceeds Credit" : "Credit exceeds Debit"
			},
			{
				label: "Transactions",
				value: String(data.length)
			}
		];
	},
	emptyMessage: "No transactions in this date range."
});
//#endregion
export { DayBookReport_default as default };
