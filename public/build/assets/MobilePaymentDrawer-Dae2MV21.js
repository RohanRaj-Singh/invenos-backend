import { i as __toESM, t as require_react } from "./react-DCO0ASPG.js";
import { t as Minus } from "./minus-jjDOQ6-9.js";
import { t as cn } from "./utils-Bim8RyS4.js";
import { t as require_jsx_runtime } from "./jsx-runtime-BjJQA5sn.js";
import { t as Button } from "./button-phKcTdak.js";
import { ct as X, dt as Trash2, st as formatCurrency, vt as Plus, yt as Package } from "./app-BJCY_l2M.js";
//#region resources/js/features/billing/MobileCartList.tsx
var import_react = /* @__PURE__ */ __toESM(require_react(), 1);
var import_jsx_runtime = require_jsx_runtime();
/** Inline quantity editor (tap-to-edit, supports custom values like 0.2 for kg) */
function EditableQty({ value, onSave }) {
	const [editing, setEditing] = (0, import_react.useState)(false);
	const [input, setInput] = (0, import_react.useState)(String(value));
	const ref = (0, import_react.useRef)(null);
	(0, import_react.useEffect)(() => {
		if (editing) ref.current?.focus();
	}, [editing]);
	(0, import_react.useEffect)(() => {
		if (!editing) setInput(String(value));
	}, [value, editing]);
	if (editing) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
		ref,
		type: "number",
		value: input,
		step: "any",
		onChange: (e) => setInput(e.target.value),
		onBlur: () => {
			const v = parseFloat(input);
			if (!isNaN(v) && v > 0) onSave(v);
			setEditing(false);
		},
		onKeyDown: (e) => {
			if (e.key === "Enter") {
				const v = parseFloat(input);
				if (!isNaN(v) && v > 0) onSave(v);
				setEditing(false);
			}
			if (e.key === "Escape") setEditing(false);
		},
		className: "w-14 h-8 text-center text-sm font-bold rounded-lg border border-primary bg-background outline-none tabular-nums",
		autoFocus: true
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
		onClick: () => {
			setEditing(true);
			setInput(String(value));
		},
		className: "w-12 h-8 flex items-center justify-center text-sm font-semibold tabular-nums hover:bg-muted/50 rounded-lg transition-colors border border-dashed border-transparent hover:border-border",
		children: value
	});
}
/** Inline price editor (tap-to-edit) */
function EditablePrice({ value, onSave, label }) {
	const [editing, setEditing] = (0, import_react.useState)(false);
	const [input, setInput] = (0, import_react.useState)(String(value));
	const ref = (0, import_react.useRef)(null);
	(0, import_react.useEffect)(() => {
		if (editing) ref.current?.focus();
	}, [editing]);
	(0, import_react.useEffect)(() => {
		if (!editing) setInput(String(value));
	}, [value, editing]);
	if (editing) return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex items-center gap-1",
		children: [label && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: "text-xs text-muted-foreground",
			children: label
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
			ref,
			type: "number",
			value: input,
			onChange: (e) => setInput(e.target.value),
			onBlur: () => {
				const v = parseFloat(input);
				if (!isNaN(v) && v > 0) onSave(v);
				setEditing(false);
			},
			onKeyDown: (e) => {
				if (e.key === "Enter") {
					const v = parseFloat(input);
					if (!isNaN(v) && v > 0) onSave(v);
					setEditing(false);
				}
				if (e.key === "Escape") setEditing(false);
			},
			className: "w-20 h-7 px-2 rounded border border-primary bg-background text-sm font-semibold text-right outline-none tabular-nums",
			autoFocus: true
		})]
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
		onClick: () => setEditing(true),
		className: "text-sm font-semibold tabular-nums hover:bg-muted/50 px-1.5 py-0.5 rounded transition-colors",
		children: formatCurrency(value)
	});
}
/**
* Card-based cart items for mobile (< 640px).
* Supports inline quantity stepper, unit selector, editable price, and delete.
*/
function MobileCartList({ items, costLabel = "Cost", onUpdateQty, onRemove, onChangeUnit, onPriceChange, qtyStep = "1" }) {
	if (items.length === 0) return null;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "space-y-3 pb-4",
		children: items.map((item, idx) => {
			const hasUnitOptions = item.sellingUnits && item.sellingUnits.length > 0;
			return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "rounded-xl border border-border bg-card overflow-hidden",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-start justify-between p-3 pb-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-start gap-2.5 min-w-0 flex-1",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "size-8 rounded-lg bg-muted flex items-center justify-center shrink-0 mt-0.5",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Package, { className: "size-4 text-muted-foreground" })
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "min-w-0 flex-1",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "text-sm font-semibold text-foreground leading-snug break-words",
									children: item.productName
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "text-[11px] text-muted-foreground mt-0.5",
									children: [item.packName || "Unit", item.baseUnitName && ` · ${item.baseUnitName}`]
								})]
							})]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							onClick: () => onRemove(item.id),
							className: "flex items-center justify-center size-7 rounded-lg hover:bg-red-50 text-muted-foreground hover:text-red-500 transition-colors shrink-0 ml-2",
							"aria-label": "Remove item",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash2, { className: "size-3.5" })
						})]
					}),
					hasUnitOptions && onChangeUnit && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "px-3 pb-2",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
							value: item.selectedUnitId || "",
							onChange: (e) => onChangeUnit(item.productId || item.id, e.target.value),
							className: "w-full h-9 px-3 rounded-lg border border-input bg-background text-xs outline-none focus:border-ring",
							children: [item.sellingUnits.map((su) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
								value: su.id,
								children: su.name
							}, su.id)), item.customUnits && item.customUnits.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("optgroup", {
								label: "Custom amount",
								children: item.customUnits.map((cu) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
									value: cu.id,
									children: cu.label
								}, cu.id))
							})]
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center justify-between px-3 pb-3",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center gap-1.5",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									onClick: () => onUpdateQty(item.id, -1),
									className: "flex items-center justify-center size-8 rounded-lg border border-input bg-background text-muted-foreground hover:text-foreground hover:border-ring transition-colors",
									"aria-label": "Decrease quantity",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Minus, { className: "size-3.5" })
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(EditableQty, {
									value: item.quantity,
									onSave: (v) => onUpdateQty(item.id, v - item.quantity)
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									onClick: () => onUpdateQty(item.id, 1),
									className: "flex items-center justify-center size-8 rounded-lg border border-input bg-background text-muted-foreground hover:text-foreground hover:border-ring transition-colors",
									"aria-label": "Increase quantity",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, { className: "size-3.5" })
								})
							]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "text-right",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "text-[10px] text-muted-foreground",
								children: costLabel
							}), onPriceChange ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EditablePrice, {
								value: item.unitCost,
								onSave: (v) => onPriceChange(item.productId || item.id, v)
							}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "text-sm font-semibold tabular-nums",
								children: formatCurrency(item.unitCost)
							})]
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center justify-between px-3 py-2.5 bg-muted/30 border-t border-border",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-xs text-muted-foreground font-medium",
							children: "Line Total"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-sm font-bold text-foreground tabular-nums",
							children: formatCurrency(item.totalCost)
						})]
					})
				]
			}, item.id);
		})
	});
}
//#endregion
//#region resources/js/features/billing/MobilePaymentDrawer.tsx
var METHOD_COLORS = {
	cash: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400",
	card: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-500/10 dark:text-blue-400",
	transfer: "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-500/10 dark:text-purple-400",
	easypaisa: "bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-500/10 dark:text-orange-400",
	jazzcash: "bg-green-50 text-green-700 border-green-200 dark:bg-green-500/10 dark:text-green-400"
};
/**
* Slide-up payment drawer for mobile (< 640px).
* Opens when user taps "Proceed to Payment".
*/
function MobilePaymentDrawer({ open, onClose, onConfirm, grandTotal, amountPaid, onAmountChange, paymentMethod, onMethodChange, paymentMethods, confirmLabel = "Confirm Sale", footer }) {
	const paid = parseFloat(amountPaid) || 0;
	const change = Math.max(0, paid - grandTotal);
	const outstanding = Math.max(0, grandTotal - paid);
	const canConfirm = paid > 0 || grandTotal === 0;
	if (!open) return null;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "fixed inset-0 z-50 bg-black/40",
		onClick: onClose
	}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: cn("fixed bottom-0 left-0 right-0 z-50 bg-background rounded-t-2xl shadow-2xl", "transition-transform duration-300 ease-out", "max-h-[85vh] overflow-y-auto"),
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex items-center justify-between sticky top-0 bg-background z-10 px-5 pt-3 pb-2 border-b border-border",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-center gap-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "w-8 h-1 rounded-full bg-muted-foreground/20 mx-auto shrink-0" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "text-sm font-semibold",
					children: "Payment"
				})]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				onClick: onClose,
				className: "flex items-center justify-center size-7 rounded-md hover:bg-muted transition-colors",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { className: "size-4" })
			})]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "p-5 space-y-4",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "text-center",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "text-xs text-muted-foreground",
						children: "Amount Due"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "text-2xl font-bold text-foreground tabular-nums",
						children: formatCurrency(grandTotal)
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
					className: "block text-xs font-medium text-muted-foreground mb-2",
					children: "Payment Method"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "grid grid-cols-3 gap-2",
					children: paymentMethods.map((pm) => {
						return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							onClick: () => onMethodChange(pm.value),
							className: cn("px-2 py-2.5 rounded-xl border text-xs font-medium transition-all text-center", paymentMethod === pm.value ? `${METHOD_COLORS[pm.value] || "bg-primary/10 text-primary border-primary"} ring-1 ring-inset` : "border-input text-muted-foreground hover:text-foreground hover:border-ring"),
							children: pm.label
						}, pm.value);
					})
				})] }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
					className: "block text-xs font-medium text-muted-foreground mb-1.5",
					children: "Amount Paid"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "relative",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground font-medium",
						children: "Rs."
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
						type: "number",
						value: amountPaid,
						onChange: (e) => onAmountChange(e.target.value),
						placeholder: "0",
						className: "w-full h-11 pl-9 pr-3 rounded-xl border border-input bg-background text-lg font-bold text-right outline-none focus:border-ring focus:ring-1 focus:ring-ring/30 tabular-nums",
						inputMode: "decimal"
					})]
				})] }),
				(change > 0 || outstanding > 0) && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: cn("rounded-xl px-4 py-3 text-sm flex items-center justify-between", change > 0 ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/10" : "bg-amber-50 text-amber-700 dark:bg-amber-500/10"),
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "font-medium",
						children: change > 0 ? "Change" : "Outstanding"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "font-bold tabular-nums",
						children: formatCurrency(change > 0 ? change : outstanding)
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					onClick: onConfirm,
					disabled: !canConfirm,
					className: "w-full h-12 text-base font-semibold shadow-sm rounded-xl",
					children: confirmLabel
				}),
				footer && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "flex gap-2",
					children: footer
				})
			]
		})]
	})] });
}
//#endregion
export { MobileCartList as n, MobilePaymentDrawer as t };
