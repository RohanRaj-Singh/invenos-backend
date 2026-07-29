import { i as __toESM, t as require_react } from "./react-DCO0ASPG.js";
import { t as ArrowRight } from "./arrow-right-BaJB_osx.js";
import { t as RotateCcw } from "./rotate-ccw-DB3zy8KA.js";
import { t as cn } from "./utils-Bim8RyS4.js";
import { t as require_jsx_runtime } from "./jsx-runtime-BjJQA5sn.js";
import { Dt as usePage, Et as router3, _t as Plus, ht as Search, pt as ShoppingBag, st as formatCurrency } from "./app-fzdHvqQg.js";
import { n as CardContent, t as Card } from "./card-DQfOgTjC.js";
import { t as usePermission } from "./PermissionGuard-qzXEvT8E.js";
//#region resources/js/Pages/purchases/PurchasesList.tsx
var import_react = /* @__PURE__ */ __toESM(require_react(), 1);
var import_jsx_runtime = require_jsx_runtime();
var paymentColors = {
	paid: {
		label: "Paid",
		cls: "text-emerald-600 dark:text-emerald-400"
	},
	partial: {
		label: "Partial",
		cls: "text-amber-600 dark:text-amber-400"
	},
	unpaid: {
		label: "Unpaid",
		cls: "text-red-600 dark:text-red-400"
	}
};
var statusColors = {
	received: {
		label: "Received",
		cls: "bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400"
	},
	pending: {
		label: "Pending",
		cls: "bg-slate-50 text-slate-600 dark:bg-slate-500/10 dark:text-slate-400"
	}
};
function PurchasesListPage() {
	const { props } = usePage();
	const { purchases, meta, filters } = props;
	const [search, setSearch] = (0, import_react.useState)("");
	const [filterStatus, setFilterStatus] = (0, import_react.useState)("all");
	const canCreatePurchase = usePermission("purchases", "create");
	const filtered = (0, import_react.useMemo)(() => {
		return (purchases || []).filter((bill) => {
			if (search) {
				const q = search.toLowerCase();
				const nameMatch = (bill.supplier_name || "").toLowerCase().includes(q);
				const refMatch = (bill.invoice_ref || "").toLowerCase().includes(q);
				if (!nameMatch && !refMatch) return false;
			}
			if (filterStatus !== "all" && bill.status !== filterStatus) return false;
			return true;
		});
	}, [
		purchases,
		search,
		filterStatus
	]);
	const totalCount = meta?.total ?? purchases?.length ?? 0;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-5",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-start justify-between",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center gap-2 text-amber-600 mb-1",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ShoppingBag, { className: "size-5" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-xs font-semibold uppercase tracking-wider",
							children: "Purchases"
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
						className: "text-xl sm:text-2xl font-semibold tracking-tight",
						children: "All Purchases"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "text-sm text-muted-foreground mt-1",
						children: [totalCount, " transactions recorded"]
					})
				] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center gap-2",
					children: [canCreatePurchase && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						onClick: () => router3.visit("/returns/purchase"),
						className: "inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-border text-sm font-medium hover:bg-muted transition-colors",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(RotateCcw, { className: "size-4" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "hidden sm:inline",
							children: "Return"
						})]
					}), canCreatePurchase && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						onClick: () => router3.visit("/purchases/new"),
						className: "inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium shadow-sm hover:bg-primary/90 transition-colors",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, { className: "size-4" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "hidden sm:inline",
							children: "New Purchase"
						})]
					})]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-center gap-3 flex-wrap",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "relative flex-1 max-w-xs",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Search, { className: "absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
						type: "text",
						placeholder: "Search by invoice or supplier...",
						value: search,
						onChange: (e) => setSearch(e.target.value),
						className: "w-full h-10 pl-9 pr-3 rounded-xl border border-input bg-background text-sm outline-none focus:border-ring focus:ring-1 focus:ring-ring/30 transition-colors"
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "flex items-center gap-1.5",
					children: [
						"all",
						"received",
						"pending"
					].map((s) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						onClick: () => setFilterStatus(s),
						className: cn("text-xs font-medium px-3 py-1.5 rounded-lg border transition-colors", filterStatus === s ? "bg-foreground text-background border-foreground" : "bg-background text-muted-foreground border-border hover:text-foreground"),
						children: s === "all" ? "All" : s.charAt(0).toUpperCase() + s.slice(1)
					}, s))
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "space-y-2",
				children: [filtered.map((bill) => {
					const pCfg = paymentColors[bill.payment_status] || paymentColors.paid;
					const sCfg = statusColors[bill.status] || statusColors.received;
					return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						onClick: () => router3.visit(`/purchases/${bill.id}`),
						className: "w-full text-left group",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Card, {
							size: "sm",
							className: "transition-all hover:shadow-sm hover:border-primary/20 active:scale-[0.99]",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardContent, {
								className: "p-0",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex items-center gap-4 px-4 py-3.5",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex-1 min-w-0 grid grid-cols-2 sm:grid-cols-6 gap-3 items-center",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "sm:col-span-2",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
													className: "text-sm font-semibold text-foreground truncate",
													children: bill.supplier_name
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
													className: "flex items-center gap-2 mt-0.5",
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("code", {
														className: "text-[11px] font-mono text-muted-foreground",
														children: bill.invoice_ref
													}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
														className: cn("text-[11px] font-medium px-1.5 py-0.5 rounded", sCfg.cls),
														children: sCfg.label
													})]
												})]
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
												className: "text-[11px] text-muted-foreground",
												children: "Items"
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
												className: "text-xs font-medium",
												children: bill.items_count ?? bill.items?.length ?? 0
											})] }),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
												className: "text-[11px] text-muted-foreground",
												children: "Total"
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
												className: "text-sm font-semibold",
												children: formatCurrency(bill.total_amount)
											})] }),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
												className: "text-[11px] text-muted-foreground",
												children: "Status"
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
												className: cn("text-xs font-medium", pCfg.cls),
												children: pCfg.label
											})] }),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "hidden sm:block",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
													className: "text-[11px] text-muted-foreground",
													children: "Date"
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
													className: "text-xs",
													children: bill.date
												})]
											})
										]
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowRight, { className: "size-4 text-muted-foreground/30 group-hover:text-muted-foreground transition-colors shrink-0" })]
								})
							})
						})
					}, bill.id);
				}), filtered.length === 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "text-center py-16 text-sm text-muted-foreground",
					children: totalCount === 0 ? "No purchases recorded yet." : "No purchases found."
				})]
			})
		]
	});
}
//#endregion
export { PurchasesListPage as default };
