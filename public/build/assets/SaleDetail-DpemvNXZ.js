import { i as __toESM, t as require_react } from "./react-DCO0ASPG.js";
import { t as ArrowLeft } from "./arrow-left-CE4TWQlw.js";
import { t as Banknote } from "./banknote-B76zKt2w.js";
import { t as FileText } from "./file-text-CkmQ0M6N.js";
import { t as Printer } from "./printer-SCaoHvv-.js";
import { t as RotateCcw } from "./rotate-ccw-DB3zy8KA.js";
import { t as cn } from "./utils-Bim8RyS4.js";
import { t as require_jsx_runtime } from "./jsx-runtime-BjJQA5sn.js";
import { t as Button } from "./button-phKcTdak.js";
import { a as DialogTitle, i as DialogHeader, n as DialogContent, r as DialogDescription, t as Dialog } from "./dialog-C4uC61EG.js";
import { Dt as router3, Et as Link_default, Ot as usePage, Tt as toast, at as formatDateTime, ht as Receipt, it as formatDate, lt as Trash2, rt as formatCurrency, xt as ChevronRight } from "./app-DxiW8KTt.js";
import { i as CardTitle, n as CardContent, r as CardHeader, t as Card } from "./card-D1ktOUWx.js";
import { t as Badge } from "./badge-BfSUOZdI.js";
import { t as usePermission } from "./PermissionGuard-O1yqBehN.js";
//#region resources/js/Pages/sales/SaleDetail.tsx
var import_react = /* @__PURE__ */ __toESM(require_react(), 1);
var import_jsx_runtime = require_jsx_runtime();
var statusStyles = {
	paid: {
		label: "Paid",
		indicator: "bg-emerald-500"
	},
	partial: {
		label: "Partial",
		indicator: "bg-amber-500"
	},
	unpaid: {
		label: "Unpaid",
		indicator: "bg-red-500"
	}
};
var sourceStyles = {
	pos: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20",
	clinic: "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-500/10 dark:text-purple-400 dark:border-purple-500/20",
	manual: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20"
};
function SaleDetailPage() {
	const { props } = usePage();
	const { sale } = props;
	const isAdmin = (props.auth?.user ?? null)?.role === "admin";
	const [showPayment, setShowPayment] = (0, import_react.useState)(false);
	const [showDeleteDialog, setShowDeleteDialog] = (0, import_react.useState)(false);
	const [deleteReason, setDeleteReason] = (0, import_react.useState)("");
	const [deleting, setDeleting] = (0, import_react.useState)(false);
	const canProcessReturn = usePermission("sales", "processReturn");
	if (!sale) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex flex-col items-center justify-center py-24 text-sm text-muted-foreground",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Receipt, { className: "size-12 text-muted-foreground/30 mb-4" }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "text-lg font-semibold text-foreground mb-1",
					children: "Sale not found"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mb-4",
					children: "This transaction doesn't exist."
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					variant: "outline",
					onClick: () => router3.visit("/sales"),
					children: "Back to Sales"
				})
			]
		})
	});
	const sCfg = sourceStyles[sale.source] || sourceStyles.pos;
	const pStatus = statusStyles[sale.payment_status] || statusStyles.paid;
	const outstanding = Math.max(0, sale.outstanding_balance);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "min-h-screen bg-muted/30 pb-24 sm:pb-8",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "max-w-4xl mx-auto",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "sticky top-0 z-10 bg-background/90 backdrop-blur-md border-b border-border",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center justify-between px-4 sm:px-6 h-14",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							onClick: () => router3.visit("/sales"),
							className: "inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowLeft, { className: "size-4" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "hidden sm:inline",
								children: "Back"
							})]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center gap-1.5 overflow-x-auto no-scrollbar",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
									variant: "outline",
									size: "sm",
									onClick: () => router3.visit(`/sales/${sale.id}/print`),
									className: "gap-1.5 shrink-0",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Printer, { className: "size-3.5" }), " Print"]
								}),
								canProcessReturn && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
									variant: "outline",
									size: "sm",
									onClick: () => router3.visit(`/returns/sale?ref=${sale.invoice_number}`),
									className: "gap-1.5 shrink-0",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(RotateCcw, { className: "size-3.5" }), " Return"]
								}),
								isAdmin && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
									variant: "outline",
									size: "sm",
									onClick: () => setShowDeleteDialog(true),
									className: "gap-1.5 shrink-0 text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700 dark:border-red-800 dark:hover:bg-red-950/20",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash2, { className: "size-3.5" }), " Delete"]
								})
							]
						})]
					})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "px-4 sm:px-6 pt-5",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Card, {
						className: "overflow-hidden",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardContent, {
							className: "p-0",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "p-4 sm:p-5",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex items-start justify-between gap-4",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "min-w-0",
											children: [
												/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
													className: "flex items-center gap-2 mb-1",
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FileText, { className: "size-4 text-muted-foreground shrink-0" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("code", {
														className: "text-sm font-mono font-semibold text-foreground",
														children: sale.invoice_number
													})]
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
													className: "text-lg sm:text-xl font-semibold tracking-tight truncate",
													children: sale.customer_name || "Walk-in Customer"
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
													className: "flex items-center gap-2 mt-1 text-xs text-muted-foreground",
													children: [
														/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: formatDate(sale.date) }),
														/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
															className: "text-muted-foreground/40",
															children: "|"
														}),
														sale.customer && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link_default, {
															href: `/contacts/${sale.customer_id}`,
															className: "text-primary hover:underline inline-flex items-center gap-0.5",
															children: ["View Contact ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronRight, { className: "size-3" })]
														})
													]
												})
											]
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "flex flex-col items-end gap-1.5 shrink-0",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
												className: cn("inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-lg border", sCfg),
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "size-1.5 rounded-full bg-current" }), sale.source.charAt(0).toUpperCase() + sale.source.slice(1)]
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Badge, {
												variant: "outline",
												className: cn("text-xs font-medium gap-1.5", sale.payment_status === "paid" ? "text-emerald-600 border-emerald-200 dark:border-emerald-800" : "", sale.payment_status === "partial" ? "text-amber-600 border-amber-200 dark:border-amber-800" : "", sale.payment_status === "unpaid" ? "text-red-600 border-red-200 dark:border-red-800" : ""),
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: cn("size-1.5 rounded-full", pStatus.indicator) }), pStatus.label]
											})]
										})]
									})
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "grid grid-cols-2 sm:grid-cols-4 divide-x divide-border border-t border-border",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "px-4 py-3 sm:px-5 sm:py-3.5",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
												className: "text-[11px] font-medium text-muted-foreground uppercase tracking-wider",
												children: "Subtotal"
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
												className: "text-sm font-semibold mt-0.5",
												children: formatCurrency(sale.subtotal)
											})]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "px-4 py-3 sm:px-5 sm:py-3.5",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
												className: "text-[11px] font-medium text-muted-foreground uppercase tracking-wider",
												children: "Discount"
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
												className: cn("text-sm font-semibold mt-0.5", sale.discount > 0 ? "text-red-500" : ""),
												children: sale.discount > 0 ? `-${formatCurrency(sale.discount)}` : "—"
											})]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "px-4 py-3 sm:px-5 sm:py-3.5",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
												className: "text-[11px] font-medium text-muted-foreground uppercase tracking-wider",
												children: "Paid"
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
												className: "text-sm font-semibold mt-0.5 text-emerald-600",
												children: formatCurrency(sale.amount_paid)
											})]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "px-4 py-3 sm:px-5 sm:py-3.5",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
												className: "text-[11px] font-medium text-muted-foreground uppercase tracking-wider",
												children: "Total"
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
												className: "text-base font-bold mt-0.5",
												children: formatCurrency(sale.grand_total)
											})]
										})
									]
								}),
								outstanding > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex items-center justify-between px-4 sm:px-5 py-2.5 bg-amber-50/70 dark:bg-amber-950/20 border-t border-border",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "text-xs font-medium text-amber-700 dark:text-amber-400",
										children: "Outstanding Balance"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex items-center gap-2",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "text-sm font-bold text-amber-700 dark:text-amber-400",
											children: formatCurrency(outstanding)
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
											variant: "ghost",
											size: "xs",
											onClick: () => setShowPayment(true),
											className: "text-xs gap-1",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Banknote, { className: "size-3" }), "Pay"]
										})]
									})]
								})
							]
						})
					})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "px-4 sm:px-6 mt-4",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "flex items-center justify-between mb-3",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h2", {
							className: "text-sm font-semibold text-foreground",
							children: [
								"Items (",
								sale.items?.length || 0,
								")"
							]
						})
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Card, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardContent, {
						className: "p-0 divide-y divide-border",
						children: [sale.items?.map((item, idx) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "px-4 sm:px-5 py-3.5 flex items-center justify-between gap-4 hover:bg-muted/20 transition-colors",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "min-w-0 flex-1",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex items-center gap-2",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
										className: "text-xs text-muted-foreground font-mono tabular-nums w-5 shrink-0",
										children: [idx + 1, "."]
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "text-sm font-medium text-foreground truncate",
										children: item.product_name
									})]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
									className: "text-xs text-muted-foreground mt-0.5 ml-7",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "tabular-nums",
											children: item.packaging_quantity
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "mx-1",
											children: "×"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "font-medium",
											children: item.packaging_name
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "mx-1.5 text-muted-foreground/30",
											children: "@"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "tabular-nums",
											children: formatCurrency(item.unit_price)
										}),
										item.base_quantity > 0 && item.base_quantity !== item.packaging_quantity && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
											className: "text-muted-foreground/50 ml-1",
											children: [
												"(",
												item.base_quantity,
												" base units)"
											]
										})
									]
								})]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "text-right shrink-0 ml-2",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-sm font-semibold tabular-nums",
									children: formatCurrency(item.total)
								})
							})]
						}, item.id)), (!sale.items || sale.items.length === 0) && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "px-4 sm:px-5 py-8 text-center text-sm text-muted-foreground",
							children: "No items recorded."
						})]
					}) })]
				}),
				sale.notes && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "px-4 sm:px-6 mt-4",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardHeader, {
						className: "pb-2",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardTitle, {
							className: "text-xs font-semibold uppercase tracking-wider text-muted-foreground",
							children: "Notes"
						})
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardContent, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-sm whitespace-pre-wrap",
						children: sale.notes
					}) })] })
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "px-4 sm:px-6 mt-4",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "text-xs text-muted-foreground/60",
						children: [
							"Created ",
							sale.created_by ? `by ${sale.created_by}` : "",
							" · ",
							formatDateTime(sale.created_at)
						]
					})
				})
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
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash2, { className: "size-4" }), "Delete Sale"]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogDescription, {
						className: "text-sm text-muted-foreground pt-1",
						children: "This will reverse inventory, adjust customer balance, and move the invoice to the Recycle Bin. This action can be undone."
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
										"• Inventory added back (",
										sale.items?.length || 0,
										" items)"
									] }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", { children: ["• Customer balance reduced by ", formatCurrency(sale.grand_total)] }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", { children: [
										"• Invoice ",
										sale.invoice_number,
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
							placeholder: "e.g. Duplicate entry, customer cancelled...",
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
									router3.delete(`/sales/${sale.id}`, {
										data: { reason },
										onSuccess: () => {
											toast.success(`Sale ${sale.invoice_number} deleted. Inventory reversed.`);
											router3.visit("/sales", { preserveState: false });
										},
										onError: (errs) => {
											toast.error(Object.values(errs)[0] || "Failed to delete sale");
											setDeleting(false);
											setShowDeleteDialog(false);
										},
										onFinish: () => setDeleting(false)
									});
								},
								className: "flex-1 gap-1.5",
								disabled: deleting,
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash2, { className: "size-3.5" }), deleting ? "Deleting..." : "Delete Sale"]
							})]
						})
					]
				})]
			})
		})]
	});
}
//#endregion
export { SaleDetailPage as default };
