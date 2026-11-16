import { t as require_jsx_runtime } from "./jsx-runtime-Do9val7F.js";
import { t as Factory } from "./factory-J4bs4vZU.js";
import { t as cn } from "./utils-Bim8RyS4.js";
import { t as Button } from "./button-CTa7sOGP.js";
import { At as Link_default, Mt as usePage, gt as Search, it as formatCurrency, jt as router3, ot as formatDate, vt as Plus } from "./app-C7AUNtSc.js";
import { n as CardContent, t as Card } from "./card-1EYOepvR.js";
//#region resources/js/Pages/production/ProductionList.tsx
var import_jsx_runtime = require_jsx_runtime();
var STATUS_STYLE = {
	draft: "bg-slate-100 text-slate-700 border-slate-200",
	in_progress: "bg-blue-50 text-blue-700 border-blue-200",
	completed: "bg-emerald-50 text-emerald-700 border-emerald-200",
	cancelled: "bg-red-50 text-red-700 border-red-200",
	reversed: "bg-amber-50 text-amber-700 border-amber-200"
};
function ProductionList() {
	const { props } = usePage();
	const orders = props.orders || [];
	const meta = props.meta || {};
	const filters = props.filters || {};
	function applyFilters(next) {
		router3.get("/production", {
			...filters,
			...next
		}, {
			preserveState: true,
			replace: true
		});
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto space-y-4",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-center justify-between gap-3 flex-wrap",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Factory, { className: "size-5 text-primary" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
						className: "text-xl font-bold tracking-tight",
						children: "Manufacturing"
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-sm text-muted-foreground mt-1",
					children: "Production orders, component consumption and finished-goods receipts."
				})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						variant: "outline",
						onClick: () => router3.visit("/reports/component-usage"),
						children: "Ingredient Usage"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
						onClick: () => router3.visit("/production/create"),
						className: "gap-1.5",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, { className: "size-4" }), " New Production Order"]
					})]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "rounded-xl border border-border bg-muted/30 p-3 text-xs leading-relaxed text-muted-foreground",
				children: [
					"Manufacturing is a separate, admin-only capability retained for businesses that assemble physical goods. Selling a formula from POS does ",
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "font-medium text-foreground",
						children: "not"
					}),
					" require a production order. Formulas are managed from the Formula tab on a product."
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-center gap-2 flex-wrap",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "relative",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Search, { className: "size-3.5 text-muted-foreground absolute left-2.5 top-1/2 -translate-y-1/2" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
						defaultValue: filters.search || "",
						placeholder: "Search production number or reference...",
						className: "h-9 w-72 rounded-lg border border-input bg-background pl-8 pr-3 text-sm outline-none focus:border-ring",
						onKeyDown: (event) => {
							if (event.key === "Enter") applyFilters({ search: event.target.value });
						}
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
					value: filters.status || "",
					onChange: (event) => applyFilters({ status: event.target.value }),
					className: "h-9 rounded-lg border border-input bg-background px-2 text-sm outline-none focus:border-ring",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
							value: "",
							children: "All statuses"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
							value: "draft",
							children: "Draft"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
							value: "in_progress",
							children: "In progress"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
							value: "completed",
							children: "Completed"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
							value: "cancelled",
							children: "Cancelled"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
							value: "reversed",
							children: "Reversed"
						})
					]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Card, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardContent, {
				className: "p-0 overflow-x-auto",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
					className: "w-full text-sm min-w-[820px]",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", {
						className: "bg-muted/40 border-b border-border",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
								className: "text-left px-4 py-3 font-semibold text-muted-foreground",
								children: "Order"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
								className: "text-left px-4 py-3 font-semibold text-muted-foreground",
								children: "Product"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
								className: "text-right px-4 py-3 font-semibold text-muted-foreground",
								children: "Planned"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
								className: "text-right px-4 py-3 font-semibold text-muted-foreground",
								children: "Produced"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
								className: "text-right px-4 py-3 font-semibold text-muted-foreground",
								children: "Cost"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
								className: "text-left px-4 py-3 font-semibold text-muted-foreground",
								children: "Status"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
								className: "text-left px-4 py-3 font-semibold text-muted-foreground",
								children: "Date"
							})
						] })
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tbody", { children: orders.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tr", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
						colSpan: 7,
						className: "px-4 py-12 text-center text-muted-foreground",
						children: "No production orders yet."
					}) }) : orders.map((order) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
						className: "border-b border-border/60 last:border-0 hover:bg-muted/20",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("td", {
								className: "px-4 py-3",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link_default, {
									href: `/production/${order.id}`,
									className: "font-mono text-xs font-semibold text-primary hover:underline",
									children: order.production_number
								}), order.reference && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "text-[10px] text-muted-foreground mt-0.5",
									children: order.reference
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("td", {
								className: "px-4 py-3",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "font-medium",
									children: order.product?.name || "—"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "text-[10px] text-muted-foreground",
									children: [
										"v",
										order.composition_version,
										" formula"
									]
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("td", {
								className: "px-4 py-3 text-right tabular-nums",
								children: [
									Number(order.planned_quantity).toLocaleString(),
									" ",
									order.output_unit_id
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: "px-4 py-3 text-right tabular-nums",
								children: order.actual_output_quantity == null ? "—" : `${Number(order.actual_output_quantity).toLocaleString()} ${order.output_unit_id}`
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("td", {
								className: "px-4 py-3 text-right tabular-nums",
								children: [order.total_cost == null ? "—" : formatCurrency(order.total_cost), order.status === "completed" && order.cost_complete === false && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "text-[10px] text-amber-600",
									children: "incomplete"
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: "px-4 py-3",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: cn("inline-flex rounded-full border px-2 py-0.5 text-[10px] font-semibold capitalize", STATUS_STYLE[order.status] || STATUS_STYLE.draft),
									children: String(order.status).replace("_", " ")
								})
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								className: "px-4 py-3 text-xs text-muted-foreground",
								children: formatDate(order.completed_at || order.planned_date || order.created_at)
							})
						]
					}, order.id)) })]
				})
			}) }),
			meta.last_page > 1 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-center justify-end gap-2 text-xs text-muted-foreground",
				children: [
					"Page ",
					meta.current_page,
					" of ",
					meta.last_page
				]
			})
		]
	});
}
//#endregion
export { ProductionList as default };
