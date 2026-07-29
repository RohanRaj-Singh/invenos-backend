import { t as ArrowRight } from "./arrow-right-BaJB_osx.js";
import { t as cn } from "./utils-Bim8RyS4.js";
import { t as require_jsx_runtime } from "./jsx-runtime-BjJQA5sn.js";
import { Et as router3, st as formatCurrency, vt as Package } from "./app-DGjxHKeP.js";
import { n as CardContent, t as Card } from "./card-DQfOgTjC.js";
import { t as StockBadge } from "./StockBadge-Dp2K041K.js";
import { t as CompletionBadge } from "./CompletionBadge-z8RvDzum.js";
//#region resources/js/Pages/inventory/components/ProductCardView.tsx
var import_jsx_runtime = require_jsx_runtime();
function getSalePrice(p) {
	if (p.selling_units && p.selling_units.length > 0) return Math.min(...p.selling_units.map((u) => u.sale_price || 0));
	return 0;
}
function ProductCardView({ products }) {
	if (products.length === 0) return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex flex-col items-center justify-center py-16 text-sm text-muted-foreground",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Package, { className: "size-10 text-muted-foreground/50 mb-3" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "No products found matching your filters." })]
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "grid grid-cols-1 gap-3",
		children: products.map((product) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
			onClick: () => router3.visit(`/inventory/product/${product.id}`),
			className: "group text-left",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Card, {
				size: "sm",
				className: "transition-all hover:shadow-md active:scale-[0.99]",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardContent, {
					className: "p-0",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "p-4",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-start justify-between mb-3",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex items-center gap-3",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "size-10 rounded-xl bg-muted flex items-center justify-center shrink-0",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Package, { className: "size-5 text-muted-foreground" })
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "min-w-0",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
											className: "text-sm font-semibold text-foreground leading-snug line-clamp-2",
											children: product.name
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("code", {
											className: "text-[11px] font-mono text-muted-foreground",
											children: product.sku
										})]
									})]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex items-center gap-2 shrink-0 mt-1",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CompletionBadge, {
										product,
										size: "sm"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowRight, { className: "size-4 text-muted-foreground/30 group-hover:text-muted-foreground transition-colors" })]
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "grid grid-cols-3 gap-2 mb-3",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "rounded-lg bg-muted/50 px-2.5 py-2",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
											className: "text-[10px] text-muted-foreground",
											children: "Category"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
											className: "text-xs font-medium mt-0.5 truncate",
											children: product.category?.name || "—"
										})]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "rounded-lg bg-muted/50 px-2.5 py-2",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
											className: "text-[10px] text-muted-foreground",
											children: "Stock"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: cn("text-xs font-medium mt-0.5", product.stock_quantity === 0 && "text-red-500", product.stock_quantity > 0 && product.status === "low-stock" && "text-amber-500"),
											children: [
												product.stock_quantity,
												" ",
												product.base_unit_name || product.base_unit_id || "Unit"
											]
										})]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "rounded-lg bg-muted/50 px-2.5 py-2",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
											className: "text-[10px] text-muted-foreground",
											children: "Sale Price"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
											className: "text-xs font-semibold mt-0.5",
											children: formatCurrency(getSalePrice(product))
										})]
									})
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-center justify-between",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "flex items-center gap-2 text-xs text-muted-foreground",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: ["Cost: ", formatCurrency(product.last_purchase_cost ?? product.default_purchase_cost ?? 0)] })
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(StockBadge, {
									status: product.status,
									size: "xs"
								})]
							})
						]
					})
				})
			})
		}, product.id))
	});
}
//#endregion
export { ProductCardView as default };
