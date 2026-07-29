import { i as __toESM, t as require_react } from "./react-DCO0ASPG.js";
import { t as require_jsx_runtime } from "./jsx-runtime-BjJQA5sn.js";
import { t as Button } from "./button-phKcTdak.js";
import { Dt as usePage, Et as router3, _t as Plus, st as formatCurrency, vt as Package } from "./app-DGjxHKeP.js";
import ProductFilters from "./ProductFilters-Beo9bzsE.js";
import ProductTable from "./ProductTable-DDpCgZzu.js";
import ProductCardView from "./ProductCardView-Cjp_qRz_.js";
//#region resources/js/Pages/inventory/ProductList.tsx
var import_react = /* @__PURE__ */ __toESM(require_react(), 1);
var import_jsx_runtime = require_jsx_runtime();
function computeCompletionStatus(p) {
	if (!p.name) return "incomplete";
	if (!p.sku) return "incomplete";
	if (!p.category_id) return "incomplete";
	if (!p.selling_units || p.selling_units.length === 0) return "incomplete";
	return "complete";
}
function ProductListPage() {
	const { props } = usePage();
	const { products, categories, meta, filters } = props;
	const [search, setSearch] = (0, import_react.useState)(filters?.search || "");
	const [category, setCategory] = (0, import_react.useState)(filters?.category_id ? String(filters.category_id) : "all");
	const [stockStatus, setStockStatus] = (0, import_react.useState)("all");
	const [completionStatus, setCompletionStatus] = (0, import_react.useState)("all");
	const filtered = (0, import_react.useMemo)(() => {
		return products.filter((p) => {
			if (search) {
				const q = search.toLowerCase();
				if (!p.name.toLowerCase().includes(q) && !p.sku.toLowerCase().includes(q)) return false;
			}
			if (category !== "all" && String(p.category_id) !== category) return false;
			if (stockStatus !== "all" && p.status !== stockStatus) return false;
			if (completionStatus !== "all") {
				const status = computeCompletionStatus(p);
				if (completionStatus === "complete" && status !== "complete") return false;
				if (completionStatus === "incomplete" && status === "complete") return false;
			}
			return true;
		});
	}, [
		products,
		search,
		category,
		stockStatus,
		completionStatus
	]);
	const totalStockValue = (0, import_react.useMemo)(() => {
		return products.reduce((sum, p) => {
			const cost = p.last_purchase_cost ?? p.default_purchase_cost ?? 0;
			return sum + p.stock_quantity * cost;
		}, 0);
	}, [products]);
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
						children: filtered.length
					}),
					" of",
					" ",
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
			})
		]
	});
}
//#endregion
export { ProductListPage as default };
