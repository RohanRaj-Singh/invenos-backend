import { t as Banknote } from "./banknote-B76zKt2w.js";
import { t as require_jsx_runtime } from "./jsx-runtime-BjJQA5sn.js";
import { at as formatCurrency } from "./app-BLMvu7I3.js";
import { createTabularReport } from "./TabularReportPage-CyXZ-mg-.js";
import { creditColumn, debitColumn } from "./helpers-Dz9Fo7C9.js";
import { t as getCashFlow } from "./reports-data-CBYZ41r3.js";
//#region resources/js/Pages/reports/CashFlowReport.tsx
var import_jsx_runtime = require_jsx_runtime();
var CashFlowReport_default = createTabularReport({
	title: "Cash Flow",
	subtitle: "Cash inflows, outflows and balance summary",
	icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Banknote, { className: "size-5 text-primary" }),
	getData: (range) => getCashFlow(range).rows,
	columns: [
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
		debitColumn((r) => r.inflow),
		creditColumn((r) => r.outflow)
	],
	keyExtractor: (r) => `${r.date}-${r.type}-${r.description}`,
	summaryCards: (_data, range) => {
		const cf = getCashFlow(range);
		return [
			{
				label: "Opening Balance",
				value: formatCurrency(cf.openingBalance),
				positive: cf.openingBalance >= 0,
				negative: cf.openingBalance < 0
			},
			{
				label: "Total Inflow",
				value: formatCurrency(cf.totalIn),
				positive: true
			},
			{
				label: "Total Outflow",
				value: formatCurrency(cf.totalOut),
				negative: true
			},
			{
				label: "Closing Balance",
				value: formatCurrency(cf.closingBalance),
				positive: cf.closingBalance >= 0,
				negative: cf.closingBalance < 0
			}
		];
	},
	emptyMessage: "No cash movements in this date range."
});
//#endregion
export { CashFlowReport_default as default };
