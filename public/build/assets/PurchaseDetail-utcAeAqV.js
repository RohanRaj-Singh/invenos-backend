import { i as __toESM, t as require_react } from "./react-DCO0ASPG.js";
import { t as ArrowLeft } from "./arrow-left-CE4TWQlw.js";
import { t as Printer } from "./printer-SCaoHvv-.js";
import { t as RotateCcw } from "./rotate-ccw-DB3zy8KA.js";
import { t as cn } from "./utils-Bim8RyS4.js";
import { t as require_jsx_runtime } from "./jsx-runtime-BjJQA5sn.js";
import { t as Button } from "./button-phKcTdak.js";
import { a as DialogTitle, i as DialogHeader, n as DialogContent, r as DialogDescription, t as Dialog } from "./dialog-C6yKUL3Q.js";
import { Dt as router3, Et as Link_default, Ot as usePage, Tt as toast, ft as ShoppingBag, it as formatDate, lt as Trash2, rt as formatCurrency } from "./app-DRCb4nuk.js";
import { i as CardTitle, n as CardContent, r as CardHeader, t as Card } from "./card-D1ktOUWx.js";
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
	const isAdmin = (props.auth?.user ?? null)?.role === "admin";
	const [showDeleteDialog, setShowDeleteDialog] = (0, import_react.useState)(false);
	const [deleteReason, setDeleteReason] = (0, import_react.useState)("");
	const [deleting, setDeleting] = (0, import_react.useState)(false);
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
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
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
						formatDate(purchase.date)
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
						}),
						isAdmin && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
							variant: "outline",
							size: "sm",
							onClick: () => setShowDeleteDialog(true),
							className: "gap-1.5 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20 border-red-200 dark:border-red-800",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash2, { className: "size-3.5" }), " Delete"]
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
							item.purchase_pack_qty * item.purchase_quantity;
							const unitName = item.purchase_pack_name || item.base_unit_name || "units";
							return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "py-3",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex items-center justify-between gap-4",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "min-w-0 flex-1",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "text-sm font-medium text-foreground truncate",
											children: item.product_name
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
											className: "text-xs text-muted-foreground mt-0.5",
											children: [
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
													className: "tabular-nums",
													children: item.purchase_quantity
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
													className: "mx-1",
													children: "×"
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
													className: "font-medium",
													children: unitName
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
													className: "mx-1.5 text-muted-foreground/30",
													children: "@"
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
													className: "tabular-nums",
													children: formatCurrency(item.unit_cost)
												}),
												item.purchase_pack_qty > 1 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
													className: "text-muted-foreground/50 ml-1",
													children: [
														"(",
														item.purchase_pack_qty,
														" base/",
														unitName,
														")"
													]
												})
											]
										})]
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "text-right shrink-0 ml-2",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "text-sm font-semibold tabular-nums",
											children: formatCurrency(item.total_cost)
										})
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
	}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Dialog, {
		open: showDeleteDialog,
		onOpenChange: setShowDeleteDialog,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogContent, {
			className: "sm:max-w-md gap-0 p-0",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogHeader, {
				className: "p-5 pb-0",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogTitle, {
					className: "text-base text-red-600 flex items-center gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash2, { className: "size-4" }), "Delete Purchase"]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogDescription, {
					className: "text-sm text-muted-foreground pt-1",
					children: "This will reverse inventory, adjust supplier balance, and move the bill to the Recycle Bin. This action can be undone by restoring from the Recycle Bin."
				})]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "p-5 space-y-4",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 p-3 text-sm",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "font-medium text-red-700 dark:text-red-400",
							children: "Impact preview:"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("ul", {
							className: "mt-1.5 text-xs text-red-600 dark:text-red-300 space-y-0.5",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", { children: [
									"• Inventory reduced (",
									purchase.items?.length || 0,
									" items)"
								] }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", { children: ["• Supplier balance reduced by ", formatCurrency(purchase.total_amount)] }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", { children: [
									"• Bill ",
									purchase.invoice_ref,
									" moved to Recycle Bin"
								] })
							]
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
						className: "text-xs font-medium text-muted-foreground mb-1.5 block",
						children: "Reason for deletion"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("textarea", {
						value: deleteReason,
						onChange: (e) => setDeleteReason(e.target.value),
						placeholder: "e.g. Supplier returned, duplicate entry...",
						rows: 3,
						className: "w-full rounded-lg border border-input bg-background px-3 py-2 text-sm outline-none focus:border-ring resize-none"
					})] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							variant: "outline",
							onClick: () => {
								setShowDeleteDialog(false);
								setDeleteReason("");
							},
							className: "flex-1",
							disabled: deleting,
							children: "Cancel"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
							variant: "destructive",
							onClick: () => {
								setDeleting(true);
								const reason = deleteReason.trim() || "No reason provided";
								router3.delete(`/purchases/${purchase.id}`, {
									data: { reason },
									onSuccess: () => {
										toast.success(`Purchase ${purchase.invoice_ref} deleted. Inventory reversed.`);
										router3.visit("/purchases", { preserveState: false });
									},
									onError: (errs) => {
										const first = Object.values(errs)[0];
										toast.error(String(first || "Failed to delete purchase"));
										setDeleting(false);
										setShowDeleteDialog(false);
									},
									onFinish: () => {
										setDeleting(false);
									}
								});
							},
							className: "flex-1 gap-1.5",
							disabled: deleting,
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash2, { className: "size-3.5" }), deleting ? "Deleting..." : "Delete Purchase"]
						})]
					})
				]
			})]
		})
	})] });
}
//#endregion
export { PurchaseDetailPage as default };
