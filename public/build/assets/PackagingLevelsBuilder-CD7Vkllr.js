import { i as __toESM, r as __exportAll, t as require_react } from "./react-DCO0ASPG.js";
import { t as LoaderCircle } from "./loader-circle-CdtlPMRw.js";
import { t as cn } from "./utils-Bim8RyS4.js";
import { t as require_jsx_runtime } from "./jsx-runtime-BjJQA5sn.js";
import { Ot as axios, St as ChevronDown, _t as Plus, ct as X } from "./app-DfjygdMU.js";
//#region resources/js/Pages/inventory/components/PackagingLevelsBuilder.tsx
var PackagingLevelsBuilder_exports = /* @__PURE__ */ __exportAll({ default: () => PackagingLevelsBuilder });
var import_react = /* @__PURE__ */ __toESM(require_react(), 1);
var import_jsx_runtime = require_jsx_runtime();
function PackagingLevelsBuilder({ levels, onChange, baseUnitId, onPreview, disabled = false }) {
	const [preview, setPreview] = (0, import_react.useState)([]);
	const [previewLoading, setPreviewLoading] = (0, import_react.useState)(false);
	const previewTimerRef = (0, import_react.useRef)(null);
	const triggerPreview = (0, import_react.useCallback)((currentLevels) => {
		const valid = currentLevels.filter((l) => l.containerUnitId && l.containsUnitId && l.quantity > 0);
		if (valid.length === 0) {
			setPreview([]);
			onPreview?.([]);
			return;
		}
		if (previewTimerRef.current) clearTimeout(previewTimerRef.current);
		previewTimerRef.current = setTimeout(async () => {
			setPreviewLoading(true);
			try {
				const payload = { packaging: valid.map((l) => ({
					container_unit_id: l.containerUnitId,
					contains_unit_id: l.containsUnitId,
					quantity: l.quantity,
					level: l.level
				})) };
				const units = (await axios.post("/inventory/preview-packaging", payload)).data?.data ?? [];
				setPreview(units);
				onPreview?.(units);
			} catch {
				setPreview([]);
				onPreview?.([]);
			} finally {
				setPreviewLoading(false);
			}
		}, 400);
	}, [onPreview]);
	(0, import_react.useEffect)(() => {
		triggerPreview(levels);
	}, [levels, triggerPreview]);
	(0, import_react.useEffect)(() => {
		return () => {
			if (previewTimerRef.current) clearTimeout(previewTimerRef.current);
		};
	}, []);
	const addLevel = (0, import_react.useCallback)(() => {
		const nextLevel = levels.length + 1;
		const newLevel = {
			_key: `pl-${Date.now()}`,
			containerUnitId: null,
			containerName: "",
			containsUnitId: null,
			containsName: "",
			quantity: 1,
			level: nextLevel
		};
		onChange([...levels, newLevel]);
	}, [levels, onChange]);
	const removeLevel = (0, import_react.useCallback)((key) => {
		onChange(levels.filter((l) => l._key !== key).map((l, i) => ({
			...l,
			level: i + 1
		})));
	}, [levels, onChange]);
	const updateLevel = (0, import_react.useCallback)((key, patch) => {
		onChange(levels.map((l) => l._key === key ? {
			...l,
			...patch
		} : l));
	}, [levels, onChange]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "space-y-3",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-center justify-between",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h4", {
					className: "text-xs font-semibold text-muted-foreground uppercase tracking-wider",
					children: "Packaging Levels"
				}), previewLoading && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "size-3.5 animate-spin text-muted-foreground" })]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-[11px] text-muted-foreground",
				children: "Define how your product is packaged. Each level describes how many smaller units fit into one larger unit."
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "space-y-2",
				children: levels.map((level) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PackagingLevelRow, {
					level,
					onChange: (patch) => updateLevel(level._key, patch),
					onRemove: () => removeLevel(level._key),
					disabled,
					baseUnitId
				}, level._key))
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
				type: "button",
				onClick: addLevel,
				disabled,
				className: "inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:text-primary/80 transition-colors disabled:opacity-50",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, { className: "size-3.5" }), "Add Level"]
			}),
			preview.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-4 pt-3 border-t border-border/60",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h5", {
					className: "text-[11px] font-medium text-muted-foreground mb-2",
					children: "Auto-generated selling units"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "space-y-1",
					children: preview.map((unit) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center gap-2 px-2.5 py-1.5 rounded-md bg-primary/[0.03] text-xs",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "font-medium text-foreground",
								children: unit.name
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "text-muted-foreground",
								children: [
									"= ",
									unit.quantity,
									" base units"
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-[10px] text-muted-foreground ml-auto",
								children: "(generated)"
							})
						]
					}, unit.product_unit_id))
				})]
			})
		]
	});
}
function PackagingLevelRow({ level, onChange, onRemove, disabled, baseUnitId }) {
	const [expanded, setExpanded] = (0, import_react.useState)(true);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "rounded-lg border border-border bg-card overflow-hidden",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
			type: "button",
			onClick: () => setExpanded(!expanded),
			className: "w-full flex items-center gap-2 px-3 py-2 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "inline-flex items-center justify-center size-5 rounded-full bg-primary/10 text-primary text-[10px] font-bold shrink-0",
					children: level.level
				}),
				level.containerName && level.containsName ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
					className: "flex-1 text-left text-foreground",
					children: [
						level.containerName,
						" contains ",
						level.quantity,
						"× ",
						level.containsName
					]
				}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
					className: "flex-1 text-left text-muted-foreground/60 italic",
					children: ["Define packaging level ", level.level]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronDown, { className: cn("size-3.5 transition-transform", expanded && "rotate-180") })
			]
		}), expanded && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "px-3 pb-3 pt-1 space-y-2.5 border-t border-border/60",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-center gap-2 flex-wrap",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex-1 min-w-[100px]",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
							className: "block text-[10px] text-muted-foreground mb-0.5",
							children: "Container"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(UnitAutocomplete, {
							value: level.containerName,
							onChange: (id, name) => onChange({
								containerUnitId: id,
								containerName: name
							}),
							placeholder: "e.g. Box",
							disabled,
							excludeId: level.containsUnitId ?? void 0
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "w-20",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
							className: "block text-[10px] text-muted-foreground mb-0.5",
							children: "Qty"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							type: "number",
							value: level.quantity || "",
							onChange: (e) => onChange({ quantity: parseFloat(e.target.value) || 0 }),
							placeholder: "12",
							min: "0.01",
							step: "any",
							disabled,
							className: "w-full h-9 px-2 rounded-lg border border-input bg-background text-xs text-center outline-none focus:border-ring focus:ring-1 focus:ring-ring/30"
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex-1 min-w-[100px]",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
							className: "block text-[10px] text-muted-foreground mb-0.5",
							children: "Contains"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(UnitAutocomplete, {
							value: level.containsName,
							onChange: (id, name) => onChange({
								containsUnitId: id,
								containsName: name
							}),
							placeholder: "e.g. Pack",
							disabled,
							excludeId: level.containerUnitId ?? void 0
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						onClick: onRemove,
						disabled,
						className: "self-end size-9 flex items-center justify-center rounded-lg text-muted-foreground hover:text-red-500 hover:bg-red-50 transition-colors disabled:opacity-50",
						title: "Remove level",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { className: "size-3.5" })
					})
				]
			})
		})]
	});
}
function UnitAutocomplete({ value, onChange, placeholder = "Search unit...", disabled = false, excludeId }) {
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
				let items = (await axios.get("/inventory/product-units", { params: { search: search.trim() } })).data?.data ?? [];
				if (excludeId) items = items.filter((u) => u.id !== excludeId);
				setResults(items);
			} catch {
				setResults([]);
			} finally {
				setLoading(false);
			}
		}, 200);
	}, [
		search,
		open,
		excludeId
	]);
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
					const first = results[0];
					onChange(first.id, first.name);
					setOpen(false);
					setSearch("");
				}
			},
			placeholder,
			disabled,
			className: "w-full h-9 px-2.5 rounded-lg border border-input bg-background text-xs outline-none focus:border-ring focus:ring-1 focus:ring-ring/30 disabled:opacity-50"
		}), open && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			ref: panelRef,
			className: "absolute z-50 mt-1 w-full min-w-[180px] bg-popover border border-border rounded-lg shadow-lg max-h-48 overflow-y-auto",
			children: [
				loading && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "flex items-center justify-center py-3",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "size-3.5 animate-spin text-muted-foreground" })
				}),
				!loading && results.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "py-1",
					children: results.map((unit) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						type: "button",
						onClick: () => {
							onChange(unit.id, unit.name);
							setOpen(false);
							setSearch("");
						},
						className: cn("w-full px-3 py-2 text-xs text-left hover:bg-muted transition-colors", value === unit.name && "bg-primary/5 text-primary font-medium"),
						children: unit.name
					}, unit.id))
				}),
				!loading && search.trim() && results.length === 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "px-3 py-2 text-xs text-muted-foreground",
					children: "No units found"
				}),
				!loading && !search.trim() && results.length === 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "px-3 py-2 text-xs text-muted-foreground",
					children: "Type to search units..."
				})
			]
		})]
	});
}
//#endregion
export { PackagingLevelsBuilder_exports as n, PackagingLevelsBuilder as t };
