import { i as __toESM, r as __exportAll, t as require_react } from "./react-DCO0ASPG.js";
import { t as ChevronUp } from "./chevron-up-BF5n-Dc8.js";
import { t as Save } from "./save-D4S_dtxM.js";
import { i as getBaseUnitOptions, o as getUnit } from "./units-CsePzNz6.js";
import { t as cn } from "./utils-Bim8RyS4.js";
import { t as require_jsx_runtime } from "./jsx-runtime-BjJQA5sn.js";
import { t as Button } from "./button-phKcTdak.js";
import { Et as router3, St as ChevronDown, _t as Plus, mt as Settings2, wt as toast } from "./app-DfjygdMU.js";
import { n as CardContent, t as Card } from "./card-DQfOgTjC.js";
import { t as calculateMargin } from "./product-adapter-Df3GNTgA.js";
import { t as PackagingLevelsBuilder } from "./PackagingLevelsBuilder-CD7Vkllr.js";
//#region resources/js/Pages/inventory/components/ProductForm.tsx
var ProductForm_exports = /* @__PURE__ */ __exportAll({ default: () => ProductForm });
var import_react = /* @__PURE__ */ __toESM(require_react(), 1);
var import_jsx_runtime = require_jsx_runtime();
var CATEGORY_PREFIX_MAP = {
	Medicine: "MED",
	Groceries: "GRO",
	Cosmetics: "COS",
	Skincare: "SKN",
	"Mobile Accessories": "MOB",
	Electronics: "ELE",
	"Clinic Supplies": "SUP"
};
function getCategoryPrefix(category) {
	return CATEGORY_PREFIX_MAP[category] || "PRD";
}
function generateSku(category, sequence) {
	return getCategoryPrefix(category) + "-" + String(sequence).padStart(3, "0");
}
/** Check whether a unit ID represents a measurement type (weight/volume/length). */
function isMeasurementUnit(unitId) {
	const unit = getUnit(unitId);
	return unit?.measurementType === "weight" || unit?.measurementType === "volume" || unit?.measurementType === "length";
}
/** Check if a unit suggests packaging (count units that aren't Piece). */
function isPackagingUnit(unitId) {
	const unit = getUnit(unitId);
	if (!unit || unit.measurementType !== "count") return false;
	return [
		"box",
		"carton",
		"bottle",
		"strip",
		"packet",
		"sachet",
		"roll",
		"tray"
	].includes(unit.id);
}
function ProductForm({ mode, categories = [], product = null, generatedSku }) {
	const isEditing = mode === "edit";
	const [name, setName] = (0, import_react.useState)(product?.name || "");
	const [purchaseCost, setPurchaseCost] = (0, import_react.useState)(String(product?.default_purchase_cost ?? product?.last_purchase_cost ?? ""));
	const [sellingPrice, setSellingPrice] = (0, import_react.useState)(product?.selling_units?.[0]?.sale_price ?? 0);
	const [baseUnitId, setBaseUnitId] = (0, import_react.useState)(product?.base_unit_id || "piece");
	const [advancedOpen, setAdvancedOpen] = (0, import_react.useState)(false);
	const [category, setCategory] = (0, import_react.useState)("");
	const [barcode, setBarcode] = (0, import_react.useState)(product?.barcode || "");
	const [sku, setSku] = (0, import_react.useState)(product?.sku || generatedSku || "");
	const [openingStock, setOpeningStock] = (0, import_react.useState)(isEditing ? String(product?.stock_quantity ?? "") : "");
	const [lowStockThreshold, setLowStockThreshold] = (0, import_react.useState)(String(product?.low_stock_threshold ?? "100"));
	const [allowNegativeStock, setAllowNegativeStock] = (0, import_react.useState)(product?.allow_negative_stock ?? true);
	const [description, setDescription] = (0, import_react.useState)("");
	const [pkgConversionQty, setPkgConversionQty] = (0, import_react.useState)(1);
	const [pkgConversionUnitId, setPkgConversionUnitId] = (0, import_react.useState)("");
	const [sellingUnits, setSellingUnits] = (0, import_react.useState)(() => {
		if (product?.selling_units?.length) return product.selling_units.map((su, i) => ({
			id: su.id || `su-${i}`,
			name: su.name || "Unit",
			unitId: su.unit_id || su.unitId || product.base_unit_id || "piece",
			quantity: su.quantity || 1,
			salePrice: su.sale_price ?? su.salePrice ?? 0,
			isDefault: su.is_default ?? su.isDefault ?? i === 0,
			productUnitId: su.product_unit_id ?? null,
			packagingId: su.packaging_id ?? null
		}));
		return [{
			id: "default",
			name: getUnit("piece")?.name || "Piece",
			unitId: "piece",
			quantity: 1,
			salePrice: 0,
			isDefault: true,
			productUnitId: null,
			packagingId: null
		}];
	});
	const [packagingLevels, setPackagingLevels] = (0, import_react.useState)(() => {
		if (product?.packaging?.length) return product.packaging.map((p, i) => ({
			_key: `pl-${p.id || i}`,
			containerUnitId: p.container_unit_id ?? p.containerUnitId ?? null,
			containerName: p.container_unit?.name || p.containerName || "",
			containsUnitId: p.contains_unit_id ?? p.containsUnitId ?? null,
			containsName: p.contains_unit?.name || p.containsName || "",
			quantity: p.quantity ?? 1,
			level: p.level ?? i + 1
		}));
		return [];
	});
	const [previewUnits, setPreviewUnits] = (0, import_react.useState)([]);
	const derivedUnits = (0, import_react.useMemo)(() => {
		return previewUnits.map((pu) => {
			const existing = sellingUnits.find((su) => su.productUnitId === pu.product_unit_id);
			return {
				...pu,
				salePrice: existing?.salePrice ?? pu.sale_price,
				packagingId: existing?.packagingId ?? null,
				productUnitId: pu.product_unit_id
			};
		});
	}, [previewUnits, sellingUnits]);
	const [sessionCount, setSessionCount] = (0, import_react.useState)(0);
	const [saving, setSaving] = (0, import_react.useState)(false);
	const nameInputRef = (0, import_react.useRef)(null);
	const [skuSequence, setSkuSequence] = (0, import_react.useState)(() => (product?.sku ? 0 : window.__inertia_props?.products?.length ?? 0) + 1);
	(0, import_react.useEffect)(() => {
		nameInputRef.current?.focus();
	}, [sessionCount]);
	(0, import_react.useEffect)(() => {
		if (product && categories.length > 0) {
			const catId = product.category_id ?? product.category?.id;
			const cat = categories.find((c) => c.id === catId || c.name === product.category?.name);
			if (cat) setCategory(cat.name);
		}
	}, []);
	(0, import_react.useEffect)(() => {
		if (!isEditing && category) setSku(generateSku(category, skuSequence));
	}, [
		category,
		skuSequence,
		isEditing
	]);
	(0, import_react.useEffect)(() => {
		if (isPackagingUnit(baseUnitId)) return;
		const unit = getUnit(baseUnitId);
		if (unit) setSellingUnits((prev) => {
			if (prev.find((su) => su.isDefault)) return prev.map((su) => su.isDefault ? {
				...su,
				name: unit.name,
				unitId: baseUnitId,
				quantity: 1
			} : su);
			return prev;
		});
	}, [baseUnitId]);
	(0, import_react.useEffect)(() => {
		if (!isPackagingUnit(baseUnitId) || !pkgConversionUnitId || pkgConversionQty <= 0) return;
		const unit = getUnit(baseUnitId);
		const baseUnit = getUnit(pkgConversionUnitId);
		if (!unit || !baseUnit) return;
		setSellingUnits((prev) => {
			if (prev.find((su) => su.isDefault)) return prev.map((su) => su.isDefault ? {
				...su,
				name: unit.name,
				unitId: pkgConversionUnitId,
				quantity: pkgConversionQty
			} : su);
			return prev;
		});
	}, [
		pkgConversionQty,
		pkgConversionUnitId,
		baseUnitId
	]);
	const costPerBaseUnit = parseFloat(purchaseCost) || 0;
	const productScenario = (0, import_react.useMemo)(() => {
		if (isMeasurementUnit(baseUnitId)) return "measurement";
		if (isPackagingUnit(baseUnitId)) return "packaging";
		return "simple";
	}, [baseUnitId]);
	const buildPayload = (0, import_react.useCallback)(() => {
		const stockQty = parseFloat(openingStock) || 0;
		const catId = categories.find((c) => c.name === category)?.id || null;
		const mergedSellingUnits = [...derivedUnits.map((du) => ({
			name: du.name,
			quantity: du.quantity,
			sale_price: du.salePrice ?? 0,
			is_default: false,
			product_unit_id: du.productUnitId
		})), ...sellingUnits.filter((su) => !su.packagingId && !derivedUnits.some((du) => du.productUnitId === su.productUnitId)).map((su) => ({
			name: su.name,
			quantity: su.quantity,
			sale_price: su.salePrice,
			is_default: su.isDefault,
			product_unit_id: su.productUnitId ?? null
		}))];
		if (mergedSellingUnits.length === 0 || !mergedSellingUnits.some((su) => su.is_default)) if (mergedSellingUnits.length > 0) mergedSellingUnits[0].is_default = true;
		else {
			const unit = getUnit(baseUnitId);
			mergedSellingUnits.push({
				name: unit?.name || "Piece",
				quantity: 1,
				sale_price: sellingPrice,
				is_default: true,
				product_unit_id: null
			});
		}
		return {
			name: name.trim(),
			sku: sku || (category ? generateSku(category, skuSequence) : `PRD-${String(skuSequence).padStart(3, "0")}`),
			category_id: catId,
			barcode: barcode || "",
			description: description || "",
			product_type: "simple",
			base_unit_id: baseUnitId,
			selling_units: mergedSellingUnits,
			packaging: packagingLevels.filter((pl) => pl.containerUnitId && pl.containsUnitId && pl.quantity > 0).map((pl) => ({
				container_unit_id: pl.containerUnitId,
				contains_unit_id: pl.containsUnitId,
				quantity: pl.quantity,
				level: pl.level
			})),
			stock_quantity: stockQty,
			low_stock_threshold: parseInt(lowStockThreshold) || 100,
			default_purchase_cost: purchaseCost ? parseFloat(purchaseCost) : null,
			allow_negative_stock: allowNegativeStock,
			status: stockQty === 0 ? "out-of-stock" : "in-stock"
		};
	}, [
		name,
		sku,
		skuSequence,
		category,
		barcode,
		description,
		baseUnitId,
		sellingUnits,
		packagingLevels,
		derivedUnits,
		sellingPrice,
		openingStock,
		lowStockThreshold,
		purchaseCost,
		allowNegativeStock,
		categories
	]);
	const validate = (0, import_react.useCallback)(() => {
		if (!name.trim()) {
			toast.error("Product name is required");
			nameInputRef.current?.focus();
			return false;
		}
		return true;
	}, [name]);
	const handleSave = (0, import_react.useCallback)((stay = false) => {
		if (!validate()) return;
		setSaving(true);
		const fullPayload = {
			...buildPayload(),
			_stay: stay
		};
		if (product?.id) fullPayload._product_id = product.id;
		const url = product?.id ? `/inventory/product/${product.id}` : "/inventory";
		router3[product?.id ? "put" : "post"](url, fullPayload, {
			onSuccess: () => {
				toast.success(`${name.trim()} ${isEditing ? "updated" : "saved"} ✓`);
				if (stay && !isEditing) {
					setSkuSequence((s) => s + 1);
					setSessionCount((c) => c + 1);
					setName("");
					setOpeningStock("");
					setPackagingLevels([]);
					setPreviewUnits([]);
					setSellingUnits([{
						id: "default",
						name: getUnit(baseUnitId)?.name || "Piece",
						unitId: baseUnitId,
						quantity: 1,
						salePrice: 0,
						isDefault: true,
						productUnitId: null,
						packagingId: null
					}]);
					setTimeout(() => nameInputRef.current?.focus(), 0);
				}
				setSaving(false);
			},
			onError: (errs) => {
				const msg = Object.values(errs).join(", ") || "Failed to save product";
				toast.error(msg);
				setSaving(false);
			}
		});
	}, [
		name,
		isEditing,
		baseUnitId,
		validate,
		buildPayload,
		product?.id
	]);
	const handleKeyDown = (0, import_react.useCallback)((e) => {
		if (e.key === "Enter" && !e.ctrlKey && !e.metaKey && !e.shiftKey) {
			e.preventDefault();
			handleSave(true);
		}
		if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
			e.preventDefault();
			handleSave(false);
		}
	}, [handleSave]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "max-w-2xl mx-auto space-y-5",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex items-center justify-between",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [isEditing && product && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "text-xs text-muted-foreground mb-0.5",
				children: [
					"Editing: ",
					product.name,
					" · SKU: ",
					product.sku
				]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
				className: "text-xl sm:text-2xl font-semibold tracking-tight",
				children: isEditing ? "Edit Product" : "Add Product"
			})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-center gap-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
					size: "sm",
					variant: "outline",
					onClick: () => handleSave(true),
					disabled: saving,
					className: "gap-1.5 hidden sm:inline-flex",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Save, { className: "size-3.5" }), " Save & Add Next"]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
					size: "sm",
					onClick: () => handleSave(false),
					disabled: saving,
					className: "gap-1.5 shadow-sm",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Save, { className: "size-3.5" }),
						" ",
						saving ? "Saving..." : "Save"
					]
				})]
			})]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Card, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardContent, {
			className: "p-4 sm:p-6 space-y-5",
			onKeyDown: handleKeyDown,
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "space-y-1.5",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
						className: "block text-xs font-medium text-foreground",
						children: ["Product Name ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-red-500",
							children: "*"
						})]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
						ref: nameInputRef,
						type: "text",
						placeholder: "e.g. Enter product name",
						value: name,
						onChange: (e) => setName(e.target.value),
						className: "w-full h-12 px-4 rounded-lg border border-input bg-background text-base outline-none focus:border-ring focus:ring-1 focus:ring-ring/30 transition-shadow"
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "grid grid-cols-1 sm:grid-cols-2 gap-4",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "space-y-1.5",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
							className: "block text-xs font-medium text-foreground",
							children: "Your Cost (Rs.)"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "relative",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground font-medium",
								children: "Rs."
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								type: "number",
								placeholder: "0",
								value: purchaseCost,
								onChange: (e) => setPurchaseCost(e.target.value),
								className: "w-full h-10 pl-10 pr-3 rounded-lg border border-input bg-background text-sm outline-none focus:border-ring focus:ring-1 focus:ring-ring/30",
								min: "0",
								step: "0.01"
							})]
						})]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "space-y-1.5",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
								className: "block text-xs font-medium text-foreground",
								children: ["Selling Price (Rs.) ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-red-500",
									children: "*"
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "relative",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground font-medium",
									children: "Rs."
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
									type: "number",
									placeholder: "0",
									value: sellingPrice,
									onChange: (e) => {
										setSellingPrice(parseFloat(e.target.value) || 0);
										setSellingUnits((prev) => prev.map((su, i) => i === 0 ? {
											...su,
											salePrice: parseFloat(e.target.value) || 0
										} : su));
									},
									className: "w-full h-10 pl-10 pr-3 rounded-lg border border-input bg-background text-sm outline-none focus:border-ring focus:ring-1 focus:ring-ring/30",
									min: "0",
									step: "0.01"
								})]
							}),
							sellingPrice <= 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-[11px] text-amber-600 dark:text-amber-400",
								children: "Set your selling price"
							})
						]
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "grid grid-cols-1 sm:grid-cols-2 gap-4",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "space-y-1.5",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
							className: "block text-xs font-medium text-foreground",
							children: "Unit"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(UnitSelect, {
							value: baseUnitId,
							onChange: setBaseUnitId
						})]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "space-y-1.5",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
							className: "block text-xs font-medium text-foreground",
							children: "Category"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CategorySelector, {
							categories,
							value: category,
							onChange: setCategory
						})]
					})]
				}),
				productScenario === "packaging" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "space-y-2 px-3 py-3 rounded-lg bg-primary/[0.04]",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "text-xs font-medium text-foreground",
							children: ["Selling in ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "font-semibold",
								children: getUnit(baseUnitId)?.name || baseUnitId
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center gap-2 flex-wrap",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
									className: "text-xs text-muted-foreground",
									children: ["Each ", getUnit(baseUnitId)?.name || baseUnitId]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-muted-foreground",
									children: "="
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
									type: "number",
									value: pkgConversionQty || "",
									onChange: (e) => setPkgConversionQty(parseFloat(e.target.value) || 0),
									placeholder: "Qty",
									min: "0.01",
									step: "any",
									className: "w-16 h-8 px-2 rounded border border-input bg-background text-xs text-center outline-none focus:border-ring focus:ring-1 focus:ring-ring/30"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-xs text-muted-foreground",
									children: "×"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(InlineUnitSelect, {
									value: pkgConversionUnitId,
									onChange: (id) => {
										setPkgConversionUnitId(id);
										if (id) {}
									},
									placeholder: "unit",
									excludeId: baseUnitId
								})
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center gap-3 text-xs",
							children: [pkgConversionUnitId && pkgConversionQty > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "text-muted-foreground",
								children: [
									"✓ ",
									getUnit(baseUnitId)?.name || baseUnitId,
									" × ",
									pkgConversionQty,
									" ",
									getUnit(pkgConversionUnitId)?.name || pkgConversionUnitId,
									" per unit"
								]
							}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "text-muted-foreground/60",
								children: [
									"Define what each ",
									getUnit(baseUnitId)?.name || baseUnitId,
									" contains"
								]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								onClick: () => setAdvancedOpen(true),
								className: "text-primary underline ml-auto",
								children: "Multi-level packaging"
							})]
						})
					]
				}),
				productScenario === "measurement" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center gap-2 px-3 py-2 rounded-lg bg-primary/[0.04] text-xs text-muted-foreground",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "⚙️" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [
						"Measurement product — selling in ",
						baseUnitId,
						" and sub-units is automatic"
					] })]
				}),
				productScenario === "simple" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center gap-2 px-3 py-2 rounded-lg bg-muted/30 text-xs text-muted-foreground",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "•" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: ["Selling as ", getUnit(baseUnitId)?.name || baseUnitId] })]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SectionDivider, {}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
					type: "button",
					onClick: () => setAdvancedOpen(!advancedOpen),
					className: "w-full flex items-center justify-between py-1 group",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Settings2, { className: "size-4 text-muted-foreground group-hover:text-foreground transition-colors" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-sm font-medium text-foreground",
							children: "More Options"
						})]
					}), advancedOpen ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronUp, { className: "size-4 text-muted-foreground" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronDown, { className: "size-4 text-muted-foreground" })]
				}), advancedOpen && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-4 space-y-5 pt-4 border-t border-border",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "grid grid-cols-1 sm:grid-cols-2 gap-4",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "space-y-1.5",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
									className: "block text-xs font-medium text-foreground",
									children: "Barcode"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
									type: "text",
									placeholder: "Optional",
									value: barcode,
									onChange: (e) => setBarcode(e.target.value),
									className: "w-full h-10 px-3 rounded-lg border border-input bg-background text-sm outline-none focus:border-ring focus:ring-1 focus:ring-ring/30 font-mono"
								})]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "space-y-1.5",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
									className: "block text-xs font-medium text-foreground",
									children: "SKU"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
									type: "text",
									placeholder: "Auto-generated",
									value: sku,
									onChange: (e) => setSku(e.target.value),
									className: "w-full h-10 px-3 rounded-lg border border-input bg-background text-sm outline-none focus:border-ring focus:ring-1 focus:ring-ring/30 font-mono text-xs"
								})]
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "grid grid-cols-1 sm:grid-cols-2 gap-4",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "space-y-1.5",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
									className: "block text-xs font-medium text-foreground",
									children: isEditing ? "Current Stock" : "Starting Quantity"
								}), isEditing ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "w-full h-10 px-3 rounded-lg border border-input bg-muted text-sm leading-10",
									children: [
										product?.stock_quantity ?? 0,
										" ",
										getUnit(baseUnitId)?.name || baseUnitId
									]
								}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
									type: "number",
									placeholder: "0",
									value: openingStock,
									onChange: (e) => setOpeningStock(e.target.value),
									className: "w-full h-10 px-3 rounded-lg border border-input bg-background text-sm outline-none focus:border-ring focus:ring-1 focus:ring-ring/30",
									min: "0"
								})]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "space-y-1.5",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
									className: "block text-xs font-medium text-foreground",
									children: "Minimum Stock"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
									type: "number",
									placeholder: "10",
									value: lowStockThreshold,
									onChange: (e) => setLowStockThreshold(e.target.value),
									className: "w-full h-10 px-3 rounded-lg border border-input bg-background text-sm outline-none focus:border-ring focus:ring-1 focus:ring-ring/30",
									min: "0"
								})]
							})]
						}),
						(productScenario === "packaging" || packagingLevels.length > 0) && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "pt-1",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PackagingLevelsBuilder, {
								levels: packagingLevels,
								onChange: setPackagingLevels,
								baseUnitId,
								onPreview: setPreviewUnits,
								disabled: false
							})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h4", {
								className: "text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3",
								children: "Selling Sizes"
							}),
							derivedUnits.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "mb-3 space-y-1",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-[10px] text-muted-foreground",
									children: "Auto-generated from packaging:"
								}), derivedUnits.map((du) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DerivedUnitRow, {
									unit: du,
									sellingUnit: sellingUnits.find((su) => su.productUnitId === du.product_unit_id),
									onPriceChange: (price) => {
										setSellingUnits((prev) => {
											if (prev.find((su) => su.productUnitId === du.product_unit_id)) return prev.map((su) => su.productUnitId === du.product_unit_id ? {
												...su,
												salePrice: price
											} : su);
											getUnit(baseUnitId);
											return [...prev, {
												id: `su-${du.product_unit_id}`,
												name: du.name,
												unitId: baseUnitId,
												quantity: du.quantity,
												salePrice: price,
												isDefault: prev.length === 0,
												productUnitId: du.product_unit_id,
												packagingId: du.packagingId ?? null
											}];
										});
									}
								}, du.product_unit_id))]
							}),
							sellingUnits.filter((su) => !su.packagingId && !derivedUnits.some((du) => du.productUnitId === su.productUnitId)).map((su, idx) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SellingUnitRow, {
								unit: su,
								isDefault: idx === 0 && derivedUnits.length === 0,
								costPerBaseUnit,
								baseUnitId,
								onChange: (updated) => setSellingUnits((prev) => prev.map((s) => s.id === updated.id ? updated : s)),
								onRemove: idx > 0 || derivedUnits.length > 0 ? () => {
									setSellingUnits((prev) => prev.filter((s) => s.id !== su.id));
								} : void 0,
								defaultSalePrice: sellingPrice
							}, su.id)),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
								type: "button",
								onClick: () => {
									const unit = getUnit(baseUnitId);
									setSellingUnits((prev) => [...prev, {
										id: `su-${Date.now()}`,
										name: unit?.name || "Piece",
										unitId: baseUnitId,
										quantity: 1,
										salePrice: 0,
										isDefault: prev.length === 0 && derivedUnits.length === 0,
										productUnitId: null,
										packagingId: null
									}]);
								},
								className: "mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:text-primary/80 transition-colors",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, { className: "size-3.5" }), " Add Custom Size"]
							})
						] }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SectionDivider, {}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
							className: "flex items-center gap-3 cursor-pointer",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								type: "checkbox",
								checked: allowNegativeStock,
								onChange: (e) => setAllowNegativeStock(e.target.checked),
								className: "size-4 rounded border-gray-300 accent-primary focus:ring-primary/30"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-sm font-medium text-foreground",
								children: "Allow Negative Stock"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-[11px] text-muted-foreground",
								children: "Permit sales when stock is insufficient."
							})] })]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SectionDivider, {}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "space-y-1.5",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
								className: "block text-xs font-medium text-foreground",
								children: "Description"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("textarea", {
								placeholder: "Optional product description...",
								value: description,
								onChange: (e) => setDescription(e.target.value),
								rows: 2,
								className: "w-full px-3 py-2 rounded-lg border border-input bg-background text-sm outline-none focus:border-ring focus:ring-1 focus:ring-ring/30 resize-none"
							})]
						})
					]
				})] }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "sticky bottom-0 -mx-4 sm:-mx-6 px-4 sm:px-6 py-3 bg-card border-t border-border mt-6 flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:justify-between z-10",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center gap-2 text-xs text-muted-foreground",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("kbd", {
								className: "inline-flex items-center justify-center size-5 rounded bg-muted text-[10px] font-mono",
								children: "↵"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Save & Add Next" }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "mx-1.5",
								children: "·"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("kbd", {
								className: "inline-flex items-center justify-center size-5 rounded bg-muted text-[10px] font-mono",
								children: "⌘↵"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Save & View" })
						]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-stretch sm:items-center gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
							variant: "outline",
							size: "lg",
							onClick: () => handleSave(false),
							disabled: saving,
							className: "gap-1.5 flex-1 sm:flex-initial",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Save, { className: "size-4" }), " Save & View"]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
							size: "lg",
							onClick: () => handleSave(true),
							disabled: saving,
							className: "gap-1.5 shadow-sm flex-1 sm:flex-initial",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Save, { className: "size-4" }), " Save & Add Next"]
						})]
					})]
				})
			]
		}) })]
	});
}
function UnitSelect({ value, onChange }) {
	const [open, setOpen] = (0, import_react.useState)(false);
	const [search, setSearch] = (0, import_react.useState)("");
	const inputRef = (0, import_react.useRef)(null);
	const panelRef = (0, import_react.useRef)(null);
	const allOptions = getBaseUnitOptions().flatMap((g) => g.options.map((o) => ({
		id: o.value,
		label: o.label
	})));
	const filtered = (0, import_react.useMemo)(() => {
		if (!search) return allOptions.filter((o) => o.id !== value);
		return allOptions.filter((o) => o.label.toLowerCase().includes(search.toLowerCase()) && o.id !== value);
	}, [
		search,
		allOptions,
		value
	]);
	(0, import_react.useEffect)(() => {
		function handleClick(e) {
			if (panelRef.current && !panelRef.current.contains(e.target) && inputRef.current && !inputRef.current.contains(e.target)) {
				setOpen(false);
				setSearch("");
			}
		}
		document.addEventListener("mousedown", handleClick);
		return () => document.removeEventListener("mousedown", handleClick);
	}, []);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "relative",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
			ref: inputRef,
			type: "text",
			value: open ? search : allOptions.find((o) => o.id === value)?.label || value,
			placeholder: "Unit",
			onChange: (e) => {
				setSearch(e.target.value);
				if (!open) setOpen(true);
			},
			onFocus: () => {
				setOpen(true);
				setSearch("");
			},
			className: "w-full h-10 px-3 rounded-lg border border-input bg-background text-sm outline-none focus:border-ring focus:ring-1 focus:ring-ring/30"
		}), open && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			ref: panelRef,
			className: "absolute z-50 mt-1 w-full bg-popover border border-border rounded-lg shadow-lg max-h-40 overflow-y-auto",
			children: [filtered.map((o) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				onClick: () => {
					onChange(o.id);
					setOpen(false);
					setSearch("");
				},
				className: cn("w-full px-3 py-2 text-sm text-left hover:bg-muted transition-colors", o.id === value && "bg-primary/5 text-primary font-medium"),
				children: o.label
			}, o.id)), !search && filtered.length === 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "px-3 py-2 text-xs text-muted-foreground",
				children: "No units"
			})]
		})]
	});
}
function CategorySelector({ categories, value, onChange }) {
	const [open, setOpen] = (0, import_react.useState)(false);
	const [search, setSearch] = (0, import_react.useState)("");
	const inputRef = (0, import_react.useRef)(null);
	const panelRef = (0, import_react.useRef)(null);
	const filtered = (0, import_react.useMemo)(() => !search ? categories : categories.filter((c) => c.name.toLowerCase().includes(search.toLowerCase())), [search, categories]);
	const showCreate = search.trim().length > 0 && !categories.some((c) => c.name.toLowerCase() === search.trim().toLowerCase());
	(0, import_react.useEffect)(() => {
		function handleClick(e) {
			if (panelRef.current && !panelRef.current.contains(e.target) && inputRef.current && !inputRef.current.contains(e.target)) setOpen(false);
		}
		document.addEventListener("mousedown", handleClick);
		return () => document.removeEventListener("mousedown", handleClick);
	}, []);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "relative",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
			ref: inputRef,
			type: "text",
			placeholder: "Search category...",
			value: open ? search : value,
			onChange: (e) => {
				setSearch(e.target.value);
				if (!open) setOpen(true);
			},
			onFocus: () => {
				setOpen(true);
				setSearch("");
			},
			className: "w-full h-10 px-3 rounded-lg border border-input bg-background text-sm outline-none focus:border-ring"
		}), open && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			ref: panelRef,
			className: "absolute z-50 mt-1 w-full bg-popover border border-border rounded-lg shadow-lg max-h-60 overflow-y-auto",
			children: [filtered.map((c) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
				type: "button",
				onClick: () => {
					onChange(c.name);
					setOpen(false);
					setSearch("");
				},
				className: cn("w-full flex items-center justify-between px-3 py-2 text-sm hover:bg-muted transition-colors", value === c.name && "bg-primary/5 text-primary"),
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: c.name }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "text-[10px] text-muted-foreground",
					children: c.productCount || 0
				})]
			}, c.id)), showCreate && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
				type: "button",
				onClick: () => {
					onChange(search.trim());
					setOpen(false);
					setSearch("");
				},
				className: "w-full flex items-center gap-2 px-3 py-2 text-sm text-primary hover:bg-primary/5 border-t border-border",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, { className: "size-3.5" }),
					" Create \"",
					search.trim(),
					"\""
				]
			})]
		})]
	});
}
function SellingUnitRow({ unit, isDefault, costPerBaseUnit, baseUnitId, onChange, onRemove, defaultSalePrice }) {
	const baseName = getUnit(baseUnitId)?.name || baseUnitId || "unit";
	const cost = costPerBaseUnit * (unit.quantity || 1);
	const margin = unit.salePrice > 0 ? calculateMargin(unit.salePrice, cost) : null;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: cn("flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors min-h-[40px]", isDefault ? "bg-primary/[0.04]" : "bg-card hover:bg-muted/20"),
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
				type: "text",
				value: unit.name,
				onChange: (e) => onChange({
					...unit,
					name: e.target.value
				}),
				className: "w-20 h-8 px-2 rounded border border-input bg-background text-xs outline-none focus:border-ring shrink-0",
				placeholder: "Name"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "text-[11px] text-muted-foreground shrink-0",
				children: "×"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
				type: "number",
				value: unit.quantity || 1,
				onChange: (e) => onChange({
					...unit,
					quantity: parseFloat(e.target.value) || 1
				}),
				className: "w-16 h-8 px-2 rounded border border-input bg-background text-xs text-right outline-none focus:border-ring",
				min: "0.001",
				step: "any"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "text-[11px] text-muted-foreground whitespace-nowrap truncate",
				children: baseName
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "w-24 shrink-0 relative ml-auto",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "absolute left-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground",
					children: "Rs."
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
					type: "number",
					value: unit.salePrice || "",
					onChange: (e) => onChange({
						...unit,
						salePrice: parseFloat(e.target.value) || 0
					}),
					className: "w-full h-8 pl-7 pr-2 rounded border border-input bg-background text-xs tabular-nums outline-none focus:border-ring",
					min: "0",
					step: "0.01"
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "flex-1 min-w-0 text-xs",
				children: !costPerBaseUnit ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "text-muted-foreground/60",
					children: "—"
				}) : !unit.salePrice ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
					className: "text-amber-600 tabular-nums",
					children: ["≈ Rs. ", Math.round(cost * 1.3)]
				}) : margin ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
					className: cn("tabular-nums", margin.profit >= 0 ? "text-emerald-600" : "text-red-500"),
					children: [Math.round(margin.marginPercent), "%"]
				}) : null
			}),
			onRemove && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				onClick: onRemove,
				className: "size-7 flex items-center justify-center rounded text-muted-foreground hover:text-red-500 hover:bg-red-50 transition-colors shrink-0",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "text-lg leading-none",
					children: "×"
				})
			})
		]
	});
}
function DerivedUnitRow({ unit, sellingUnit, onPriceChange }) {
	const currentPrice = sellingUnit?.salePrice ?? unit.salePrice ?? 0;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex items-center gap-2 px-3 py-2 rounded-lg bg-primary/[0.03] text-sm",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "font-medium text-foreground text-xs min-w-[60px]",
				children: unit.name
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
				className: "text-[11px] text-muted-foreground",
				children: [
					"= ",
					unit.quantity,
					" base units"
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "w-24 shrink-0 relative ml-auto",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "absolute left-2 top-1/2 -translate-y-1/2 text-[10px] text-muted-foreground",
					children: "Rs."
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
					type: "number",
					value: currentPrice || "",
					onChange: (e) => onPriceChange(parseFloat(e.target.value) || 0),
					className: "w-full h-8 pl-7 pr-2 rounded border border-input bg-background text-xs tabular-nums outline-none focus:border-ring",
					min: "0",
					step: "0.01",
					placeholder: "Set price"
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "text-[10px] text-muted-foreground shrink-0",
				children: "(generated)"
			})
		]
	});
}
function InlineUnitSelect({ value, onChange, placeholder = "unit", excludeId }) {
	const [open, setOpen] = (0, import_react.useState)(false);
	const [search, setSearch] = (0, import_react.useState)("");
	const inputRef = (0, import_react.useRef)(null);
	const panelRef = (0, import_react.useRef)(null);
	const allOptions = getBaseUnitOptions().flatMap((g) => g.options.map((o) => ({
		id: o.value,
		label: o.label
	})));
	const filtered = (0, import_react.useMemo)(() => {
		if (!search) return allOptions.filter((o) => o.id !== value && o.id !== excludeId);
		return allOptions.filter((o) => o.label.toLowerCase().includes(search.toLowerCase()) && o.id !== value && o.id !== excludeId);
	}, [
		search,
		allOptions,
		value,
		excludeId
	]);
	(0, import_react.useEffect)(() => {
		function handleClick(e) {
			if (panelRef.current && !panelRef.current.contains(e.target) && inputRef.current && !inputRef.current.contains(e.target)) {
				setOpen(false);
				setSearch("");
			}
		}
		document.addEventListener("mousedown", handleClick);
		return () => document.removeEventListener("mousedown", handleClick);
	}, []);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "relative",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
			ref: inputRef,
			type: "text",
			value: open ? search : allOptions.find((o) => o.id === value)?.label || value,
			placeholder,
			onChange: (e) => {
				setSearch(e.target.value);
				if (!open) setOpen(true);
			},
			onFocus: () => {
				setOpen(true);
				setSearch("");
			},
			className: "w-24 h-8 px-2 rounded border border-input bg-background text-xs outline-none focus:border-ring"
		}), open && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			ref: panelRef,
			className: "absolute z-50 mt-1 bg-popover border border-border rounded-lg shadow-lg max-h-40 overflow-y-auto w-36",
			children: [filtered.map((o) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				onClick: () => {
					onChange(o.id);
					setOpen(false);
					setSearch("");
				},
				className: cn("w-full px-2.5 py-1.5 text-xs text-left hover:bg-muted transition-colors", o.id === value && "bg-primary/5 text-primary"),
				children: o.label
			}, o.id)), filtered.length === 0 && !search && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "px-2.5 py-1.5 text-xs text-muted-foreground",
				children: "Type to search"
			})]
		})]
	});
}
function SectionDivider() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "border-t border-border/60" });
}
//#endregion
export { ProductForm_exports as n, ProductForm as t };
