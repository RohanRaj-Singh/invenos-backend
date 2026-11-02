import { t as require_jsx_runtime } from "./jsx-runtime-Do9val7F.js";
import { t as Banknote } from "./banknote-C8PNremW.js";
import { Dt as usePage, rt as formatDate, tt as formatCurrency } from "./app-CO4ODFtf.js";
import { ReportLayout } from "./ReportLayout-BfXKmJuA.js";
import { ReportToolbar } from "./ReportToolbar-D_g_ZwrD.js";
import { SummaryCards } from "./SummaryCards-0iOqnAO9.js";
import { n as DateRangeFilter, t as useReportDateRange } from "./useReportDateRange-BLKeZQY3.js";
import { ReportTable } from "./ReportTable-BTarlIo5.js";
//#region resources/js/Pages/reports/CashFlowReport.tsx
var import_jsx_runtime = require_jsx_runtime();
function CashFlowReport() {
	const { props } = usePage();
	const report = props.report || {
		summary: {},
		rows: [],
		period: {}
	};
	const filters = props.filters || {};
	const summary = report.summary || {};
	const range = useReportDateRange("/reports/cash-flow", filters, { only: ["report", "filters"] });
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(ReportLayout, {
		title: "Cash Flow",
		subtitle: `Actual cash movements${report.period?.from ? ` — ${report.period.from} to ${report.period.to}` : ""}`,
		icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Banknote, { className: "size-5 text-primary" }),
		toolbar: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ReportToolbar, {
			reportTitle: "Cash Flow",
			onPrint: () => window.print()
		}),
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
					label: "Opening Balance",
					value: formatCurrency(summary.opening_balance ?? 0),
					positive: (summary.opening_balance ?? 0) >= 0,
					negative: (summary.opening_balance ?? 0) < 0
				},
				{
					label: "Cash In",
					value: formatCurrency(summary.total_in ?? 0),
					positive: true
				},
				{
					label: "Cash Out",
					value: formatCurrency(summary.total_out ?? 0),
					negative: (summary.total_out ?? 0) > 0
				},
				{
					label: "Closing Balance",
					value: formatCurrency(summary.closing_balance ?? 0),
					positive: (summary.closing_balance ?? 0) >= 0,
					negative: (summary.closing_balance ?? 0) < 0
				}
			] }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ReportTable, {
				columns: [
					{
						key: "date",
						header: "Date",
						render: (r) => formatDate(r.date),
						sortable: true,
						sortValue: (r) => r.date
					},
					{
						key: "type",
						header: "Type",
						render: (r) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "font-medium",
							children: r.type
						}),
						sortable: true,
						sortValue: (r) => r.type
					},
					{
						key: "description",
						header: "Description",
						render: (r) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-xs",
							children: r.description
						})
					},
					{
						key: "reference",
						header: "Reference",
						render: (r) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("code", {
							className: "text-[10px] font-mono bg-muted px-1 py-0.5 rounded",
							children: r.reference
						})
					},
					{
						key: "inflow",
						header: "In",
						className: "text-right",
						sortable: true,
						sortValue: (r) => r.inflow,
						render: (r) => r.inflow ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-emerald-600 tabular-nums",
							children: formatCurrency(r.inflow)
						}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-muted-foreground",
							children: "—"
						})
					},
					{
						key: "outflow",
						header: "Out",
						className: "text-right",
						sortable: true,
						sortValue: (r) => r.outflow,
						render: (r) => r.outflow ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-red-500 tabular-nums",
							children: formatCurrency(r.outflow)
						}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-muted-foreground",
							children: "—"
						})
					}
				],
				data: report.rows || [],
				keyExtractor: (r) => String(r.id),
				pageSize: 25,
				searchable: true,
				searchPlaceholder: "Search reference or description...",
				emptyMessage: "No cash movements in this period."
			})
		]
	});
}
//#endregion
export { CashFlowReport as default };
