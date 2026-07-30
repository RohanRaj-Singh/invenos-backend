import { t as CircleCheck } from "./circle-check-DoVrqruV.js";
import { t as require_jsx_runtime } from "./jsx-runtime-BjJQA5sn.js";
import { t as Button } from "./button-phKcTdak.js";
import { a as DialogTitle, i as DialogHeader, n as DialogContent, r as DialogDescription, t as Dialog } from "./dialog-CsGPEqqr.js";
import { rt as formatCurrency } from "./app-CwPUaRAl.js";
//#region resources/js/features/transactions/dialogs/ConfirmDialog.tsx
var import_jsx_runtime = require_jsx_runtime();
function ConfirmTransactionDialog({ open, onOpenChange, itemCount, items, subtotal, discount = 0, grandTotal, amountPaid, partyName, showParty, paymentMethod, title = "Confirm Sale", actionLabel = "Confirm Sale", onConfirm }) {
	const paid = parseFloat(amountPaid) || grandTotal;
	const change = paid > grandTotal ? paid - grandTotal : 0;
	const outstanding = grandTotal - Math.min(paid, grandTotal);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Dialog, {
		open,
		onOpenChange,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogContent, {
			className: "sm:max-w-md gap-0 p-0",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogHeader, {
				className: "p-5 pb-0",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTitle, {
					className: "text-base",
					children: title
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogDescription, {
					className: "text-xs",
					children: [showParty && partyName && `Supplier: ${partyName}`, paymentMethod && ` · ${paymentMethod}`]
				})]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "p-5 space-y-3",
				children: [
					items && items.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "rounded-xl border border-border overflow-hidden",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
							className: "w-full",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
								className: "bg-muted/30",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
										className: "px-3 py-1.5 text-left text-[10px] font-semibold text-muted-foreground uppercase",
										children: "Item"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
										className: "px-3 py-1.5 text-center text-[10px] font-semibold text-muted-foreground uppercase w-12",
										children: "Qty"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
										className: "px-3 py-1.5 text-right text-[10px] font-semibold text-muted-foreground uppercase w-20",
										children: "Total"
									})
								]
							}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tbody", { children: items.map((item, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
								className: "border-t border-border",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("td", {
										className: "px-3 py-1.5 text-xs",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "font-medium text-foreground",
											children: item.name
										}), item.unitName && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
											className: "text-muted-foreground ml-1",
											children: ["· ", item.unitName]
										})]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
										className: "px-3 py-1.5 text-xs text-center tabular-nums",
										children: item.qty
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
										className: "px-3 py-1.5 text-xs text-right font-medium tabular-nums",
										children: formatCurrency(item.total)
									})
								]
							}, i)) })]
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "rounded-xl bg-muted/30 p-4 space-y-1.5 text-sm",
						children: [
							subtotal !== void 0 && discount > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex justify-between",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-muted-foreground",
									children: "Subtotal"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "font-medium",
									children: formatCurrency(subtotal)
								})]
							}),
							discount > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex justify-between",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-muted-foreground",
									children: "Discount"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
									className: "font-medium text-amber-600",
									children: ["-", formatCurrency(discount)]
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex justify-between",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-muted-foreground",
									children: "Grand Total"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "font-bold text-foreground",
									children: formatCurrency(grandTotal)
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex justify-between",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-muted-foreground",
									children: "Payment"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "font-semibold",
									children: formatCurrency(paid)
								})]
							}),
							outstanding > 0 && paid > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex justify-between text-amber-600",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "font-medium",
									children: "Outstanding"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "font-bold",
									children: formatCurrency(outstanding)
								})]
							}),
							change > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex justify-between pt-1 border-t border-emerald-200 text-emerald-600 dark:text-emerald-400",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "font-medium",
									children: "Change Due"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "font-bold",
									children: formatCurrency(change)
								})]
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							variant: "outline",
							className: "flex-1 h-10",
							onClick: () => onOpenChange(false),
							children: "Back"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
							className: "flex-1 h-10 gap-1.5 shadow-sm",
							onClick: () => {
								onOpenChange(false);
								onConfirm();
							},
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CircleCheck, { className: "size-4" }),
								" ",
								actionLabel
							]
						})]
					})
				]
			})]
		})
	});
}
//#endregion
export { ConfirmTransactionDialog as t };
