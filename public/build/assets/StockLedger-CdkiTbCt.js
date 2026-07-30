import { i as __toESM, t as require_react } from "./react-DCO0ASPG.js";
import { t as ClipboardList } from "./clipboard-list-vYbzP_6F.js";
import { t as ReportToolbar } from "./ReportToolbar-Bz_3cMrv.js";
import { t as require_jsx_runtime } from "./jsx-runtime-BjJQA5sn.js";
import { Ot as usePage, it as formatDate } from "./app-DxiW8KTt.js";
import { t as ReportLayout } from "./ReportLayout-647vA4sZ.js";
import { t as SummaryCards } from "./SummaryCards-dGWtU2Mx.js";
import { t as ReportTable } from "./ReportTable-DnYaxygU.js";
//#region resources/js/Pages/reports/StockLedger.tsx
var import_react = /* @__PURE__ */ __toESM(require_react(), 1);
var import_jsx_runtime = require_jsx_runtime();
function StockLedgerPage() {
	const { props } = usePage();
	const report = props.report || {
		movements: [],
		meta: null
	};
	props.filters;
	const movements = report.movements || [];
	const cards = (0, import_react.useMemo)(() => {
		const totalIn = movements.filter((m) => m.quantity > 0).reduce((s, m) => s + m.quantity, 0);
		const totalOut = movements.filter((m) => m.quantity < 0).reduce((s, m) => s + Math.abs(m.quantity), 0);
		const types = new Set(movements.map((m) => m.type));
		return [
			{
				label: "Total Movements",
				value: String(movements.length)
			},
			{
				label: "Stock In",
				value: totalIn.toLocaleString(),
				positive: true
			},
			{
				label: "Stock Out",
				value: totalOut.toLocaleString(),
				negative: totalOut > 0
			},
			{
				label: "Transaction Types",
				value: String(types.size)
			}
		];
	}, [movements]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(ReportLayout, {
		title: "Stock Ledger",
		subtitle: "All inventory movements in chronological order",
		icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ClipboardList, { className: "size-5 text-primary" }),
		toolbar: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ReportToolbar, {
			csvExportUrl: "/reports/stock/ledger/export/csv",
			onPrint: () => window.print()
		}),
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SummaryCards, { cards }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ReportTable, {
			columns: [
				{
					key: "date",
					header: "Date",
					render: (r) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "text-xs font-medium",
						children: formatDate(r.date) || "—"
					}),
					sortable: true,
					sortValue: (r) => r.date
				},
				{
					key: "product_name",
					header: "Product",
					render: (r) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "font-medium",
						children: r.product_name || "—"
					}),
					sortable: true,
					sortValue: (r) => r.product_name
				},
				{
					key: "type",
					header: "Type",
					render: (r) => {
						return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: `inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold ${{
								"purchase": "text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30",
								"sale": "text-blue-600 bg-blue-50 dark:bg-blue-950/30",
								"sale-return": "text-amber-600 bg-amber-50 dark:bg-amber-950/30",
								"purchase-return": "text-red-600 bg-red-50 dark:bg-red-950/30",
								"adjustment": "text-purple-600 bg-purple-50 dark:bg-purple-950/30"
							}[r.type] || "text-muted-foreground bg-muted/50"}`,
							children: r.type
						});
					}
				},
				{
					key: "quantity",
					header: "Qty",
					render: (r) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
						className: `text-sm font-semibold tabular-nums ${r.quantity > 0 ? "text-emerald-600" : r.quantity < 0 ? "text-red-500" : ""}`,
						children: [r.quantity > 0 ? "+" : "", r.quantity.toLocaleString()]
					}),
					className: "text-right",
					sortable: true,
					sortValue: (r) => r.quantity
				},
				{
					key: "running_balance",
					header: "Balance",
					render: (r) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "text-sm font-semibold tabular-nums",
						children: r.running_balance.toLocaleString()
					}),
					className: "text-right",
					sortable: true,
					sortValue: (r) => r.running_balance
				},
				{
					key: "reference",
					header: "Reference",
					render: (r) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("code", {
						className: "text-[10px] font-mono bg-muted px-1 py-0.5 rounded",
						children: r.reference || "—"
					})
				}
			],
			data: movements,
			keyExtractor: (r) => String(r.id),
			pageSize: 25,
			searchable: true,
			searchPlaceholder: "Search by product or reference...",
			onSearch: (data, q) => data.filter((r) => (r.product_name || "").toLowerCase().includes(q) || (r.reference || "").toLowerCase().includes(q)),
			emptyMessage: "No stock movements found for the selected filters."
		})]
	});
}
//#endregion
export { StockLedgerPage as default };
