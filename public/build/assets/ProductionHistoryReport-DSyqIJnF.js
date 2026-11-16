import { t as require_jsx_runtime } from "./jsx-runtime-Do9val7F.js";
import { t as Factory } from "./factory-J4bs4vZU.js";
import { t as cn } from "./utils-Bim8RyS4.js";
import { Mt as usePage, it as formatCurrency, ot as formatDate } from "./app-C7AUNtSc.js";
import { ReportLayout } from "./ReportLayout-DdPv5xpK.js";
import { ReportToolbar } from "./ReportToolbar-DkFXNV3_.js";
import { SummaryCards } from "./SummaryCards-DMXMwOZs.js";
import { n as DateRangeFilter, t as useReportDateRange } from "./useReportDateRange-DOYkGId6.js";
//#region resources/js/Pages/production/ProductionHistoryReport.tsx
var import_jsx_runtime = require_jsx_runtime();
function ProductionHistoryReport() {
	const { props } = usePage();
	const report = props.report || {
		orders: [],
		summary: {}
	};
	const range = useReportDateRange("/reports/production-history", props.filters || {}, { only: ["report", "filters"] });
	const summary = report.summary || {};
	const orders = report.orders || [];
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(ReportLayout, {
		title: "Production History",
		subtitle: "Manufacturing output, cost and reversal history",
		icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Factory, { className: "size-5 text-primary" }),
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
					label: "Orders",
					value: String(summary.order_count || 0)
				},
				{
					label: "Completed",
					value: String(summary.completed_count || 0),
					positive: true
				},
				{
					label: "Reversed",
					value: String(summary.reversed_count || 0),
					negative: (summary.reversed_count || 0) > 0
				},
				{
					label: "Output",
					value: Number(summary.output_quantity || 0).toLocaleString()
				},
				{
					label: "Production cost",
					value: summary.production_cost == null ? "—" : formatCurrency(summary.production_cost),
					positive: false
				}
			] }),
			summary.cost_complete === false && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "rounded-xl border border-amber-200 bg-amber-50/70 p-3 text-xs text-amber-800",
				children: "One or more production orders have incomplete component cost. Known costs are shown; no complete unit cost was forced into inventory."
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "rounded-xl border border-border overflow-x-auto",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
					className: "w-full text-sm min-w-[760px]",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", {
						className: "bg-muted/40 border-b border-border",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
								className: "text-left px-4 py-3 font-semibold text-muted-foreground",
								children: "Order"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
								className: "text-left px-4 py-3 font-semibold text-muted-foreground",
								children: "Product"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
								className: "text-right px-4 py-3 font-semibold text-muted-foreground",
								children: "Output"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
								className: "text-right px-4 py-3 font-semibold text-muted-foreground",
								children: "Cost"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
								className: "text-left px-4 py-3 font-semibold text-muted-foreground",
								children: "Status"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
								className: "text-left px-4 py-3 font-semibold text-muted-foreground",
								children: "Completed"
							})
						] })
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tbody", { children: orders.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tr", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
						colSpan: 6,
						className: "px-4 py-12 text-center text-muted-foreground",
						children: "No production history in this period."
					}) }) : orders.map((order) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
						className: "border-b border-border/60 last:border-0",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: "px-4 py-3",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
									href: `/production/${order.id}`,
									className: "font-mono text-xs text-primary hover:underline",
									children: order.production_number
								})
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: "px-4 py-3",
								children: order.product?.name || "—"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: "px-4 py-3 text-right tabular-nums",
								children: order.actual_output_quantity == null ? "—" : `${Number(order.actual_output_quantity).toLocaleString()} ${order.output_unit_id}`
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: "px-4 py-3 text-right tabular-nums",
								children: order.total_cost == null ? "—" : formatCurrency(order.total_cost)
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: "px-4 py-3",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: cn("text-xs capitalize", order.status === "reversed" ? "text-amber-600" : order.status === "completed" ? "text-emerald-600" : "text-muted-foreground"),
									children: String(order.status).replace("_", " ")
								})
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: "px-4 py-3 text-xs text-muted-foreground",
								children: order.completed_at ? formatDate(order.completed_at) : "—"
							})
						]
					}, order.id)) })]
				})
			})
		]
	});
}
//#endregion
export { ProductionHistoryReport as default };
