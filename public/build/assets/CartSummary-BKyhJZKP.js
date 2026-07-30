import { i as __toESM, t as require_react } from "./react-DCO0ASPG.js";
import { t as Check } from "./check-BFfFFZZu.js";
import { t as ExternalLink } from "./external-link-BeGckZzO.js";
import { a as posCustomers } from "./ClearConfirmDialog-DNChBlmj.js";
import { t as Phone } from "./phone-CSvtNg5c.js";
import { t as Printer } from "./printer-SCaoHvv-.js";
import { t as RefreshCw } from "./refresh-cw-DGGw9qMI.js";
import { t as Share2 } from "./share-2-BDkinF3u.js";
import { t as User } from "./user-DLTIgJdv.js";
import { t as cn } from "./utils-Bim8RyS4.js";
import { t as require_jsx_runtime } from "./jsx-runtime-BjJQA5sn.js";
import { t as Button } from "./button-phKcTdak.js";
import { n as DialogContent, t as Dialog } from "./dialog-C6yKUL3Q.js";
import { Dt as router3, I as computeCartDiscount, St as ChevronDown, Tt as toast, gt as Plus, ht as Receipt, mt as Search, ot as X, rt as formatCurrency, vt as LogOut } from "./app-DRCb4nuk.js";
import { t as Badge } from "./badge-BfSUOZdI.js";
//#region resources/js/domain/products/pricing.ts
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
var import_react = /* @__PURE__ */ __toESM(require_react(), 1);
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
export { getStepForUnit as a, getIncrementForUnit as i, ReceiptDialog as n, computeCustomUnitPrice as o, CustomerSelect as r, computePricePerBaseUnit as s, TransactionSummary as t };
