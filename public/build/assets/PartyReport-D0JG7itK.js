import { i as __toESM, t as require_react } from "./react-DCO0ASPG.js";
import { t as ReportToolbar } from "./ReportToolbar-D8SR0LvN.js";
import { t as cn } from "./utils-Bim8RyS4.js";
import { t as require_jsx_runtime } from "./jsx-runtime-BjJQA5sn.js";
import { ct as Users, it as formatDate, tt as formatCurrency } from "./app-CwPUaRAl.js";
import { t as ReportLayout } from "./ReportLayout-647vA4sZ.js";
import { t as SummaryCards } from "./SummaryCards-D7455BBE.js";
import { r as useReportFilters, t as ReportFilterBar } from "./ReportFilters-DDa6usea.js";
import { t as ReportTable } from "./ReportTable-D008XYvR.js";
import { creditColumn, debitColumn } from "./helpers-BKg29yiv.js";
import { n as getPartyStatement } from "./reports-data-Cpp0TazK.js";
//#region resources/js/Pages/reports/PartyReport.tsx
var import_react = /* @__PURE__ */ __toESM(require_react(), 1);
var import_jsx_runtime = require_jsx_runtime();
function PartyReport() {
	const [partyName, setPartyName] = (0, import_react.useState)("");
	const [partyType, setPartyType] = (0, import_react.useState)("customer");
	const { filters, setFilters, setPreset } = useReportFilters();
	const dateRange = (0, import_react.useMemo)(() => ({
		from: filters.dateFrom,
		to: filters.dateTo
	}), [filters.dateFrom, filters.dateTo]);
	const rows = (0, import_react.useMemo)(() => {
		if (!partyName.trim()) return [];
		return getPartyStatement(dateRange, partyName.trim(), partyType);
	}, [dateRange, partyName]);
	const closingBalance = rows.length > 0 ? rows[rows.length - 1].balance : 0;
	const totalDebit = rows.reduce((s, r) => s + r.debit, 0);
	const totalCredit = rows.reduce((s, r) => s + r.credit, 0);
	const columns = [
		{
			key: "date",
			header: "Date",
			render: (r) => formatDate(r.date),
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
			key: "ref",
			header: "Reference",
			render: (r) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("code", {
				className: "text-[11px] font-mono bg-muted px-1 py-0.5 rounded",
				children: r.ref
			})
		},
		{
			key: "description",
			header: "Description",
			render: (r) => r.description
		},
		debitColumn((r) => r.debit),
		creditColumn((r) => r.credit),
		{
			key: "balance",
			header: "Balance",
			render: (r) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: cn("font-semibold", r.balance >= 0 ? "text-emerald-600" : "text-red-600"),
				children: formatCurrency(r.balance)
			}),
			className: "text-right",
			sortable: true,
			sortValue: (r) => r.balance
		}
	];
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(ReportLayout, {
		title: "Party Statement",
		subtitle: "Customer and supplier transaction history with balances",
		icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Users, { className: "size-5 text-primary" }),
		toolbar: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ReportToolbar, { onPrint: () => window.print() }),
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ReportFilterBar, {
				filters,
				setFilters,
				setPreset
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-center gap-3 flex-wrap",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center gap-1.5 rounded-lg border border-border p-0.5",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							onClick: () => setPartyType("customer"),
							className: cn("px-3 py-1.5 text-xs font-medium rounded-md transition-colors", partyType === "customer" ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground"),
							children: "Customer"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							onClick: () => setPartyType("supplier"),
							className: cn("px-3 py-1.5 text-xs font-medium rounded-md transition-colors", partyType === "supplier" ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground"),
							children: "Supplier"
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
						type: "text",
						value: partyName,
						onChange: (e) => setPartyName(e.target.value),
						placeholder: `Enter ${partyType} name...`,
						className: "h-9 px-3 rounded-lg border border-input bg-background text-xs outline-none focus:border-ring w-64"
					}),
					partyName && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
						className: "text-xs text-muted-foreground",
						children: [rows.length, " transactions"]
					})
				]
			}),
			partyName && rows.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SummaryCards, { cards: [
				{
					label: "Opening Balance",
					value: formatCurrency(0)
				},
				{
					label: "Total Debit",
					value: formatCurrency(totalDebit),
					positive: totalDebit > 0
				},
				{
					label: "Total Credit",
					value: formatCurrency(totalCredit),
					negative: totalCredit > 0
				},
				{
					label: "Closing Balance",
					value: formatCurrency(closingBalance),
					positive: closingBalance >= 0,
					negative: closingBalance < 0
				}
			] }),
			partyName ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ReportTable, {
				columns,
				data: rows,
				keyExtractor: (r) => `${r.ref}-${r.type}`,
				pageSize: 25,
				emptyMessage: "No transactions found for this party in the selected date range."
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "text-center py-16 text-sm text-muted-foreground",
				children: "Enter a customer or supplier name to view their statement."
			})
		]
	});
}
//#endregion
export { PartyReport as default };
