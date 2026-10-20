import { a as __toESM, n as require_react, t as require_jsx_runtime } from "./jsx-runtime-Do9val7F.js";
import { t as createLucideIcon } from "./createLucideIcon-CtLNniWl.js";
import { t as Archive } from "./archive-Xyp33pPR.js";
import { t as ArrowLeft } from "./arrow-left-Bd6q48cy.js";
import { t as ClipboardList } from "./clipboard-list--9WCyfYS.js";
import { t as PackagePlus } from "./package-plus-662fD4Ar.js";
import { t as TriangleAlert } from "./triangle-alert-Djqi0JrF.js";
import { t as cn } from "./utils-Bim8RyS4.js";
import { t as Button } from "./button-Av_5dPGQ.js";
import { a as DialogTitle, i as DialogHeader, n as DialogContent, r as DialogDescription, t as Dialog } from "./dialog-BskbUtLF.js";
import { Ot as router3, _t as Plus, at as formatDate, ft as ShoppingCart, kt as usePage, rt as formatCurrency, ut as Trash2, vt as Package, wt as ChartColumn } from "./app-DtyXTQGb.js";
import { i as CardTitle, n as CardContent, r as CardHeader, t as Card } from "./card-1EYOepvR.js";
import { t as formatStock } from "./product-unit-display-D3DaRJfT.js";
import { t as useLifecycleAction } from "./use-lifecycle-action-D02njiQr.js";
import { t as StockBadge } from "./StockBadge-C3eapODW.js";
import { t as ArchivedBadge } from "./ArchivedBadge-CVKFTN4U.js";
import { r as computeCompletionStatus, t as CompletionBadge } from "./CompletionBadge-DkkO7-0S.js";
import InventoryTimeline from "./InventoryTimeline-CYypXZTK.js";
import AdjustStockDialog from "./AdjustStockDialog-DS0opd5Y.js";
/**
* @license lucide-react v1.26.0 - ISC
*
* This source code is licensed under the ISC license.
* See the LICENSE file in the root directory of this source tree.
*/
var ArchiveRestore = createLucideIcon("archive-restore", [
	["rect", {
		width: "20",
		height: "5",
		x: "2",
		y: "3",
		rx: "1",
		key: "1wp1u1"
	}],
	["path", {
		d: "M4 8v11a2 2 0 0 0 2 2h2",
		key: "tvwodi"
	}],
	["path", {
		d: "M20 8v11a2 2 0 0 1-2 2h-2",
		key: "1gkqxj"
	}],
	["path", {
		d: "m9 15 3-3 3 3",
		key: "1pd0qc"
	}],
	["path", {
		d: "M12 12v9",
		key: "192myk"
	}]
]);
//#endregion
//#region resources/js/Pages/inventory/ProductDetails.tsx
var import_react = /* @__PURE__ */ __toESM(require_react(), 1);
var import_jsx_runtime = require_jsx_runtime();
function ProductDetailsPage() {
	const { props, url } = usePage();
	const { product, movements, purchases, sales } = props;
	url.split("/").pop();
	const isAdmin = (props.auth?.user ?? null)?.role === "admin";
	const [activeSection, setActiveSection] = (0, import_react.useState)("overview");
	const [showAdjust, setShowAdjust] = (0, import_react.useState)(false);
	const [showDeleteDialog, setShowDeleteDialog] = (0, import_react.useState)(false);
	const [showArchiveDialog, setShowArchiveDialog] = (0, import_react.useState)(false);
	const [showUnarchiveDialog, setShowUnarchiveDialog] = (0, import_react.useState)(false);
	const [actionReason, setActionReason] = (0, import_react.useState)("");
	const { run, processing } = useLifecycleAction();
	const lifecycle = props?.lifecycle ?? {
		can_delete: true,
		delete_blocker: null
	};
	const canDelete = lifecycle.can_delete !== false;
	const blocker = lifecycle.delete_blocker;
	const isArchived = !!product?.archived_at;
	const canArchive = lifecycle.can_archive !== false;
	const canUnarchive = lifecycle.can_unarchive === true;
	const usageParts = [];
	if (blocker?.sales) usageParts.push(`${blocker.sales} sale${blocker.sales === 1 ? "" : "s"}`);
	if (blocker?.purchases) usageParts.push(`${blocker.purchases} purchase${blocker.purchases === 1 ? "" : "s"}`);
	const usageText = usageParts.join(" and ");
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
				className: "flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "min-w-0",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
							variant: "ghost",
							size: "sm",
							onClick: () => router3.visit("/inventory"),
							className: "gap-1.5 mb-1 -ml-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowLeft, { className: "size-3.5" }), "Back to Inventory"]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex flex-wrap items-center gap-2",
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
								}),
								isArchived && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArchivedBadge, {})
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
					]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex flex-wrap items-center gap-2",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
							variant: "outline",
							size: "sm",
							onClick: () => setShowAdjust(true),
							className: "gap-1.5",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, { className: "size-3.5" }), "Adjust Stock"]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
							variant: "outline",
							size: "sm",
							onClick: () => router3.visit(`/inventory/product/${product.id}/edit`),
							className: "gap-1.5",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PackagePlus, { className: "size-3.5" }), "Edit"]
						}),
						isAdmin && canArchive && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
							variant: "outline",
							size: "sm",
							onClick: () => {
								setActionReason("");
								setShowArchiveDialog(true);
							},
							className: "gap-1.5 text-amber-600 hover:text-amber-700 hover:bg-amber-50 dark:hover:bg-amber-950/20 border-amber-200 dark:border-amber-800",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Archive, { className: "size-3.5" }), " Archive"]
						}),
						isAdmin && canUnarchive && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
							size: "sm",
							onClick: () => {
								setActionReason("");
								setShowUnarchiveDialog(true);
							},
							className: "gap-1.5",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArchiveRestore, { className: "size-3.5" }), " Unarchive"]
						}),
						isAdmin && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
							variant: "outline",
							size: "sm",
							disabled: !canDelete,
							title: canDelete ? void 0 : `Used in ${usageText || "existing transactions"} — archive it instead`,
							onClick: () => {
								setActionReason("");
								setShowDeleteDialog(true);
							},
							className: "gap-1.5 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20 border-red-200 dark:border-red-800 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-transparent",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash2, { className: "size-3.5" }), " Delete"]
						})
					]
				})]
			}),
			isArchived && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-start gap-2.5 rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/20 p-3.5",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TriangleAlert, { className: "size-4 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "text-sm",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "font-medium text-amber-700 dark:text-amber-400",
						children: [
							"Archived",
							product.archived_at ? ` on ${formatDate(product.archived_at)}` : "",
							" — hidden from new transactions."
						]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "text-xs text-amber-600 dark:text-amber-300 mt-0.5",
						children: [product.archive_reason ? `Reason: ${product.archive_reason}. ` : "", "It is excluded from sales, purchases, reports and stock value. Unarchive to make it available again."]
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
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Dialog, {
				open: showDeleteDialog,
				onOpenChange: setShowDeleteDialog,
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogContent, {
					className: "sm:max-w-md gap-0 p-0",
					children: canDelete ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogHeader, {
						className: "p-5 pb-0",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogTitle, {
							className: "text-base text-red-600 flex items-center gap-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash2, { className: "size-4" }), "Delete Product"]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogDescription, {
							className: "text-sm text-muted-foreground pt-1",
							children: "This moves the product to the Recycle Bin, where you can restore it later. Products used in sales or purchases can't be deleted — archive those instead."
						})]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "p-5 space-y-4",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 p-3 text-sm",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "font-medium text-amber-700 dark:text-amber-400",
									children: "Impact preview:"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("ul", {
									className: "mt-1.5 text-xs text-amber-600 dark:text-amber-300 space-y-0.5",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "• Product moved to Recycle Bin" }),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "• Historical transactions preserved" }),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "• Inventory not affected" })
									]
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
								htmlFor: "delete-reason",
								className: "text-xs font-medium text-muted-foreground mb-1.5 block",
								children: "Reason for deletion"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("textarea", {
								id: "delete-reason",
								value: actionReason,
								onChange: (e) => setActionReason(e.target.value),
								placeholder: "e.g. No longer sold, duplicate entry...",
								rows: 3,
								className: "w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-ring focus-visible:ring-2 focus-visible:ring-ring/50 resize-none"
							})] }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex gap-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
									variant: "outline",
									onClick: () => setShowDeleteDialog(false),
									className: "flex-1",
									disabled: processing,
									children: "Cancel"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
									variant: "destructive",
									onClick: () => {
										const reason = actionReason.trim() || "No reason provided";
										run({
											url: `/inventory/product/${product.id}`,
											method: "delete",
											data: { reason },
											onDone: () => setShowDeleteDialog(false)
										});
									},
									className: "flex-1 gap-1.5",
									disabled: processing,
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash2, { className: "size-3.5" }),
										" ",
										processing ? "Deleting..." : "Delete Product"
									]
								})]
							})
						]
					})] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogHeader, {
						className: "p-5 pb-0",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogTitle, {
							className: "text-base text-red-600 flex items-center gap-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash2, { className: "size-4" }), "Can't delete this product"]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogDescription, {
							className: "text-sm text-muted-foreground pt-1",
							children: usageText ? `This product is used in ${usageText}, so it can't be deleted — deleting it would break those records.` : "This product has transaction history, so it can't be deleted — deleting it would break those records."
						})]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "p-5 space-y-4",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-sm text-muted-foreground",
								children: "Archive it instead. Archiving hides it from new transactions while keeping its history, and you can restore it later."
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 p-3 text-sm",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "font-medium text-amber-700 dark:text-amber-400",
									children: "What archiving does:"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("ul", {
									className: "mt-1.5 text-xs text-amber-600 dark:text-amber-300 space-y-0.5",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "• Product hidden from new transactions" }),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "• Historical records remain intact" }),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "• Can be unarchived later" })
									]
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex gap-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
									variant: "outline",
									onClick: () => setShowDeleteDialog(false),
									className: "flex-1",
									children: "Cancel"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
									onClick: () => {
										setShowDeleteDialog(false);
										setActionReason("");
										setShowArchiveDialog(true);
									},
									className: "flex-1 gap-1.5 bg-amber-600 text-white hover:bg-amber-700 dark:hover:bg-amber-500",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Archive, { className: "size-3.5" }), " Archive instead"]
								})]
							})
						]
					})] })
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Dialog, {
				open: showArchiveDialog,
				onOpenChange: setShowArchiveDialog,
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogContent, {
					className: "sm:max-w-md gap-0 p-0",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogHeader, {
						className: "p-5 pb-0",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogTitle, {
							className: "text-base text-amber-600 flex items-center gap-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Archive, { className: "size-4" }), "Archive Product"]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogDescription, {
							className: "text-sm text-muted-foreground pt-1",
							children: "Archiving hides the product from sales, purchases and reports while keeping its history intact. It can be unarchived at any time."
						})]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "p-5 space-y-4",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 p-3 text-sm",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "font-medium text-amber-700 dark:text-amber-400",
									children: "Impact preview:"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("ul", {
									className: "mt-1.5 text-xs text-amber-600 dark:text-amber-300 space-y-0.5",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "• Product hidden from new transactions" }),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "• Historical records remain intact" }),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "• Can be unarchived later" }),
										product.stock_quantity > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", { children: [
											"• ",
											product.stock_quantity,
											" ",
											unitName,
											" worth ",
											formatCurrency(product.stock_quantity * costPrice),
											" drops out of stock value and reports while archived"
										] })
									]
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
								htmlFor: "archive-reason",
								className: "text-xs font-medium text-muted-foreground mb-1.5 block",
								children: "Reason for archiving"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("textarea", {
								id: "archive-reason",
								value: actionReason,
								onChange: (e) => setActionReason(e.target.value),
								placeholder: "e.g. Discontinued, seasonal product...",
								rows: 3,
								className: "w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-ring focus-visible:ring-2 focus-visible:ring-ring/50 resize-none"
							})] }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex gap-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
									variant: "outline",
									onClick: () => setShowArchiveDialog(false),
									className: "flex-1",
									disabled: processing,
									children: "Cancel"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
									variant: "outline",
									onClick: () => {
										const reason = actionReason.trim() || "No reason provided";
										run({
											url: `/inventory/product/${product.id}/archive`,
											method: "post",
											data: { reason },
											onDone: () => setShowArchiveDialog(false)
										});
									},
									className: "flex-1 gap-1.5 border-amber-200 text-amber-700 hover:bg-amber-50 dark:border-amber-800 dark:hover:bg-amber-950/20",
									disabled: processing,
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Archive, { className: "size-3.5" }),
										" ",
										processing ? "Archiving..." : "Archive Product"
									]
								})]
							})
						]
					})]
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Dialog, {
				open: showUnarchiveDialog,
				onOpenChange: setShowUnarchiveDialog,
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogContent, {
					className: "sm:max-w-md gap-0 p-0",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogHeader, {
						className: "p-5 pb-0",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogTitle, {
							className: "text-base text-emerald-600 flex items-center gap-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArchiveRestore, { className: "size-4" }), "Unarchive Product"]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogDescription, {
							className: "text-sm text-muted-foreground pt-1",
							children: "This makes the product available again for sales, purchases and reports."
						})]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "p-5 space-y-4",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "rounded-lg bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800 p-3 text-sm",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "font-medium text-emerald-700 dark:text-emerald-400",
									children: "What unarchiving does:"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("ul", {
									className: "mt-1.5 text-xs text-emerald-600 dark:text-emerald-300 space-y-0.5",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "• Product appears in inventory and all pickers again" }),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "• Counts toward stock value and low-stock alerts" }),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "• Stock and history are unchanged" })
									]
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
								htmlFor: "unarchive-reason",
								className: "text-xs font-medium text-muted-foreground mb-1.5 block",
								children: "Reason for unarchiving"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("textarea", {
								id: "unarchive-reason",
								value: actionReason,
								onChange: (e) => setActionReason(e.target.value),
								placeholder: "e.g. Selling this product again...",
								rows: 3,
								className: "w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-ring focus-visible:ring-2 focus-visible:ring-ring/50 resize-none"
							})] }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex gap-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
									variant: "outline",
									onClick: () => setShowUnarchiveDialog(false),
									className: "flex-1",
									disabled: processing,
									children: "Cancel"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
									onClick: () => {
										const reason = actionReason.trim() || "No reason provided";
										run({
											url: `/inventory/product/${product.id}/unarchive`,
											method: "post",
											data: { reason },
											onDone: () => setShowUnarchiveDialog(false)
										});
									},
									className: "flex-1 gap-1.5",
									disabled: processing,
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArchiveRestore, { className: "size-3.5" }),
										" ",
										processing ? "Unarchiving..." : "Unarchive Product"
									]
								})]
							})
						]
					})]
				})
			})
		]
	});
}
//#endregion
export { ProductDetailsPage as default };
