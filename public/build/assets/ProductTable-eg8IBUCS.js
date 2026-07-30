import { t as ArrowRight } from "./arrow-right-BaJB_osx.js";
import { t as cn } from "./utils-Bim8RyS4.js";
import { t as require_jsx_runtime } from "./jsx-runtime-BjJQA5sn.js";
import { Dt as router3, _t as Package, rt as formatCurrency } from "./app-DxiW8KTt.js";
import { t as StockBadge } from "./StockBadge-Dp2K041K.js";
//#region resources/js/Pages/inventory/components/ProductTable.tsx
var import_jsx_runtime = require_jsx_runtime();
function getSalePrice(p) {
	return (p.selling_units?.find((u) => u.is_default))?.sale_price || p.selling_units?.[0]?.sale_price || 0;
}
function getCostPrice(p) {
	return p.last_purchase_cost ?? p.default_purchase_cost ?? 0;
}
function ProductTable({ products }) {
	const totalValue = products.reduce((sum, p) => sum + p.stock_quantity * getCostPrice(p), 0);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "rounded-xl border border-border overflow-hidden",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
			className: "w-full",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
					className: "border-b border-border bg-muted/30",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Th, { children: "Product" }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Th, { children: "SKU" }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Th, { children: "Category" }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Th, {
							className: "text-right",
							children: "Stock"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Th, {
							className: "text-right",
							children: "Purchase Price"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Th, {
							className: "text-right",
							children: "Sale Price"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Th, {
							className: "text-right",
							children: "Value"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Th, { children: "Status" }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Th, { className: "w-10" })
					]
				}) }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("tbody", { children: products.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tr", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
					colSpan: 9,
					className: "text-center py-16 text-sm text-muted-foreground",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex flex-col items-center gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Package, { className: "size-8 text-muted-foreground/50" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "No products found matching your filters." })]
					})
				}) }) : products.map((product) => {
					const costPrice = getCostPrice(product);
					const salePrice = getSalePrice(product);
					return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
						className: "border-b border-border last:border-b-0 hover:bg-muted/30 transition-colors group",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: "px-4 py-3.5 cursor-pointer",
								onClick: () => router3.visit(`/inventory/product/${product.id}`),
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex items-center gap-3",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "size-9 rounded-lg bg-muted flex items-center justify-center shrink-0",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Package, { className: "size-4 text-muted-foreground" })
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "text-sm font-medium text-foreground",
										children: product.name
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "text-[11px] text-muted-foreground mt-0.5",
										children: product.barcode
									})] })]
								})
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: "px-4 py-3.5 cursor-pointer",
								onClick: () => router3.visit(`/inventory/product/${product.id}`),
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("code", {
									className: "text-xs font-mono text-muted-foreground bg-muted px-1.5 py-0.5 rounded",
									children: product.sku
								})
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: "px-4 py-3.5 text-sm text-muted-foreground cursor-pointer",
								onClick: () => router3.visit(`/inventory/product/${product.id}`),
								children: product.category?.name || "—"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: "px-4 py-3.5 text-right cursor-pointer",
								onClick: () => router3.visit(`/inventory/product/${product.id}`),
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex flex-col items-end gap-1",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: cn("text-sm font-semibold tabular-nums", product.stock_quantity === 0 && "text-red-500", product.stock_quantity > 0 && product.status === "low-stock" && "text-amber-500"),
										children: product.stock_quantity.toLocaleString()
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "text-[10px] text-muted-foreground",
										children: product.base_unit_name || product.base_unit_id || "Unit"
									})]
								})
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: "px-4 py-3.5 text-right cursor-pointer",
								onClick: () => router3.visit(`/inventory/product/${product.id}`),
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-sm tabular-nums",
									children: costPrice > 0 ? formatCurrency(costPrice) : "—"
								})
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: "px-4 py-3.5 text-right cursor-pointer",
								onClick: () => router3.visit(`/inventory/product/${product.id}`),
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-sm font-semibold tabular-nums",
									children: salePrice > 0 ? formatCurrency(salePrice) : "—"
								})
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: "px-4 py-3.5 text-right cursor-pointer",
								onClick: () => router3.visit(`/inventory/product/${product.id}`),
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-sm text-muted-foreground tabular-nums",
									children: formatCurrency(product.stock_quantity * costPrice)
								})
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: "px-4 py-3.5 cursor-pointer",
								onClick: () => router3.visit(`/inventory/product/${product.id}`),
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(StockBadge, { status: product.status })
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: "px-4 py-3.5 cursor-pointer",
								onClick: () => router3.visit(`/inventory/product/${product.id}`),
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowRight, { className: "size-4 text-muted-foreground/0 group-hover:text-muted-foreground transition-colors" })
							})
						]
					}, product.id);
				}) }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("tfoot", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
					className: "border-t-2 border-border bg-muted/20",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("td", {
							colSpan: 3,
							className: "px-4 py-3 text-sm font-medium text-foreground",
							children: [
								products.length,
								" product",
								products.length !== 1 ? "s" : ""
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
							className: "px-4 py-3 text-right text-sm text-muted-foreground",
							children: "—"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", { colSpan: 2 }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
							className: "px-4 py-3 text-right",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-sm font-bold text-foreground tabular-nums",
								children: formatCurrency(totalValue)
							})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", { colSpan: 2 })
					]
				}) })
			]
		})
	});
}
function Th({ children, className }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
		className: cn("px-4 py-3 text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wider", className),
		children
	});
}
//#endregion
export { ProductTable as default };
