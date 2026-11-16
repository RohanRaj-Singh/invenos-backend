import { a as __toESM, n as require_react, t as require_jsx_runtime } from "./jsx-runtime-Do9val7F.js";
import { t as Check } from "./check-DoNZKe9-.js";
import { t as ExternalLink } from "./external-link-BryfxJn_.js";
import { t as FileText } from "./file-text-Bw298uxf.js";
import { t as LoaderCircle } from "./loader-circle-Bu7VuNI1.js";
import { t as Minus } from "./minus-DpdbhsLE.js";
import { a as MobileCartList, i as MobilePaymentDrawer, n as PaymentPanel, r as TransactionSearchBar, s as posCustomers, t as ConfirmClearDialog, u as getDefaultSellingUnit } from "./ClearConfirmDialog-C7-Ys02U.js";
import { t as Phone } from "./phone-C8zODZ-7.js";
import { t as Printer } from "./printer-rYmPOR_Q.js";
import { t as RefreshCw } from "./refresh-cw-7s4UNAPj.js";
import { t as RotateCcw } from "./rotate-ccw-DIzmnjQ5.js";
import { t as Share2 } from "./share-2-DJXgCYVf.js";
import { t as TriangleAlert } from "./triangle-alert-Djqi0JrF.js";
import { t as User } from "./user-W2WLOAYi.js";
import { i as getUnit, t as convert } from "./units-DupAfCnK.js";
import { t as cn } from "./utils-Bim8RyS4.js";
import { t as Button } from "./button-CTa7sOGP.js";
import { F as computeLineGrossTotal, I as computeLineTotal, L as computeSubtotal, M as computeCartDiscount, Mt as usePage, N as computeGrandTotal, P as computeLineDiscount, St as FlaskConical, Tt as ChevronDown, _t as Receipt, bt as LogOut, ct as X, dt as Trash2, gt as Search, it as formatCurrency, jt as router3, kt as toast, vt as Plus } from "./app-ByfccPpi.js";
import { t as Badge } from "./badge-CFYtyx5n.js";
import { a as DialogHeader, i as DialogFooter, n as DialogContent, o as DialogTitle, r as DialogDescription, t as Dialog } from "./dialog-Z1wM3Uxg.js";
import { i as fetchActiveComposition } from "./api-Dhvx-JzJ.js";
import EditableQuantity from "./EditableQuantity-BqdF_65Z.js";
import { t as ConfirmTransactionDialog } from "./ConfirmDialog-pA2gDF-D.js";
//#region resources/js/domain/products/pricing.ts
var import_react = /* @__PURE__ */ __toESM(require_react(), 1);
function computePricePerBaseUnit(defaultPrice, baseUnitQuantity) {
	if (baseUnitQuantity <= 0) return 0;
	return defaultPrice / baseUnitQuantity;
}
function computeCustomUnitPrice(pricePerBase, factor) {
	const raw = pricePerBase * factor;
	return Math.round(raw * 1e4) / 1e4;
}
//#endregion
//#region resources/js/domain/products/unit-stepping.ts
var SMALL_UNIT_IDS = /* @__PURE__ */ new Set([
	"__custom_gram",
	"__custom_ml",
	"__custom_cm"
]);
function getIncrementForUnit(unitId) {
	if (SMALL_UNIT_IDS.has(unitId)) return 10;
	if (unitId.startsWith("__custom_")) return .1;
	return 1;
}
function getStepForUnit(unitId) {
	return getIncrementForUnit(unitId) < 1 ? "0.1" : "1";
}
//#endregion
//#region resources/js/features/pos/components/CustomerSelect.tsx
var import_jsx_runtime = require_jsx_runtime();
var WALK_IN = {
	id: "cust-0",
	name: "Walk-in Customer",
	phone: ""
};
function CustomerSelect({ value, onChange }) {
	const [open, setOpen] = (0, import_react.useState)(false);
	const [search, setSearch] = (0, import_react.useState)("");
	const [showAdd, setShowAdd] = (0, import_react.useState)(false);
	const [newName, setNewName] = (0, import_react.useState)("");
	const [newPhone, setNewPhone] = (0, import_react.useState)("");
	const filtered = posCustomers.filter((c) => c.name.toLowerCase().includes(search.toLowerCase()) || c.phone.includes(search));
	const handleAddCustomer = () => {
		if (!newName.trim()) return;
		onChange({
			id: `cust-${Date.now()}`,
			name: newName.trim(),
			phone: newPhone.trim()
		});
		setNewName("");
		setNewPhone("");
		setShowAdd(false);
		setOpen(false);
	};
	const isWalkIn = value.id === "cust-0";
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "relative",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
			onClick: () => setOpen(!open),
			className: "flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(User, { className: "size-3.5" }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "max-w-[100px] truncate",
					children: isWalkIn ? "Walk-in" : value.name
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronDown, { className: "size-3" })
			]
		}), open && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "fixed inset-0 z-40",
			onClick: () => setOpen(false)
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "absolute right-0 top-full mt-1 z-50 w-64 rounded-xl border border-border bg-popover shadow-lg overflow-hidden",
			children: showAdd ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "p-3 space-y-2",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center justify-between",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-xs font-semibold text-foreground",
							children: "New Customer"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							onClick: () => setShowAdd(false),
							className: "flex items-center justify-center size-6 rounded-md hover:bg-muted",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { className: "size-3" })
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
						type: "text",
						placeholder: "Name",
						value: newName,
						onChange: (e) => setNewName(e.target.value),
						className: "w-full h-8 px-2.5 rounded-lg bg-muted text-xs outline-none",
						autoFocus: true
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
						type: "text",
						placeholder: "Phone (optional)",
						value: newPhone,
						onChange: (e) => setNewPhone(e.target.value),
						className: "w-full h-8 px-2.5 rounded-lg bg-muted text-xs outline-none"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						onClick: handleAddCustomer,
						disabled: !newName.trim(),
						className: "w-full py-1.5 rounded-lg bg-primary text-primary-foreground text-xs font-medium disabled:opacity-50",
						children: "Add & Select"
					})
				]
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
				!isWalkIn && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
					onClick: () => {
						onChange(WALK_IN);
						setOpen(false);
					},
					className: "flex items-center gap-2 w-full px-3 py-2.5 text-left border-b border-border hover:bg-muted transition-colors",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "flex items-center justify-center size-7 rounded-full bg-muted text-muted-foreground",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LogOut, { className: "size-3.5" })
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "text-xs font-medium text-foreground",
						children: "Walk-in Customer"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "text-[10px] text-muted-foreground",
						children: "Reset to anonymous sale"
					})] })]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "p-2",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "relative",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Search, { className: "absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							type: "text",
							placeholder: "Search customers...",
							value: search,
							onChange: (e) => setSearch(e.target.value),
							className: "w-full h-8 pl-8 pr-3 rounded-lg bg-muted text-xs outline-none",
							autoFocus: true
						})]
					})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "max-h-40 overflow-y-auto",
					children: [filtered.map((customer) => {
						const isSelected = customer.id === value.id;
						return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							onClick: () => {
								onChange(customer);
								setOpen(false);
								setSearch("");
							},
							className: cn("flex items-center gap-3 w-full px-3 py-2 text-left transition-colors", isSelected ? "bg-primary/10 text-foreground" : "hover:bg-muted text-foreground"),
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: cn("flex items-center justify-center size-7 rounded-full shrink-0", isSelected ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"),
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(User, { className: "size-3.5" })
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex-1 min-w-0",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "text-xs font-medium truncate",
										children: customer.name
									}), customer.phone && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex items-center gap-1 text-[10px] text-muted-foreground",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Phone, { className: "size-2.5" }), customer.phone]
									})]
								}),
								isSelected && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Check, { className: "size-3.5 text-primary shrink-0" })
							]
						}, customer.id);
					}), filtered.length === 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "px-3 py-4 text-xs text-muted-foreground text-center",
						children: "No customers found"
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "border-t border-border p-1",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						onClick: () => {
							setShowAdd(true);
							setSearch("");
						},
						className: "flex items-center gap-2 w-full px-3 py-2 rounded-lg text-xs text-muted-foreground hover:text-foreground hover:bg-muted transition-colors",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, { className: "size-3.5" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Add new customer" })]
					})
				})
			] })
		})] })]
	});
}
//#endregion
//#region resources/js/features/pos/components/ReceiptDialog.tsx
function ReceiptDialog({ open, saleData, onClose, onNewSale }) {
	if (!saleData) return null;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Dialog, {
		open,
		onOpenChange: (v) => {
			if (!v) onClose();
		},
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogContent, {
			className: "sm:max-w-md gap-0 p-0 max-h-[90vh] overflow-y-auto",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "bg-gradient-to-r from-emerald-500/10 to-emerald-400/5 p-6 text-center border-b border-border",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "inline-flex items-center justify-center size-14 rounded-full bg-emerald-50 dark:bg-emerald-500/10 mb-3 ring-4 ring-emerald-500/10",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Receipt, { className: "size-7 text-emerald-600 dark:text-emerald-400" })
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "text-lg font-bold text-foreground",
						children: "Sale Successful"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "text-xs text-muted-foreground mt-1",
						children: saleData.invoiceNumber
					})
				]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "p-5 space-y-4",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "rounded-xl bg-muted/30 p-4 space-y-3",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-center justify-between text-sm",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-muted-foreground",
									children: "Customer"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "font-medium text-foreground",
									children: saleData.customer.name
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "border-t border-border pt-2 space-y-1.5",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "text-xs font-medium text-muted-foreground uppercase tracking-wider",
									children: "Items"
								}), saleData.items.map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex items-center justify-between text-sm",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
										className: "text-muted-foreground truncate max-w-[60%]",
										children: [
											item.name,
											" ×",
											item.packagingQuantity
										]
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "font-medium text-foreground",
										children: formatCurrency(item.total)
									})]
								}, item.id || item.productId))]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "border-t border-border pt-2 space-y-1",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex justify-between text-sm",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "text-muted-foreground",
											children: "Subtotal"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "font-medium",
											children: formatCurrency(saleData.subtotal)
										})]
									}),
									saleData.discount > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex justify-between text-sm",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "text-muted-foreground",
											children: "Discount"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
											className: "font-medium text-red-500",
											children: ["-", formatCurrency(saleData.discount)]
										})]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex justify-between text-sm font-semibold pt-1 border-t border-border",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "text-foreground",
											children: "Grand Total"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "text-foreground",
											children: formatCurrency(saleData.grandTotal)
										})]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex justify-between text-sm",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "text-muted-foreground",
											children: "Payment Method"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
											variant: "outline",
											className: "text-[10px] px-2 py-0 h-5 font-medium capitalize",
											children: saleData.method
										})]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex justify-between text-sm",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "text-muted-foreground",
											children: "Amount Paid"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: cn("font-semibold", saleData.amountPaid >= saleData.grandTotal ? "text-emerald-600" : "text-amber-600"),
											children: formatCurrency(saleData.amountPaid)
										})]
									}),
									saleData.outstanding > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex justify-between text-sm",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "text-muted-foreground",
											children: "Outstanding"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "font-semibold text-amber-600",
											children: formatCurrency(saleData.outstanding)
										})]
									})
								]
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "grid grid-cols-2 gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
							variant: "outline",
							className: "gap-1.5 h-10",
							onClick: () => toast.success("Receipt sent to printer (prototype)"),
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Printer, { className: "size-4" }), " Print Receipt"]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
							variant: "outline",
							className: "gap-1.5 h-10",
							onClick: () => toast.success("Receipt link copied (prototype)"),
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Share2, { className: "size-4" }), " Share Receipt"]
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "grid grid-cols-2 gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
							variant: "outline",
							className: "gap-1.5 h-10",
							onClick: () => {
								onClose();
								router3.visit(`/sales/${saleData.saleId}`);
							},
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ExternalLink, { className: "size-4" }), " View Sale"]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
							className: "gap-1.5 h-10 shadow-sm",
							onClick: onNewSale,
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(RefreshCw, { className: "size-4" }), " New Sale"]
						})]
					})
				]
			})]
		})
	});
}
//#endregion
//#region resources/js/features/transactions/cart/CartSummary.tsx
function TransactionSummary({ subtotal, discount, discountInput, grandTotal, onDiscountChange, onDiscountInputChange, onDiscountPctChange }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "flex justify-end mt-4",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "w-72 space-y-2",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center justify-between text-sm",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "text-muted-foreground",
						children: "Subtotal"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "font-semibold text-foreground",
						children: formatCurrency(subtotal)
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center justify-between text-sm gap-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "text-muted-foreground shrink-0",
						children: "Discount"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center gap-1",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-[10px] text-muted-foreground",
								children: "Rs."
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								type: "number",
								value: discount || "",
								onChange: (e) => {
									onDiscountChange(parseFloat(e.target.value) || 0);
									onDiscountInputChange("");
								},
								placeholder: "0",
								className: "w-20 h-8 px-2 rounded-md border border-input bg-background text-sm text-right outline-none focus:border-ring tabular-nums",
								min: "0"
							})]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center gap-1",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-[10px] text-muted-foreground",
								children: "%"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								type: "number",
								value: discountInput,
								onChange: (e) => {
									const p = parseFloat(e.target.value) || 0;
									onDiscountInputChange(e.target.value);
									onDiscountPctChange(computeCartDiscount(subtotal, p));
								},
								placeholder: "0",
								className: "w-16 h-8 px-2 rounded-md border border-input bg-background text-sm text-right outline-none focus:border-ring tabular-nums",
								min: "0",
								max: "100"
							})]
						})]
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center justify-between pt-2 border-t border-border",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "text-base font-bold text-foreground",
						children: "Grand Total"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "text-lg font-bold text-foreground tabular-nums",
						children: formatCurrency(grandTotal)
					})]
				})
			]
		})
	});
}
//#endregion
//#region resources/js/features/composition/FormulaCustomizationDialog.tsx
function FormulaCustomizationDialog({ open, product, initial, onClose, onConfirm }) {
	const [rows, setRows] = (0, import_react.useState)([]);
	const [compositionId, setCompositionId] = (0, import_react.useState)(initial?.compositionId ?? null);
	const [version, setVersion] = (0, import_react.useState)(initial?.version ?? 0);
	const [loading, setLoading] = (0, import_react.useState)(false);
	const [error, setError] = (0, import_react.useState)(null);
	const [formulaName, setFormulaName] = (0, import_react.useState)(product.name);
	const load = (0, import_react.useCallback)(async () => {
		setLoading(true);
		setError(null);
		try {
			const composition = await fetchActiveComposition(product.id, "consumption");
			if (!composition || composition.items.length === 0) {
				setRows([]);
				setError("This product has no active formula. Add ingredients on the product page first.");
				return;
			}
			setCompositionId(composition.id);
			setVersion(composition.version);
			setFormulaName(composition.name || product.name);
			const previous = new Map((initial?.overrides ?? []).map((override) => [override.composition_item_id, override.quantity]));
			setRows(composition.items.map((item) => {
				const unit = item.display_unit_id || item.component?.base_unit_id || "piece";
				const defaultQuantity = Number(item.display_quantity || item.quantity_base || 0);
				const prior = previous.get(item.id);
				return {
					compositionItemId: item.id,
					componentProductId: item.component_product_id ?? null,
					name: item.component?.name || `Ingredient #${item.component_product_id}`,
					unit,
					defaultQuantity,
					actual: String(prior ?? defaultQuantity),
					optional: item.is_optional,
					availableStock: item.display_stock_quantity ?? item.component?.stock_quantity ?? null,
					allowsNegativeStock: Boolean(item.component?.allows_negative_stock)
				};
			}));
		} catch {
			setError("Could not load the formula. Check the connection and try again.");
		} finally {
			setLoading(false);
		}
	}, [
		product.id,
		product.name,
		initial?.overrides
	]);
	(0, import_react.useEffect)(() => {
		if (open) load();
	}, [open, load]);
	const totalLines = (0, import_react.useMemo)(() => rows.filter((row) => Number(row.actual) > 0).length, [rows]);
	function restoreDefaults() {
		setRows((current) => current.map((row) => ({
			...row,
			actual: String(row.defaultQuantity)
		})));
		setError(null);
	}
	function confirm() {
		if (!compositionId) {
			setError("No active formula is available.");
			return;
		}
		if (rows.length === 0) {
			setError("This formula has no ingredients.");
			return;
		}
		const overrides = [];
		const details = [];
		for (const row of rows) {
			const quantity = Number(row.actual);
			if (!Number.isFinite(quantity) || quantity <= 0) {
				setError(`Enter a quantity greater than zero for ${row.name}.`);
				return;
			}
			overrides.push({
				composition_item_id: row.compositionItemId,
				quantity: Number(quantity.toFixed(6)),
				unit_id: row.unit
			});
			details.push({
				composition_item_id: row.compositionItemId,
				name: row.name,
				unit: row.unit,
				default_quantity: row.defaultQuantity,
				actual_quantity: Number(quantity.toFixed(6)),
				optional: row.optional,
				available_stock: row.availableStock,
				allows_negative_stock: row.allowsNegativeStock
			});
		}
		onConfirm({
			compositionId,
			version,
			overrides,
			optionalItemIds: rows.filter((row) => row.optional).map((row) => row.compositionItemId),
			details
		});
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Dialog, {
		open,
		onOpenChange: (next) => {
			if (!next) onClose();
		},
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogContent, {
			className: "sm:max-w-lg gap-0 p-0 max-h-[90vh] flex flex-col",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogHeader, {
					className: "p-5 pb-3 shrink-0",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogTitle, {
						className: "flex items-center gap-2",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FlaskConical, { className: "size-4 text-primary" }),
							" Customize ",
							formulaName
						]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogDescription, { children: "Ingredient identities come from the saved formula. Adjust the quantity per formula; the saved template is never changed." })]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "flex-1 overflow-y-auto px-5 pb-4 space-y-3",
					children: loading ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center justify-center gap-2 py-12 text-sm text-muted-foreground",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "size-4 animate-spin" }), " Loading formula..."]
					}) : error ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "rounded-lg border border-amber-200 bg-amber-50/70 p-3 text-xs text-amber-800",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-start gap-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TriangleAlert, { className: "mt-0.5 size-4 shrink-0" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: error })]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							type: "button",
							variant: "outline",
							size: "sm",
							className: "mt-2",
							onClick: () => void load(),
							children: "Retry"
						})]
					}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center justify-between gap-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "text-xs text-muted-foreground",
								children: [
									totalLines,
									" of ",
									rows.length,
									" ingredients have a quantity."
								]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
								type: "button",
								variant: "ghost",
								size: "sm",
								onClick: restoreDefaults,
								className: "gap-1.5",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(RotateCcw, { className: "size-3.5" }), " Restore defaults"]
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "overflow-hidden rounded-xl border border-border",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "grid grid-cols-12 gap-2 border-b border-border bg-muted/40 px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "col-span-5",
										children: "Ingredient"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "col-span-2 text-right",
										children: "Default"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "col-span-3 text-right",
										children: "Per formula"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "col-span-2 text-right",
										children: "Unit"
									})
								]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "divide-y divide-border",
								children: rows.map((row) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "grid grid-cols-12 items-center gap-2 px-3 py-2",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "col-span-5 min-w-0",
											children: [
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
													className: "truncate text-xs font-medium",
													children: row.name
												}),
												row.optional && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
													className: "text-[10px] text-muted-foreground",
													children: "Optional in template"
												}),
												row.availableStock !== null && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
													className: cn("text-[10px] tabular-nums", row.availableStock <= 0 ? "text-amber-600 dark:text-amber-400" : "text-muted-foreground"),
													children: [
														Number(row.availableStock.toFixed(6)).toLocaleString(),
														" ",
														row.unit,
														" in stock"
													]
												})
											]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
											className: "col-span-2 text-right text-xs tabular-nums text-muted-foreground",
											children: Number(row.defaultQuantity.toFixed(6)).toLocaleString()
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
											className: "col-span-3",
											children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
												type: "number",
												min: "0.000001",
												step: "0.000001",
												value: row.actual,
												onChange: (event) => {
													const value = event.target.value;
													setRows((current) => current.map((entry) => entry.compositionItemId === row.compositionItemId ? {
														...entry,
														actual: value
													} : entry));
													setError(null);
												},
												className: "h-8 w-full rounded-lg border border-input bg-background px-2 text-right text-xs tabular-nums outline-none focus:border-ring",
												"aria-label": `${row.name} quantity per formula`
											})
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
											className: "col-span-2 text-right text-xs text-muted-foreground",
											children: row.unit
										})
									]
								}, row.compositionItemId))
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-[10px] leading-relaxed text-muted-foreground",
							children: "Quantities are per formula. Selling 5 formulas consumes 5× these amounts. Ingredient stock is checked by the server at checkout; this dialog does not reserve stock."
						})
					] })
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogFooter, {
					className: "border-t border-border p-4",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						type: "button",
						variant: "outline",
						onClick: onClose,
						children: "Cancel"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						type: "button",
						onClick: confirm,
						disabled: loading || rows.length === 0,
						children: "Use this formula"
					})]
				})
			]
		})
	});
}
//#endregion
//#region resources/js/Pages/pos/SaleBill.tsx
var CART_KEY = "invenos-pos-cart";
var DISCOUNT_KEY = "invenos-pos-discount";
var CUSTOMER_KEY = "invenos-pos-customer";
var HELD_KEY = "invenos-pos-held";
function saveCartState(cart, discount, customer) {
	try {
		sessionStorage.setItem(CART_KEY, JSON.stringify(cart));
		sessionStorage.setItem(DISCOUNT_KEY, String(discount));
		sessionStorage.setItem(CUSTOMER_KEY, JSON.stringify(customer));
	} catch {}
}
function loadCartState() {
	try {
		const cartRaw = sessionStorage.getItem(CART_KEY);
		const discountRaw = sessionStorage.getItem(DISCOUNT_KEY);
		const customerRaw = sessionStorage.getItem(CUSTOMER_KEY);
		if (!cartRaw) return null;
		return {
			cart: JSON.parse(cartRaw),
			discount: discountRaw ? parseFloat(discountRaw) : 0,
			customer: customerRaw ? JSON.parse(customerRaw) : null
		};
	} catch {
		return null;
	}
}
function clearCartState() {
	sessionStorage.removeItem(CART_KEY);
	sessionStorage.removeItem(DISCOUNT_KEY);
	sessionStorage.removeItem(CUSTOMER_KEY);
}
function getHeldSales() {
	try {
		return JSON.parse(sessionStorage.getItem(HELD_KEY) || "[]");
	} catch {
		return [];
	}
}
function holdSaleItem(sale) {
	const held = getHeldSales();
	held.push(sale);
	try {
		sessionStorage.setItem(HELD_KEY, JSON.stringify(held));
	} catch {}
}
var DEFAULT_CUSTOMER = {
	id: "cust-0",
	name: "Walk-in Customer",
	phone: ""
};
function SaleBillPage() {
	const { props: inertiaProps } = usePage();
	const posProducts = (inertiaProps.products || []).filter((p) => !p.archived_at).map((p) => ({
		...p,
		id: p.id,
		sellingUnits: (p.selling_units || []).map((u) => ({
			...u,
			id: String(u.id),
			salePrice: u.sale_price || 0,
			isDefault: u.is_default || false,
			unitId: String(u.unit_id || ""),
			purchaseCost: u.purchase_cost ?? null
		})),
		stockQuantity: p.stock_quantity || 0,
		lowStockThreshold: p.low_stock_threshold || 10,
		baseUnitId: String(p.base_unit_id || ""),
		hasConsumptionComposition: Boolean(p.has_consumption_composition),
		consumptionCompositionVersion: p.consumption_composition_version ?? null,
		purchaseConfig: p.purchase_units?.[0] ? {
			name: p.purchase_units[0].name || "Pack",
			cost: p.purchase_units[0].cost || 0,
			quantity: p.purchase_units[0].quantity || 1
		} : void 0
	}));
	inertiaProps.customers;
	function filterPOSProducts(query) {
		if (!query.trim()) return [];
		const q = query.toLowerCase();
		return posProducts.filter((p) => p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q) || String(p.barcode || "").toLowerCase().includes(q)).slice(0, 8);
	}
	const [cart, setCart] = (0, import_react.useState)([]);
	const [formulaProduct, setFormulaProduct] = (0, import_react.useState)(null);
	const [formulaInitial, setFormulaInitial] = (0, import_react.useState)(null);
	const [customer, setCustomer] = (0, import_react.useState)(DEFAULT_CUSTOMER);
	const [discount, setDiscount] = (0, import_react.useState)(0);
	const [discountInput, setDiscountInput] = (0, import_react.useState)("");
	const [search, setSearch] = (0, import_react.useState)("");
	const [showResults, setShowResults] = (0, import_react.useState)(false);
	const [paymentMethod, setPaymentMethod] = (0, import_react.useState)("cash");
	const [amountPaid, setAmountPaid] = (0, import_react.useState)("");
	const [showReceipt, setShowReceipt] = (0, import_react.useState)(false);
	const [receiptData, setReceiptData] = (0, import_react.useState)(null);
	const [showConfirm, setShowConfirm] = (0, import_react.useState)(false);
	const [showMobilePayment, setShowMobilePayment] = (0, import_react.useState)(false);
	const [showClearConfirm, setShowClearConfirm] = (0, import_react.useState)(false);
	const [showLowStockWarning, setShowLowStockWarning] = (0, import_react.useState)(false);
	const [lowStockItems, setLowStockItems] = (0, import_react.useState)("");
	const [confirmingSale, setConfirmingSale] = (0, import_react.useState)(false);
	const [priceOverrides, setPriceOverrides] = (0, import_react.useState)({});
	const [discountPcts, setDiscountPcts] = (0, import_react.useState)({});
	const [editingPrice, setEditingPrice] = (0, import_react.useState)(null);
	const [editingDisc, setEditingDisc] = (0, import_react.useState)(null);
	const [editValue, setEditValue] = (0, import_react.useState)("");
	const editInputRef = (0, import_react.useRef)(null);
	const restoredRef = (0, import_react.useRef)(false);
	const searchInputRef = (0, import_react.useRef)(null);
	(0, import_react.useRef)(null);
	const idempotencyKeyRef = (0, import_react.useRef)(null);
	(0, import_react.useEffect)(() => {
		if (restoredRef.current) return;
		restoredRef.current = true;
		const saved = loadCartState();
		if (saved && saved.cart.length > 0) {
			setCart(saved.cart);
			setDiscount(saved.discount);
			if (saved.customer) setCustomer(saved.customer);
		}
	}, []);
	(0, import_react.useEffect)(() => {
		saveCartState(cart, discount, customer);
	}, [
		cart,
		discount,
		customer
	]);
	(0, import_react.useEffect)(() => {
		if (cart.length === 0) return;
		const handler = (e) => {
			e.preventDefault();
			e.returnValue = "";
		};
		window.addEventListener("beforeunload", handler);
		return () => window.removeEventListener("beforeunload", handler);
	}, [cart.length]);
	(0, import_react.useEffect)(() => {
		if (editingPrice || editingDisc) editInputRef.current?.focus();
	}, [editingPrice, editingDisc]);
	(0, import_react.useEffect)(() => {
		const handler = (e) => {
			if ((e.ctrlKey || e.metaKey) && e.key === "Enter" && cart.length > 0) {
				e.preventDefault();
				setShowConfirm(true);
			}
		};
		window.addEventListener("keydown", handler);
		return () => window.removeEventListener("keydown", handler);
	}, [cart.length]);
	const computedCart = (0, import_react.useMemo)(() => cart.map((item) => {
		const price = priceOverrides[item.productId] ?? item.unitPrice;
		const pctDiscount = discountPcts[item.productId] || 0;
		const grossTotal = computeLineGrossTotal(item.packagingQuantity, price);
		const flatDiscount = computeLineDiscount(grossTotal, pctDiscount);
		return {
			...item,
			unitPrice: price,
			total: computeLineTotal(grossTotal, flatDiscount),
			grossTotal
		};
	}), [
		cart,
		priceOverrides,
		discountPcts
	]);
	const subtotal = (0, import_react.useMemo)(() => computeSubtotal(computedCart.map((i) => i.total)), [computedCart]);
	const grandTotal = (0, import_react.useMemo)(() => computeGrandTotal(subtotal, discount), [subtotal, discount]);
	const sessionCount = (0, import_react.useMemo)(() => posProducts.length + 1, [posProducts]);
	const searchResults = (0, import_react.useMemo)(() => {
		if (!search.trim()) return [];
		return filterPOSProducts(search).slice(0, 8);
	}, [search]);
	const addToCart = (0, import_react.useCallback)((product) => {
		const defaultSU = getDefaultSellingUnit(product);
		if (!defaultSU) return;
		setCart((prev) => {
			if (prev.find((c) => c.productId === product.id)) return prev.map((c) => c.productId === product.id ? {
				...c,
				packagingQuantity: c.packagingQuantity + 1,
				baseQuantity: (c.packagingQuantity + 1) * defaultSU.quantity,
				total: (c.packagingQuantity + 1) * c.unitPrice
			} : c);
			return [...prev, {
				id: `ci-${Date.now()}`,
				productId: product.id,
				name: product.name,
				sellingUnitId: defaultSU.id,
				packagingName: defaultSU.name,
				packagingQuantity: 1,
				baseUnitQuantity: defaultSU.quantity,
				baseQuantity: defaultSU.quantity,
				unitPrice: defaultSU.salePrice,
				total: defaultSU.salePrice,
				category: product.category,
				hasConsumptionComposition: Boolean(product.hasConsumptionComposition)
			}];
		});
		setSearch("");
		setShowResults(false);
		searchInputRef.current?.focus();
	}, []);
	const openFormulaCustomization = (0, import_react.useCallback)((product, existing) => {
		setFormulaProduct(product);
		setFormulaInitial(existing ? {
			compositionId: existing.formulaCompositionId,
			version: existing.formulaVersion,
			overrides: existing.formulaOverrides,
			optionalItemIds: existing.formulaOptionalItemIds,
			details: existing.formulaDetails
		} : null);
		setShowResults(false);
	}, []);
	const handleSelectProduct = (0, import_react.useCallback)((product) => {
		const fullProduct = posProducts.find((p) => String(p.id) === String(product.id)) ?? product;
		if (fullProduct.hasConsumptionComposition) {
			openFormulaCustomization(fullProduct);
			return;
		}
		addToCart(fullProduct);
	}, [
		posProducts,
		openFormulaCustomization,
		addToCart
	]);
	const confirmFormulaCustomization = (0, import_react.useCallback)((customization) => {
		const product = formulaProduct;
		if (!product) return;
		const defaultSU = getDefaultSellingUnit(product);
		if (!defaultSU) {
			toast.error("This formula has no selling unit.");
			return;
		}
		const formulaFields = {
			hasConsumptionComposition: true,
			formulaCompositionId: customization.compositionId,
			formulaVersion: customization.version,
			formulaOverrides: customization.overrides,
			formulaOptionalItemIds: customization.optionalItemIds,
			formulaDetails: customization.details
		};
		setCart((prev) => {
			if (prev.find((item) => item.productId === product.id)) return prev.map((item) => item.productId === product.id ? {
				...item,
				...formulaFields
			} : item);
			return [...prev, {
				id: `ci-${Date.now()}`,
				productId: product.id,
				name: product.name,
				sellingUnitId: defaultSU.id,
				packagingName: defaultSU.name,
				packagingQuantity: 1,
				baseUnitQuantity: defaultSU.quantity,
				baseQuantity: defaultSU.quantity,
				unitPrice: defaultSU.salePrice,
				total: defaultSU.salePrice,
				category: product.category,
				...formulaFields
			}];
		});
		setFormulaProduct(null);
		setFormulaInitial(null);
		setSearch("");
		setShowResults(false);
		searchInputRef.current?.focus();
	}, [formulaProduct]);
	const updateQuantity = (0, import_react.useCallback)((productId, delta) => {
		setCart((prev) => prev.map((c) => {
			if (c.productId !== productId) return c;
			const n = c.packagingQuantity + delta;
			if (n <= 0) return null;
			return {
				...c,
				packagingQuantity: n,
				baseQuantity: n * c.baseUnitQuantity,
				total: n * c.unitPrice
			};
		}).filter(Boolean));
	}, []);
	const getSellingUnits = (0, import_react.useCallback)((productId) => {
		return posProducts.find((p) => p.id === productId)?.sellingUnits ?? [];
	}, []);
	const getCustomUnitOptions = (0, import_react.useCallback)((productId) => {
		const product = posProducts.find((p) => p.id === productId);
		if (!product) return [];
		const unit = getUnit(product.baseUnitId);
		if (!unit) return [];
		const bu = product.baseUnitId;
		const opts = [];
		if (unit.measurementType === "weight") {
			if (convert(1, "g", bu) !== null) opts.push({
				id: "__custom_gram",
				label: "Gram (g)",
				factor: convert(1, "g", bu) ?? 1
			});
			if (convert(1, "kg", bu) !== null) opts.push({
				id: "__custom_kg",
				label: "Kilogram (kg)",
				factor: convert(1, "kg", bu) ?? 1e3
			});
		}
		if (unit.measurementType === "volume") {
			if (convert(1, "ml", bu) !== null) opts.push({
				id: "__custom_ml",
				label: "Millilitre (ml)",
				factor: convert(1, "ml", bu) ?? 1
			});
			if (convert(1, "liter", bu) !== null) opts.push({
				id: "__custom_liter",
				label: "Litre (L)",
				factor: convert(1, "liter", bu) ?? 1e3
			});
		}
		if (unit.measurementType === "length") {
			if (convert(1, "cm", bu) !== null) opts.push({
				id: "__custom_cm",
				label: "Per cm",
				factor: convert(1, "cm", bu) ?? .01
			});
			if (convert(1, "meter", bu) !== null) opts.push({
				id: "__custom_meter",
				label: "Per Meter",
				factor: convert(1, "meter", bu) ?? 100
			});
		}
		return opts;
	}, []);
	const handleChangeUnit = (0, import_react.useCallback)((productId, sellingUnitId) => {
		const product = posProducts.find((p) => p.id === productId);
		if (!product) return;
		if (sellingUnitId.startsWith("__custom_")) {
			const opt = getCustomUnitOptions(productId).find((o) => o.id === sellingUnitId);
			if (!opt) return;
			const defaultSU = getDefaultSellingUnit(product);
			const unitPrice = computeCustomUnitPrice(defaultSU ? computePricePerBaseUnit(defaultSU.salePrice, defaultSU.quantity) : 0, opt.factor);
			setCart((prev) => prev.map((c) => c.productId !== productId ? c : {
				...c,
				sellingUnitId,
				packagingName: opt.label,
				baseUnitQuantity: opt.factor,
				baseQuantity: c.packagingQuantity * opt.factor,
				unitPrice,
				total: c.packagingQuantity * unitPrice
			}));
			setPriceOverrides((prev) => {
				const r = { ...prev };
				delete r[productId];
				return r;
			});
			return;
		}
		const su = product.sellingUnits.find((s) => s.id === sellingUnitId);
		if (!su) return;
		setCart((prev) => prev.map((c) => c.productId !== productId ? c : {
			...c,
			sellingUnitId: su.id,
			packagingName: su.name,
			baseUnitQuantity: su.quantity,
			baseQuantity: c.packagingQuantity * su.quantity,
			unitPrice: su.salePrice,
			total: c.packagingQuantity * su.salePrice
		}));
		setPriceOverrides((prev) => {
			const r = { ...prev };
			delete r[productId];
			return r;
		});
	}, [getCustomUnitOptions]);
	const handleRemoveItem = (0, import_react.useCallback)((productId) => {
		const item = cart.find((c) => c.productId === productId);
		setCart((prev) => prev.filter((c) => c.productId !== productId));
		setPriceOverrides((prev) => {
			const r = { ...prev };
			delete r[productId];
			return r;
		});
		setDiscountPcts((prev) => {
			const r = { ...prev };
			delete r[productId];
			return r;
		});
		if (item) toast(`${item.name} removed`, {
			action: {
				label: "Undo",
				onClick: () => setCart((prev) => {
					const idx = cart.findIndex((c) => c.productId === productId);
					const copy = [...prev];
					if (idx >= 0 && idx <= copy.length) copy.splice(idx, 0, item);
					else copy.push(item);
					return copy;
				})
			},
			duration: 4e3
		});
	}, [cart]);
	const startEditPrice = (0, import_react.useCallback)((productId, currentPrice) => {
		setEditingDisc(null);
		setEditingPrice(productId);
		setEditValue(String(priceOverrides[productId] ?? currentPrice));
	}, [priceOverrides]);
	const commitPrice = (0, import_react.useCallback)(() => {
		if (editingPrice) {
			const val = parseFloat(editValue);
			if (!isNaN(val) && val > 0) setPriceOverrides((prev) => ({
				...prev,
				[editingPrice]: val
			}));
		}
		setEditingPrice(null);
		setEditValue("");
	}, [editingPrice, editValue]);
	const startEditDisc = (0, import_react.useCallback)((productId) => {
		setEditingPrice(null);
		setEditingDisc(productId);
		setEditValue(String(discountPcts[productId] ?? ""));
	}, [discountPcts]);
	const commitDisc = (0, import_react.useCallback)(() => {
		if (editingDisc) {
			const val = parseFloat(editValue);
			if (!isNaN(val) && val >= 0 && val <= 100) setDiscountPcts((prev) => ({
				...prev,
				[editingDisc]: val
			}));
			else if (editValue === "" || editValue === "0") setDiscountPcts((prev) => {
				const r = { ...prev };
				delete r[editingDisc];
				return r;
			});
		}
		setEditingDisc(null);
		setEditValue("");
	}, [editingDisc, editValue]);
	const handleEditKeyDown = (e) => {
		if (e.key === "Enter") {
			if (editingPrice) commitPrice();
			else if (editingDisc) commitDisc();
		}
		if (e.key === "Escape") {
			setEditingPrice(null);
			setEditingDisc(null);
			setEditValue("");
		}
	};
	const handleQuickPay = (0, import_react.useCallback)((type) => {
		if (type === "full") setAmountPaid(String(grandTotal));
		else if (type === "half") setAmountPaid(String(Math.ceil(grandTotal / 2)));
		else setAmountPaid("0");
	}, [grandTotal]);
	const resetSale = (0, import_react.useCallback)(() => {
		setCart([]);
		setDiscount(0);
		setDiscountInput("");
		setCustomer(DEFAULT_CUSTOMER);
		setPriceOverrides({});
		setDiscountPcts({});
		setAmountPaid("");
		idempotencyKeyRef.current = null;
		clearCartState();
		setTimeout(() => searchInputRef.current?.focus(), 100);
	}, []);
	const handleHoldSale = (0, import_react.useCallback)(() => {
		if (cart.length === 0) return;
		holdSaleItem({
			id: `held-${Date.now()}`,
			customer,
			items: [...cart],
			discount,
			subtotal,
			grandTotal,
			heldAt: (/* @__PURE__ */ new Date()).toLocaleString()
		});
		resetSale();
		toast.success("Sale held — you can resume it from POS");
	}, [
		cart,
		customer,
		discount,
		subtotal,
		grandTotal,
		resetSale
	]);
	const handleRecordSale = (0, import_react.useCallback)(() => {
		if (cart.length === 0) return;
		const lowStock = cart.filter((item) => {
			const product = posProducts.find((p) => String(p.id) === String(item.productId));
			if (product?.hasConsumptionComposition) return false;
			if (product?.track_inventory === false) return false;
			const baseQty = item.packagingQuantity * item.baseUnitQuantity;
			return (product?.stockQuantity ?? 0) < baseQty;
		});
		const shortIngredients = cart.flatMap((item) => {
			const details = item.formulaDetails ?? [];
			const units = item.packagingQuantity || 1;
			return details.filter((line) => line.allows_negative_stock).map((line) => {
				const available = line.available_stock;
				if (available === null || available === void 0) return null;
				const required = line.actual_quantity * units;
				if (available >= required) return null;
				return `${line.name}: ${Number(required.toFixed(6)).toLocaleString()} ${line.unit} required, ${Number(available.toFixed(6)).toLocaleString()} in stock`;
			}).filter((message) => message !== null);
		});
		const messages = [...lowStock.map((item) => {
			const product = posProducts.find((p) => String(p.id) === String(item.productId));
			return `${item.name}: ${item.packagingQuantity} ${item.packagingName} requested, ${product?.stockQuantity ?? 0} in stock`;
		}), ...shortIngredients];
		if (messages.length > 0) {
			setLowStockItems(messages.join("\n"));
			setShowLowStockWarning(true);
			return;
		}
		doSubmitSale(false);
	}, [
		cart,
		posProducts,
		doSubmitSale
	]);
	function doSubmitSale(bypassStockCheck) {
		const today = (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
		const paid = parseFloat(amountPaid) || grandTotal;
		const paymentStatus = paid >= grandTotal ? "paid" : paid > 0 ? "partial" : "unpaid";
		const idempotencyKey = idempotencyKeyRef.current ?? (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function" ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`);
		idempotencyKeyRef.current = idempotencyKey;
		router3.post("/sales", {
			idempotency_key: idempotencyKey,
			items: computedCart.map((i) => ({
				product_id: i.productId,
				quantity: i.packagingQuantity,
				packaging_quantity: i.packagingQuantity,
				packaging_name: i.packagingName,
				selling_unit_id: i.sellingUnitId ? Number(i.sellingUnitId) : null,
				base_unit_quantity: i.baseUnitQuantity,
				unit_price: i.unitPrice,
				total: i.total,
				formula_composition_id: i.formulaCompositionId ?? null,
				formula_overrides: i.formulaOverrides ?? [],
				formula_optional_item_ids: i.formulaOptionalItemIds ?? []
			})),
			customer_id: customer.id === "cust-0" ? null : customer.id,
			discount,
			amount_paid: paid,
			payment_method: paymentMethod,
			payment_status: paymentStatus,
			source: "pos",
			date: today,
			bypass_stock_check: bypassStockCheck
		}, {
			onSuccess: () => {
				setReceiptData({
					saleId: `sale-${Date.now()}`,
					customer,
					method: paymentMethod,
					paymentStatus,
					invoiceNumber: `INV-${Date.now()}`,
					items: cart,
					subtotal,
					discount,
					grandTotal,
					amountPaid: paid,
					outstanding: paid >= grandTotal ? 0 : grandTotal - paid
				});
				setShowReceipt(true);
				resetSale();
			},
			onError: (errs) => {
				const first = Object.values(errs)[0];
				toast.error(String(first || "Sale failed"));
			}
		});
	}
	const handleNewSale = (0, import_react.useCallback)(() => {
		setShowReceipt(false);
		setReceiptData(null);
		resetSale();
	}, [resetSale]);
	const getQuantityIncrement = (0, import_react.useCallback)((productId) => {
		const item = cart.find((c) => c.productId === productId);
		if (!item?.sellingUnitId) return 1;
		return getIncrementForUnit(item.sellingUnitId);
	}, [cart]);
	const getQuantityStep = (0, import_react.useCallback)((productId) => {
		const item = cart.find((c) => c.productId === productId);
		if (!item?.sellingUnitId) return "1";
		return getStepForUnit(item.sellingUnitId);
	}, [cart]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "h-full flex flex-col overflow-hidden",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "px-5 py-3 border-b border-border bg-card shrink-0",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center justify-between",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center gap-3",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "flex items-center justify-center size-10 rounded-xl bg-primary/10 text-primary",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(FileText, { className: "size-5" })
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center gap-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
								className: "text-lg font-bold text-foreground leading-tight",
								children: "Create Sale"
							}), cart.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "inline-flex items-center px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-semibold",
								children: [
									cart.length,
									" item",
									cart.length > 1 ? "s" : ""
								]
							})]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "text-[11px] text-muted-foreground",
							children: [
								(/* @__PURE__ */ new Date()).toLocaleDateString("en-PK", {
									weekday: "short",
									day: "numeric",
									month: "short",
									year: "numeric"
								}),
								" ",
								"·",
								" ",
								(/* @__PURE__ */ new Date()).toLocaleTimeString("en-PK", {
									hour: "2-digit",
									minute: "2-digit"
								})
							]
						})] })]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center gap-3",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: "text-xs text-muted-foreground",
							children: ["Session #", sessionCount]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CustomerSelect, {
							value: customer,
							onChange: setCustomer
						})]
					})]
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TransactionSearchBar, {
				search,
				onSearchChange: setSearch,
				showResults,
				onShowResultsChange: setShowResults,
				results: searchResults,
				onAddProduct: handleSelectProduct,
				placeholder: "Search product by name, SKU, or barcode... (Enter to add)"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "hidden sm:flex sm:flex-col sm:flex-1 sm:min-h-0",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex-1 overflow-y-auto px-5 py-4",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "rounded-xl border border-border overflow-hidden",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
							className: "w-full",
							style: { tableLayout: "fixed" },
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
								className: "border-b border-border bg-muted/40",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Th, {
										className: "w-8",
										children: "#"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Th, {
										className: "w-[32%]",
										children: "Product"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Th, {
										className: "w-24",
										children: "Unit"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Th, {
										className: "w-20 text-center",
										children: "Qty"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Th, {
										className: "w-24 text-right",
										children: "Price"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Th, {
										className: "w-20 text-right",
										children: "Disc%"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Th, {
										className: "w-24 text-right",
										children: "Total"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Th, { className: "w-8" })
								]
							}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tbody", { children: cart.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tr", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("td", {
								colSpan: 8,
								className: "text-center py-16 text-sm text-muted-foreground",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FileText, { className: "size-10 text-muted-foreground/20 mx-auto mb-3" }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "font-medium text-foreground",
										children: "No items yet"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "text-xs mt-1",
										children: "Search for a product above to add it to the bill"
									})
								]
							}) }) : cart.map((item, idx) => {
								const product = posProducts.find((p) => p.id === item.productId);
								const sellingUnits = getSellingUnits(item.productId);
								const customOpts = getCustomUnitOptions(item.productId);
								const pct = discountPcts[item.productId];
								const computedItem = computedCart.find((c) => c.productId === item.productId) ?? item;
								const isEditingPrice = editingPrice === item.productId;
								const isEditingDisc = editingDisc === item.productId;
								const qtyIncrement = getQuantityIncrement(item.productId);
								const qtyStep = getQuantityStep(item.productId);
								return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
									className: "border-b border-border hover:bg-muted/20 transition-colors",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Td, {
											className: "w-10 text-center text-xs text-muted-foreground",
											children: idx + 1
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Td, {
											className: "min-w-0",
											children: [
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
													className: "text-sm font-medium text-foreground truncate",
													children: item.name
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
													className: "flex items-center gap-1.5",
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
														className: "text-[10px] text-muted-foreground",
														children: product?.sku
													}), (item.hasConsumptionComposition || product?.hasConsumptionComposition) && product && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
														type: "button",
														onClick: () => openFormulaCustomization(product, item),
														title: "Review or change ingredient quantities per formula unit. Component stock is checked by the server at checkout.",
														className: "text-[9px] font-semibold uppercase tracking-wide rounded-full bg-primary/10 text-primary px-1.5 py-0.5 hover:bg-primary/20",
														children: "Formula · edit"
													})]
												}),
												(item.formulaDetails?.length ?? 0) > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
													className: "mt-0.5 truncate text-[9px] text-muted-foreground",
													children: [
														item.formulaDetails.map((line) => `${line.name} ${line.actual_quantity}${line.unit}`).join(" · "),
														" per formula",
														item.packagingQuantity > 1 && ` · ${item.packagingQuantity} formulas`
													]
												})
											]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Td, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
											value: item.sellingUnitId || "",
											onChange: (e) => handleChangeUnit(item.productId, e.target.value),
											className: "w-full h-8 px-2 rounded-md border border-input bg-background text-xs outline-none focus:border-ring",
											children: [sellingUnits.map((su) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
												value: su.id,
												children: su.name
											}, su.id)), customOpts.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("optgroup", {
												label: "Custom amount",
												children: customOpts.map((opt) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
													value: opt.id,
													children: opt.label
												}, opt.id))
											})]
										}) }),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Td, {
											className: "w-24 text-center",
											children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "flex items-center justify-center gap-0.5",
												children: [
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
														onClick: () => updateQuantity(item.productId, -qtyIncrement),
														className: "flex items-center justify-center size-7 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors",
														children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Minus, { className: "size-3" })
													}),
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)(EditableQuantity, {
														value: item.packagingQuantity,
														onChange: (delta) => updateQuantity(item.productId, delta),
														step: qtyStep
													}),
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
														className: "text-[10px] text-muted-foreground min-w-[32px] text-left",
														children: item.packagingName
													}),
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
														onClick: () => updateQuantity(item.productId, qtyIncrement),
														className: "flex items-center justify-center size-7 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors",
														children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, { className: "size-3" })
													})
												]
											})
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Td, {
											className: "w-24 text-right",
											children: isEditingPrice ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "flex items-center justify-end gap-1",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
													className: "text-[10px] text-muted-foreground",
													children: "Rs."
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
													ref: editInputRef,
													type: "number",
													value: editValue,
													onChange: (e) => setEditValue(e.target.value),
													onBlur: commitPrice,
													onKeyDown: handleEditKeyDown,
													className: "w-20 h-7 px-2 rounded border border-primary bg-background text-sm font-semibold text-right outline-none tabular-nums",
													autoFocus: true
												})]
											}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
												onClick: () => startEditPrice(item.productId, item.unitPrice),
												className: "text-sm font-semibold tabular-nums hover:bg-muted/50 px-1.5 py-0.5 rounded transition-colors",
												title: "Click to edit price",
												children: formatCurrency(computedItem.unitPrice)
											})
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Td, {
											className: "w-20 text-right",
											children: isEditingDisc ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "flex items-center justify-end gap-1",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
													ref: editInputRef,
													type: "number",
													value: editValue,
													onChange: (e) => setEditValue(e.target.value),
													onBlur: commitDisc,
													onKeyDown: handleEditKeyDown,
													className: "w-16 h-7 px-2 rounded border border-primary bg-background text-sm font-semibold text-right outline-none tabular-nums",
													autoFocus: true,
													min: "0",
													max: "100"
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
													className: "text-xs text-muted-foreground",
													children: "%"
												})]
											}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
												onClick: () => startEditDisc(item.productId),
												className: cn("text-sm font-semibold tabular-nums hover:bg-muted/50 px-1.5 py-0.5 rounded transition-colors", pct ? "text-amber-600" : "text-muted-foreground"),
												title: "Click to set discount %",
												children: pct && pct > 0 ? `${pct}%` : "—"
											})
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Td, {
											className: "w-28 text-right",
											children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: cn("text-sm font-bold tabular-nums", computedItem.total > 0 ? "text-foreground" : "text-red-500"),
												children: formatCurrency(computedItem.total)
											})
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Td, {
											className: "w-10 text-center",
											children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
												onClick: () => handleRemoveItem(item.productId),
												className: "flex items-center justify-center size-7 rounded-md hover:bg-red-50 text-muted-foreground hover:text-red-500 transition-colors",
												title: "Remove item",
												children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash2, { className: "size-3.5" })
											})
										})
									]
								}, item.id);
							}) })]
						})
					}), cart.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TransactionSummary, {
						subtotal,
						discount,
						discountInput,
						grandTotal,
						onDiscountChange: (v) => {
							setDiscount(v);
							setDiscountInput("");
						},
						onDiscountInputChange: setDiscountInput,
						onDiscountPctChange: setDiscount
					})]
				})
			}),
			" ",
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "block sm:hidden",
				style: {
					height: "calc(100vh - 250px)",
					overflowY: "auto"
				},
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "px-4 py-3 space-y-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MobileCartList, {
						items: cart.map((c) => {
							const prod = posProducts.find((p) => p.id === c.productId);
							const sus = prod ? getSellingUnits(prod.id) : [];
							const custom = prod ? getCustomUnitOptions(prod.id) : [];
							return {
								id: c.id || c.productId,
								productId: c.productId,
								productName: c.name,
								packName: c.packagingName,
								quantity: c.packagingQuantity,
								unitCost: c.unitPrice,
								totalCost: c.total,
								sellingUnits: sus.map((su) => ({
									id: su.id,
									name: su.name
								})),
								customUnits: custom.map((cu) => ({
									id: cu.id,
									label: cu.label
								})),
								selectedUnitId: c.sellingUnitId,
								isConsumption: c.hasConsumptionComposition === true || prod?.hasConsumptionComposition === true,
								formulaDetails: c.formulaDetails
							};
						}),
						costLabel: "Price",
						onFormulaClick: (id) => {
							const item = cart.find((c) => (c.id || c.productId) === id);
							const product = item ? posProducts.find((p) => p.id === item.productId) : null;
							if (item && product) openFormulaCustomization(product, item);
						},
						onUpdateQty: (id, delta) => {
							const item = cart.find((c) => (c.id || c.productId) === id);
							if (item) updateQuantity(item.productId, delta);
						},
						onRemove: (id) => {
							setCart((prev) => prev.filter((c) => (c.id || c.productId) !== id));
						},
						onChangeUnit: (id, unitId) => handleChangeUnit(id, unitId),
						onPriceChange: (productId, newPrice) => {
							setCart((prev) => prev.map((c) => c.productId === productId ? {
								...c,
								unitPrice: newPrice,
								total: (c.packagingQuantity || 1) * newPrice
							} : c));
						}
					}), cart.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center justify-between px-1 py-3 border-t border-border",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "text-xs text-muted-foreground",
							children: "Total"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "text-lg font-bold tabular-nums",
							children: formatCurrency(grandTotal)
						})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							onClick: () => {
								if (!customer?.id) {
									toast.error("Please select a customer");
									return;
								}
								setShowMobilePayment(true);
							},
							className: "inline-flex items-center gap-1.5 px-5 py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-semibold shadow-sm",
							children: "Proceed to Payment"
						})]
					})]
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "hidden sm:block sm:shrink-0",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PaymentPanel, {
					paymentMethod,
					onMethodChange: setPaymentMethod,
					amountPaid,
					onAmountChange: setAmountPaid,
					grandTotal,
					cartEmpty: cart.length === 0,
					onHold: handleHoldSale,
					onClear: () => cart.length > 0 ? setShowClearConfirm(true) : resetSale(),
					onRecord: () => setShowConfirm(true),
					onQuickPay: handleQuickPay
				})
			}),
			" ",
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ReceiptDialog, {
				open: showReceipt,
				saleData: receiptData,
				onClose: () => setShowReceipt(false),
				onNewSale: handleNewSale
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ConfirmTransactionDialog, {
				open: showConfirm,
				onOpenChange: setShowConfirm,
				itemCount: cart.length,
				items: computedCart.map((c) => ({
					name: c.name,
					qty: c.packagingQuantity,
					cost: c.unitPrice,
					total: c.total,
					unitName: c.packagingName
				})),
				subtotal,
				discount,
				grandTotal,
				amountPaid,
				partyName: customer.name,
				showParty: customer.name !== "Walk-in Customer",
				paymentMethod,
				onConfirm: handleRecordSale
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ConfirmClearDialog, {
				open: showClearConfirm,
				onOpenChange: setShowClearConfirm,
				itemCount: cart.length,
				onConfirm: () => {
					resetSale();
					toast.success("Cart cleared");
				}
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Dialog, {
				open: showLowStockWarning,
				onOpenChange: setShowLowStockWarning,
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogContent, {
					className: "sm:max-w-md gap-0 p-0",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogHeader, {
						className: "p-5 pb-0",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTitle, {
							className: "text-base",
							children: "⚠️ Insufficient Stock"
						})
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "p-5 space-y-4",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-sm text-muted-foreground",
								children: "The following items have insufficient stock:"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 p-3",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("pre", {
									className: "text-xs whitespace-pre-wrap font-sans text-amber-800 dark:text-amber-300",
									children: lowStockItems
								})
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-xs text-muted-foreground",
								children: "Stock will go negative for these items, including formula ingredients. Do you want to proceed?"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex gap-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
									variant: "outline",
									onClick: () => setShowLowStockWarning(false),
									className: "flex-1",
									children: "Cancel"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
									onClick: () => {
										setShowLowStockWarning(false);
										doSubmitSale(true);
									},
									className: "flex-1 gap-1.5",
									children: "Proceed with Sale"
								})]
							})
						]
					})]
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MobilePaymentDrawer, {
				open: showMobilePayment,
				onClose: () => setShowMobilePayment(false),
				onConfirm: handleRecordSale,
				grandTotal,
				amountPaid,
				onAmountChange: setAmountPaid,
				paymentMethod,
				onMethodChange: setPaymentMethod,
				paymentMethods: [
					{
						value: "cash",
						label: "Cash"
					},
					{
						value: "card",
						label: "Card"
					},
					{
						value: "transfer",
						label: "Transfer"
					},
					{
						value: "easypaisa",
						label: "Easypaisa"
					},
					{
						value: "jazzcash",
						label: "JazzCash"
					}
				],
				confirmLabel: "Complete Sale"
			}),
			formulaProduct && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(FormulaCustomizationDialog, {
				open: Boolean(formulaProduct),
				product: {
					id: formulaProduct.id,
					name: formulaProduct.name
				},
				initial: formulaInitial,
				onClose: () => {
					setFormulaProduct(null);
					setFormulaInitial(null);
				},
				onConfirm: confirmFormulaCustomization
			})
		]
	});
}
function Th({ children, className }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
		className: cn("px-3 py-2.5 text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wider", className),
		children
	});
}
function Td({ children, className }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
		className: cn("px-3 py-2", className),
		children
	});
}
//#endregion
export { SaleBillPage as default };
