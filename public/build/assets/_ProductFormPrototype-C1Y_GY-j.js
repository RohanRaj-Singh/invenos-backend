import { i as __toESM, t as require_react } from "./react-DCO0ASPG.js";
import { t as createLucideIcon } from "./createLucideIcon--nD-f_FR.js";
import { t as ChevronUp } from "./chevron-up-BF5n-Dc8.js";
import { t as Save } from "./save-D4S_dtxM.js";
import { t as Sparkles } from "./sparkles-L4t5n-If.js";
import { t as Trash2 } from "./trash-2-D6E37i_K.js";
import { a as getDefaultUnitForCategory, i as getBaseUnitOptions, o as getUnit } from "./units-CsePzNz6.js";
import { t as cn } from "./utils-Bim8RyS4.js";
import { t as require_jsx_runtime } from "./jsx-runtime-BjJQA5sn.js";
import { t as Button } from "./button-phKcTdak.js";
import { D as categories, J as SheetContent, St as ChevronDown, X as SheetTitle, Y as SheetHeader, _t as Plus, ht as Search, k as mockProducts, mt as Settings2, q as Sheet, wt as toast } from "./app-BLMvu7I3.js";
import { n as CardContent, t as Card } from "./card-DQfOgTjC.js";
import { r as ensureBackwardCompat, t as calculateMargin } from "./product-adapter-Df3GNTgA.js";
import SessionCounter from "./SessionCounter-BZ4I16rg.js";
import { t as useNavigate } from "./chunk-KS7C4IRE-DX0Jponj.js";
/**
* @license lucide-react v1.26.0 - ISC
*
* This source code is licensed under the ISC license.
* See the LICENSE file in the root directory of this source tree.
*/
var Beaker = createLucideIcon("beaker", [
	["path", {
		d: "M4.5 3h15",
		key: "c7n0jr"
	}],
	["path", {
		d: "M6 3v16a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V3",
		key: "m1uhx7"
	}],
	["path", {
		d: "M6 14h12",
		key: "4cwo0f"
	}]
]);
//#endregion
//#region resources/js/Pages/inventory/components/_ProductFormPrototype.tsx
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
	return `${getCategoryPrefix(category)}-${String(sequence).padStart(3, "0")}`;
}
function CategoryCombobox({ value, onChange }) {
	const [open, setOpen] = (0, import_react.useState)(false);
	const [search, setSearch] = (0, import_react.useState)("");
	const inputRef = (0, import_react.useRef)(null);
	const panelRef = (0, import_react.useRef)(null);
	const filtered = (0, import_react.useMemo)(() => {
		if (!search) return categories;
		return categories.filter((c) => c.name.toLowerCase().includes(search.toLowerCase()));
	}, [search]);
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
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "relative",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Search, { className: "absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
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
				onKeyDown: (e) => {
					if (e.key === "Enter" && open && filtered.length > 0) {
						e.preventDefault();
						e.stopPropagation();
						const sel = filtered[0];
						if (sel) {
							onChange(sel.name);
							setOpen(false);
							setSearch("");
						}
					}
					if (e.key === "Escape" && open) {
						e.stopPropagation();
						setOpen(false);
						setSearch("");
					}
				},
				className: "w-full h-10 pl-9 pr-3 rounded-lg border border-input bg-background text-sm outline-none focus:border-ring focus:ring-1 focus:ring-ring/30"
			})]
		}), open && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			ref: panelRef,
			className: "absolute z-50 mt-1 w-full bg-popover border border-border rounded-lg shadow-lg max-h-60 overflow-y-auto",
			children: [
				filtered.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "py-1",
					children: filtered.map((cat) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						type: "button",
						onClick: () => {
							onChange(cat.name);
							setOpen(false);
							setSearch("");
						},
						className: cn("w-full flex items-center justify-between px-3 py-2 text-sm hover:bg-muted transition-colors", value === cat.name && "bg-primary/5 text-primary"),
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: cat.name }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: "text-[10px] text-muted-foreground",
							children: [cat.productCount, " products"]
						})]
					}, cat.id))
				}),
				showCreate && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
					type: "button",
					onClick: () => {
						onChange(search.trim());
						setOpen(false);
						setSearch("");
					},
					className: "w-full flex items-center gap-2 px-3 py-2 text-sm text-primary hover:bg-primary/5 transition-colors border-t border-border",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, { className: "size-3.5" }),
						"Create \"",
						search.trim(),
						"\""
					]
				}),
				!showCreate && filtered.length === 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "px-3 py-2 text-sm text-muted-foreground",
					children: "No categories found"
				})
			]
		})]
	});
}
function CategorySheet({ value, onChange, children }) {
	const [open, setOpen] = (0, import_react.useState)(false);
	const [search, setSearch] = (0, import_react.useState)("");
	const filtered = (0, import_react.useMemo)(() => {
		if (!search) return categories;
		return categories.filter((c) => c.name.toLowerCase().includes(search.toLowerCase()));
	}, [search]);
	const showCreate = search.trim().length > 0 && !categories.some((c) => c.name.toLowerCase() === search.trim().toLowerCase());
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Sheet, {
		open,
		onOpenChange: setOpen,
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			onClick: () => setOpen(true),
			children
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SheetContent, {
			side: "bottom",
			className: "max-h-[70vh]",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SheetHeader, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SheetTitle, { children: "Select Category" }) }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "px-4 pb-4",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "relative mb-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Search, { className: "absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
						type: "text",
						placeholder: "Search category...",
						value: search,
						onChange: (e) => setSearch(e.target.value),
						className: "w-full h-10 pl-9 pr-3 rounded-lg border border-input bg-background text-sm outline-none focus:border-ring focus:ring-1 focus:ring-ring/30",
						autoFocus: true,
						onKeyDown: (e) => {
							if (e.key === "Enter" && filtered.length > 0) {
								e.preventDefault();
								onChange(filtered[0].name);
								setOpen(false);
								setSearch("");
							}
						}
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "space-y-1 max-h-[40vh] overflow-y-auto",
					children: [
						filtered.map((cat) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							type: "button",
							onClick: () => {
								onChange(cat.name);
								setOpen(false);
								setSearch("");
							},
							className: cn("w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-colors", value === cat.name ? "bg-primary/10 text-primary ring-1 ring-primary/30" : "text-foreground hover:bg-muted"),
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: cat.name }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "text-[10px] text-muted-foreground",
								children: [cat.productCount, " products"]
							})]
						}, cat.id)),
						showCreate && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							type: "button",
							onClick: () => {
								onChange(search.trim());
								setOpen(false);
								setSearch("");
							},
							className: "w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium text-primary hover:bg-primary/5 transition-colors",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, { className: "size-3.5" }),
								"Create \"",
								search.trim(),
								"\""
							]
						}),
						!showCreate && filtered.length === 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "px-3 py-2 text-sm text-muted-foreground",
							children: "No categories found"
						})
					]
				})]
			})]
		})]
	});
}
function UnitSelect({ value, onChange, measurementType }) {
	const baseOptions = getBaseUnitOptions();
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("select", {
		value,
		onChange: (e) => onChange(e.target.value),
		className: "w-full h-10 px-3 rounded-lg border border-input bg-background text-sm outline-none focus:border-ring focus:ring-1 focus:ring-ring/30 appearance-none cursor-pointer",
		children: (measurementType ? baseOptions.filter((g) => g.label.toLowerCase() === measurementType.toLowerCase()) : baseOptions).map((group) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("optgroup", {
			label: group.label,
			children: group.options.map((opt) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
				value: opt.value,
				children: opt.label
			}, opt.value))
		}, group.label))
	});
}
function UnitCombobox({ value, onChange, baseUnitId }) {
	const [open, setOpen] = (0, import_react.useState)(false);
	const [search, setSearch] = (0, import_react.useState)("");
	const inputRef = (0, import_react.useRef)(null);
	const panelRef = (0, import_react.useRef)(null);
	const options = getBaseUnitOptions().flatMap((g) => g.options.map((o) => ({
		id: o.value,
		label: o.label
	})));
	const displayLabel = options.find((o) => o.id === value)?.label || value;
	const filtered = (0, import_react.useMemo)(() => {
		if (!search) return options.filter((o) => o.id !== value);
		const q = search.toLowerCase();
		return options.filter((o) => o.label.toLowerCase().includes(q) && o.id !== value);
	}, [
		search,
		options,
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
			value: open ? search : displayLabel,
			placeholder: "Unit",
			onChange: (e) => {
				setSearch(e.target.value);
				if (!open) setOpen(true);
			},
			onFocus: () => {
				setOpen(true);
				setSearch("");
			},
			onKeyDown: (e) => {
				if (e.key === "Enter" && open && filtered.length > 0) {
					e.preventDefault();
					e.stopPropagation();
					onChange(filtered[0].id);
					setOpen(false);
					setSearch("");
				}
				if (e.key === "Escape" && open) {
					e.stopPropagation();
					setOpen(false);
					setSearch("");
				}
			},
			className: "h-8 px-2 rounded border border-input bg-background text-xs outline-none focus:border-ring focus:ring-1 focus:ring-ring/30",
			style: { width: "72px" }
		}), open && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			ref: panelRef,
			className: "absolute z-50 mt-1 bg-popover border border-border rounded-lg shadow-lg max-h-40 overflow-y-auto w-36",
			children: filtered.map((o) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
				type: "button",
				onClick: () => {
					onChange(o.id);
					setOpen(false);
					setSearch("");
				},
				className: cn("w-full px-2.5 py-1.5 text-xs text-left hover:bg-muted transition-colors", o.id === baseUnitId && "bg-primary/5 text-primary font-medium"),
				children: [
					o.label,
					" ",
					o.id === baseUnitId ? "(base)" : ""
				]
			}, o.id))
		})]
	});
}
function SellingUnitRow({ unit, isDefault, costPerBaseUnit, baseUnitId, onChange, onRemove, defaultSalePrice }) {
	const aIsBase = unit.unitId === baseUnitId;
	const qty = unit.quantity;
	const cost = qty > 0 ? aIsBase ? costPerBaseUnit / qty : costPerBaseUnit * qty : 0;
	const handleAChange = (v) => {
		if (v === baseUnitId && unit.unitId === baseUnitId) return;
		onChange({
			...unit,
			unitId: v === baseUnitId ? baseUnitId : v
		});
	};
	const handleBChange = (v) => {
		if (v === baseUnitId && unit.unitId === baseUnitId) return;
		onChange({
			...unit,
			unitId: v === baseUnitId ? baseUnitId : v
		});
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: cn("flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors min-h-[40px]", isDefault ? "bg-primary/[0.04]" : "bg-card hover:bg-muted/20"),
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(UnitCombobox, {
				value: aIsBase ? baseUnitId : unit.unitId,
				baseUnitId,
				onChange: handleAChange
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "text-[11px] text-muted-foreground shrink-0 text-center w-10",
				children: "1 ="
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
				type: "number",
				value: qty || "",
				placeholder: "1",
				step: "any",
				onChange: (e) => onChange({
					...unit,
					quantity: parseFloat(e.target.value) || 1
				}),
				className: "w-16 h-8 px-2 rounded border border-input bg-background text-xs tabular-nums outline-none focus:border-ring focus:ring-1 focus:ring-ring/30 shrink-0",
				min: "0.001"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(UnitCombobox, {
				value: aIsBase ? unit.unitId : baseUnitId,
				baseUnitId,
				onChange: handleBChange
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "w-24 shrink-0 relative",
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
					className: "w-full h-8 pl-7 pr-2 rounded border border-input bg-background text-xs tabular-nums outline-none focus:border-ring focus:ring-1 focus:ring-ring/30",
					min: "0",
					step: "0.01"
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "flex-1 min-w-0 text-xs",
				children: !costPerBaseUnit ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "text-muted-foreground/60",
					children: "Add cost"
				}) : !unit.salePrice ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
					className: "text-amber-600 tabular-nums",
					children: ["≈ Rs. ", Math.round(defaultSalePrice > 0 ? defaultSalePrice * qty : cost * 1.3)]
				}) : (() => {
					const { profit, marginPercent } = calculateMargin(unit.salePrice, cost);
					return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
						className: cn("tabular-nums", profit >= 0 ? "text-emerald-600" : "text-red-500"),
						children: [
							"Cost ",
							Math.round(cost),
							" · ",
							Math.round(marginPercent),
							"%"
						]
					});
				})()
			}),
			onRemove && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				onClick: onRemove,
				className: "size-7 flex items-center justify-center rounded text-muted-foreground hover:text-red-500 hover:bg-red-50 transition-colors shrink-0",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash2, { className: "size-3" })
			})
		]
	});
}
function ProductForm() {
	const navigate = useNavigate();
	const [name, setName] = (0, import_react.useState)("");
	const [category, setCategory] = (0, import_react.useState)("");
	const [barcode, setBarcode] = (0, import_react.useState)("");
	const [productType, setProductType] = (0, import_react.useState)("simple");
	const [baseUnitId, setBaseUnitId] = (0, import_react.useState)("piece");
	const [openingStock, setOpeningStock] = (0, import_react.useState)("");
	const [lowStockThreshold] = (0, import_react.useState)("100");
	const [sellingUnits, setSellingUnits] = (0, import_react.useState)([{
		id: "default",
		name: "Piece",
		unitId: "piece",
		quantity: 1,
		salePrice: 0,
		isDefault: true
	}]);
	const [advancedOpen, setAdvancedOpen] = (0, import_react.useState)(false);
	const [purchaseCost, setPurchaseCost] = (0, import_react.useState)("");
	const [ingredientSearch, setIngredientSearch] = (0, import_react.useState)("");
	const [ingredientSearchOpen, setIngredientSearchOpen] = (0, import_react.useState)(false);
	const [ingredients, setIngredients] = (0, import_react.useState)([]);
	const ingredientSearchRef = (0, import_react.useRef)(null);
	const costPerBaseUnit = parseFloat(purchaseCost) || 0;
	const totalIngredientCost = (0, import_react.useMemo)(() => {
		if (ingredients.length === 0) return 0;
		return ingredients.reduce((sum, ing) => {
			const product = mockProducts.find((p) => p.id === ing.productId);
			if (!product || !product.purchaseConfig) return sum;
			return sum + product.purchaseConfig.cost / product.purchaseConfig.quantity * (parseFloat(ing.quantity) || 0);
		}, 0);
	}, [ingredients]);
	const ingredientSearchResults = (0, import_react.useMemo)(() => {
		if (!ingredientSearch.trim()) return [];
		const q = ingredientSearch.toLowerCase();
		return mockProducts.filter((p) => p.name.toLowerCase().includes(q) && !ingredients.some((i) => i.productId === p.id)).slice(0, 20);
	}, [ingredientSearch, ingredients]);
	const [skuSequence, setSkuSequence] = (0, import_react.useState)(() => mockProducts.length + 1);
	const [sku, setSku] = (0, import_react.useState)("");
	(0, import_react.useEffect)(() => {
		if (category) {
			setSku(generateSku(category, skuSequence));
			if (!baseUnitId) setBaseUnitId(getDefaultUnitForCategory(category));
		} else setSku("");
	}, [category, skuSequence]);
	(0, import_react.useEffect)(() => {
		const unit = getUnit(baseUnitId);
		if (unit) setSellingUnits((prev) => {
			const defaultUnit = prev.find((su) => su.isDefault);
			return [{
				id: "default",
				name: unit.name,
				unitId: baseUnitId,
				quantity: 1,
				salePrice: defaultUnit?.salePrice ?? 0,
				isDefault: true
			}];
		});
	}, [baseUnitId]);
	(0, import_react.useEffect)(() => {
		function handleClick(e) {
			if (ingredientSearchRef.current && !ingredientSearchRef.current.contains(e.target)) setIngredientSearchOpen(false);
		}
		document.addEventListener("mousedown", handleClick);
		return () => document.removeEventListener("mousedown", handleClick);
	}, []);
	const [description, setDescription] = (0, import_react.useState)("");
	const [sessionCount, setSessionCount] = (0, import_react.useState)(0);
	const [saving, setSaving] = (0, import_react.useState)(false);
	const nameInputRef = (0, import_react.useRef)(null);
	(0, import_react.useEffect)(() => {
		nameInputRef.current?.focus();
	}, [sessionCount]);
	const buildProduct = (0, import_react.useCallback)((newId, currentSku) => {
		const today = (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
		const stockQty = parseInt(openingStock) || 0;
		const categoryThreshold = parseInt(lowStockThreshold) || 100;
		const newSellingUnits = sellingUnits.map((su) => ({
			...su,
			salePrice: su.salePrice || 0,
			quantity: su.quantity || 1
		}));
		if (newSellingUnits.length === 0) {
			const unit = getUnit(baseUnitId);
			newSellingUnits.push({
				id: `su-${Date.now()}-default`,
				name: unit?.name || "Piece",
				unitId: baseUnitId,
				quantity: 1,
				salePrice: 0,
				isDefault: true
			});
		}
		const productIngredients = productType === "composite" && ingredients.length > 0 ? ingredients.filter((i) => i.productId && i.quantity).map((i) => ({
			productId: i.productId,
			quantity: parseFloat(i.quantity) || 0,
			unitId: i.unitId || baseUnitId
		})) : void 0;
		const product = {
			id: newId,
			name: name.trim(),
			sku: currentSku,
			barcode: barcode || "",
			category: category || "Uncategorized",
			description: description || "",
			productType: productType !== "simple" ? productType : void 0,
			baseUnitId,
			sellingUnits: newSellingUnits,
			ingredients: productIngredients && productIngredients.length > 0 ? productIngredients : void 0,
			trackInventory: true,
			stockQuantity: stockQty,
			lowStockThreshold: categoryThreshold,
			status: stockQty === 0 ? "out-of-stock" : stockQty <= categoryThreshold ? "low-stock" : "in-stock",
			createdAt: today,
			updatedAt: today
		};
		ensureBackwardCompat(product);
		return product;
	}, [
		name,
		category,
		barcode,
		productType,
		baseUnitId,
		openingStock,
		lowStockThreshold,
		sellingUnits,
		purchaseCost,
		ingredients,
		description
	]);
	const handleSaveAndAddNext = (0, import_react.useCallback)(() => {
		if (!name.trim()) {
			toast.error("Product name is required");
			nameInputRef.current?.focus();
			return;
		}
		if (sellingUnits.length === 0 || sellingUnits.every((su) => !su.salePrice || su.salePrice <= 0)) {
			toast.error("At least one selling unit with a sale price is required");
			return;
		}
		setSaving(true);
		const newId = `prod-${String(mockProducts.length + 1).padStart(3, "0")}`;
		const currentSku = sku || (category ? generateSku(category, skuSequence) : `PRD-${String(skuSequence).padStart(3, "0")}`);
		const newProduct = buildProduct(newId, currentSku);
		mockProducts.unshift(newProduct);
		const newSeq = skuSequence + 1;
		setSkuSequence(newSeq);
		setSessionCount((c) => c + 1);
		toast.success(`${name.trim()} saved ✓`);
		setName("");
		setOpeningStock("");
		setIngredients([]);
		setSaving(false);
		setTimeout(() => nameInputRef.current?.focus(), 0);
	}, [
		name,
		sku,
		skuSequence,
		category,
		sellingUnits,
		buildProduct
	]);
	const handleSaveAndOpen = (0, import_react.useCallback)(() => {
		if (!name.trim()) {
			toast.error("Product name is required");
			nameInputRef.current?.focus();
			return;
		}
		if (sellingUnits.length === 0 || sellingUnits.every((su) => !su.salePrice || su.salePrice <= 0)) {
			toast.error("At least one selling unit with a sale price is required");
			return;
		}
		setSaving(true);
		const newId = `prod-${String(mockProducts.length + 1).padStart(3, "0")}`;
		const currentSku = sku || (category ? generateSku(category, skuSequence) : `PRD-${String(skuSequence).padStart(3, "0")}`);
		const newProduct = buildProduct(newId, currentSku);
		mockProducts.unshift(newProduct);
		setSessionCount((c) => c + 1);
		toast.success(`${name.trim()} saved ✓`);
		setSaving(false);
		navigate(`/inventory/product/${newId}`);
	}, [
		name,
		sku,
		skuSequence,
		category,
		sellingUnits,
		buildProduct,
		navigate
	]);
	const handleKeyDown = (0, import_react.useCallback)((e) => {
		if (e.key === "Enter" && !e.ctrlKey && !e.metaKey && !e.shiftKey) {
			e.preventDefault();
			handleSaveAndAddNext();
		}
		if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
			e.preventDefault();
			handleSaveAndOpen();
		}
	}, [handleSaveAndAddNext, handleSaveAndOpen]);
	const sellingUnitTemplates = (0, import_react.useMemo)(() => {
		const unit = getUnit(baseUnitId);
		const mt = unit?.measurementType;
		if (mt === "weight") return [
			{
				name: "50g Pack",
				quantity: 1e3 / 50
			},
			{
				name: "100g Pack",
				quantity: 1e3 / 100
			},
			{
				name: "250g Pack",
				quantity: 1e3 / 250
			},
			{
				name: "500g Pack",
				quantity: 1e3 / 500
			},
			{
				name: "1kg Pack",
				quantity: baseUnitId === "kg" ? 1 : 1e3
			}
		];
		if (mt === "volume") return [
			{
				name: "100ml",
				quantity: 1e3 / 100
			},
			{
				name: "250ml",
				quantity: 1e3 / 250
			},
			{
				name: "500ml",
				quantity: 1e3 / 500
			},
			{
				name: "1 Liter",
				quantity: baseUnitId === "liter" ? 1 : 1e3
			}
		];
		if (mt === "length") return [
			{
				name: "10cm",
				quantity: 100 / 10
			},
			{
				name: "50cm",
				quantity: 100 / 50
			},
			{
				name: "1m",
				quantity: baseUnitId === "meter" ? 1 : 100
			},
			{
				name: "5m",
				quantity: 1 / 5
			}
		];
		return [
			{
				name: "Half " + (unit?.name || "Unit"),
				quantity: 2
			},
			{
				name: (unit?.name || "Unit") + " (same)",
				quantity: 1
			},
			{
				name: "Double " + (unit?.name || "Unit"),
				quantity: 1 / 2
			},
			{
				name: "Quarter " + (unit?.name || "Unit"),
				quantity: 1 / .25
			}
		];
	}, [baseUnitId]);
	const addSellingUnit = (0, import_react.useCallback)((templateName, templateQty) => {
		const unit = getUnit(baseUnitId);
		const newId = `su-${Date.now()}`;
		const name = templateName || unit?.name || "Piece";
		const qty = templateQty || 1;
		const suggestedPrice = costPerBaseUnit > 0 ? Math.round(costPerBaseUnit * qty * 1.3) : 0;
		const newUnit = {
			id: newId,
			name,
			unitId: baseUnitId,
			quantity: qty,
			salePrice: suggestedPrice,
			isDefault: false
		};
		setSellingUnits((prev) => [...prev, newUnit]);
	}, [baseUnitId, costPerBaseUnit]);
	const updateSellingUnit = (0, import_react.useCallback)((updated) => {
		setSellingUnits((prev) => prev.map((su) => su.id === updated.id ? updated : su));
	}, []);
	const removeSellingUnit = (0, import_react.useCallback)((id) => {
		setSellingUnits((prev) => prev.filter((su) => su.id !== id));
	}, []);
	const handleProductTypeChange = (0, import_react.useCallback)((type) => {
		setProductType(type);
	}, []);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "max-w-2xl mx-auto space-y-5",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex items-center justify-between",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
				className: "text-xl sm:text-2xl font-semibold tracking-tight",
				children: "Add Product"
			}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "flex items-center gap-2",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SessionCounter, { count: sessionCount })
			})]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Card, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardContent, {
			className: "p-4 sm:p-6 space-y-5",
			onKeyDown: handleKeyDown,
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FormField, {
					label: "Product Name",
					required: true,
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
						ref: nameInputRef,
						type: "text",
						placeholder: "e.g. Enter product name",
						value: name,
						onChange: (e) => setName(e.target.value),
						className: "w-full h-12 px-4 rounded-lg border border-input bg-background text-base outline-none focus:border-ring focus:ring-1 focus:ring-ring/30 transition-shadow"
					})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "grid grid-cols-1 sm:grid-cols-2 gap-4",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(FormField, {
						label: "Category",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "hidden sm:block",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CategoryCombobox, {
								value: category,
								onChange: setCategory
							})
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "sm:hidden",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CategorySheet, {
								value: category,
								onChange: setCategory,
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									type: "button",
									className: "w-full h-10 px-3 rounded-lg border border-input bg-background text-sm text-left outline-none focus:border-ring focus:ring-1 focus:ring-ring/30",
									children: category || /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "text-muted-foreground",
										children: "Select category"
									})
								})
							})
						})]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(FormField, {
						label: "Barcode (optional)",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							type: "text",
							placeholder: "e.g. 8901234567",
							value: barcode,
							onChange: (e) => setBarcode(e.target.value),
							className: "w-full h-10 px-3 rounded-lg border border-input bg-background text-sm outline-none focus:border-ring focus:ring-1 focus:ring-ring/30 font-mono"
						})
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "grid grid-cols-1 sm:grid-cols-2 gap-4",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FormField, {
						label: "Your Cost",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
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
						})
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(FormField, {
						label: "Selling Price",
						required: true,
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "relative",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground font-medium",
								children: "Rs."
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								type: "number",
								placeholder: "0",
								value: sellingUnits[0]?.salePrice || "",
								onChange: (e) => updateSellingUnit({
									...sellingUnits[0],
									salePrice: parseFloat(e.target.value) || 0
								}),
								className: "w-full h-10 pl-10 pr-3 rounded-lg border border-input bg-background text-sm outline-none focus:border-ring focus:ring-1 focus:ring-ring/30",
								min: "0",
								step: "0.01"
							})]
						}), (!sellingUnits[0]?.salePrice || sellingUnits[0].salePrice <= 0) && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-[11px] text-amber-600 dark:text-amber-400 mt-1",
							children: "Set your selling price"
						})]
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "text-xs text-muted-foreground",
						children: "Type:"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex rounded-lg border border-input overflow-hidden",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							onClick: () => handleProductTypeChange("simple"),
							className: cn("px-3 py-1.5 text-xs font-medium transition-colors", productType === "simple" ? "bg-primary text-primary-foreground" : "bg-background text-foreground hover:bg-muted"),
							children: "I Buy & Sell"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							onClick: () => handleProductTypeChange("composite"),
							className: cn("px-3 py-1.5 text-xs font-medium transition-colors border-l border-input", productType === "composite" ? "bg-primary text-primary-foreground" : "bg-background text-foreground hover:bg-muted"),
							children: "I Make It"
						})]
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "grid grid-cols-1 sm:grid-cols-2 gap-4",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FormField, {
						label: "Starting Quantity",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							type: "number",
							placeholder: "0",
							value: openingStock,
							onChange: (e) => setOpeningStock(e.target.value),
							className: "w-full h-10 px-3 rounded-lg border border-input bg-background text-sm outline-none focus:border-ring focus:ring-1 focus:ring-ring/30",
							min: "0"
						})
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(FormField, {
						label: "Unit",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(UnitSelect, {
							value: baseUnitId,
							onChange: setBaseUnitId
						})
					})]
				}),
				(() => {
					const defaultSU = sellingUnits[0];
					const defaultName = defaultSU?.name || getUnit(baseUnitId)?.name || baseUnitId;
					const isDifferent = defaultSU && defaultSU.name !== getUnit(baseUnitId)?.name && defaultSU.quantity !== 1;
					return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center gap-3 text-sm",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-muted-foreground text-xs",
								children: "Sold as:"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "font-medium text-foreground",
								children: defaultName
							}),
							isDifferent && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "text-xs text-muted-foreground",
								children: [
									"(",
									Number(defaultSU.quantity.toFixed(4)),
									" ",
									getUnit(baseUnitId)?.name || baseUnitId,
									" each)"
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								type: "button",
								onClick: () => setAdvancedOpen(true),
								className: "text-xs text-primary hover:underline",
								children: isDifferent ? "Change" : "Add sizes"
							})
						]
					});
				})(),
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
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h4", {
								className: "text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3",
								children: "Selling Sizes"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-center gap-1.5 mb-3",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-[10px] text-muted-foreground shrink-0",
									children: "Quick Add:"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "flex flex-wrap gap-1.5",
									children: sellingUnitTemplates.map((tmpl) => {
										const existing = sellingUnits.find((su) => su.name === tmpl.name);
										return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
											type: "button",
											disabled: !!existing,
											onClick: () => addSellingUnit(tmpl.name, tmpl.quantity),
											className: cn("inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg border text-[11px] font-medium transition-colors", existing ? "border-border bg-muted/30 text-muted-foreground/50 cursor-default" : "border-border text-muted-foreground hover:text-foreground hover:border-muted-foreground/30"),
											children: [existing ? "✓ " : "+ ", tmpl.name]
										}, tmpl.name);
									})
								})]
							}),
							sellingUnits.length > 1 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-center gap-2 px-3 text-[10px] text-muted-foreground uppercase tracking-wider",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "w-[72px] shrink-0",
										children: "Unit"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "w-10 shrink-0" }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "w-16 shrink-0" }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "w-[72px] shrink-0",
										children: "Unit"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "w-24 shrink-0",
										children: "Price"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "flex-1",
										children: "Cost & Profit"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "w-7 shrink-0" })
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "space-y-1",
								children: sellingUnits.map((su, idx) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SellingUnitRow, {
									unit: su,
									isDefault: idx === 0,
									costPerBaseUnit,
									baseUnitId,
									onChange: updateSellingUnit,
									onRemove: idx > 0 ? () => removeSellingUnit(su.id) : void 0,
									defaultSalePrice: sellingUnits[0]?.salePrice || 0
								}, su.id))
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
								type: "button",
								onClick: () => addSellingUnit(),
								className: "mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:text-primary/80 transition-colors",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, { className: "size-3.5" }), "Add Another Size"]
							})
						] }),
						productType === "composite" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SectionDivider, {}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h4", {
								className: "text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Beaker, { className: "size-3.5" }), " Manufacturing"]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								ref: ingredientSearchRef,
								className: "relative mb-3",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "relative",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Search, { className: "absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
										type: "text",
										placeholder: "Search product to add as ingredient...",
										value: ingredientSearch,
										onChange: (e) => {
											setIngredientSearch(e.target.value);
											if (!ingredientSearchOpen) setIngredientSearchOpen(true);
										},
										onFocus: () => setIngredientSearchOpen(true),
										onKeyDown: (e) => {
											if (e.key === "Enter" && ingredientSearchOpen && ingredientSearchResults.length > 0) {
												e.preventDefault();
												e.stopPropagation();
												const prod = ingredientSearchResults[0];
												setIngredients([...ingredients, {
													productId: prod.id,
													name: prod.name,
													quantity: "1",
													unitId: prod.baseUnitId || "piece"
												}]);
												setIngredientSearch("");
												setIngredientSearchOpen(false);
											}
											if (e.key === "Escape" && ingredientSearchOpen) {
												e.stopPropagation();
												setIngredientSearchOpen(false);
											}
										},
										className: "w-full h-10 pl-9 pr-3 rounded-lg border border-input bg-background text-sm outline-none focus:border-ring focus:ring-1 focus:ring-ring/30"
									})]
								}), ingredientSearchOpen && ingredientSearch.trim() && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "absolute z-50 mt-1 w-full bg-popover border border-border rounded-lg shadow-lg max-h-48 overflow-y-auto",
									children: ingredientSearchResults.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "py-1",
										children: ingredientSearchResults.map((product) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
											type: "button",
											onClick: () => {
												setIngredients([...ingredients, {
													productId: product.id,
													name: product.name,
													quantity: "1",
													unitId: product.baseUnitId || "piece"
												}]);
												setIngredientSearch("");
												setIngredientSearchOpen(false);
											},
											className: "w-full flex items-center justify-between px-3 py-2 text-sm hover:bg-muted transition-colors",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "font-medium",
												children: product.name
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "text-[10px] text-muted-foreground",
												children: getUnit(product.baseUnitId)?.name || product.baseUnitId
											})]
										}, product.id))
									}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "px-3 py-2 text-sm text-muted-foreground",
										children: "No matching products"
									})
								})]
							}),
							ingredients.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "space-y-2",
								children: ingredients.map((ing, idx) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex items-center gap-2 rounded-xl border border-border bg-card p-3",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "flex-1 text-sm font-medium text-foreground truncate min-w-0",
											children: ing.name
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
											type: "number",
											placeholder: "Qty",
											value: ing.quantity,
											onChange: (e) => {
												const updated = [...ingredients];
												updated[idx] = {
													...updated[idx],
													quantity: e.target.value
												};
												setIngredients(updated);
											},
											className: "w-20 h-8 px-2 rounded-lg border border-input bg-background text-sm outline-none focus:border-ring focus:ring-1 focus:ring-ring/30",
											min: "0",
											step: "any"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(UnitSelect, {
											value: ing.unitId,
											onChange: (v) => {
												const updated = [...ingredients];
												updated[idx] = {
													...updated[idx],
													unitId: v
												};
												setIngredients(updated);
											}
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
											type: "button",
											onClick: () => setIngredients(ingredients.filter((_, i) => i !== idx)),
											className: "size-8 flex items-center justify-center text-muted-foreground hover:text-red-500 transition-colors shrink-0",
											children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash2, { className: "size-3.5" })
										})
									]
								}, ing.productId))
							}),
							totalIngredientCost > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "mt-3 rounded-lg bg-muted/40 border border-border/50 px-4 py-3",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex items-center justify-between text-sm",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "text-muted-foreground",
										children: "Estimated ingredient cost"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
										className: "font-semibold text-foreground tabular-nums",
										children: ["Rs. ", totalIngredientCost.toFixed(2)]
									})]
								})
							})
						] })] }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SectionDivider, {}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h4", {
							className: "text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3",
							children: "Details"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "space-y-4",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FormField, {
								label: "Product Code (auto-generated)",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
									type: "text",
									placeholder: "Will be filled automatically",
									value: sku,
									onChange: (e) => setSku(e.target.value),
									className: "w-full h-10 px-3 rounded-lg border border-input bg-background text-sm outline-none focus:border-ring focus:ring-1 focus:ring-ring/30 font-mono"
								})
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(FormField, {
								label: "Description",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("textarea", {
									placeholder: "Optional product description...",
									value: description,
									onChange: (e) => setDescription(e.target.value),
									rows: 2,
									className: "w-full px-3 py-2 rounded-lg border border-input bg-background text-sm outline-none focus:border-ring focus:ring-1 focus:ring-ring/30 resize-none"
								})
							})]
						})] })
					]
				})] }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "sticky bottom-0 -mx-4 sm:-mx-6 px-4 sm:px-6 py-3 bg-card border-t border-border mt-6 flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:justify-between z-10",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
						variant: "outline",
						size: "lg",
						onClick: handleSaveAndOpen,
						disabled: saving,
						className: "sm:order-1 gap-1.5",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Save, { className: "size-4" }),
							"Save & View",
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("kbd", {
								className: "hidden sm:inline-flex items-center justify-center size-4 rounded bg-muted text-[10px] font-mono",
								children: "⌘⏎"
							})
						]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
						size: "lg",
						onClick: handleSaveAndAddNext,
						disabled: saving,
						className: "gap-1.5 shadow-sm",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Sparkles, { className: "size-4" }),
							"Save & Add Another",
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("kbd", {
								className: "hidden sm:inline-flex items-center justify-center size-4 rounded bg-primary-foreground/20 text-[10px] font-mono",
								children: "↵"
							})
						]
					})]
				})
			]
		}) })]
	});
}
function FormField({ label, required, children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "space-y-1.5",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
			className: "block text-xs font-medium text-foreground",
			children: [label, required && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "text-red-500 ml-0.5",
				children: "*"
			})]
		}), children]
	});
}
function SectionDivider() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "border-t border-border/60" });
}
//#endregion
export { ProductForm as default };
