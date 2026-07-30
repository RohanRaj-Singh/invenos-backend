import { i as __toESM, t as require_react } from "./react-DCO0ASPG.js";
import { t as ArrowRight } from "./arrow-right-BaJB_osx.js";
import { t as FileText } from "./file-text-CkmQ0M6N.js";
import { t as RotateCcw } from "./rotate-ccw-DB3zy8KA.js";
import { t as cn } from "./utils-Bim8RyS4.js";
import { t as require_jsx_runtime } from "./jsx-runtime-BjJQA5sn.js";
import { t as Button } from "./button-phKcTdak.js";
import { Dt as router3, Ot as usePage, gt as Plus, ht as Receipt, it as formatDate, mt as Search, rt as formatCurrency, xt as ChevronRight } from "./app-DxiW8KTt.js";
import { n as CardContent, t as Card } from "./card-D1ktOUWx.js";
import { t as DateFilter } from "./DateFilter-DimoDpHg.js";
import { t as usePermission } from "./PermissionGuard-O1yqBehN.js";
//#region resources/js/Pages/sales/SalesList.tsx
var import_react = /* @__PURE__ */ __toESM(require_react(), 1);
var import_jsx_runtime = require_jsx_runtime();
var sourceBadge = {
	pos: "bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400",
	clinic: "bg-purple-50 text-purple-700 dark:bg-purple-500/10 dark:text-purple-400",
	manual: "bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400"
};
var payCls = {
	paid: "text-emerald-600 dark:text-emerald-400",
	partial: "text-amber-600 dark:text-amber-400",
	unpaid: "text-red-600 dark:text-red-400"
};
function SalesListPage() {
	const { props } = usePage();
	const { sales, meta } = props;
	const navigate = (path) => router3.visit(path);
	const [search, setSearch] = (0, import_react.useState)("");
	const [filterSource, setFilterSource] = (0, import_react.useState)("all");
	const [dateFilter, setDateFilter] = (0, import_react.useState)({
		dateFrom: "",
		dateTo: "",
		quick: ""
	});
	const canCreate = usePermission("sales", "create");
	const canProcessReturn = usePermission("sales", "processReturn");
	const handleDateChange = (val) => {
		setDateFilter(val);
		router3.get("/sales", {
			date_from: val.dateFrom,
			date_to: val.dateTo,
			quick: val.quick,
			search,
			source: filterSource
		}, {
			preserveState: true,
			replace: true
		});
	};
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
	const totalAmount = (0, import_react.useMemo)(() => filtered.reduce((s, x) => s + (x.grand_total || 0), 0), [filtered]);
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
						children: [meta?.total ?? list.length, " transactions"]
					})
				] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center gap-2",
					children: [canProcessReturn && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
						variant: "outline",
						size: "sm",
						onClick: () => navigate("/returns/sale"),
						className: "gap-1.5",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(RotateCcw, { className: "size-3.5" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "hidden sm:inline",
							children: "Return"
						})]
					}), canCreate && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
						size: "sm",
						onClick: () => navigate("/sales/pos"),
						className: "gap-1.5 shadow-sm h-9",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, { className: "size-3.5" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "hidden sm:inline",
							children: "New Sale"
						})]
					})]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex flex-col sm:flex-row sm:items-center gap-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "relative flex-1 max-w-md",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Search, { className: "absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
						type: "text",
						placeholder: "Search by invoice or customer...",
						value: search,
						onChange: (e) => setSearch(e.target.value),
						className: "w-full h-10 pl-9 pr-3 rounded-xl border border-input bg-background text-sm outline-none focus:border-ring transition-colors"
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "flex items-center gap-1.5 overflow-x-auto -mx-4 sm:mx-0 px-4 sm:px-0 no-scrollbar",
					children: [
						"all",
						"pos",
						"clinic",
						"manual"
					].map((src) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						onClick: () => setFilterSource(src),
						className: cn("text-xs font-medium px-3 py-1.5 rounded-lg border transition-colors shrink-0", filterSource === src ? "bg-foreground text-background border-foreground" : "bg-background text-muted-foreground border-border hover:text-foreground"),
						children: src === "all" ? "All" : src.charAt(0).toUpperCase() + src.slice(1)
					}, src))
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "border-t border-border pt-3 flex items-center gap-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DateFilter, {
					value: dateFilter,
					onChange: handleDateChange
				}), (dateFilter.dateFrom || dateFilter.dateTo) && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					onClick: () => handleDateChange({
						dateFrom: "",
						dateTo: "",
						quick: ""
					}),
					className: "text-xs text-muted-foreground hover:text-foreground underline transition-colors",
					children: "Clear"
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "hidden md:block rounded-xl border border-border overflow-hidden",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
					className: "w-full",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
							className: "border-b border-border bg-muted/30",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Th, { children: "Customer" }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Th, { children: "Invoice" }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Th, { children: "Source" }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Th, {
									className: "text-right",
									children: "Total"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Th, {
									className: "text-right",
									children: "Paid"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Th, { children: "Status" }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Th, { children: "Date" }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Th, { className: "w-10" })
							]
						}) }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("tbody", { children: filtered.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tr", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
							colSpan: 8,
							className: "text-center py-16 text-sm text-muted-foreground",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex flex-col items-center gap-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Receipt, { className: "size-8 text-muted-foreground/50" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "No sales found." })]
							})
						}) }) : filtered.map((s) => {
							const srcCls = sourceBadge[s.source] || sourceBadge.pos;
							const pCls = payCls[s.payment_status] || payCls.paid;
							return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
								className: "border-b border-border last:border-b-0 hover:bg-muted/30 transition-colors group cursor-pointer",
								onClick: () => navigate(`/sales/${s.id}`),
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
										className: "px-4 py-3.5",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "text-sm font-medium text-foreground",
											children: s.customer_name || "Walk-in Customer"
										})
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
										className: "px-4 py-3.5",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("code", {
											className: "text-xs font-mono text-muted-foreground bg-muted px-1.5 py-0.5 rounded",
											children: s.invoice_number
										})
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
										className: "px-4 py-3.5",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: cn("text-xs font-medium px-1.5 py-0.5 rounded", srcCls),
											children: s.source.charAt(0).toUpperCase() + s.source.slice(1)
										})
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
										className: "px-4 py-3.5 text-right",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "text-sm font-semibold tabular-nums",
											children: formatCurrency(s.grand_total)
										})
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
										className: "px-4 py-3.5 text-right",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "text-sm text-muted-foreground tabular-nums",
											children: formatCurrency(s.amount_paid)
										})
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
										className: "px-4 py-3.5",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: cn("text-xs font-medium", pCls),
											children: s.payment_status.charAt(0).toUpperCase() + s.payment_status.slice(1)
										})
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
										className: "px-4 py-3.5 text-sm text-muted-foreground",
										children: formatDate(s.date)
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
										className: "px-4 py-3.5",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowRight, { className: "size-4 text-muted-foreground/0 group-hover:text-muted-foreground transition-colors" })
									})
								]
							}, s.id);
						}) }),
						filtered.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tfoot", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
							className: "border-t-2 border-border bg-muted/20",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("td", {
									colSpan: 3,
									className: "px-4 py-3 text-sm font-medium text-foreground",
									children: [
										filtered.length,
										" sale",
										filtered.length !== 1 ? "s" : ""
									]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									className: "px-4 py-3 text-right",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "text-sm font-bold text-foreground tabular-nums",
										children: formatCurrency(totalAmount)
									})
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", { colSpan: 4 })
							]
						}) })
					]
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "md:hidden space-y-2",
				children: filtered.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "text-center py-16",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Receipt, { className: "size-10 text-muted-foreground/50 mx-auto mb-3" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-sm text-muted-foreground",
						children: "No sales found."
					})]
				}) : filtered.map((s) => {
					const srcCls = sourceBadge[s.source] || sourceBadge.pos;
					const pCls = payCls[s.payment_status] || payCls.paid;
					return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						onClick: () => navigate(`/sales/${s.id}`),
						className: "w-full text-left group",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Card, {
							className: "transition-all hover:shadow-md active:scale-[0.99]",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardContent, {
								className: "p-0",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "p-4",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "flex items-start justify-between mb-3",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "flex items-center gap-3",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
													className: "size-10 rounded-xl bg-muted flex items-center justify-center shrink-0",
													children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(FileText, { className: "size-5 text-muted-foreground" })
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
													className: "min-w-0",
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
														className: "text-sm font-semibold text-foreground leading-snug truncate",
														children: s.customer_name || "Walk-in Customer"
													}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("code", {
														className: "text-[11px] font-mono text-muted-foreground",
														children: s.invoice_number
													})]
												})]
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronRight, { className: "size-4 text-muted-foreground/30 mt-1 shrink-0" })]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "grid grid-cols-3 gap-2 mb-3",
											children: [
												/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
													className: "rounded-lg bg-muted/50 px-2.5 py-2",
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
														className: "text-[10px] text-muted-foreground",
														children: "Source"
													}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
														className: cn("text-xs font-medium mt-0.5", srcCls),
														children: s.source.charAt(0).toUpperCase() + s.source.slice(1)
													})]
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
													className: "rounded-lg bg-muted/50 px-2.5 py-2",
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
														className: "text-[10px] text-muted-foreground",
														children: "Total"
													}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
														className: "text-xs font-semibold mt-0.5 tabular-nums",
														children: formatCurrency(s.grand_total)
													})]
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
													className: "rounded-lg bg-muted/50 px-2.5 py-2",
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
														className: "text-[10px] text-muted-foreground",
														children: "Status"
													}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
														className: cn("text-xs font-medium mt-0.5", pCls),
														children: s.payment_status.charAt(0).toUpperCase() + s.payment_status.slice(1)
													})]
												})
											]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "flex items-center justify-between text-xs text-muted-foreground",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: formatDate(s.date) }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [formatCurrency(s.amount_paid), " paid"] })]
										})
									]
								})
							})
						})
					}, s.id);
				})
			})
		]
	});
}
function Th({ children, className }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
		className: cn("px-4 py-3 text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wider", className),
		children
	});
}
//#endregion
export { SalesListPage as default };
