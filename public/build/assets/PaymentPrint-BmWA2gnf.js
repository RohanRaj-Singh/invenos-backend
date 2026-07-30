import { a as formatDisplayDate, n as InvoiceFooter, o as BusinessHeader, r as InvoiceMeta, s as PrintLayout, t as DocumentActions } from "./DocumentActions-BXIaNbyR.js";
import { t as require_jsx_runtime } from "./jsx-runtime-BjJQA5sn.js";
import { Ot as usePage, rt as formatCurrency } from "./app-DxiW8KTt.js";
//#region resources/js/Pages/payments/PaymentPrint.tsx
var import_jsx_runtime = require_jsx_runtime();
var methodLabels = {
	cash: "Cash",
	easypaisa: "Easypaisa",
	jazzcash: "JazzCash",
	card: "Card",
	transfer: "Bank Transfer"
};
function PaymentPrintPage() {
	const { props } = usePage();
	const { payment, settings } = props;
	const biz = settings?.business || {};
	const receipt = settings?.receipt || {};
	const p = payment || {};
	if (!payment) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "p-8 text-center text-gray-500",
		children: "Payment not found."
	});
	const title = p.direction === "in" ? "PAYMENT RECEIPT" : "PAYMENT VOUCHER";
	const label = p.direction === "in" ? "Payment Received" : "Payment Sent";
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "bg-gray-100 pb-6",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DocumentActions, {
			title,
			invoiceNumber: p.reference,
			partyName: p.contact?.name || "—",
			total: p.amount || 0,
			outstanding: 0
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(PrintLayout, { children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(BusinessHeader, {
				business: biz,
				receipt,
				title
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-start justify-between mb-5",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-xs text-gray-400 uppercase tracking-wide mb-1",
					children: "Party"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-base font-bold text-gray-900",
					children: p.contact?.name || "—"
				})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "text-right space-y-1",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(InvoiceMeta, {
						label: "Reference",
						value: p.reference,
						highlight: true
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(InvoiceMeta, {
						label: "Date",
						value: formatDisplayDate(p.date)
					})]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "text-center py-6 mb-5 border-y border-gray-200",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-xs text-gray-400 uppercase tracking-wide mb-1",
						children: label
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-3xl font-bold text-gray-900",
						children: formatCurrency(p.amount)
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-sm text-gray-500 mt-1",
						children: methodLabels[p.method] || p.method
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "grid grid-cols-3 gap-4 mb-5",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-xs text-gray-400 uppercase tracking-wide",
						children: "Method"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-sm font-medium text-gray-900 mt-0.5",
						children: methodLabels[p.method] || p.method
					})] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-xs text-gray-400 uppercase tracking-wide",
						children: "Date"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-sm font-medium text-gray-900 mt-0.5",
						children: formatDisplayDate(p.date)
					})] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-xs text-gray-400 uppercase tracking-wide",
						children: "Recorded by"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-sm font-medium text-gray-900 mt-0.5",
						children: p.created_by || "—"
					})] })
				]
			}),
			p.description && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mb-5",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-xs text-gray-400 uppercase tracking-wide mb-1",
					children: "Note"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-sm text-gray-700 bg-gray-50 rounded px-3 py-2",
					children: p.description
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(InvoiceFooter, {
				notes: null,
				receipt
			})
		] })]
	});
}
//#endregion
export { PaymentPrintPage as default };
