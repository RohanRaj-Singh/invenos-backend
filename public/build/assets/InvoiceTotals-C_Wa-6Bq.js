import { t as require_jsx_runtime } from "./jsx-runtime-BjJQA5sn.js";
import { rt as formatCurrency } from "./app-CwPUaRAl.js";
//#region resources/js/features/printing/components/InvoiceItemsTable.tsx
var import_jsx_runtime = require_jsx_runtime();
/** Items table with column visibility controlled by receipt toggles */
function InvoiceItemsTable({ items, receipt }) {
	if (items.length === 0) return null;
	const r = receipt || {};
	const showUnit = r.show_item_unit !== false;
	const showDisc = r.show_item_discount !== false;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
		className: "w-full border-collapse text-sm mb-2",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
			className: "border-b-2 border-gray-800",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
					className: "py-2 pr-1 text-left text-xs font-semibold uppercase text-gray-500 w-8",
					children: "#"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
					className: "py-2 pr-2 text-left text-xs font-semibold uppercase text-gray-500",
					style: { width: showDisc ? "34%" : "44%" },
					children: "Product"
				}),
				showUnit && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
					className: "py-2 pr-2 text-left text-xs font-semibold uppercase text-gray-500 w-14",
					children: "Unit"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
					className: "py-2 pr-2 text-right text-xs font-semibold uppercase text-gray-500 w-16",
					children: "Qty"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
					className: "py-2 pr-2 text-right text-xs font-semibold uppercase text-gray-500 w-20",
					children: "Price"
				}),
				showDisc && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
					className: "py-2 pr-2 text-right text-xs font-semibold uppercase text-gray-500 w-14",
					children: "Disc"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
					className: "py-2 text-right text-xs font-semibold uppercase text-gray-500 w-22",
					children: "Total"
				})
			]
		}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tbody", { children: items.map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
			className: "border-b border-gray-200",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
					className: "py-2 pr-1 text-gray-500 align-top",
					children: item.sr
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
					className: "py-2 pr-2 text-gray-900 align-top",
					style: { wordBreak: "break-word" },
					children: item.name
				}),
				showUnit && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
					className: "py-2 pr-2 text-gray-600 align-top",
					children: item.unit
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
					className: "py-2 pr-2 text-right text-gray-900 align-top tabular-nums",
					children: item.quantity
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
					className: "py-2 pr-2 text-right text-gray-900 align-top tabular-nums",
					children: formatCurrency(item.unitPrice)
				}),
				showDisc && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
					className: "py-2 pr-2 text-right text-gray-500 align-top tabular-nums",
					children: item.discount ? `${item.discount}%` : "—"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
					className: `py-2 text-right text-gray-900 font-semibold align-top tabular-nums ${showDisc ? "" : "w-24"}`,
					children: formatCurrency(item.total)
				})
			]
		}, item.sr)) })]
	});
}
//#endregion
//#region resources/js/features/printing/components/InvoiceTotals.tsx
/** Totals section — line visibility controlled by receipt toggles */
function InvoiceTotals({ subtotal, discount, grandTotal, amountPaid, outstanding, paymentStatus, paymentMethod, receipt }) {
	const r = receipt || {};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "mt-6",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("table", {
			className: "w-72 ml-auto border-collapse text-sm",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tbody", { children: [
				r.show_subtotal !== false && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
					className: "py-1 pr-4 text-gray-600 text-right",
					children: "Subtotal"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
					className: "py-1 text-right font-medium text-gray-900 w-28 tabular-nums",
					children: formatCurrency(subtotal)
				})] }),
				r.show_discount !== false && discount > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
					className: "py-1 pr-4 text-gray-600 text-right",
					children: "Discount"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("td", {
					className: "py-1 text-right font-medium text-red-600 tabular-nums",
					children: ["-", formatCurrency(discount)]
				})] }),
				r.show_grand_total !== false && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
					className: "border-t-2 border-gray-800",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
						className: "py-2 pr-4 text-gray-800 font-bold text-right",
						children: "Grand Total"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
						className: "py-2 text-right font-bold text-gray-900 tabular-nums",
						children: formatCurrency(grandTotal)
					})]
				}),
				r.show_paid !== false && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
					className: "py-1 pr-4 text-gray-600 text-right",
					children: "Paid"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
					className: "py-1 text-right font-medium text-gray-900 tabular-nums",
					children: formatCurrency(amountPaid)
				})] }),
				r.show_remaining !== false && outstanding > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
					className: "py-1 pr-4 text-gray-600 text-right",
					children: "Outstanding"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
					className: "py-1 text-right font-semibold text-amber-700 tabular-nums",
					children: formatCurrency(outstanding)
				})] }),
				(r.show_payment_status !== false || r.show_payment_method !== false) && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tr", {
					className: "border-t border-gray-300",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
						colSpan: 2,
						className: "py-1 text-right",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "space-x-2",
							children: [r.show_payment_status !== false && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-xs font-medium text-gray-600 capitalize",
								children: paymentStatus
							}), r.show_payment_method !== false && paymentMethod && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "text-xs text-gray-400",
								children: ["via ", paymentMethod]
							})]
						})
					})
				})
			] })
		})
	});
}
//#endregion
export { InvoiceItemsTable as n, InvoiceTotals as t };
