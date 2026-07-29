import { i as __toESM, t as require_react } from "./react-DCO0ASPG.js";
import { t as CalendarDays } from "./calendar-days-CE0jslca.js";
import { t as Clock } from "./clock-zPxdzOK3.js";
import { t as FileText } from "./file-text-CkmQ0M6N.js";
import { t as Minus } from "./minus-jjDOQ6-9.js";
import { t as Pill } from "./pill-BnEdyPyP.js";
import { n as convert, o as getUnit } from "./units-CsePzNz6.js";
import { t as cn } from "./utils-Bim8RyS4.js";
import { t as require_jsx_runtime } from "./jsx-runtime-BjJQA5sn.js";
import { t as Button } from "./button-phKcTdak.js";
import { a as DialogTitle, i as DialogHeader, n as DialogContent, t as Dialog } from "./dialog-CNooGnKC.js";
import { _t as Plus, ct as X, ht as Search, st as formatCurrency, vt as Package } from "./app-BLMvu7I3.js";
import { t as Badge } from "./badge-BfSUOZdI.js";
//#region resources/js/Pages/clinic/components/AddMedicineDialog.tsx
var import_react = /* @__PURE__ */ __toESM(require_react(), 1);
var import_jsx_runtime = require_jsx_runtime();
function getCustomMeasurementOptions(baseUnitId) {
	const unit = getUnit(baseUnitId);
	if (!unit) return [];
	const opts = [];
	if (unit.measurementType === "weight") {
		if (convert(1, "g", baseUnitId) !== null) opts.push({
			id: "__custom_gram",
			label: "Gram (g)",
			factor: convert(1, "g", baseUnitId) ?? 1
		});
		if (convert(1, "kg", baseUnitId) !== null) opts.push({
			id: "__custom_kg",
			label: "Kilogram (kg)",
			factor: convert(1, "kg", baseUnitId) ?? 1e3
		});
	}
	if (unit.measurementType === "volume") {
		if (convert(1, "ml", baseUnitId) !== null) opts.push({
			id: "__custom_ml",
			label: "Millilitre (ml)",
			factor: convert(1, "ml", baseUnitId) ?? 1
		});
		if (convert(1, "liter", baseUnitId) !== null) opts.push({
			id: "__custom_liter",
			label: "Litre (L)",
			factor: convert(1, "liter", baseUnitId) ?? 1e3
		});
	}
	if (unit.measurementType === "length") {
		if (convert(1, "cm", baseUnitId) !== null) opts.push({
			id: "__custom_cm",
			label: "Per cm",
			factor: convert(1, "cm", baseUnitId) ?? .01
		});
		if (convert(1, "meter", baseUnitId) !== null) opts.push({
			id: "__custom_meter",
			label: "Per Meter",
			factor: convert(1, "meter", baseUnitId) ?? 100
		});
	}
	return opts;
}
function AddMedicineDialog({ open, onClose, onAdd, selectedIds, editEntry, products: serverProducts }) {
	const [search, setSearch] = (0, import_react.useState)("");
	const [working, setWorking] = (0, import_react.useState)(null);
	const [qtyInput, setQtyInput] = (0, import_react.useState)("1");
	const getSmallestUnit = (product) => {
		const sus = product.selling_units || product.sellingUnits || [];
		return sus.length > 0 ? sus.reduce((a, b) => (a.quantity || 1) < (b.quantity || 1) ? a : b) : null;
	};
	(0, import_react.useEffect)(() => {
		if (open && editEntry) {
			const product = serverProducts.find((p) => String(p.id) === String(editEntry.productId));
			if (product) {
				const su = (product.selling_units || product.sellingUnits || []).find((u) => u.name === editEntry.packagingName) || getSmallestUnit(product);
				if (su) setWorking({
					product,
					sellingUnit: su,
					packagingName: su.name,
					packagingQuantity: editEntry.packagingQuantity,
					baseUnitQuantity: su.quantity || 1,
					baseQuantity: editEntry.baseQuantity,
					unitPrice: editEntry.unitPrice,
					total: editEntry.total,
					dosage: editEntry.dosage,
					frequency: editEntry.frequency,
					duration: editEntry.duration,
					notes: editEntry.notes
				});
			}
		}
	}, [open, editEntry]);
	const filtered = (0, import_react.useMemo)(() => {
		if (!search.trim()) return serverProducts;
		const q = search.toLowerCase();
		return serverProducts.filter((p) => p.name.toLowerCase().includes(q) || (p.sku || "").toLowerCase().includes(q));
	}, [search, serverProducts]);
	const handleSelectProduct = (product) => {
		const su = getSmallestUnit(product);
		if (!su) return;
		setWorking({
			product,
			sellingUnit: su,
			packagingName: su.name,
			packagingQuantity: 1,
			baseUnitQuantity: su.quantity || 1,
			baseQuantity: su.quantity || 1,
			unitPrice: su.sale_price || 0,
			total: su.sale_price || 0,
			dosage: "1",
			frequency: "Once daily",
			duration: "7 days",
			notes: ""
		});
	};
	const handleChangeUnit = (product, su) => {
		setWorking((prev) => {
			if (!prev) return null;
			return {
				...prev,
				sellingUnit: su,
				packagingName: su.name,
				packagingQuantity: 1,
				baseUnitQuantity: su.quantity || 1,
				baseQuantity: su.quantity || 1,
				unitPrice: su.sale_price || 0,
				total: su.sale_price || 0
			};
		});
	};
	const handleQtyChange = (delta) => {
		setWorking((prev) => {
			if (!prev) return null;
			const increment = prev.baseUnitQuantity < 1 ? .1 : 1;
			const current = prev.packagingQuantity || 1;
			const newQty = Math.max(.001, Math.round((current + delta * increment) * 1e3) / 1e3);
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
			id: editEntry ? editEntry.id : `med-${Date.now()}`,
			productId: String(working.product.id),
			name: working.product.name,
			packagingName: working.packagingName,
			packagingQuantity: working.packagingQuantity,
			baseUnitQuantity: working.baseUnitQuantity,
			baseQuantity: working.baseQuantity,
			unitPrice: working.unitPrice,
			total: working.total,
			category: working.product.category?.name || working.product.category || "",
			dosage: working.dosage,
			frequency: working.frequency,
			duration: working.duration,
			notes: working.notes,
			sellingUnitId: working.sellingUnit?.id || null
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
									working.product.category?.name || working.product.category
								]
							})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								onClick: () => setWorking(null),
								className: "text-muted-foreground hover:text-foreground",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { className: "size-4" })
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "space-y-1.5",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
								className: "text-xs font-medium text-foreground",
								children: "Selling Unit"
							}), (() => {
								const isRegular = (working.product.selling_units || working.product.sellingUnits || []).some((u) => u.name === working.packagingName);
								const customOpts = getCustomMeasurementOptions(working.product.base_unit_id);
								return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
									value: customOpts.some((o) => o.label === working.packagingName) ? customOpts.find((o) => o.label === working.packagingName)?.id || working.packagingName : isRegular ? working.packagingName : working.packagingName,
									onChange: (e) => {
										const val = e.target.value;
										const product = working.product;
										const su = (product.selling_units || product.sellingUnits || []).find((u) => u.name === val);
										if (su) {
											handleChangeUnit(product, su);
											return;
										}
										if (val.startsWith("__custom_")) {
											const opt = getCustomMeasurementOptions(product.base_unit_id).find((o) => o.id === val);
											if (!opt) return;
											const pricePerBase = working.unitPrice > 0 ? working.unitPrice / working.baseUnitQuantity : 0;
											const newUnitPrice = Math.round(pricePerBase * opt.factor * 100) / 100;
											setWorking((prev) => {
												if (!prev) return null;
												return {
													...prev,
													packagingName: opt.label,
													packagingQuantity: 1,
													baseUnitQuantity: opt.factor,
													baseQuantity: opt.factor,
													unitPrice: newUnitPrice,
													total: newUnitPrice,
													sellingUnit: null
												};
											});
										}
									},
									className: "w-full h-9 px-2.5 rounded-lg border border-input bg-background text-xs outline-none focus:border-ring focus:ring-1 focus:ring-ring/30 appearance-none cursor-pointer",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("optgroup", {
										label: "Selling Units",
										children: (working.product.selling_units || working.product.sellingUnits || []).map((su) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("option", {
											value: su.name,
											children: [
												su.name,
												" — ",
												formatCurrency(su.sale_price || 0),
												"/each"
											]
										}, su.id))
									}), (() => {
										const customOpts = getCustomMeasurementOptions(working.product.base_unit_id);
										return customOpts.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("optgroup", {
											label: "Custom amount",
											children: customOpts.map((opt) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
												value: opt.id,
												children: opt.label
											}, opt.id))
										}) : null;
									})()]
								});
							})()]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "space-y-1.5",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
									className: "text-xs font-medium text-foreground",
									children: "Quantity"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex items-center gap-3",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
											onClick: () => handleQtyChange(-1),
											disabled: working.packagingQuantity <= .001,
											className: "flex items-center justify-center size-9 rounded-lg bg-muted hover:bg-muted/80 disabled:opacity-30 disabled:cursor-not-allowed",
											children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Minus, { className: "size-4" })
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
											type: "number",
											value: qtyInput,
											onChange: (e) => {
												const raw = e.target.value;
												if (raw === "") {
													setQtyInput("");
													return;
												}
												const v = parseFloat(raw);
												if (!isNaN(v) && v > 0) {
													setQtyInput(raw);
													setWorking((prev) => {
														if (!prev) return null;
														return {
															...prev,
															packagingQuantity: v,
															baseQuantity: v * prev.baseUnitQuantity,
															total: v * prev.unitPrice
														};
													});
												}
											},
											onBlur: () => {
												if (qtyInput === "" || isNaN(parseFloat(qtyInput)) || parseFloat(qtyInput) <= 0) {
													setQtyInput("1");
													setWorking((prev) => {
														if (!prev) return null;
														return {
															...prev,
															packagingQuantity: 1,
															baseQuantity: 1 * prev.baseUnitQuantity,
															total: 1 * prev.unitPrice
														};
													});
												}
											},
											step: working.baseUnitQuantity < 1 ? "0.001" : "1",
											min: "0.001",
											className: "w-20 h-9 px-2 rounded-lg border border-input bg-background text-sm font-bold text-center outline-none focus:border-ring focus:ring-1 focus:ring-ring/30 tabular-nums"
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
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
									className: "text-[10px] text-muted-foreground/70",
									children: [
										"(",
										formatCurrency(working.unitPrice || 0),
										" × ",
										qtyInput || 0,
										" = ",
										formatCurrency(working.total || 0),
										") · ",
										working.baseQuantity > 0 ? working.baseQuantity : "0",
										" ",
										getUnit(working.product.base_unit_id)?.name || working.product.base_unit_id,
										" deducted from stock"
									]
								})
							]
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
						const sus = product.selling_units || product.sellingUnits || [];
						const alreadySelected = selectedIds.includes(String(product.id));
						return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							onClick: () => !alreadySelected && handleSelectProduct(product),
							disabled: alreadySelected,
							className: cn("w-full text-left px-3 py-2.5 rounded-lg transition-colors", alreadySelected ? "bg-primary/5 opacity-60 cursor-not-allowed" : "hover:bg-muted/50 active:bg-muted/80"),
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-start justify-between gap-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "min-w-0 flex-1",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex items-center gap-2",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "text-sm font-medium truncate",
											children: product.name
										}), alreadySelected && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "size-3.5 text-primary shrink-0",
											children: "✓"
										})]
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "flex flex-wrap gap-1 mt-1",
										children: sus.length > 0 ? sus.map((u) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
											className: "inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] bg-muted/60 text-muted-foreground",
											children: [
												u.name,
												" @ ",
												formatCurrency(u.sale_price || 0)
											]
										}, u.id)) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "text-[10px] text-muted-foreground/60",
											children: "No selling units"
										})
									})]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
									variant: "outline",
									className: "text-[10px] px-1.5 py-0 h-4 font-normal shrink-0 ml-2",
									children: product.category?.name || product.category || ""
								})]
							})
						}, product.id);
					})]
				})
			]
		})
	});
}
//#endregion
export { AddMedicineDialog as default };
