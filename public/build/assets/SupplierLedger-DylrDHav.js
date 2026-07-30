import { i as __toESM, t as require_react } from "./react-DCO0ASPG.js";
import { t as Building2 } from "./building-2-DGTQudO_.js";
import { t as ReportToolbar } from "./ReportToolbar-Bz_3cMrv.js";
import { t as cn } from "./utils-Bim8RyS4.js";
import { t as require_jsx_runtime } from "./jsx-runtime-BjJQA5sn.js";
import { Ot as usePage, it as formatDate, rt as formatCurrency } from "./app-DxiW8KTt.js";
import { t as ReportLayout } from "./ReportLayout-647vA4sZ.js";
import { t as ReportTable } from "./ReportTable-DnYaxygU.js";
//#region resources/js/Pages/reports/SupplierLedger.tsx
var import_react = /* @__PURE__ */ __toESM(require_react(), 1);
var import_jsx_runtime = require_jsx_runtime();
function SupplierLedgerPage() {
	const { props } = usePage();
	const report = props.report || {
		contact: null,
		rows: []
	};
	const contact = report.contact;
	const rows = report.rows || [];
	const closingBalance = rows.length > 0 ? rows[rows.length - 1].balance : 0;
	const totals = (0, import_react.useMemo)(() => {
		return {
			totalDebit: rows.reduce((s, r) => s + r.debit, 0),
			totalCredit: rows.reduce((s, r) => s + r.credit, 0)
		};
	}, [rows]);
	const columns = [
		{
			key: "date",
			header: "Date",
			render: (r) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "text-xs font-medium",
				children: formatDate(r.date)
			}),
			sortable: true
		},
		{
			key: "type",
			header: "Type",
			render: (r) => {
				return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: `inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-semibold ${{
						"Purchase": "text-red-600 bg-red-50 dark:bg-red-950/30",
						"Purchase Return": "text-emerald-600 bg-emerald-50 dark:bg-emerald-950/30",
						"Payment": "text-blue-600 bg-blue-50 dark:bg-blue-950/30"
					}[r.type] || "text-muted-foreground bg-muted/50"}`,
					children: r.type
				});
			}
		},
		{
			key: "ref",
			header: "Ref",
			render: (r) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("code", {
				className: "text-[10px] font-mono bg-muted px-1 py-0.5 rounded",
				children: r.ref
			})
		},
		{
			key: "description",
			header: "Description",
			render: (r) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "text-xs text-muted-foreground",
				children: r.description
			})
		},
		{
			key: "debit",
			header: "Debit",
			render: (r) => r.debit > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "text-sm font-semibold text-red-500 tabular-nums",
				children: formatCurrency(r.debit)
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "text-xs text-muted-foreground",
				children: "—"
			}),
			className: "text-right"
		},
		{
			key: "credit",
			header: "Credit",
			render: (r) => r.credit > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "text-sm font-semibold text-emerald-600 tabular-nums",
				children: formatCurrency(r.credit)
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "text-xs text-muted-foreground",
				children: "—"
			}),
			className: "text-right"
		},
		{
			key: "balance",
			header: "Balance",
			render: (r) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: cn("text-sm font-bold tabular-nums", r.balance > 0 ? "text-red-500" : "text-emerald-600"),
				children: formatCurrency(Math.abs(r.balance))
			}),
			className: "text-right",
			sortable: true,
			sortValue: (r) => r.balance
		}
	];
	if (!contact) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ReportLayout, {
		title: "Supplier Ledger",
		subtitle: "Select a supplier to view their financial statement",
		icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Building2, { className: "size-5 text-primary" }),
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "text-center py-24 text-sm text-muted-foreground",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Building2, { className: "size-12 mx-auto mb-3 text-muted-foreground/20" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "No supplier selected. Navigate from a supplier profile or use the contact filter." })]
		})
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(ReportLayout, {
		title: contact.name,
		subtitle: `Phone: ${contact.phone || "—"} · Supplier Ledger — All financial activity`,
		icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Building2, { className: "size-5 text-primary" }),
		toolbar: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ReportToolbar, { onPrint: () => window.print() }),
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "grid grid-cols-2 sm:grid-cols-4 gap-3",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "rounded-xl border border-border bg-card p-3.5",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "text-[10px] text-muted-foreground font-medium uppercase tracking-wider",
						children: "Opening Balance"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "text-lg font-bold text-foreground mt-1 tabular-nums",
						children: "Rs. 0"
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "rounded-xl border border-border bg-card p-3.5",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "text-[10px] text-muted-foreground font-medium uppercase tracking-wider",
						children: "Total Purchases"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "text-lg font-bold text-red-500 mt-1 tabular-nums",
						children: formatCurrency(totals.totalDebit)
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "rounded-xl border border-border bg-card p-3.5",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "text-[10px] text-muted-foreground font-medium uppercase tracking-wider",
						children: "Total Payments"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "text-lg font-bold text-emerald-600 mt-1 tabular-nums",
						children: formatCurrency(totals.totalCredit)
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "rounded-xl border border-border bg-card p-3.5",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "text-[10px] text-muted-foreground font-medium uppercase tracking-wider",
						children: "Closing Balance"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: cn("text-lg font-bold mt-1 tabular-nums", closingBalance > 0 ? "text-red-500" : "text-emerald-600"),
						children: [formatCurrency(Math.abs(closingBalance)), closingBalance > 0 ? " (Payable)" : closingBalance < 0 ? " (Credit)" : ""]
					})]
				})
			]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ReportTable, {
			columns,
			data: rows,
			keyExtractor: (r) => `${r.date}-${r.ref}`,
			pageSize: 30,
			searchable: true,
			searchPlaceholder: "Search by reference or description...",
			onSearch: (data, q) => data.filter((r) => r.ref.toLowerCase().includes(q) || r.description.toLowerCase().includes(q) || r.type.toLowerCase().includes(q)),
			emptyMessage: "No transactions found for this supplier in the selected period."
		})]
	});
}
//#endregion
export { SupplierLedgerPage as default };
