import { i as __toESM, t as require_react } from "./react-DCO0ASPG.js";
import { t as ChevronLeft } from "./chevron-left-BWkIAWWi.js";
import { t as cn } from "./utils-Bim8RyS4.js";
import { t as require_jsx_runtime } from "./jsx-runtime-BjJQA5sn.js";
import { t as Button } from "./button-phKcTdak.js";
import { Ot as router3, St as ChevronRight, _t as Plus, kt as usePage, rt as formatCurrency, vt as Package } from "./app-Us-FuJbD.js";
import ProductFilters from "./ProductFilters-x7baTAii.js";
import ProductTable from "./ProductTable-ChP1NUGv.js";
import ProductCardView from "./ProductCardView-BcFomoPA.js";
//#region resources/js/Pages/inventory/ProductList.tsx
var import_react = /* @__PURE__ */ __toESM(require_react(), 1);
var import_jsx_runtime = require_jsx_runtime();
/** Page sizes offered by the per-page selector (must match the backend allowlist). */
var PAGE_SIZES = [
	10,
	25,
	50,
	100,
	250
];
function computeCompletionStatus(p) {
	if (!p.name) return "incomplete";
	if (!p.sku) return "incomplete";
	if (!p.category_id) return "incomplete";
	if (!p.selling_units || p.selling_units.length === 0) return "incomplete";
	return "complete";
}
/** Windowed page list, e.g. [1, '…', 4, 5, 6, '…', 12] — keeps long lists short. */
function pageWindow(current, last) {
	if (last <= 7) return Array.from({ length: last }, (_, i) => i + 1);
	const pages = [1];
	const lo = Math.max(2, current - 1);
	const hi = Math.min(last - 1, current + 1);
	if (lo > 2) pages.push("…");
	for (let i = lo; i <= hi; i++) pages.push(i);
	if (hi < last - 1) pages.push("…");
	pages.push(last);
	return pages;
}
function ProductListPage() {
	const { props } = usePage();
	const products = props.products || [];
	const categories = props.categories || [];
	const meta = props.meta || {};
	const filters = props.filters || {};
	const [search, setSearch] = (0, import_react.useState)(filters?.search || "");
	const [category, setCategory] = (0, import_react.useState)(filters?.category_id ? String(filters.category_id) : "all");
	const [stockStatus, setStockStatus] = (0, import_react.useState)(filters?.status || "all");
	const [completionStatus, setCompletionStatus] = (0, import_react.useState)("all");
	const [perPage, setPerPage] = (0, import_react.useState)(filters?.per_page || 25);
	const isFirstRender = (0, import_react.useRef)(true);
	const fetchPage = (0, import_react.useCallback)((page) => {
		router3.get("/inventory", {
			search,
			status: stockStatus,
			category_id: category === "all" ? "" : category,
			per_page: perPage,
			page
		}, {
			preserveState: true,
			preserveScroll: true,
			replace: true,
			only: [
				"products",
				"meta",
				"filters"
			]
		});
	}, [
		search,
		stockStatus,
		category,
		perPage
	]);
	(0, import_react.useEffect)(() => {
		if (isFirstRender.current) {
			isFirstRender.current = false;
			return;
		}
		const t = setTimeout(() => fetchPage(1), 300);
		return () => clearTimeout(t);
	}, [
		search,
		stockStatus,
		category,
		perPage,
		fetchPage
	]);
	const filtered = (0, import_react.useMemo)(() => {
		return products.filter((p) => {
			if (completionStatus !== "all") {
				const status = computeCompletionStatus(p);
				if (completionStatus === "complete" && status !== "complete") return false;
				if (completionStatus === "incomplete" && status === "complete") return false;
			}
			return true;
		});
	}, [products, completionStatus]);
	const totalStockValue = (0, import_react.useMemo)(() => {
		return products.reduce((sum, p) => {
			const cost = p.last_purchase_cost ?? p.default_purchase_cost ?? 0;
			return sum + p.stock_quantity * cost;
		}, 0);
	}, [products]);
	const from = meta.total === 0 ? 0 : (meta.current_page - 1) * meta.per_page + 1;
	const to = Math.min(meta.current_page * meta.per_page, meta.total);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-5",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-start justify-between",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center gap-2 text-primary mb-1",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Package, { className: "size-5" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-xs font-semibold uppercase tracking-wider text-primary",
							children: "Inventory"
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
						className: "text-xl sm:text-2xl font-semibold tracking-tight",
						children: "Products"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "text-sm text-muted-foreground mt-1",
						children: [
							meta?.total ?? products.length,
							" products · Stock value: ",
							formatCurrency(totalStockValue)
						]
					})
				] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
					onClick: () => router3.visit("/inventory/add"),
					size: "sm",
					className: "gap-1.5 shadow-sm h-9",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, { className: "size-3.5" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "hidden sm:inline",
						children: "Add Product"
					})]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ProductFilters, {
				search,
				onSearchChange: setSearch,
				category,
				onCategoryChange: setCategory,
				stockStatus,
				onStockStatusChange: setStockStatus,
				completionStatus,
				onCompletionStatusChange: setCompletionStatus,
				categories
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "text-xs text-muted-foreground",
				children: [
					"Showing ",
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "font-medium text-foreground",
						children: meta?.total === 0 ? "0" : `${from}–${to}`
					}),
					" of ",
					meta?.total ?? products.length,
					" products"
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "hidden md:block",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ProductTable, { products: filtered })
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "md:hidden",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ProductCardView, { products: filtered })
			}),
			meta?.last_page > 1 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-center justify-between gap-4 border-t border-border pt-4",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center gap-2 text-xs text-muted-foreground",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "whitespace-nowrap",
						children: "Rows / page:"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("select", {
						value: perPage,
						onChange: (e) => setPerPage(Number(e.target.value)),
						className: "h-8 rounded-lg border border-input bg-background px-2 text-xs outline-none focus:border-ring focus:ring-1 focus:ring-ring/30",
						children: PAGE_SIZES.map((n) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
							value: n,
							children: n
						}, n))
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center gap-1",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
							variant: "outline",
							size: "sm",
							disabled: meta.current_page <= 1,
							onClick: () => fetchPage(meta.current_page - 1),
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronLeft, { className: "size-4" }), " Prev"]
						}),
						pageWindow(meta.current_page, meta.last_page).map((p, i) => p === "…" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "px-1.5 text-xs text-muted-foreground",
							children: "…"
						}, `ellipsis-${i}`) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							onClick: () => fetchPage(p),
							className: cn("min-w-8 h-8 px-2 rounded-lg text-xs font-medium transition-colors", p === meta.current_page ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground hover:bg-muted"),
							children: p
						}, p)),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
							variant: "outline",
							size: "sm",
							disabled: meta.current_page >= meta.last_page,
							onClick: () => fetchPage(meta.current_page + 1),
							children: ["Next ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronRight, { className: "size-4" })]
						})
					]
				})]
			})
		]
	});
}
//#endregion
export { ProductListPage as default };
