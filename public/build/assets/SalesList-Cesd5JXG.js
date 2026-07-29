import { i as __toESM, t as require_react } from "./react-DCO0ASPG.js";
import { t as ArrowRight } from "./arrow-right-BaJB_osx.js";
import { t as RotateCcw } from "./rotate-ccw-DB3zy8KA.js";
import { t as cn } from "./utils-Bim8RyS4.js";
import { t as require_jsx_runtime } from "./jsx-runtime-BjJQA5sn.js";
import { Dt as usePage, Et as router3, ft as ShoppingCart, gt as Receipt, ht as Search, st as formatCurrency } from "./app-BLMvu7I3.js";
import { n as CardContent, t as Card } from "./card-DQfOgTjC.js";
import { t as usePermission } from "./PermissionGuard-C60bnBSQ.js";
//#region resources/js/Pages/sales/SalesList.tsx
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
		label: "Partial",
		cls: "text-amber-600 dark:text-amber-400"
	},
	unpaid: {
		label: "Unpaid",
		cls: "text-red-600 dark:text-red-400"
	}
};
function SalesListPage() {
	const { props } = usePage();
	const { sales, meta } = props;
	const navigate = (path) => router3.visit(path);
	const [search, setSearch] = (0, import_react.useState)("");
	const [filterSource, setFilterSource] = (0, import_react.useState)("all");
	const canCreate = usePermission("sales", "create");
	const canProcessReturn = usePermission("sales", "processReturn");
	const list = sales || [];
	const filtered = (0, import_react.useMemo)(() => {
		return list.filter((s) => {
			if (s.invoice_number?.startsWith("RET-")) return false;
			if (search) {
				const q = search.toLowerCase();
				const nameMatch = (s.customer_name || "").toLowerCase().includes(q);
				const invMatch = s.invoice_number.toLowerCase().includes(q);
				if (!nameMatch && !invMatch) return false;
			}
			if (filterSource !== "all" && s.source !== filterSource) return false;
			return true;
		});
	}, [
		list,
		search,
		filterSource
	]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-5",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-start justify-between",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center gap-2 text-primary mb-1",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Receipt, { className: "size-5" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-xs font-semibold uppercase tracking-wider text-primary",
							children: "Sales"
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
						className: "text-xl sm:text-2xl font-semibold tracking-tight",
						children: "All Sales"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "text-sm text-muted-foreground mt-1",
						children: [meta?.total ?? list.length, " transactions recorded"]
					})
				] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center gap-2",
					children: [canProcessReturn && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						onClick: () => navigate("/returns/sale"),
						className: "inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-border text-sm font-medium hover:bg-muted transition-colors",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(RotateCcw, { className: "size-4" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "hidden sm:inline",
							children: "Return"
						})]
					}), canCreate && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						onClick: () => navigate("/sales/pos"),
						className: "inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium shadow-sm hover:bg-primary/90 transition-colors",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ShoppingCart, { className: "size-4" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "hidden sm:inline",
							children: "Open POS"
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
						placeholder: "Search by invoice or customer...",
						value: search,
						onChange: (e) => setSearch(e.target.value),
						className: "w-full h-10 pl-9 pr-3 rounded-xl border border-input bg-background text-sm outline-none focus:border-ring focus:ring-1 focus:ring-ring/30 transition-colors"
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "flex items-center gap-1.5",
					children: [
						"all",
						"pos",
						"clinic",
						"manual"
					].map((src) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						onClick: () => setFilterSource(src),
						className: cn("text-xs font-medium px-3 py-1.5 rounded-lg border transition-colors", filterSource === src ? "bg-foreground text-background border-foreground" : "bg-background text-muted-foreground border-border hover:text-foreground"),
						children: src === "all" ? "All" : src.charAt(0).toUpperCase() + src.slice(1)
					}, src))
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "space-y-2",
				children: [filtered.map((s) => {
					const srcCfg = sourceConfig[s.source] || sourceConfig.pos;
					const pCfg = payCfg[s.payment_status] || payCfg.paid;
					return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						onClick: () => navigate(`/sales/${s.id}`),
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
													children: s.customer_name || "—"
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
													className: "flex items-center gap-2 mt-0.5",
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("code", {
														className: "text-[11px] font-mono text-muted-foreground",
														children: s.invoice_number
													}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
														className: cn("text-[11px] font-medium px-1.5 py-0.5 rounded", srcCfg.cls),
														children: srcCfg.label
													})]
												})]
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
												className: "text-[11px] text-muted-foreground",
												children: "Items"
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
												className: "text-xs font-medium",
												children: s.items_count ?? s.items?.length ?? 0
											})] }),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
												className: "text-[11px] text-muted-foreground",
												children: "Total"
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
												className: "text-sm font-semibold",
												children: formatCurrency(s.grand_total)
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
													children: s.date
												})]
											})
										]
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowRight, { className: "size-4 text-muted-foreground/30 group-hover:text-muted-foreground transition-colors shrink-0" })]
								})
							})
						})
					}, s.id);
				}), filtered.length === 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "text-center py-16 text-sm text-muted-foreground",
					children: "No sales found."
				})]
			})
		]
	});
}
//#endregion
export { SalesListPage as default };
