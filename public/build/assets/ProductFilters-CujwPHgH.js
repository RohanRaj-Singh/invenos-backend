import { a as __toESM, n as require_react, t as require_jsx_runtime } from "./jsx-runtime-Do9val7F.js";
import { t as createLucideIcon } from "./createLucideIcon-CtLNniWl.js";
import { t as cn } from "./utils-Bim8RyS4.js";
import { t as Button } from "./button-Av_5dPGQ.js";
import { ht as Search, st as X } from "./app-DtyXTQGb.js";
/**
* @license lucide-react v1.26.0 - ISC
*
* This source code is licensed under the ISC license.
* See the LICENSE file in the root directory of this source tree.
*/
var SlidersHorizontal = createLucideIcon("sliders-horizontal", [
	["path", {
		d: "M10 5H3",
		key: "1qgfaw"
	}],
	["path", {
		d: "M12 19H3",
		key: "yhmn1j"
	}],
	["path", {
		d: "M14 3v4",
		key: "1sua03"
	}],
	["path", {
		d: "M16 17v4",
		key: "1q0r14"
	}],
	["path", {
		d: "M21 12h-9",
		key: "1o4lsq"
	}],
	["path", {
		d: "M21 19h-5",
		key: "1rlt1p"
	}],
	["path", {
		d: "M21 5h-7",
		key: "1oszz2"
	}],
	["path", {
		d: "M8 10v4",
		key: "tgpxqk"
	}],
	["path", {
		d: "M8 12H3",
		key: "a7s4jb"
	}]
]);
//#endregion
//#region resources/js/Pages/inventory/components/ProductFilters.tsx
var import_react = /* @__PURE__ */ __toESM(require_react(), 1);
var import_jsx_runtime = require_jsx_runtime();
function ProductFilters({ search, onSearchChange, category, onCategoryChange, stockStatus, onStockStatusChange, completionStatus = "all", onCompletionStatusChange, archived = "active", onArchivedChange, categories = [] }) {
	const [mobileFiltersOpen, setMobileFiltersOpen] = (0, import_react.useState)(false);
	const hasFilters = !!search || category !== "all" || stockStatus !== "all" || completionStatus !== "all" || archived !== "active";
	const clearAll = () => {
		onSearchChange("");
		onCategoryChange("all");
		onStockStatusChange("all");
		onCompletionStatusChange?.("all");
		onArchivedChange?.("active");
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "space-y-3",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-center gap-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "relative flex-1 max-w-md",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Search, { className: "absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							type: "text",
							placeholder: "Search products by name or SKU...",
							value: search,
							onChange: (e) => onSearchChange(e.target.value),
							className: "w-full h-10 pl-9 pr-3 rounded-xl border border-input bg-background text-sm outline-none focus:border-ring focus:ring-1 focus:ring-ring/30 transition-colors"
						}),
						search && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							onClick: () => onSearchChange(""),
							className: "absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground",
							"aria-label": "Clear search",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { className: "size-3.5" })
						})
					]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
					variant: "outline",
					size: "sm",
					className: "gap-1.5 shrink-0 md:hidden",
					onClick: () => setMobileFiltersOpen((v) => !v),
					"aria-expanded": mobileFiltersOpen,
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SlidersHorizontal, { className: "size-3.5" }), "Filters"]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: cn("items-center gap-2 flex-wrap", mobileFiltersOpen ? "flex" : "hidden md:flex"),
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CategoryChip, {
						label: "All Categories",
						active: category === "all",
						onClick: () => onCategoryChange("all")
					}),
					categories.map((cat) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CategoryChip, {
						label: cat.name,
						active: category === String(cat.id),
						onClick: () => onCategoryChange(String(cat.id))
					}, cat.id)),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "w-px h-5 bg-border mx-1" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(StockChip, {
						label: "All",
						active: stockStatus === "all",
						onClick: () => onStockStatusChange("all")
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(StockChip, {
						label: "In Stock",
						active: stockStatus === "in-stock",
						onClick: () => onStockStatusChange("in-stock")
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(StockChip, {
						label: "Low Stock",
						active: stockStatus === "low-stock",
						onClick: () => onStockStatusChange("low-stock")
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(StockChip, {
						label: "Out of Stock",
						active: stockStatus === "out-of-stock",
						onClick: () => onStockStatusChange("out-of-stock")
					}),
					onCompletionStatusChange && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "w-px h-5 bg-border mx-1" }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(StockChip, {
							label: "All",
							active: completionStatus === "all",
							onClick: () => onCompletionStatusChange("all")
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(StockChip, {
							label: "Complete",
							active: completionStatus === "complete",
							onClick: () => onCompletionStatusChange("complete")
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(StockChip, {
							label: "Needs Attention",
							active: completionStatus === "incomplete",
							onClick: () => onCompletionStatusChange("incomplete")
						})
					] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "w-px h-5 bg-border mx-1" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(StockChip, {
						label: "Active",
						active: archived === "active",
						onClick: () => onArchivedChange?.("active")
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(StockChip, {
						label: "Archived",
						active: archived === "archived",
						onClick: () => onArchivedChange?.("archived")
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(StockChip, {
						label: "Active + Archived",
						active: archived === "all",
						onClick: () => onArchivedChange?.("all")
					}),
					hasFilters && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						onClick: clearAll,
						className: "text-xs text-muted-foreground hover:text-foreground ml-2 underline underline-offset-2",
						children: "Clear all"
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex md:hidden items-center gap-2 overflow-x-auto scrollbar-none pb-1",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MobileFilterChip, {
						label: "All",
						active: category === "all" && stockStatus === "all" && archived === "active",
						onClick: () => {
							onCategoryChange("all");
							onStockStatusChange("all");
							onArchivedChange?.("active");
						}
					}),
					categories.slice(0, 5).map((cat) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(MobileFilterChip, {
						label: cat.name,
						active: category === String(cat.id),
						onClick: () => onCategoryChange(String(cat.id))
					}, cat.id)),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "w-px h-5 bg-border mx-1 shrink-0" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(MobileFilterChip, {
						label: "Archived",
						active: archived === "archived",
						onClick: () => onArchivedChange?.("archived")
					})
				]
			})
		]
	});
}
function CategoryChip({ label, active, onClick }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
		onClick,
		className: cn("text-xs font-medium px-3 py-1.5 rounded-lg border transition-colors whitespace-nowrap", active ? "bg-primary text-primary-foreground border-primary" : "bg-background text-muted-foreground border-border hover:text-foreground hover:border-ring"),
		children: label
	});
}
function StockChip({ label, active, onClick }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
		onClick,
		"aria-pressed": active,
		className: cn("text-xs font-medium px-3 py-1.5 rounded-lg border transition-colors whitespace-nowrap", active ? "bg-foreground text-background border-foreground" : "bg-background text-muted-foreground border-border hover:text-foreground"),
		children: label
	});
}
function MobileFilterChip({ label, active, onClick }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
		onClick,
		"aria-pressed": active,
		className: cn("text-xs font-medium px-3 py-1.5 rounded-lg border whitespace-nowrap shrink-0", active ? "bg-primary text-primary-foreground border-primary" : "bg-background text-muted-foreground border-border"),
		children: label
	});
}
//#endregion
export { ProductFilters as default };
