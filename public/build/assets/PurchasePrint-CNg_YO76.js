import { a as InvoiceFooter, c as BusinessHeader, i as DocumentActions, l as PrintLayout, n as PaymentBadge, o as InvoiceTotals, r as formatDisplayDate, s as InvoiceItemsTable, t as InvoiceMeta } from "./InvoiceMeta-CxU15R1r.js";
import { t as require_jsx_runtime } from "./jsx-runtime-BjJQA5sn.js";
import { Dt as usePage } from "./app-fzdHvqQg.js";
//#region resources/js/Pages/purchases/PurchasePrint.tsx
var import_jsx_runtime = require_jsx_runtime();
function PurchasePrintPage() {
	const { props } = usePage();
	const { purchase, settings } = props;
	const biz = settings?.business || {};
	const receipt = settings?.receipt || {};
	const p = purchase || {};
	if (!purchase) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "p-8 text-center text-gray-500",
		children: "Purchase not found."
	});
	const items = (p.items || []).map((item, i) => ({
		sr: i + 1,
		name: item.product_name,
		unit: item.base_unit_name || item.purchase_pack_name || "Unit",
		quantity: item.purchase_pack_qty * item.purchase_quantity,
		unitPrice: item.unit_cost,
		discount: item.discount_pct || 0,
		total: item.total_cost || item.unit_cost * item.purchase_quantity
	}));
	const supplier = p.supplier || {};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "bg-gray-100 pb-6",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DocumentActions, {
			title: receipt.purchase_title || "PURCHASE BILL",
			invoiceNumber: p.invoice_ref,
			partyName: supplier.name || p.supplier_name,
			total: p.total_amount || 0,
			outstanding: p.outstanding_balance || 0
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(PrintLayout, { children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(BusinessHeader, {
				business: biz,
				receipt,
				title: receipt.purchase_title || "PURCHASE BILL"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-start justify-between mb-5",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
					receipt.show_party_name !== false && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-xs text-gray-400 uppercase tracking-wide mb-1",
						children: "Supplier"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-base font-bold text-gray-900",
						children: supplier.name || p.supplier_name
					})] }),
					receipt.show_party_phone !== false && supplier.phone && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-sm text-gray-600",
						children: supplier.phone
					}),
					receipt.show_party_address !== false && supplier.address && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-sm text-gray-600",
						children: supplier.address
					})
				] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "text-right space-y-1",
					children: [
						receipt.show_invoice_number !== false && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(InvoiceMeta, {
							label: "Invoice",
							value: p.invoice_ref,
							highlight: true
						}),
						receipt.show_date !== false && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(InvoiceMeta, {
							label: "Date",
							value: formatDisplayDate(p.date)
						}),
						receipt.show_payment_status !== false && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "flex items-center justify-end gap-2 mt-2",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PaymentBadge, { status: p.payment_status })
						})
					]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(InvoiceItemsTable, {
				items,
				receipt
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(InvoiceTotals, {
				subtotal: p.subtotal || 0,
				discount: p.discount || 0,
				grandTotal: p.total_amount || 0,
				amountPaid: p.amount_paid || 0,
				outstanding: p.outstanding_balance || 0,
				paymentStatus: p.payment_status || "unknown",
				receipt
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(InvoiceFooter, {
				notes: p.notes,
				receipt
			})
		] })]
	});
}
//#endregion
export { PurchasePrintPage as default };
