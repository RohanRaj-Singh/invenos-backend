import { a as __toESM, n as require_react, t as require_jsx_runtime } from "./jsx-runtime-Do9val7F.js";
import { ReportLayout } from "./ReportLayout-DmhgHQ1p.js";
import { ReportToolbar } from "./ReportToolbar-CqBH1pKg.js";
import { SummaryCards } from "./SummaryCards-Dh-Q-Qyr.js";
import { ReportTable } from "./ReportTable-B99rAlOi.js";
import { ReportFilterBar, useReportFilters } from "./ReportFilters-Cvhy-42b.js";
//#region resources/js/Pages/reports/TabularReportPage.tsx
var import_react = /* @__PURE__ */ __toESM(require_react(), 1);
var import_jsx_runtime = require_jsx_runtime();
function createTabularReport(config) {
	return function ReportPage() {
		const { filters, setFilters, setPreset, dateRange } = useReportFilters();
		const data = (0, import_react.useMemo)(() => config.getData(dateRange), [dateRange]);
		const cards = (0, import_react.useMemo)(() => config.summaryCards(data, dateRange), [data, dateRange]);
		return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(ReportLayout, {
			title: config.title,
			subtitle: config.subtitle,
			icon: config.icon,
			toolbar: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ReportToolbar, { onPrint: () => window.print() }),
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ReportFilterBar, {
					filters,
					setFilters,
					setPreset,
					showPaymentMethod: config.showPaymentMethod
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SummaryCards, { cards }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ReportTable, {
					columns: config.columns,
					data,
					keyExtractor: config.keyExtractor,
					pageSize: 25,
					searchable: config.searchable,
					searchPlaceholder: config.searchPlaceholder,
					onSearch: config.onSearch,
					emptyMessage: config.emptyMessage
				})
			]
		});
	};
}
//#endregion
export { createTabularReport };
