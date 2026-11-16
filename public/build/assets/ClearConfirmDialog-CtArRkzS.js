import { a as __toESM, n as require_react, t as require_jsx_runtime } from "./jsx-runtime-Do9val7F.js";
import { t as createLucideIcon } from "./createLucideIcon-CtLNniWl.js";
import { t as CircleCheck } from "./circle-check-DyG_hSe7.js";
import { t as Minus } from "./minus-DpdbhsLE.js";
import { t as RotateCcw } from "./rotate-ccw-DIzmnjQ5.js";
import { t as generatedPOSCustomers } from "./generator-DJb70F4o.js";
import { t as cn } from "./utils-Bim8RyS4.js";
import { t as Button } from "./button-CTa7sOGP.js";
import { Dt as Beaker, S as mockProducts, ct as X, dt as Trash2, gt as Search, it as formatCurrency, j as getPaymentDisplayState, vt as Plus, yt as Package } from "./app-C7AUNtSc.js";
import { a as DialogHeader, n as DialogContent, o as DialogTitle, t as Dialog } from "./dialog-ZltGVgcx.js";
/**
* @license lucide-react v1.26.0 - ISC
*
* This source code is licensed under the ISC license.
* See the LICENSE file in the root directory of this source tree.
*/
var Pause = createLucideIcon("pause", [["rect", {
	x: "14",
	y: "3",
	width: "5",
	height: "18",
	rx: "1",
	key: "kaeet6"
}], ["rect", {
	x: "5",
	y: "3",
	width: "5",
	height: "18",
	rx: "1",
	key: "1wsw3u"
}]]);
//#endregion
//#region resources/js/lib/product-adapter.ts
/**
* Calculate the cost for a specific selling unit.
* Spreads the purchase cost across base units, then multiplies by the
* selling unit's quantity.
*
* @example For a product with purchaseConfig: { cost: 750, quantity: 100 }
*          and a selling unit with quantity: 10
*          → costPerBaseUnit = 750 / 100 = 7.5
*          → sellingUnitCost = 7.5 * 10 = 75
*/
function calculateSellingUnitCost(product, sellingUnitId) {
	const su = product.sellingUnits.find((u) => u.id === sellingUnitId);
	if (!su) return 0;
	if (!product.purchaseConfig) return 0;
	return product.purchaseConfig.cost / product.purchaseConfig.quantity * su.quantity;
}
function calculateMargin(salePrice, cost) {
	const profit = salePrice - cost;
	return {
		profit,
		marginPercent: salePrice > 0 ? profit / salePrice * 100 : 0
	};
}
/**
* Get the default selling unit for a product.
* Returns the one marked isDefault, or the first one in the array.
*/
function getDefaultSellingUnit(product) {
	return product.sellingUnits.find((u) => u.isDefault) || product.sellingUnits[0];
}
//#endregion
//#region resources/js/data/pos.ts
var posCustomers = generatedPOSCustomers;
var COLORS = [
	"from-sky-500/20 to-sky-600/10",
	"from-violet-500/20 to-violet-600/10",
	"from-emerald-500/20 to-emerald-600/10",
	"from-amber-500/20 to-amber-600/10",
	"from-rose-500/20 to-rose-600/10",
	"from-cyan-500/20 to-cyan-600/10",
	"from-orange-500/20 to-orange-600/10",
	"from-pink-500/20 to-pink-600/10"
];
var posProducts = mockProducts.filter((p) => p.status !== "out-of-stock").map((p, i) => ({
	...p,
	_color: COLORS[i % COLORS.length]
}));
function filterPOSProducts(search, category) {
	let result = posProducts;
	if (search) {
		const q = search.toLowerCase();
		result = result.filter((p) => p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q) || p.barcode.includes(q));
	}
	if (category !== "all") result = result.filter((p) => p.category === category);
	return result;
}
//#endregion
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
function MobileCartList({ items, costLabel = "Cost", onUpdateQty, onRemove, onChangeUnit, onPriceChange, qtyStep = "1", onFormulaClick }) {
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
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex items-center gap-1.5 flex-wrap",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
											className: "text-sm font-semibold text-foreground leading-snug break-words",
											children: item.productName
										}), item.isConsumption && (onFormulaClick ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
											type: "button",
											onClick: () => onFormulaClick(item.id),
											title: "Review or change ingredient quantities per formula unit.",
											className: "text-[9px] font-semibold uppercase tracking-wide rounded-full bg-primary/10 text-primary px-1.5 py-0.5",
											children: "Formula · edit"
										}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											title: "This line consumes formula components. Component stock is checked by the server at checkout; the parent product is not deducted.",
											className: "text-[9px] font-semibold uppercase tracking-wide rounded-full bg-primary/10 text-primary px-1.5 py-0.5",
											children: "Formula"
										}))]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "text-[11px] text-muted-foreground mt-0.5",
										children: [item.packName || "Unit", item.baseUnitName && ` · ${item.baseUnitName}`]
									}),
									(item.formulaDetails?.length ?? 0) > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "mt-0.5 text-[10px] text-muted-foreground line-clamp-2",
										children: [item.formulaDetails.map((line) => `${line.name} ${line.actual_quantity}${line.unit}`).join(" · "), " per formula"]
									}),
									item.formulaCostPerFormulaUnit != null && (() => {
										const totalIngredientCost = item.formulaCostPerFormulaUnit * item.quantity;
										const profit = item.totalCost - totalIngredientCost;
										const margin = item.totalCost > 0 ? profit / item.totalCost * 100 : null;
										return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: `mt-0.5 text-[10px] tabular-nums ${profit < 0 ? "text-red-600 dark:text-red-400" : "text-muted-foreground"}`,
											children: [
												"Est. cost ",
												formatCurrency(totalIngredientCost),
												" · profit ",
												formatCurrency(profit),
												margin != null && ` · ${margin.toFixed(1)}%`
											]
										});
									})()
								]
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
//#region resources/js/features/transactions/search/SearchBar.tsx
function TransactionSearchBar({ search, onSearchChange, showResults, onShowResultsChange, results, onAddProduct, placeholder = "Search product by name or SKU..." }) {
	const inputRef = (0, import_react.useRef)(null);
	const [highlighted, setHighlighted] = (0, import_react.useState)(0);
	const handleKeyDown = (e) => {
		if (!showResults || results.length === 0) return;
		if (e.key === "ArrowDown") {
			e.preventDefault();
			setHighlighted((prev) => (prev + 1) % results.length);
			return;
		}
		if (e.key === "ArrowUp") {
			e.preventDefault();
			setHighlighted((prev) => (prev - 1 + results.length) % results.length);
			return;
		}
		if (e.key === "Enter") {
			e.preventDefault();
			if (results[highlighted]) {
				onAddProduct(results[highlighted]);
				setHighlighted(0);
			}
			return;
		}
		if (e.key === "Escape") {
			onSearchChange("");
			onShowResultsChange(false);
			setHighlighted(0);
		}
	};
	const handleChange = (value) => {
		onSearchChange(value);
		onShowResultsChange(!!value.trim());
		setHighlighted(0);
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "px-5 py-3 bg-card shrink-0 relative",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "relative",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Search, { className: "absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
					ref: inputRef,
					type: "text",
					value: search,
					onChange: (e) => handleChange(e.target.value),
					onFocus: () => {
						if (search.trim()) onShowResultsChange(true);
					},
					onBlur: () => {
						setTimeout(() => onShowResultsChange(false), 150);
					},
					onKeyDown: handleKeyDown,
					placeholder,
					className: "w-full h-10 pl-10 pr-4 rounded-lg border border-input bg-background text-sm outline-none focus:border-ring transition-colors"
				}),
				search && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					onClick: () => {
						onSearchChange("");
						onShowResultsChange(false);
						setHighlighted(0);
						inputRef.current?.focus();
					},
					className: "absolute right-2 top-1/2 -translate-y-1/2 flex items-center justify-center size-6 rounded-md hover:bg-muted text-muted-foreground",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { className: "size-3.5" })
				})
			]
		}), showResults && results.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "absolute left-5 right-5 top-full mt-1 z-50 rounded-xl border border-border bg-popover shadow-lg overflow-hidden",
			children: results.map((product, idx) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
				onMouseDown: (e) => {
					e.preventDefault();
					onAddProduct(product);
					setHighlighted(0);
				},
				onMouseEnter: () => setHighlighted(idx),
				className: cn("flex items-center gap-3 w-full px-3 py-2.5 text-left transition-colors", idx === highlighted ? "bg-muted" : "hover:bg-muted/50"),
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "flex items-center justify-center size-8 rounded-lg bg-muted text-muted-foreground shrink-0",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, { className: "size-4" })
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex-1 min-w-0",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center gap-1.5",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "truncate text-sm font-medium text-foreground",
								children: product.name
							}), product.hasConsumptionComposition && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "inline-flex shrink-0 items-center gap-0.5 rounded-full bg-primary/10 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wide text-primary",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Beaker, { className: "size-2.5" }), " Formula"]
							})]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "text-[11px] text-muted-foreground",
							children: [product.sku, product.sellingUnits?.[0] && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
								" ",
								"· ",
								product.sellingUnits[0].name,
								" ·",
								" ",
								formatCurrency(product.sellingUnits[0].salePrice ?? 0)
							] })]
						})]
					}),
					idx === highlighted && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("kbd", {
						className: "hidden sm:inline-flex items-center px-1 py-0.5 text-[9px] text-muted-foreground bg-muted rounded font-sans",
						children: "⏎"
					})
				]
			}, product.id))
		})]
	});
}
//#endregion
//#region resources/js/features/transactions/payment/PaymentPanel.tsx
var DEFAULT_METHODS = [
	{
		id: "cash",
		label: "Cash",
		color: "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20"
	},
	{
		id: "card",
		label: "Card",
		color: "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20"
	},
	{
		id: "transfer",
		label: "Transfer",
		color: "bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100 dark:bg-purple-500/10 dark:text-purple-400 dark:border-purple-500/20"
	},
	{
		id: "easypaisa",
		label: "Easypaisa",
		color: "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20"
	},
	{
		id: "jazzcash",
		label: "JazzCash",
		color: "bg-red-50 text-red-700 border-red-200 hover:bg-red-100 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20"
	}
];
function PaymentPanel({ paymentMethod, onMethodChange, amountPaid, onAmountChange, grandTotal, methods = DEFAULT_METHODS, cartEmpty, onHold, onClear, onRecord, holdLabel = "Hold", recordLabel = "Record Sale", showHold = true, onQuickPay }) {
	const displayState = getPaymentDisplayState(parseFloat(amountPaid) || 0, grandTotal);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "border-t border-border bg-card px-5 py-3 shrink-0",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex flex-col sm:flex-row sm:items-center gap-3",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "flex items-center gap-1.5",
					children: methods.map((m) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						onClick: () => onMethodChange(m.id),
						className: cn("px-3 py-1.5 rounded-lg text-xs font-medium border transition-all capitalize", paymentMethod === m.id ? `${m.color} shadow-sm` : "border-transparent text-muted-foreground hover:bg-muted hover:text-foreground"),
						children: m.label
					}, m.id))
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center gap-2",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-xs text-muted-foreground whitespace-nowrap",
							children: "Amount:"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center gap-1",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-xs text-muted-foreground",
								children: "Rs."
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								type: "number",
								value: amountPaid,
								onChange: (e) => onAmountChange(e.target.value),
								placeholder: String(grandTotal),
								className: "w-24 h-8 px-2 rounded-md border border-input bg-background text-sm font-semibold text-right outline-none focus:border-ring tabular-nums",
								min: "0"
							})]
						}),
						displayState.type === "change" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: "text-sm font-semibold text-emerald-600 dark:text-emerald-400 tabular-nums ml-2",
							children: ["Change: ", formatCurrency(displayState.amount)]
						}),
						displayState.type === "outstanding" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: "text-[11px] text-amber-600 dark:text-amber-400 ml-2 whitespace-nowrap",
							children: [formatCurrency(displayState.amount), " outstanding"]
						})
					]
				}),
				onQuickPay && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center gap-1",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							onClick: () => onQuickPay("full"),
							className: cn("px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors border", amountPaid === String(grandTotal) ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20" : "text-muted-foreground hover:text-foreground hover:bg-muted border-transparent"),
							children: "Full"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							onClick: () => onQuickPay("half"),
							className: cn("px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors border", amountPaid === String(Math.ceil(grandTotal / 2)) ? "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20" : "text-muted-foreground hover:text-foreground hover:bg-muted border-transparent"),
							children: "Half"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							onClick: () => onQuickPay("none"),
							className: cn("px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors border", amountPaid === "0" ? "bg-red-50 text-red-700 border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20" : "text-muted-foreground hover:text-foreground hover:bg-muted border-transparent"),
							children: "None"
						})
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center gap-2 sm:ml-auto",
					children: [
						showHold && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
							variant: "outline",
							size: "sm",
							className: "gap-1.5 h-9",
							disabled: cartEmpty,
							onClick: onHold,
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pause, { className: "size-3.5" }),
								" ",
								holdLabel
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
							variant: "outline",
							size: "sm",
							className: "gap-1.5 h-9",
							onClick: onClear,
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(RotateCcw, { className: "size-3.5" }), " Clear"]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
							size: "sm",
							className: "gap-1.5 h-9 shadow-sm",
							disabled: cartEmpty,
							onClick: onRecord,
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CircleCheck, { className: "size-3.5" }),
								" ",
								recordLabel,
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("kbd", {
									className: "hidden sm:inline-flex items-center ml-1.5 px-1 py-0 text-[9px] bg-primary-foreground/20 rounded",
									children: "⌘⏎"
								})
							]
						})
					]
				})
			]
		})
	});
}
//#endregion
//#region resources/js/features/transactions/dialogs/ClearConfirmDialog.tsx
function ConfirmClearDialog({ open, onOpenChange, itemCount, onConfirm }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Dialog, {
		open,
		onOpenChange,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogContent, {
			className: "sm:max-w-sm gap-0 p-0",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogHeader, {
				className: "p-5 pb-0",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTitle, {
					className: "text-base",
					children: "Clear Cart?"
				})
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "p-5 space-y-4",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "text-sm text-muted-foreground",
					children: [
						"Remove all ",
						itemCount,
						" item",
						itemCount > 1 ? "s" : "",
						"? This cannot be undone."
					]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						variant: "outline",
						className: "flex-1 h-10",
						onClick: () => onOpenChange(false),
						children: "Cancel"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
						variant: "destructive",
						className: "flex-1 h-10 gap-1.5",
						onClick: onConfirm,
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash2, { className: "size-4" }), " Clear All"]
					})]
				})]
			})]
		})
	});
}
//#endregion
export { MobileCartList as a, calculateMargin as c, MobilePaymentDrawer as i, calculateSellingUnitCost as l, PaymentPanel as n, filterPOSProducts as o, TransactionSearchBar as r, posCustomers as s, ConfirmClearDialog as t, getDefaultSellingUnit as u };
