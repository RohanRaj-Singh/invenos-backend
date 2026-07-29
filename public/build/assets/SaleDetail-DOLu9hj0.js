import { i as __toESM, t as require_react } from "./react-DCO0ASPG.js";
import { t as ArrowLeft } from "./arrow-left-CE4TWQlw.js";
import { t as Banknote } from "./banknote-B76zKt2w.js";
import { t as Printer } from "./printer-SCaoHvv-.js";
import { t as RotateCcw } from "./rotate-ccw-DB3zy8KA.js";
import { t as cn } from "./utils-Bim8RyS4.js";
import { t as require_jsx_runtime } from "./jsx-runtime-BjJQA5sn.js";
import { t as Button } from "./button-phKcTdak.js";
import { Dt as usePage, Et as router3, Tt as Link_default, gt as Receipt, st as formatCurrency } from "./app-DCc201bC.js";
import { i as CardTitle, n as CardContent, r as CardHeader, t as Card } from "./card-DQfOgTjC.js";
import { t as usePermission } from "./PermissionGuard-f3eLliM_.js";
//#region resources/js/Pages/sales/SaleDetail.tsx
var import_react = /* @__PURE__ */ __toESM(require_react(), 1);
var import_jsx_runtime = require_jsx_runtime();
var sourceConfig = {
	pos: {
		label: "POS",
		cls: "bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400"
	},
	clinic: {
		label: "Clinic",
		cls: "bg-purple-50 text-purple-600 dark:bg-purple-500/10 dark:text-purple-400"
	},
	manual: {
		label: "Manual",
		cls: "bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400"
	}
};
var payCfg = {
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
function SaleDetailPage() {
	const { props } = usePage();
	const { sale } = props;
	const [showPayment, setShowPayment] = (0, import_react.useState)(false);
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
	const sCfg = sourceConfig[sale.source] || sourceConfig.pos;
	const pCfg = payCfg[sale.payment_status] || payCfg.paid;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto space-y-5",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
				variant: "ghost",
				size: "sm",
				onClick: () => router3.visit("/sales"),
				className: "gap-1.5 -ml-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowLeft, { className: "size-3.5" }), "Back to Sales"]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-start justify-between",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center gap-2",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Receipt, { className: "size-5 text-primary" }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
							className: "text-xl font-semibold tracking-tight",
							children: sale.customer_name || "Walk-in Customer"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: cn("text-[10px] font-medium px-1.5 py-0.5 rounded", sCfg.cls),
							children: sCfg.label
						})
					]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "text-sm text-muted-foreground mt-1",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("code", {
							className: "font-mono text-xs bg-muted px-1.5 py-0.5 rounded",
							children: sale.invoice_number
						}),
						" · ",
						sale.date
					]
				})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
						variant: "outline",
						size: "sm",
						onClick: () => router3.visit(`/sales/${sale.id}/print`),
						className: "gap-1.5",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Printer, { className: "size-3.5" }), " Print"]
					}), canProcessReturn && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
						variant: "outline",
						size: "sm",
						onClick: () => router3.visit(`/returns/sale?ref=${sale.invoice_number}`),
						className: "gap-1.5",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(RotateCcw, { className: "size-3.5" }), "Return"]
					})]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "grid grid-cols-1 md:grid-cols-3 gap-4",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardHeader, {
						className: "pb-2",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardTitle, {
							className: "text-xs uppercase tracking-wider text-muted-foreground",
							children: "Customer"
						})
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardContent, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-sm font-medium",
						children: sale.customer_name || "Walk-in Customer"
					}), sale.customer && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link_default, {
						href: `/contacts/${sale.customer_id}`,
						className: "text-xs text-primary hover:underline inline-flex items-center gap-1 mt-1",
						children: ["View Contact ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowLeft, { className: "size-3 rotate-180" })]
					})] })] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardHeader, {
						className: "pb-2",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardTitle, {
							className: "text-xs uppercase tracking-wider text-muted-foreground",
							children: "Payment"
						})
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardContent, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center justify-between",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: cn("text-sm font-medium", pCfg.cls),
							children: pCfg.label
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
							variant: "ghost",
							size: "xs",
							onClick: () => setShowPayment(true),
							className: "text-xs gap-1",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Banknote, { className: "size-3" }), "Record Payment"]
						})]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "text-xs text-muted-foreground mt-1",
						children: [
							formatCurrency(sale.amount_paid),
							" paid · ",
							sale.outstanding_balance > 0 ? `Outstanding: ${formatCurrency(sale.outstanding_balance)}` : "Settled"
						]
					})] })] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardHeader, {
						className: "pb-2",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardTitle, {
							className: "text-xs uppercase tracking-wider text-muted-foreground",
							children: "Total"
						})
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardContent, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-base font-bold",
						children: formatCurrency(sale.grand_total)
					}), sale.discount > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "text-xs text-muted-foreground",
						children: ["Discount: ", formatCurrency(sale.discount)]
					})] })] })
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardHeader, {
				className: "flex-row items-center justify-between",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardTitle, {
					className: "text-sm",
					children: [
						"Items (",
						sale.items?.length || 0,
						")"
					]
				})
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardContent, {
				className: "pt-0",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "divide-y divide-border",
					children: sale.items?.map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "py-3 flex items-center justify-between",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-sm font-medium",
							children: item.product_name
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "text-xs text-muted-foreground",
							children: [
								item.quantity,
								" × ",
								item.packaging_name,
								" (",
								item.packaging_quantity,
								" units) @ ",
								formatCurrency(item.unit_price),
								" each"
							]
						})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-sm font-semibold",
							children: formatCurrency(item.total)
						})]
					}, item.id))
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "border-t border-border pt-3 mt-3 space-y-1",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex justify-between text-sm text-muted-foreground",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Subtotal" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: formatCurrency(sale.subtotal) })]
						}),
						sale.discount > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex justify-between text-sm text-muted-foreground",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Discount" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "text-red-500",
								children: ["-", formatCurrency(sale.discount)]
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex justify-between text-base font-bold pt-1 border-t border-border",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Total" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: formatCurrency(sale.grand_total) })]
						})
					]
				})]
			})] }),
			sale.notes && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardHeader, {
				className: "pb-2",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardTitle, {
					className: "text-xs uppercase tracking-wider text-muted-foreground",
					children: "Notes"
				})
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardContent, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-sm",
				children: sale.notes
			}) })] })
		]
	});
}
//#endregion
export { SaleDetailPage as default };
