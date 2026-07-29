import { a as InvoiceFooter, c as BusinessHeader, i as DocumentActions, l as PrintLayout, n as PaymentBadge, o as InvoiceTotals, r as formatDisplayDate, s as InvoiceItemsTable, t as InvoiceMeta } from "./InvoiceMeta-BhWHLCAS.js";
import { t as require_jsx_runtime } from "./jsx-runtime-BjJQA5sn.js";
import { Dt as usePage } from "./app-DGjxHKeP.js";
//#region resources/js/Pages/sales/SalePrint.tsx
var import_jsx_runtime = require_jsx_runtime();
function SalePrintPage() {
	const { props } = usePage();
	const { sale, settings } = props;
	const biz = settings?.business || {};
	const receipt = settings?.receipt || {};
	const s = sale || {};
	if (!sale) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "p-8 text-center text-gray-500",
		children: "Sale not found."
	});
	const items = (s.items || []).map((item, i) => ({
		sr: i + 1,
		name: item.product_name,
		unit: item.packaging_name || "Unit",
		quantity: item.base_quantity,
		unitPrice: item.unit_price,
		discount: item.discount_pct || 0,
		total: item.total || item.unit_price * item.base_quantity
	}));
	const customer = s.customer || {};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "bg-gray-100 pb-6",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DocumentActions, {
			title: receipt.sale_title || "SALE INVOICE",
			invoiceNumber: s.invoice_number,
			partyName: customer.name || s.customer_name,
			total: s.grand_total || 0,
			outstanding: s.outstanding_balance || 0
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(PrintLayout, { children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(BusinessHeader, {
				business: biz,
				receipt,
				title: receipt.sale_title || "SALE INVOICE"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-start justify-between mb-5",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
					receipt.show_party_name !== false && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-xs text-gray-400 uppercase tracking-wide mb-1",
						children: "Customer"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-base font-bold text-gray-900",
						children: customer.name || s.customer_name
					})] }),
					receipt.show_party_phone !== false && customer.phone && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-sm text-gray-600",
						children: customer.phone
					}),
					receipt.show_party_address !== false && customer.address && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-sm text-gray-600",
						children: customer.address
					})
				] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "text-right space-y-1",
					children: [
						receipt.show_invoice_number !== false && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(InvoiceMeta, {
							label: "Invoice",
							value: s.invoice_number,
							highlight: true
						}),
						receipt.show_date !== false && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(InvoiceMeta, {
							label: "Date",
							value: formatDisplayDate(s.date)
						}),
						receipt.show_payment_status !== false && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "flex items-center justify-end gap-2 mt-2",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PaymentBadge, { status: s.payment_status })
						})
					]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(InvoiceItemsTable, {
				items,
				receipt
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(InvoiceTotals, {
				subtotal: s.subtotal || 0,
				discount: s.discount || 0,
				grandTotal: s.grand_total || 0,
				amountPaid: s.amount_paid || 0,
				outstanding: s.outstanding_balance || 0,
				paymentStatus: s.payment_status || "unknown",
				receipt
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(InvoiceFooter, {
				notes: s.notes,
				receipt
			})
		] })]
	});
}
//#endregion
export { SalePrintPage as default };
