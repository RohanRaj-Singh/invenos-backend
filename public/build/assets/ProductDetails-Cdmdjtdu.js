import { i as __toESM, t as require_react } from "./react-DCO0ASPG.js";
import { t as ArrowLeft } from "./arrow-left-CE4TWQlw.js";
import { t as ClipboardList } from "./clipboard-list-vYbzP_6F.js";
import { t as PackagePlus } from "./package-plus-BjX_WD8A.js";
import { t as cn } from "./utils-Bim8RyS4.js";
import { t as require_jsx_runtime } from "./jsx-runtime-BjJQA5sn.js";
import { t as Button } from "./button-phKcTdak.js";
import { Ct as ChartColumn, Dt as usePage, Et as router3, _t as Plus, ft as ShoppingCart, st as formatCurrency, vt as Package } from "./app-DGjxHKeP.js";
import { i as CardTitle, n as CardContent, r as CardHeader, t as Card } from "./card-DQfOgTjC.js";
import { t as formatStock } from "./product-unit-display-ClAHr8cS.js";
import { t as StockBadge } from "./StockBadge-Dp2K041K.js";
import { r as computeCompletionStatus, t as CompletionBadge } from "./CompletionBadge-z8RvDzum.js";
import InventoryTimeline from "./InventoryTimeline-Dt4hgD5E.js";
import AdjustStockDialog from "./AdjustStockDialog-DictnNMb.js";
//#region resources/js/Pages/inventory/ProductDetails.tsx
var import_react = /* @__PURE__ */ __toESM(require_react(), 1);
var import_jsx_runtime = require_jsx_runtime();
function ProductDetailsPage() {
	const { props, url } = usePage();
	const { product, movements, purchases, sales } = props;
	url.split("/").pop();
	const [activeSection, setActiveSection] = (0, import_react.useState)("overview");
	const [showAdjust, setShowAdjust] = (0, import_react.useState)(false);
	const costPrice = product ? product.last_purchase_cost ?? product.default_purchase_cost ?? 0 : 0;
	const unitName = product.base_unit_name || product?.base_unit_id || "Unit";
	const sellingPrice = product && product.selling_units?.length > 0 ? Math.min(...product.selling_units.map((u) => u.sale_price || 0)) : 0;
	const normalizedMovements = (movements || []).map((m) => ({
		id: String(m.id),
		productId: m.product_id,
		type: m.type,
		quantity: m.quantity,
		unit: m.unit || unitName,
		packagingName: m.packaging_name,
		packagingQuantity: m.packaging_quantity,
		date: m.date,
		reference: m.reference || "",
		notes: m.notes,
		user: m.user || "",
		runningBalance: m.running_balance ?? 0
	}));
	if (!product) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex flex-col items-center justify-center py-24 text-sm text-muted-foreground",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Package, { className: "size-12 text-muted-foreground/30 mb-4" }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "text-lg font-semibold text-foreground mb-1",
					children: "Product not found"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mb-4",
					children: "The product you're looking for doesn't exist."
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					variant: "outline",
					onClick: () => router3.visit("/inventory"),
					children: "Back to Inventory"
				})
			]
		})
	});
	computeCompletionStatus(product);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto space-y-5",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-start justify-between",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
						variant: "ghost",
						size: "sm",
						onClick: () => router3.visit("/inventory"),
						className: "gap-1.5 mb-1 -ml-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowLeft, { className: "size-3.5" }), "Back to Inventory"]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center gap-2",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Package, { className: "size-5 text-primary" }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
								className: "text-xl font-semibold tracking-tight",
								children: product.name
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(StockBadge, { status: product.status }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CompletionBadge, {
								product,
								size: "sm"
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "text-sm text-muted-foreground mt-1",
						children: [
							"SKU: ",
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("code", {
								className: "font-mono text-xs bg-muted px-1.5 py-0.5 rounded",
								children: product.sku
							}),
							product.barcode && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [" · Barcode: ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("code", {
								className: "font-mono text-xs bg-muted px-1.5 py-0.5 rounded",
								children: product.barcode
							})] })
						]
					})
				] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
						variant: "outline",
						size: "sm",
						onClick: () => setShowAdjust(true),
						className: "gap-1.5",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, { className: "size-3.5" }), "Adjust Stock"]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
						variant: "outline",
						size: "sm",
						onClick: () => router3.visit(`/inventory/product/${product.id}/edit`),
						className: "gap-1.5",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PackagePlus, { className: "size-3.5" }), "Edit"]
					})]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "flex items-center gap-0.5 border-b border-border overflow-x-auto",
				children: [
					{
						id: "overview",
						label: "Overview",
						icon: Package
					},
					{
						id: "transactions",
						label: "Stock Movements",
						icon: ChartColumn
					},
					{
						id: "purchases",
						label: "Purchase History",
						icon: ShoppingCart
					},
					{
						id: "sales",
						label: "Sales History",
						icon: ClipboardList
					}
				].map((tab) => {
					const Icon = tab.icon;
					return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						onClick: () => setActiveSection(tab.id),
						className: cn("flex items-center gap-1.5 px-4 py-2.5 text-xs font-medium border-b-2 transition-colors shrink-0", activeSection === tab.id ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground"),
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, { className: "size-3.5" }), tab.label]
					}, tab.id);
				})
			}),
			activeSection === "overview" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "grid grid-cols-1 md:grid-cols-3 gap-5",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardHeader, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardTitle, {
						className: "text-sm",
						children: "Details"
					}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardContent, {
						className: "space-y-3",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex justify-between text-sm",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-muted-foreground",
									children: "Category"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "font-medium",
									children: product.category?.name || "—"
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex justify-between text-sm",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-muted-foreground",
									children: "Product Type"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "font-medium capitalize",
									children: product.product_type || "Simple"
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex justify-between text-sm",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-muted-foreground",
									children: "Track Inventory"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "font-medium",
									children: product.track_inventory ? "Yes" : "No"
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex justify-between text-sm",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-muted-foreground",
									children: "Status"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(StockBadge, { status: product.status })]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "text-sm pt-2 border-t border-border",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-muted-foreground block mb-1",
									children: "Description"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "font-medium",
									children: product.description || "No description"
								})]
							})
						]
					})] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardHeader, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardTitle, {
						className: "text-sm",
						children: "Stock"
					}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardContent, {
						className: "space-y-3",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex justify-between text-sm",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-muted-foreground",
									children: "Current Stock"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: cn("font-bold text-lg", product.stock_quantity === 0 ? "text-red-500" : product.status === "low-stock" ? "text-amber-500" : "text-emerald-600"),
									children: formatStock(product.stock_quantity, unitName)
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex justify-between text-sm",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-muted-foreground",
									children: "Low Stock Threshold"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "font-medium",
									children: product.low_stock_threshold
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex justify-between text-sm",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-muted-foreground",
									children: "Stock Value"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "font-semibold",
									children: formatCurrency(product.stock_quantity * (costPrice || 0))
								})]
							})
						]
					})] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardHeader, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardTitle, {
						className: "text-sm",
						children: "Pricing"
					}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardContent, {
						className: "space-y-3",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex justify-between text-sm",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-muted-foreground",
									children: "Cost Price"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "font-medium",
									children: formatCurrency(costPrice || 0)
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex justify-between text-sm",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-muted-foreground",
									children: "Selling Price"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "font-semibold text-emerald-600",
									children: formatCurrency(sellingPrice || 0)
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex justify-between text-sm pt-2 border-t border-border",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-muted-foreground",
									children: "Margin"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "font-semibold",
									children: costPrice > 0 ? `${Math.round((sellingPrice - costPrice) / costPrice * 100)}%` : "—"
								})]
							})
						]
					})] })
				]
			}),
			activeSection === "transactions" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardHeader, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardTitle, {
				className: "text-sm",
				children: "Stock Movements"
			}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardContent, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(InventoryTimeline, { transactions: normalizedMovements }) })] }),
			activeSection === "purchases" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardHeader, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardTitle, {
				className: "text-sm",
				children: "Purchase History"
			}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardContent, { children: !purchases || purchases.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-sm text-muted-foreground py-8 text-center",
				children: "No purchase history found."
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "space-y-1",
				children: purchases.map((p) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center justify-between py-2.5 px-3 rounded-lg hover:bg-muted/50 transition-colors",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center gap-3",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "size-8 rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-500/10 flex items-center justify-center",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ShoppingCart, { className: "size-4" })
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "text-sm font-medium text-foreground",
							children: p.purchase_bill?.invoice_ref || p.purchase_bill_id
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "text-xs text-muted-foreground",
							children: [
								p.purchase_bill?.supplier?.name || p.supplier_name || "",
								" · ",
								p.purchase_bill?.date || p.date
							]
						})] })]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "text-right",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "text-sm font-semibold",
							children: [
								"×",
								p.purchase_quantity,
								" @ ",
								formatCurrency(p.unit_cost)
							]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "text-xs text-muted-foreground",
							children: formatCurrency(p.total_cost)
						})]
					})]
				}, p.id))
			}) })] }),
			activeSection === "sales" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardHeader, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardTitle, {
				className: "text-sm",
				children: "Sales History"
			}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardContent, { children: !sales || sales.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-sm text-muted-foreground py-8 text-center",
				children: "No sales history found."
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "space-y-1",
				children: sales.map((s) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center justify-between py-2.5 px-3 rounded-lg hover:bg-muted/50 transition-colors",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center gap-3",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "size-8 rounded-lg bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 flex items-center justify-center",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ClipboardList, { className: "size-4" })
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "text-sm font-medium text-foreground",
							children: s.sale?.invoice_number || s.sale_id
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "text-xs text-muted-foreground",
							children: [
								s.sale?.customer?.name || s.customer_name || "",
								" · ",
								s.sale?.date || s.date
							]
						})] })]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "text-right",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "text-sm font-semibold",
							children: [
								"×",
								s.base_quantity,
								" @ ",
								formatCurrency(s.unit_price)
							]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "text-xs text-muted-foreground",
							children: formatCurrency(s.total)
						})]
					})]
				}, s.id))
			}) })] }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(AdjustStockDialog, {
				open: showAdjust,
				onOpenChange: setShowAdjust,
				productId: product.id,
				productName: product.name,
				currentStock: product.stock_quantity,
				stockUnit: unitName
			})
		]
	});
}
//#endregion
export { ProductDetailsPage as default };
