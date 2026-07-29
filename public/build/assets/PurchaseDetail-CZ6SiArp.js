import { i as __toESM, t as require_react } from "./react-DCO0ASPG.js";
import { t as ArrowLeft } from "./arrow-left-CE4TWQlw.js";
import { t as Printer } from "./printer-SCaoHvv-.js";
import { t as RotateCcw } from "./rotate-ccw-DB3zy8KA.js";
import { t as cn } from "./utils-Bim8RyS4.js";
import { t as require_jsx_runtime } from "./jsx-runtime-BjJQA5sn.js";
import { t as Button } from "./button-phKcTdak.js";
import { Dt as usePage, Et as router3, Tt as Link_default, pt as ShoppingBag, st as formatCurrency } from "./app-DGjxHKeP.js";
import { i as CardTitle, n as CardContent, r as CardHeader, t as Card } from "./card-DQfOgTjC.js";
//#region resources/js/Pages/purchases/PurchaseDetail.tsx
var import_react = /* @__PURE__ */ __toESM(require_react(), 1);
var import_jsx_runtime = require_jsx_runtime();
var paymentColors = {
	paid: {
		label: "Paid",
		cls: "text-emerald-600 dark:text-emerald-400"
	},
	partial: {
		label: "Partially Paid",
		cls: "text-amber-600 dark:text-amber-400"
	},
	unpaid: {
		label: "Unpaid",
		cls: "text-red-600 dark:text-red-400"
	}
};
var statusCfg = {
	received: {
		label: "Received",
		cls: "bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400"
	},
	pending: {
		label: "Pending",
		cls: "bg-slate-50 text-slate-600 dark:bg-slate-500/10 dark:text-slate-400"
	}
};
function PurchaseDetailPage() {
	const { props } = usePage();
	const { purchase, returns } = props;
	const [expandedItems, setExpandedItems] = (0, import_react.useState)(/* @__PURE__ */ new Set());
	if (!purchase) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex flex-col items-center justify-center py-24 text-sm text-muted-foreground",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ShoppingBag, { className: "size-12 text-muted-foreground/30 mb-4" }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "text-lg font-semibold text-foreground mb-1",
					children: "Purchase not found"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mb-4",
					children: "This transaction doesn't exist."
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					variant: "outline",
					onClick: () => router3.visit("/purchases"),
					children: "Back to Purchases"
				})
			]
		})
	});
	const pCfg = paymentColors[purchase.payment_status] || paymentColors.paid;
	const sCfg = statusCfg[purchase.status] || statusCfg.received;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto space-y-5",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
				variant: "ghost",
				size: "sm",
				onClick: () => router3.visit("/purchases"),
				className: "gap-1.5 -ml-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowLeft, { className: "size-3.5" }), "Back to Purchases"]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-start justify-between",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ShoppingBag, { className: "size-5 text-amber-600" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
						className: "text-xl font-semibold tracking-tight",
						children: purchase.supplier_name
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "text-sm text-muted-foreground mt-1",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("code", {
							className: "font-mono text-xs bg-muted px-1.5 py-0.5 rounded",
							children: purchase.invoice_ref
						}),
						" · ",
						purchase.date
					]
				})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center gap-2",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
							variant: "outline",
							size: "sm",
							onClick: () => router3.visit(`/purchases/${purchase.id}/print`),
							className: "gap-1.5",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Printer, { className: "size-3.5" }), " Print"]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: cn("text-xs font-medium px-2 py-1 rounded-lg", sCfg.cls),
							children: sCfg.label
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: cn("text-xs font-medium", pCfg.cls),
							children: pCfg.label
						})
					]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "grid grid-cols-1 md:grid-cols-3 gap-4",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardHeader, {
						className: "pb-2",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardTitle, {
							className: "text-xs uppercase tracking-wider text-muted-foreground",
							children: "Supplier"
						})
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardContent, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-sm font-medium",
						children: purchase.supplier_name
					}), purchase.supplier && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link_default, {
						href: `/contacts/${purchase.supplier_id}`,
						className: "text-xs text-primary hover:underline inline-flex items-center gap-1 mt-1",
						children: ["View Contact ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowLeft, { className: "size-3 rotate-180" })]
					})] })] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardHeader, {
						className: "pb-2",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardTitle, {
							className: "text-xs uppercase tracking-wider text-muted-foreground",
							children: "Payment"
						})
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardContent, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "text-sm font-medium",
						children: [formatCurrency(purchase.amount_paid), " paid"]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-xs text-muted-foreground mt-0.5",
						children: purchase.outstanding_balance > 0 ? `Outstanding: ${formatCurrency(purchase.outstanding_balance)}` : "Fully paid"
					})] })] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardHeader, {
						className: "pb-2",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardTitle, {
							className: "text-xs uppercase tracking-wider text-muted-foreground",
							children: "Totals"
						})
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardContent, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-sm font-bold",
						children: formatCurrency(purchase.total_amount)
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "text-xs text-muted-foreground mt-0.5",
						children: ["Subtotal: ", formatCurrency(purchase.subtotal)]
					})] })] })
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardHeader, {
				className: "flex-row items-center justify-between",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardTitle, {
					className: "text-sm",
					children: [
						"Items (",
						purchase.items?.length || 0,
						")"
					]
				})
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardContent, {
				className: "pt-0",
				children: !purchase.items || purchase.items.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-sm text-muted-foreground py-4 text-center",
					children: "No items in this purchase."
				}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "divide-y divide-border",
					children: [
						purchase.items.map((item) => {
							const totalQty = item.purchase_pack_qty * item.purchase_quantity;
							return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "py-3",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex items-center justify-between",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "text-sm font-medium",
										children: item.product_name
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
										className: "text-xs text-muted-foreground",
										children: [
											item.purchase_quantity,
											" × ",
											item.purchase_pack_name,
											" (",
											item.purchase_pack_qty,
											" units each) = ",
											totalQty,
											" units"
										]
									})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "text-right",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "text-sm font-semibold",
											children: formatCurrency(item.total_cost)
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
											className: "text-[11px] text-muted-foreground",
											children: [
												"@",
												formatCurrency(item.unit_cost),
												"/",
												item.purchase_pack_name
											]
										})]
									})]
								})
							}, item.id);
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "py-3 flex items-center justify-between font-medium",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Subtotal" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: formatCurrency(purchase.subtotal) })]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "py-3 flex items-center justify-between font-bold text-base",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Total" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: formatCurrency(purchase.total_amount) })]
						})
					]
				})
			})] }),
			returns && returns.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardHeader, {
				className: "flex-row items-center justify-between",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardTitle, {
					className: "text-sm flex items-center gap-2",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(RotateCcw, { className: "size-4 text-orange-500" }),
						"Returns (",
						returns.length,
						")"
					]
				})
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardContent, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "space-y-2",
				children: returns.map((ret) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center justify-between py-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link_default, {
						href: `/purchases/returns/${ret.id}`,
						className: "text-sm font-medium text-primary hover:underline",
						children: ret.return_number
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "text-sm",
						children: formatCurrency(ret.total)
					})]
				}, ret.id))
			}) })] }),
			purchase.notes && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardHeader, {
				className: "pb-2",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardTitle, {
					className: "text-xs uppercase tracking-wider text-muted-foreground",
					children: "Notes"
				})
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardContent, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-sm",
				children: purchase.notes
			}) })] })
		]
	});
}
//#endregion
export { PurchaseDetailPage as default };
