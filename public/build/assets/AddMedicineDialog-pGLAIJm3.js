import { i as __toESM, t as require_react } from "./react-DCO0ASPG.js";
import { t as CalendarDays } from "./calendar-days-CE0jslca.js";
import { t as Check } from "./check-BFfFFZZu.js";
import { t as Clock } from "./clock-zPxdzOK3.js";
import { t as FileText } from "./file-text-CkmQ0M6N.js";
import { t as Minus } from "./minus-jjDOQ6-9.js";
import { t as Pill } from "./pill-BnEdyPyP.js";
import { t as cn } from "./utils-Bim8RyS4.js";
import { t as require_jsx_runtime } from "./jsx-runtime-BjJQA5sn.js";
import { t as Button } from "./button-phKcTdak.js";
import { a as DialogTitle, i as DialogHeader, n as DialogContent, t as Dialog } from "./dialog-DIpOEEmk.js";
import { O as getProductById, _t as Plus, at as formatCurrency, ct as X, ht as Search, k as mockProducts, vt as Package } from "./app-DfjygdMU.js";
import { t as Badge } from "./badge-BfSUOZdI.js";
//#region resources/js/Pages/components/AddMedicineDialog.tsx
var import_react = /* @__PURE__ */ __toESM(require_react(), 1);
var import_jsx_runtime = require_jsx_runtime();
function AddMedicineDialog({ open, onClose, onAdd, selectedIds, editEntry }) {
	const [search, setSearch] = (0, import_react.useState)("");
	const [working, setWorking] = (0, import_react.useState)(null);
	const getSmallestPkg = (product) => product.packaging.length ? product.packaging.reduce((a, b) => a.quantity < b.quantity ? a : b) : null;
	(0, import_react.useEffect)(() => {
		if (open && editEntry) {
			const product = mockProducts.find((p) => p.id === editEntry.productId);
			if (product) {
				const pkg = product.packaging.find((p) => p.name === editEntry.packagingName) || getSmallestPkg(product);
				if (pkg) setWorking({
					product,
					packagingName: editEntry.packagingName,
					packagingQuantity: editEntry.packagingQuantity,
					baseUnitQuantity: pkg.quantity,
					baseQuantity: editEntry.baseQuantity,
					unitPrice: editEntry.unitPrice,
					total: editEntry.total,
					dosage: editEntry.dosage,
					frequency: editEntry.frequency,
					duration: editEntry.duration,
					notes: editEntry.notes,
					productId: editEntry.productId
				});
			}
		}
	}, [open, editEntry]);
	const filtered = (0, import_react.useMemo)(() => mockProducts.filter((p) => search ? p.name.toLowerCase().includes(search.toLowerCase()) || p.sku.toLowerCase().includes(search.toLowerCase()) : true), [search]);
	const getStockAfter = (productId, consumeQty) => {
		const prod = getProductById(productId);
		if (!prod) return null;
		return {
			current: prod.stockQuantity,
			remaining: Math.max(0, prod.stockQuantity - consumeQty)
		};
	};
	const handleSelectProduct = (product) => {
		const pkg = getSmallestPkg(product);
		if (!pkg) return;
		setWorking({
			product,
			packagingName: pkg.name,
			packagingQuantity: 1,
			baseUnitQuantity: pkg.quantity,
			baseQuantity: pkg.quantity,
			unitPrice: pkg.salePrice,
			total: pkg.salePrice,
			dosage: "1",
			frequency: "Once daily",
			duration: "7 days",
			notes: "",
			productId: product.id
		});
	};
	const handleChangePkg = (product, pkgName) => {
		const pkg = product.packaging.find((p) => p.name === pkgName);
		if (!pkg) return;
		setWorking((prev) => {
			if (!prev) return null;
			return {
				...prev,
				packagingName: pkg.name,
				packagingQuantity: 1,
				baseUnitQuantity: pkg.quantity,
				baseQuantity: pkg.quantity,
				unitPrice: pkg.salePrice,
				total: pkg.salePrice
			};
		});
	};
	const handleQtyChange = (delta) => {
		setWorking((prev) => {
			if (!prev) return null;
			const newQty = Math.max(1, prev.packagingQuantity + delta);
			return {
				...prev,
				packagingQuantity: newQty,
				baseQuantity: newQty * prev.baseUnitQuantity,
				total: newQty * prev.unitPrice
			};
		});
	};
	const handleAdd = () => {
		if (!working) return;
		onAdd({
			id: editEntry ? editEntry.id : `med-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
			productId: working.productId,
			name: working.product.name,
			packagingName: working.packagingName,
			packagingQuantity: working.packagingQuantity,
			baseUnitQuantity: working.baseUnitQuantity,
			baseQuantity: working.baseQuantity,
			unitPrice: working.unitPrice,
			total: working.total,
			category: working.product.category,
			dosage: working.dosage,
			frequency: working.frequency,
			duration: working.duration,
			notes: working.notes
		});
		if (editEntry) handleClose();
		else {
			setWorking(null);
			setSearch("");
		}
	};
	const handleClose = () => {
		setWorking(null);
		setSearch("");
		onClose();
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Dialog, {
		open,
		onOpenChange: (v) => {
			if (!v) handleClose();
		},
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogContent, {
			className: "sm:max-w-lg gap-0 p-0 max-h-[90vh] flex flex-col",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogHeader, {
					className: "p-5 pb-3 shrink-0",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTitle, {
						className: "text-base",
						children: "Add Medicine / Service"
					})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "px-5 pb-3 shrink-0",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "relative",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Search, { className: "absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							type: "text",
							placeholder: "Search products...",
							value: search,
							onChange: (e) => setSearch(e.target.value),
							className: "w-full h-10 pl-9 pr-3 rounded-xl border border-input bg-background text-sm outline-none focus:border-ring focus:ring-1 focus:ring-ring/30",
							autoFocus: true
						})]
					})
				}),
				working ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex-1 overflow-y-auto px-5 pb-5 space-y-4",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center justify-between",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h4", {
								className: "text-sm font-semibold",
								children: working.product.name
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "text-xs text-muted-foreground",
								children: [
									working.product.sku,
									" · ",
									working.product.category
								]
							})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								onClick: () => setWorking(null),
								className: "text-muted-foreground hover:text-foreground",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { className: "size-4" })
							})]
						}),
						working.product.packaging.length > 1 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "space-y-1.5",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
								className: "text-xs font-medium text-foreground",
								children: "Packaging"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "flex flex-wrap gap-1.5",
								children: working.product.packaging.map((pkg) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
									onClick: () => handleChangePkg(working.product, pkg.name),
									className: cn("px-3 py-2 rounded-lg border text-xs font-medium transition-all", working.packagingName === pkg.name ? "border-primary bg-primary/5 text-foreground ring-1 ring-primary/20" : "border-border text-muted-foreground hover:text-foreground hover:border-muted-foreground/30"),
									children: [
										pkg.name,
										" · ",
										formatCurrency(pkg.salePrice),
										"/each"
									]
								}, pkg.name))
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "space-y-1.5",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
								className: "text-xs font-medium text-foreground",
								children: "Quantity"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-center gap-3",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
										onClick: () => handleQtyChange(-1),
										disabled: working.packagingQuantity <= 1,
										className: "flex items-center justify-center size-9 rounded-lg bg-muted hover:bg-muted/80 disabled:opacity-30 disabled:cursor-not-allowed",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Minus, { className: "size-4" })
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "text-lg font-bold w-10 text-center",
										children: working.packagingQuantity
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
										onClick: () => handleQtyChange(1),
										className: "flex items-center justify-center size-9 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, { className: "size-4" })
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
										className: "text-xs text-muted-foreground",
										children: [
											"× ",
											working.packagingName,
											" = ",
											working.baseQuantity,
											" base units"
										]
									})
								]
							})]
						}),
						getStockAfter(working.productId, working.baseQuantity) && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(StockIndicator, {
							stock: getStockAfter(working.productId, working.baseQuantity),
							threshold: working.product.lowStockThreshold
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "border-t border-border pt-3",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3",
								children: "Prescription Info"
							})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "grid grid-cols-3 gap-3",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "space-y-1.5",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
										className: "flex items-center gap-1 text-xs font-medium text-foreground",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pill, { className: "size-3" }), " Dosage"]
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
										type: "text",
										value: working.dosage,
										placeholder: "1 tablet",
										onChange: (e) => setWorking({
											...working,
											dosage: e.target.value
										}),
										className: "w-full h-9 px-3 rounded-lg border border-input bg-background text-sm outline-none focus:border-ring focus:ring-1 focus:ring-ring/30"
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "space-y-1.5",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
										className: "flex items-center gap-1 text-xs font-medium text-foreground",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Clock, { className: "size-3" }), " Frequency"]
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
										type: "text",
										value: working.frequency,
										placeholder: "Twice daily",
										onChange: (e) => setWorking({
											...working,
											frequency: e.target.value
										}),
										className: "w-full h-9 px-3 rounded-lg border border-input bg-background text-sm outline-none focus:border-ring focus:ring-1 focus:ring-ring/30"
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "space-y-1.5",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
										className: "flex items-center gap-1 text-xs font-medium text-foreground",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CalendarDays, { className: "size-3" }), " Duration"]
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
										type: "text",
										value: working.duration,
										placeholder: "7 days",
										onChange: (e) => setWorking({
											...working,
											duration: e.target.value
										}),
										className: "w-full h-9 px-3 rounded-lg border border-input bg-background text-sm outline-none focus:border-ring focus:ring-1 focus:ring-ring/30"
									})]
								})
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "space-y-1.5",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
								className: "flex items-center gap-1 text-xs font-medium text-foreground",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FileText, { className: "size-3" }), " Instructions"]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								type: "text",
								value: working.notes,
								placeholder: "e.g. Take with food",
								onChange: (e) => setWorking({
									...working,
									notes: e.target.value
								}),
								className: "w-full h-9 px-3 rounded-lg border border-input bg-background text-sm outline-none focus:border-ring focus:ring-1 focus:ring-ring/30"
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center justify-between py-2 px-4 rounded-xl bg-muted/50",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-sm text-muted-foreground",
								children: "Total"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-lg font-bold",
								children: formatCurrency(working.total)
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex gap-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								variant: "outline",
								onClick: () => setWorking(null),
								className: "flex-1 h-10",
								children: "Back to List"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
								onClick: handleAdd,
								className: "flex-1 h-10 gap-1.5 shadow-sm",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, { className: "size-4" }), " Add to Prescription"]
							})]
						})
					]
				}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex-1 overflow-y-auto px-5 pb-5 space-y-1",
					children: [filtered.length === 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "text-center py-12 text-sm text-muted-foreground",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Package, { className: "size-8 mx-auto mb-2 text-muted-foreground/30" }), "No products found."]
					}), filtered.map((product) => {
						const pkg = getSmallestPkg(product);
						const alreadySelected = selectedIds.includes(product.id);
						const stock = getStockAfter(product.id, 0);
						return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							onClick: () => !alreadySelected && handleSelectProduct(product),
							disabled: alreadySelected,
							className: cn("w-full flex items-center justify-between px-3 py-2.5 rounded-lg transition-colors text-left", alreadySelected ? "bg-primary/5 opacity-60 cursor-not-allowed" : "hover:bg-muted/50 active:bg-muted/80"),
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "min-w-0 flex-1",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex items-center gap-2",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "text-sm font-medium truncate",
										children: product.name
									}), alreadySelected && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Check, { className: "size-3.5 text-primary shrink-0" })]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex items-center gap-2 text-xs text-muted-foreground mt-0.5",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [
										pkg ? formatCurrency(pkg.salePrice) : "—",
										" per ",
										pkg?.name || product.baseUnit
									] }), stock && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "·" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
										className: cn(stock.remaining <= 0 ? "text-red-500" : stock.remaining < product.lowStockThreshold ? "text-amber-500" : "text-emerald-500"),
										children: [stock.remaining, " in stock"]
									})] })]
								})]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
								variant: "outline",
								className: "text-[10px] px-1.5 py-0 h-4 font-normal shrink-0 ml-2",
								children: product.category
							})]
						}, product.id);
					})]
				})
			]
		})
	});
}
function StockIndicator({ stock, threshold }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex items-center gap-2 text-xs",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: "text-muted-foreground",
			children: "Available stock:"
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
			className: cn("px-2 py-0.5 rounded-full font-medium", stock.remaining <= 0 ? "bg-red-50 text-red-600 dark:bg-red-950/30 dark:text-red-400" : stock.remaining < threshold ? "bg-amber-50 text-amber-600 dark:bg-amber-950/30 dark:text-amber-400" : "bg-emerald-50 text-emerald-600 dark:bg-emerald-950/30 dark:text-emerald-400"),
			children: [stock.remaining, " left"]
		})]
	});
}
//#endregion
export { AddMedicineDialog as default };
