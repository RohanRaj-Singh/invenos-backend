import { i as __toESM, r as __exportAll, t as require_react } from "./react-DCO0ASPG.js";
import { t as createLucideIcon } from "./createLucideIcon--nD-f_FR.js";
import { t as ChevronUp } from "./chevron-up-BF5n-Dc8.js";
import { t as Save } from "./save-D4S_dtxM.js";
import { i as getBaseUnitOptions, o as getUnit } from "./units-CsePzNz6.js";
import { t as cn } from "./utils-Bim8RyS4.js";
import { t as require_jsx_runtime } from "./jsx-runtime-BjJQA5sn.js";
import { t as Button } from "./button-phKcTdak.js";
import { Et as router3, Ot as axios, St as ChevronDown, _t as Plus, ct as X, mt as Settings2, wt as toast } from "./app-DCc201bC.js";
import { n as CardContent, t as Card } from "./card-DQfOgTjC.js";
import { n as resolveUnitDisplay, t as formatStock } from "./product-unit-display-ClAHr8cS.js";
/**
* @license lucide-react v1.26.0 - ISC
*
* This source code is licensed under the ISC license.
* See the LICENSE file in the root directory of this source tree.
*/
var CircleAlert = createLucideIcon("circle-alert", [
	["circle", {
		cx: "12",
		cy: "12",
		r: "10",
		key: "1mglay"
	}],
	["line", {
		x1: "12",
		x2: "12",
		y1: "8",
		y2: "12",
		key: "1pkeuh"
	}],
	["line", {
		x1: "12",
		x2: "12.01",
		y1: "16",
		y2: "16",
		key: "4dfq90"
	}]
]);
//#endregion
//#region resources/js/lib/unit-relation-validator.ts
var import_react = /* @__PURE__ */ __toESM(require_react(), 1);
/**
* Validate a set of unit relationships.
*
* Rules:
* 1. No duplicate relationships (same pair already defined)
* 2. No zero/negative quantities
* 3. No circular references
* 4. All nodes must connect to the Default Unit
*/
function validateRelationships(defaultUnitName, relationships) {
	const errors = [];
	if (relationships.length === 0) return {
		valid: true,
		errors: []
	};
	const seen = /* @__PURE__ */ new Set();
	for (const rel of relationships) {
		const key = [rel.unitName, rel.relatedUnitName].sort().join("|");
		if (seen.has(key)) errors.push(`Duplicate relationship: 1 ${rel.unitName} = ${rel.quantity} ${rel.relatedUnitName}`);
		seen.add(key);
	}
	if (errors.length > 0) return {
		valid: false,
		errors
	};
	for (const rel of relationships) if (rel.quantity <= 0) errors.push(`"${rel.unitName}" has invalid quantity (${rel.quantity}). Quantity must be greater than 0.`);
	if (errors.length > 0) return {
		valid: false,
		errors
	};
	const graph = buildGraph(relationships);
	for (const nodeName of Object.keys(graph)) if (hasCycle(nodeName, graph)) errors.push(`Circular reference detected involving "${nodeName}". Units should form a chain.`);
	if (errors.length > 0) return {
		valid: false,
		errors
	};
	const connected = findConnectedNodes(defaultUnitName, graph);
	for (const nodeName of Object.keys(graph)) if (!connected.includes(nodeName)) errors.push(`"${nodeName}" cannot be resolved back to the Default Unit ("${defaultUnitName}").`);
	return {
		valid: errors.length === 0,
		errors
	};
}
/**
* Build an undirected adjacency graph from relationships.
*/
function buildGraph(relationships) {
	const graph = {};
	for (const rel of relationships) {
		if (!graph[rel.unitName]) graph[rel.unitName] = [];
		if (!graph[rel.relatedUnitName]) graph[rel.relatedUnitName] = [];
		graph[rel.unitName].push(rel.relatedUnitName);
		graph[rel.relatedUnitName].push(rel.unitName);
	}
	return graph;
}
/**
* Detect cycles using DFS.
*/
function hasCycle(start, graph) {
	const visited = /* @__PURE__ */ new Set();
	function dfs(node, parent) {
		if (visited.has(node)) return true;
		visited.add(node);
		for (const neighbor of graph[node] || []) if (neighbor !== parent) {
			if (dfs(neighbor, node)) return true;
		}
		visited.delete(node);
		return false;
	}
	return dfs(start, null);
}
/**
* Find all nodes connected to a root via BFS.
*/
function findConnectedNodes(root, graph) {
	const visited = /* @__PURE__ */ new Set();
	const queue = [root];
	while (queue.length > 0) {
		const node = queue.shift();
		if (visited.has(node)) continue;
		visited.add(node);
		for (const neighbor of graph[node] || []) if (!visited.has(neighbor)) queue.push(neighbor);
	}
	return Array.from(visited);
}
//#endregion
//#region resources/js/lib/unit-relation-transformer.ts
/**
* Transform user-defined relationships into the backend payload format.
*
* @param defaultUnitName  The Default Unit name (e.g. "Capsule")
* @param relationships    Array of user-defined relationships
* @returns               { packaging, selling_units } matching ProductService input
*/
function transformRelationships(defaultUnitName, relationships) {
	const packaging = [];
	const sellingUnits = [];
	let level = 1;
	for (const rel of relationships) packaging.push({
		container_unit_id: null,
		contains_unit_id: null,
		quantity: rel.quantity,
		level: level++
	});
	const quantities = computeTransitiveQuantities(defaultUnitName, relationships);
	sellingUnits.push({
		name: defaultUnitName,
		unit_id: defaultUnitName.toLowerCase(),
		quantity: 1,
		sale_price: findPrice(defaultUnitName, relationships),
		purchase_cost: null,
		barcode: null,
		is_default: true,
		product_unit_id: null
	});
	for (const rel of relationships) {
		const qty = quantities[rel.unitName];
		if (qty === void 0 || qty <= 0) continue;
		if (rel.unitName === defaultUnitName) continue;
		sellingUnits.push({
			name: rel.unitName,
			unit_id: rel.relatedUnitName.toLowerCase(),
			quantity: qty,
			sale_price: rel.salePrice ?? null,
			purchase_cost: rel.purchaseCost ?? null,
			barcode: rel.barcode ?? null,
			is_default: false,
			product_unit_id: null
		});
	}
	for (const rel of relationships) {
		const childName = rel.relatedUnitName;
		if (childName === defaultUnitName) continue;
		if (sellingUnits.some((su) => su.name === childName)) continue;
		if (relationships.some((r) => r.unitName === childName)) continue;
		const qty = quantities[childName];
		if (qty === void 0 || qty <= 0) continue;
		sellingUnits.push({
			name: childName,
			unit_id: childName.toLowerCase(),
			quantity: qty,
			sale_price: findPrice(childName, relationships),
			purchase_cost: null,
			barcode: null,
			is_default: false,
			product_unit_id: null
		});
	}
	return {
		packaging,
		selling_units: sellingUnits
	};
}
/**
* Compute transitive quantities for each unit relative to the Default Unit.
*
* For: Box → 12 → Strip → 10 → Capsule (Default)
*   Capsule = 1
*   Strip   = 10
*   Box     = 120
*/
function computeTransitiveQuantities(defaultUnitName, relationships) {
	const quantities = { [defaultUnitName]: 1 };
	const maxIterations = relationships.length + 1;
	for (let i = 0; i < maxIterations; i++) {
		let changed = false;
		for (const rel of relationships) {
			const parentQty = quantities[rel.relatedUnitName];
			const childQty = quantities[rel.unitName];
			if (childQty !== void 0 && quantities[rel.relatedUnitName] === void 0) {
				quantities[rel.relatedUnitName] = childQty / rel.quantity;
				changed = true;
			}
			if (parentQty !== void 0 && quantities[rel.unitName] === void 0) {
				quantities[rel.unitName] = rel.quantity * parentQty;
				changed = true;
			}
		}
		if (!changed) break;
	}
	return quantities;
}
/**
* Find the sale price for a unit name from relationships.
*/
function findPrice(unitName, relationships) {
	for (const rel of relationships) if (rel.unitName === unitName && rel.salePrice !== null && rel.salePrice > 0) return rel.salePrice;
	return null;
}
//#endregion
//#region resources/js/components/unit/UnitRelationEditor.tsx
var import_jsx_runtime = require_jsx_runtime();
var nextKey = 1;
function genKey() {
	return `rel-${nextKey++}`;
}
function UnitRelationEditor({ defaultUnitId, onDefaultUnitChange, relationships, onRelationshipsChange, preview, disabled = false, error }) {
	const [validationErrors, setValidationErrors] = (0, import_react.useState)([]);
	const defaultUnitName = getUnit(defaultUnitId)?.name || defaultUnitId || "Unit";
	(0, import_react.useEffect)(() => {
		const result = validateRelationships(defaultUnitName, relationships);
		setValidationErrors(result.errors);
	}, [relationships, defaultUnitName]);
	const computedPreview = (0, import_react.useMemo)(() => {
		if (relationships.length === 0) return [];
		return transformRelationships(defaultUnitName, relationships).selling_units.map((su) => ({
			name: su.name,
			quantity: su.quantity,
			sale_price: su.sale_price || 0,
			is_default: su.is_default
		}));
	}, [relationships, defaultUnitName]);
	const displayErrors = error ? [error] : validationErrors;
	const addRelation = (0, import_react.useCallback)(() => {
		const unit = getUnit(defaultUnitId);
		onRelationshipsChange([...relationships, {
			_key: genKey(),
			unitName: unit?.name || defaultUnitId || "Unit",
			relatedUnitName: "",
			quantity: 1,
			salePrice: null,
			purchaseCost: null
		}]);
	}, [
		relationships,
		defaultUnitId,
		onRelationshipsChange
	]);
	const removeRelation = (0, import_react.useCallback)((key) => {
		onRelationshipsChange(relationships.filter((r) => r._key !== key));
	}, [relationships, onRelationshipsChange]);
	const updateRelation = (0, import_react.useCallback)((key, patch) => {
		onRelationshipsChange(relationships.map((r) => r._key === key ? {
			...r,
			...patch
		} : r));
	}, [relationships, onRelationshipsChange]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "space-y-4",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "space-y-1.5",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
						className: "text-xs font-medium text-foreground",
						children: "I count inventory in"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DefaultUnitSelect, {
						value: defaultUnitId,
						onChange: onDefaultUnitChange,
						disabled
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-[11px] text-muted-foreground",
						children: "Used for inventory tracking and preselected in transactions. You may still purchase and sell using any supported unit."
					})
				]
			}),
			relationships.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "space-y-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
					className: "text-xs font-medium text-foreground",
					children: "Other units"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "space-y-2",
					children: relationships.map((rel) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(UnitRelationRow, {
						relation: rel,
						onChange: (patch) => updateRelation(rel._key, patch),
						onRemove: () => removeRelation(rel._key),
						disabled,
						defaultUnitName
					}, rel._key))
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
				type: "button",
				onClick: addRelation,
				disabled,
				className: "inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:text-primary/80 transition-colors disabled:opacity-50",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, { className: "size-3.5" }), "Add unit"]
			}),
			displayErrors.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 p-3 space-y-1",
				children: displayErrors.map((err, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-start gap-2 text-xs text-red-600 dark:text-red-400",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CircleAlert, { className: "size-3.5 mt-0.5 shrink-0" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: err })]
				}, i))
			}),
			computedPreview.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "rounded-lg bg-muted/30 border border-border/60 p-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-[10px] font-medium text-muted-foreground uppercase tracking-wider mb-2",
					children: "Selling units (auto-generated)"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "space-y-1",
					children: computedPreview.map((su, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center justify-between text-xs",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "font-medium text-foreground",
							children: su.name
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: "text-muted-foreground",
							children: [su.quantity > 0 ? `${su.quantity} ${defaultUnitName}${su.quantity > 1 ? "s" : ""}` : "—", su.sale_price > 0 && ` · Rs. ${su.sale_price}`]
						})]
					}, i))
				})]
			})
		]
	});
}
function DefaultUnitSelect({ value, onChange, disabled }) {
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
			placeholder: "Search unit...",
			onChange: (e) => {
				setSearch(e.target.value);
				if (!open) setOpen(true);
			},
			onFocus: () => {
				setOpen(true);
				setSearch("");
			},
			disabled,
			className: "w-full h-10 px-3 rounded-lg border border-input bg-background text-sm outline-none focus:border-ring focus:ring-1 focus:ring-ring/30 disabled:opacity-50"
		}), open && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			ref: panelRef,
			className: "absolute z-50 mt-1 w-full bg-popover border border-border rounded-lg shadow-lg max-h-48 overflow-y-auto",
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
				children: "No units found"
			})]
		})]
	});
}
function UnitRelationRow({ relation, onChange, onRemove, disabled, defaultUnitName }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "rounded-lg border border-border bg-card p-3 sm:p-4",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex flex-col sm:flex-row sm:items-start gap-3",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center gap-1.5 flex-1 min-w-0",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-xs text-muted-foreground shrink-0",
							children: "1"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "flex-1 min-w-0",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(UnitAutocomplete, {
								value: relation.unitName,
								onChange: (name) => onChange({ unitName: name }),
								placeholder: "Unit name",
								disabled
							})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-xs text-muted-foreground shrink-0",
							children: "="
						})
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center gap-1.5 flex-1 min-w-0",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
						type: "number",
						value: relation.quantity || "",
						onChange: (e) => onChange({ quantity: parseFloat(e.target.value) || 0 }),
						placeholder: "Qty",
						min: "0.001",
						step: "any",
						disabled,
						className: "w-16 h-9 px-2 rounded-lg border border-input bg-background text-xs text-center outline-none focus:border-ring focus:ring-1 focus:ring-ring/30"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "flex-1 min-w-0",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(UnitAutocomplete, {
							value: relation.relatedUnitName,
							onChange: (name) => onChange({ relatedUnitName: name }),
							placeholder: "Unit",
							disabled
						})
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center gap-1.5",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "relative w-24",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "absolute left-2 top-1/2 -translate-y-1/2 text-[9px] text-muted-foreground",
								children: "Rs."
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								type: "number",
								value: relation.salePrice ?? "",
								onChange: (e) => {
									const v = parseFloat(e.target.value);
									onChange({ salePrice: isNaN(v) ? null : v });
								},
								placeholder: "Price",
								title: "Sale price per unit (leave empty if not sold in this unit)",
								min: "0",
								step: "0.01",
								disabled,
								className: "w-full h-9 pl-7 pr-2 rounded-lg border border-input bg-background text-xs text-right outline-none focus:border-ring focus:ring-1 focus:ring-ring/30"
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "relative w-24 hidden sm:block",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "absolute left-2 top-1/2 -translate-y-1/2 text-[9px] text-muted-foreground",
								children: "Rs."
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								type: "number",
								value: relation.purchaseCost ?? "",
								onChange: (e) => {
									const v = parseFloat(e.target.value);
									onChange({ purchaseCost: isNaN(v) ? null : v });
								},
								placeholder: "Cost",
								title: "Purchase cost per unit (leave empty if not purchased in this unit)",
								min: "0",
								step: "0.01",
								disabled,
								className: "w-full h-9 pl-7 pr-2 rounded-lg border border-input bg-background text-xs text-right outline-none focus:border-ring focus:ring-1 focus:ring-ring/30"
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							type: "button",
							onClick: onRemove,
							disabled,
							className: "flex items-center justify-center size-9 rounded-lg text-muted-foreground hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors disabled:opacity-50",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { className: "size-3.5" })
						})
					]
				})
			]
		}), relation.unitName && relation.relatedUnitName && relation.quantity > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
			className: "text-[10px] text-muted-foreground mt-2",
			children: [
				"1 ",
				relation.unitName,
				" = ",
				relation.quantity,
				" × ",
				relation.relatedUnitName,
				relation.salePrice != null && relation.salePrice > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [
					" · Rs. ",
					relation.salePrice,
					"/",
					relation.unitName
				] }),
				relation.purchaseCost != null && relation.purchaseCost > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [
					" · Cost: Rs. ",
					relation.purchaseCost,
					"/",
					relation.unitName
				] })
			]
		})]
	});
}
function UnitAutocomplete({ value, onChange, placeholder = "Search unit...", disabled = false }) {
	const [open, setOpen] = (0, import_react.useState)(false);
	const [search, setSearch] = (0, import_react.useState)("");
	const [results, setResults] = (0, import_react.useState)([]);
	const [loading, setLoading] = (0, import_react.useState)(false);
	const inputRef = (0, import_react.useRef)(null);
	const panelRef = (0, import_react.useRef)(null);
	const searchTimerRef = (0, import_react.useRef)(null);
	(0, import_react.useEffect)(() => {
		if (!open || !search.trim()) {
			setResults([]);
			return;
		}
		if (searchTimerRef.current) clearTimeout(searchTimerRef.current);
		searchTimerRef.current = setTimeout(async () => {
			setLoading(true);
			try {
				const res = await axios.get("/inventory/product-units", { params: { search: search.trim() } });
				setResults(res.data?.data ?? []);
			} catch {
				setResults([]);
			} finally {
				setLoading(false);
			}
		}, 200);
	}, [search, open]);
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
				if (e.key === "Escape") setOpen(false);
				if (e.key === "Enter" && open && results.length > 0) {
					e.preventDefault();
					onChange(results[0].name);
					setOpen(false);
					setSearch("");
				}
			},
			placeholder,
			disabled,
			className: "w-full h-9 px-2.5 rounded-lg border border-input bg-background text-xs outline-none focus:border-ring focus:ring-1 focus:ring-ring/30 disabled:opacity-50"
		}), open && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			ref: panelRef,
			className: "absolute z-50 mt-1 w-full min-w-[140px] bg-popover border border-border rounded-lg shadow-lg max-h-40 overflow-y-auto",
			children: [
				loading && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "px-3 py-2 text-xs text-muted-foreground",
					children: "Searching..."
				}),
				!loading && results.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "py-1",
					children: results.map((unit) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						onClick: () => {
							onChange(unit.name);
							setOpen(false);
							setSearch("");
						},
						className: cn("w-full px-3 py-2 text-xs text-left hover:bg-muted transition-colors", value === unit.name && "bg-primary/5 text-primary font-medium"),
						children: unit.name
					}, unit.id))
				}),
				!loading && search.trim() && results.length === 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "px-3 py-2 text-xs text-muted-foreground",
					children: "Type to search units..."
				})
			]
		})]
	});
}
//#endregion
//#region resources/js/Pages/inventory/components/ProductForm.tsx
var ProductForm_exports = /* @__PURE__ */ __exportAll({ default: () => ProductForm });
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
	const [relationships, setRelationships] = (0, import_react.useState)([]);
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
	const buildPayload = (0, import_react.useCallback)(() => {
		const stockQty = parseFloat(openingStock) || 0;
		const catId = categories.find((c) => c.name === category)?.id || null;
		let packaging = [];
		let sellingUnitsOut = [];
		const unit = getUnit(baseUnitId);
		if (relationships.length > 0) {
			const transformed = transformRelationships(unit?.name || baseUnitId || "Unit", relationships);
			packaging = transformed.packaging;
			sellingUnitsOut = transformed.selling_units;
		} else sellingUnitsOut = [{
			name: unit?.name || "Piece",
			quantity: 1,
			sale_price: sellingPrice,
			is_default: true,
			product_unit_id: null
		}];
		return {
			name: name.trim(),
			sku: sku || (category ? generateSku(category, skuSequence) : `PRD-${String(skuSequence).padStart(3, "0")}`),
			category_id: catId,
			barcode: barcode || "",
			description: description || "",
			product_type: "simple",
			base_unit_id: baseUnitId,
			selling_units: sellingUnitsOut,
			packaging,
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
		relationships,
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
					setRelationships([]);
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
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "pt-2",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(UnitRelationEditor, {
						defaultUnitId: baseUnitId,
						onDefaultUnitChange: setBaseUnitId,
						relationships,
						onRelationshipsChange: setRelationships
					})
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
								}), isEditing ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "w-full h-10 px-3 rounded-lg border border-input bg-muted text-sm leading-10",
									children: formatStock(product?.stock_quantity ?? 0, resolveUnitDisplay(baseUnitId))
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
function SectionDivider() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "border-t border-border/60" });
}
//#endregion
export { ProductForm_exports as n, ProductForm as t };
