import { t as require_jsx_runtime } from "./jsx-runtime-Do9val7F.js";
import { t as cn } from "./utils-Bim8RyS4.js";
import { Dt as Beaker, Mt as usePage, it as formatCurrency, ot as formatDate } from "./app-C7AUNtSc.js";
import { ReportLayout } from "./ReportLayout-DdPv5xpK.js";
import { ReportToolbar } from "./ReportToolbar-DkFXNV3_.js";
import { SummaryCards } from "./SummaryCards-DMXMwOZs.js";
import { ReportTable } from "./ReportTable-CP_op9dT.js";
import { n as DateRangeFilter, t as useReportDateRange } from "./useReportDateRange-DOYkGId6.js";
//#region resources/js/Pages/production/ComponentUsageReport.tsx
var import_jsx_runtime = require_jsx_runtime();
function ComponentUsageReport() {
	const { props } = usePage();
	const report = props.report || {
		rows: [],
		summary: {},
		by_component: []
	};
	const range = useReportDateRange("/reports/component-usage", props.filters || {}, { only: ["report", "filters"] });
	const formulaRows = (report.rows || []).filter((row) => row.source !== "manufacturing");
	const posRows = formulaRows.filter((row) => row.source === "pos");
	const recoveryRows = formulaRows.filter((row) => row.source === "recovery");
	const posQuantity = posRows.reduce((sum, row) => sum + Number(row.actual_quantity || 0), 0);
	const recoveredQuantity = recoveryRows.reduce((sum, row) => sum + Number(row.actual_quantity || 0), 0);
	const netQuantity = posQuantity - recoveredQuantity;
	const uncostedLines = formulaRows.filter((row) => row.total_cost == null).length;
	const byIngredient = Object.values(formulaRows.reduce((groups, row) => {
		const key = `${row.component_name}:${row.unit}`;
		const group = groups[key] ?? {
			key,
			ingredient: row.component_name,
			unit: row.unit,
			used: 0,
			recovered: 0,
			cost: 0,
			costComplete: true
		};
		if (row.source === "recovery") group.recovered += Number(row.actual_quantity || 0);
		else group.used += Number(row.actual_quantity || 0);
		group.cost += Number(row.total_cost || 0);
		if (row.total_cost == null) group.costComplete = false;
		groups[key] = group;
		return groups;
	}, {})).sort((a, b) => b.used - a.used);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(ReportLayout, {
		title: "Ingredient Usage",
		subtitle: "Actual ingredient consumption from formula sales, net of recovered ingredients",
		icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Beaker, { className: "size-5 text-primary" }),
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
					label: "Formula ingredient use",
					value: Number(posQuantity.toFixed(6)).toLocaleString(),
					positive: false
				},
				{
					label: "Recovered",
					value: Number(recoveredQuantity.toFixed(6)).toLocaleString(),
					positive: recoveredQuantity > 0
				},
				{
					label: "Net ingredient use",
					value: Number(netQuantity.toFixed(6)).toLocaleString(),
					positive: false
				},
				{
					label: "Usage lines",
					value: `${formulaRows.length}`,
					positive: true
				}
			] }),
			uncostedLines > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "rounded-xl border border-amber-200 bg-amber-50/70 p-3 text-xs text-amber-800",
				children: [
					"Ingredient cost is incomplete for ",
					uncostedLines,
					" line(s). Costs shown are known execution snapshots only."
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "space-y-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "text-sm font-semibold",
					children: "Consumption by ingredient"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ReportTable, {
					columns: [
						{
							key: "ingredient",
							header: "Ingredient",
							render: (r) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "font-medium",
								children: r.ingredient
							})
						},
						{
							key: "used",
							header: "Formula use",
							render: (r) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "tabular-nums",
								children: [
									Number(r.used.toFixed(6)).toLocaleString(),
									" ",
									r.unit
								]
							}),
							className: "text-right"
						},
						{
							key: "recovered",
							header: "Recovered",
							render: (r) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "tabular-nums",
								children: [
									Number(r.recovered.toFixed(6)).toLocaleString(),
									" ",
									r.unit
								]
							}),
							className: "text-right"
						},
						{
							key: "net",
							header: "Net",
							render: (r) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "tabular-nums",
								children: [
									Number((r.used - r.recovered).toFixed(6)).toLocaleString(),
									" ",
									r.unit
								]
							}),
							className: "text-right"
						},
						{
							key: "cost",
							header: "Cost",
							render: (r) => r.costComplete ? formatCurrency(r.cost) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-amber-600",
								children: "Incomplete"
							}),
							className: "text-right"
						}
					],
					data: byIngredient,
					keyExtractor: (r) => r.key,
					pageSize: 50,
					emptyMessage: "No ingredient consumption in this period."
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "space-y-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "text-sm font-semibold",
					children: "Formula sale lines"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ReportTable, {
					columns: [
						{
							key: "date",
							header: "Date",
							render: (r) => formatDate(r.date),
							sortable: true
						},
						{
							key: "finished_product_name",
							header: "Formula",
							render: (r) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "font-medium",
								children: r.finished_product_name || "—"
							})
						},
						{
							key: "document_number",
							header: "Invoice / Return",
							render: (r) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "font-mono text-xs",
								children: r.document_number
							})
						},
						{
							key: "component_name",
							header: "Ingredient",
							render: (r) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: r.component_name })
						},
						{
							key: "actual_quantity",
							header: "Actual",
							render: (r) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "tabular-nums",
								children: [
									Number(r.actual_quantity).toLocaleString(),
									" ",
									r.unit
								]
							}),
							className: "text-right",
							sortable: true,
							sortValue: (r) => r.actual_quantity
						},
						{
							key: "wastage_quantity",
							header: "Wastage",
							render: (r) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "tabular-nums",
								children: Number(r.wastage_quantity).toLocaleString()
							}),
							className: "text-right"
						},
						{
							key: "total_cost",
							header: "Cost",
							render: (r) => r.total_cost == null ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-amber-600",
								children: "Incomplete"
							}) : formatCurrency(r.total_cost),
							className: "text-right"
						},
						{
							key: "cost_basis",
							header: "Basis",
							render: (r) => r.cost_basis || "—"
						},
						{
							key: "source",
							header: "Source",
							render: (r) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-xs capitalize",
								children: r.source === "pos" ? "Formula sale" : "Recovery"
							})
						},
						{
							key: "status",
							header: "Status",
							render: (r) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: cn("text-xs", r.source === "recovery" ? "text-emerald-600" : "text-muted-foreground"),
								children: r.source === "recovery" ? "Recovered" : "Consumed"
							})
						}
					],
					data: formulaRows,
					keyExtractor: (r) => `${r.source}-${r.document_number}-${r.component_name}-${r.actual_quantity}`,
					pageSize: 50,
					searchable: true,
					searchPlaceholder: "Search formula, invoice or ingredient...",
					onSearch: (data, q) => data.filter((r) => `${r.document_number} ${r.component_name} ${r.finished_product_name || ""}`.toLowerCase().includes(q.toLowerCase())),
					emptyMessage: "No formula ingredient usage in this period."
				})]
			})
		]
	});
}
//#endregion
export { ComponentUsageReport as default };
