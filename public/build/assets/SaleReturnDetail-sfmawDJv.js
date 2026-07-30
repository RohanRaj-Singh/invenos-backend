import { t as ArrowLeft } from "./arrow-left-CE4TWQlw.js";
import { t as ExternalLink } from "./external-link-BeGckZzO.js";
import { t as Printer } from "./printer-SCaoHvv-.js";
import { t as RotateCcw } from "./rotate-ccw-DB3zy8KA.js";
import { t as cn } from "./utils-Bim8RyS4.js";
import { t as require_jsx_runtime } from "./jsx-runtime-BjJQA5sn.js";
import { A as getSaleById, Dt as router3, Et as Link_default, Ot as usePage, ht as Receipt, tt as formatCurrency } from "./app-DQEL3DJY.js";
import { i as CardTitle, n as CardContent, r as CardHeader, t as Card } from "./card-D1ktOUWx.js";
import { t as Badge } from "./badge-BfSUOZdI.js";
import { n as getSaleReturnByNumber } from "./returns-DwZYvuvg.js";
//#region resources/js/Pages/returns/SaleReturnDetail.tsx
var import_jsx_runtime = require_jsx_runtime();
var CONDITION_LABELS = {
	resellable: {
		label: "Resellable",
		cls: "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400"
	},
	damaged: {
		label: "Damaged",
		cls: "bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-400"
	},
	expired: {
		label: "Expired",
		cls: "bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400"
	}
};
function SaleReturnDetailPage() {
	const { url } = usePage();
	const returnData = getSaleReturnByNumber(url.split("/").pop() || "");
	if (!returnData) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex flex-col items-center justify-center py-24 text-sm text-muted-foreground",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(RotateCcw, { className: "size-12 text-muted-foreground/30 mb-4" }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "text-lg font-semibold text-foreground mb-1",
					children: "Return Not Found"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mb-4",
					children: "This return transaction doesn't exist."
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link_default, {
					href: "/sales/returns",
					className: "inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-border text-sm font-medium hover:bg-muted transition-colors",
					children: "Back to Sale Returns"
				})
			]
		})
	});
	const originalSale = returnData.originalSaleId ? getSaleById(returnData.originalSaleId) : null;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto space-y-5",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-center justify-between",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
					onClick: () => router3.visit("/sales/returns"),
					className: "inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowLeft, { className: "size-4" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Back to Sale Returns" })]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						onClick: () => window.print(),
						className: "inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-border text-xs font-medium hover:bg-muted transition-colors",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Printer, { className: "size-3.5" }), "Print"]
					}), originalSale && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link_default, {
						href: `/sales/${returnData.originalSaleId}`,
						className: "inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-border text-xs font-medium hover:bg-muted transition-colors",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ExternalLink, { className: "size-3.5" }), "View Original Sale"]
					})]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-start gap-4",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "size-12 sm:size-14 rounded-xl bg-gradient-to-br from-amber-500/20 to-amber-500/5 flex items-center justify-center shrink-0",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(RotateCcw, { className: "size-6 sm:size-7 text-amber-600 dark:text-amber-400" })
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex-1 min-w-0",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center gap-3 flex-wrap",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
								className: "text-xl sm:text-2xl font-semibold tracking-tight",
								children: returnData.returnNumber
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
								variant: "outline",
								className: "text-[10px] bg-amber-50 text-amber-700 border-amber-200 px-2 py-0 h-5 font-medium",
								children: "Sale Return"
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center gap-2 mt-1 text-sm text-muted-foreground flex-wrap",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "font-medium text-foreground",
									children: returnData.customerName
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "·" }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: returnData.date }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "·" }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: returnData.createdBy })
							]
						}),
						originalSale && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "mt-1",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link_default, {
								href: `/sales/${returnData.originalSaleId}`,
								className: "text-xs text-primary hover:underline inline-flex items-center gap-1",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ExternalLink, { className: "size-3" }),
									"Original: ",
									returnData.originalInvoice
								]
							})
						})
					]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "grid grid-cols-2 sm:grid-cols-4 gap-3",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(StatCard, {
						label: "Items Returned",
						value: `${returnData.items.length}`
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(StatCard, {
						label: "Total Units",
						value: `${returnData.items.reduce((s, i) => s + i.returnedQty, 0)}`
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(StatCard, {
						label: "Total Refund",
						value: formatCurrency(returnData.totalRefund),
						bold: true
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(StatCard, {
						label: "Refund Method",
						value: returnData.refundMethod,
						positive: true
					})
				]
			}),
			originalSale && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Card, {
				size: "sm",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardContent, {
					className: "p-4",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center justify-between",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center gap-2 text-sm",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Receipt, { className: "size-4 text-muted-foreground" }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-muted-foreground",
									children: "Original Sale:"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "font-medium",
									children: returnData.originalInvoice
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-muted-foreground",
									children: "·"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: originalSale.date }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-muted-foreground",
									children: "·"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: formatCurrency(originalSale.grandTotal) })
							]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link_default, {
							href: `/sales/${returnData.originalSaleId}`,
							className: "text-xs text-primary hover:underline inline-flex items-center gap-1",
							children: ["View Sale ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ExternalLink, { className: "size-3" })]
						})]
					})
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardHeader, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardTitle, { children: [
				"Returned Items (",
				returnData.items.length,
				")"
			] }) }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardContent, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "space-y-1",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "grid grid-cols-12 gap-3 px-3 py-2 text-[11px] font-semibold text-muted-foreground uppercase tracking-wider",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "col-span-4",
							children: "Product"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "col-span-2 text-center",
							children: "Returned"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "col-span-2 text-right",
							children: "Price"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "col-span-2 text-right",
							children: "Refund"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "col-span-2 text-right",
							children: "Condition"
						})
					]
				}), returnData.items.map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "grid grid-cols-12 gap-3 px-3 py-2.5 rounded-lg hover:bg-muted/50 transition-colors text-sm",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "col-span-4 font-medium text-foreground truncate",
							children: item.productName
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "col-span-2 text-center text-muted-foreground",
							children: [
								item.returnedQty,
								" ",
								item.unitName
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "col-span-2 text-right text-muted-foreground",
							children: formatCurrency(item.refundAmount / Math.max(1, item.returnedQty))
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "col-span-2 text-right font-semibold text-amber-600 dark:text-amber-400",
							children: formatCurrency(item.refundAmount)
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "col-span-2 text-right",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
								variant: "outline",
								className: cn("text-[10px] px-1.5 py-0 h-5", CONDITION_LABELS[item.condition]?.cls),
								children: CONDITION_LABELS[item.condition]?.label || item.condition
							})
						})
					]
				}, item.originalLineId))]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-3 pt-3 border-t border-border",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex justify-between text-sm font-semibold px-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Total Refund" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "text-amber-600 dark:text-amber-400",
						children: formatCurrency(returnData.totalRefund)
					})]
				})
			})] })] }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardHeader, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardTitle, { children: "Timeline" }) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardContent, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "space-y-3",
				children: [originalSale && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TimelineEntry, {
					icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Receipt, { className: "size-4" }),
					title: "Original Sale Created",
					description: `${returnData.originalInvoice} — ${formatCurrency(originalSale.grandTotal)}`,
					date: originalSale.date,
					active: true
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TimelineEntry, {
					icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(RotateCcw, { className: "size-4" }),
					title: "Return Processed",
					description: `${returnData.returnNumber} — ${returnData.items.length} item${returnData.items.length !== 1 ? "s" : ""} returned · Refund ${formatCurrency(returnData.totalRefund)}`,
					date: returnData.date,
					active: true
				})]
			}) })] })
		]
	});
}
function StatCard({ label, value, bold, positive, negative }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Card, {
		size: "sm",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardContent, {
			className: "p-4",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "text-[11px] text-muted-foreground uppercase tracking-wider mb-1",
				children: label
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: cn("text-lg tracking-tight", bold ? "font-bold" : "font-semibold", positive && "text-emerald-600 dark:text-emerald-400", negative && "text-red-600 dark:text-red-400"),
				children: value
			})]
		})
	});
}
function TimelineEntry({ icon, title, description, date, active }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex gap-3",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: cn("flex items-center justify-center size-8 rounded-lg shrink-0 mt-0.5", active ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"),
				children: icon
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex-1 min-w-0",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "text-sm font-medium text-foreground",
					children: title
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "text-xs text-muted-foreground",
					children: description
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "text-xs text-muted-foreground shrink-0",
				children: date
			})
		]
	});
}
//#endregion
export { SaleReturnDetailPage as default };
