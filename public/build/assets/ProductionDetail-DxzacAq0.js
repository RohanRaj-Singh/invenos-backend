import { a as __toESM, n as require_react, t as require_jsx_runtime } from "./jsx-runtime-Do9val7F.js";
import { t as createLucideIcon } from "./createLucideIcon-CtLNniWl.js";
import { t as ArrowLeft } from "./arrow-left-Bd6q48cy.js";
import { t as CircleX } from "./circle-x-CVSVEDT2.js";
import { t as Factory } from "./factory-J4bs4vZU.js";
import { t as RotateCcw } from "./rotate-ccw-DIzmnjQ5.js";
import { t as cn } from "./utils-Bim8RyS4.js";
import { t as Button } from "./button-CTa7sOGP.js";
import { Mt as usePage, it as formatCurrency, jt as router3, st as formatDateTime } from "./app-ByfccPpi.js";
import { i as CardTitle, n as CardContent, r as CardHeader, t as Card } from "./card-1EYOepvR.js";
/**
* @license lucide-react v1.26.0 - ISC
*
* This source code is licensed under the ISC license.
* See the LICENSE file in the root directory of this source tree.
*/
var Play = createLucideIcon("play", [["path", {
	d: "M5 5a2 2 0 0 1 3.008-1.728l11.997 6.998a2 2 0 0 1 .003 3.458l-12 7A2 2 0 0 1 5 19z",
	key: "10ikf1"
}]]);
//#endregion
//#region resources/js/Pages/production/ProductionDetail.tsx
var import_react = /* @__PURE__ */ __toESM(require_react(), 1);
var import_jsx_runtime = require_jsx_runtime();
var STATUS_STYLE = {
	draft: "bg-slate-100 text-slate-700 border-slate-200",
	in_progress: "bg-blue-50 text-blue-700 border-blue-200",
	completed: "bg-emerald-50 text-emerald-700 border-emerald-200",
	cancelled: "bg-red-50 text-red-700 border-red-200",
	reversed: "bg-amber-50 text-amber-700 border-amber-200"
};
function uuid() {
	return typeof crypto !== "undefined" && typeof crypto.randomUUID === "function" ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}
function ProductionDetail() {
	const { props } = usePage();
	const order = props.order;
	const canManage = Boolean(props.canManage);
	const run = order?.composition_run;
	const items = run?.items || order?.composition?.items || [];
	const [actualQuantity, setActualQuantity] = (0, import_react.useState)(String(order?.planned_quantity ?? ""));
	const [draftQuantity, setDraftQuantity] = (0, import_react.useState)(String(order?.planned_quantity ?? ""));
	const [draftLocation, setDraftLocation] = (0, import_react.useState)(order?.location || "");
	const [draftNotes, setDraftNotes] = (0, import_react.useState)(order?.notes || "");
	const [pending, setPending] = (0, import_react.useState)(false);
	if (!order) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "p-8 text-center text-sm text-muted-foreground",
		children: "Production order not found."
	});
	function action(path, data = {}) {
		setPending(true);
		router3.post(path, data, {
			onFinish: () => setPending(false),
			preserveScroll: true
		});
	}
	function execute() {
		const quantity = Number(actualQuantity);
		if (!Number.isFinite(quantity) || quantity <= 0) return;
		action(`/production/${order.id}/execute`, {
			actual_output_quantity: quantity,
			output_unit_id: order.output_unit_id,
			location: order.location,
			idempotency_key: uuid()
		});
	}
	function reverse() {
		if (!window.confirm("Reverse this production? Finished goods will be removed from stock. Components are not restored automatically.")) return;
		action(`/production/${order.id}/reverse`, { idempotency_key: uuid() });
	}
	function updateDraft() {
		setPending(true);
		router3.put(`/production/${order.id}`, {
			planned_quantity: Number(draftQuantity),
			location: draftLocation || null,
			notes: draftNotes || null
		}, {
			onFinish: () => setPending(false),
			preserveScroll: true
		});
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto space-y-4",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-center justify-between gap-3 flex-wrap",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
					variant: "ghost",
					size: "sm",
					onClick: () => router3.visit("/production"),
					className: "gap-1.5 -ml-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowLeft, { className: "size-4" }), " Manufacturing"]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center gap-2",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: cn("inline-flex rounded-full border px-2.5 py-1 text-[11px] font-semibold capitalize", STATUS_STYLE[order.status] || STATUS_STYLE.draft),
							children: String(order.status).replace("_", " ")
						}),
						canManage && order.status === "draft" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
							size: "sm",
							onClick: () => action(`/production/${order.id}/start`),
							disabled: pending,
							className: "gap-1.5",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Play, { className: "size-3.5" }), " Start"]
						}),
						canManage && (order.status === "draft" || order.status === "in_progress") && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
							size: "sm",
							variant: "outline",
							onClick: () => action(`/production/${order.id}/cancel`),
							disabled: pending,
							className: "gap-1.5",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CircleX, { className: "size-3.5" }), " Cancel"]
						}),
						canManage && order.status === "completed" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
							size: "sm",
							variant: "outline",
							onClick: reverse,
							disabled: pending,
							className: "gap-1.5",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(RotateCcw, { className: "size-3.5" }), " Reverse"]
						})
					]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-center gap-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Factory, { className: "size-5 text-primary" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "text-xl font-bold tracking-tight",
					children: order.production_number
				})]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "text-sm text-muted-foreground mt-1",
				children: [
					order.product?.name,
					" · formula v",
					order.composition_version,
					" · ",
					order.location || "No location"
				]
			})] }),
			!order.cost_complete && (order.status === "completed" || order.status === "reversed") && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "rounded-xl border border-amber-200 bg-amber-50/70 p-3 text-xs text-amber-800",
				children: "Production cost is incomplete. Finished goods were received as uncosted stock; the known cost is shown for reference but no complete unit cost was forced into inventory value."
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "grid gap-4 sm:grid-cols-2 lg:grid-cols-4",
				children: [
					["Planned", `${Number(order.planned_quantity).toLocaleString()} ${order.output_unit_id}`],
					["Produced", order.actual_output_quantity == null ? "—" : `${Number(order.actual_output_quantity).toLocaleString()} ${order.output_unit_id}`],
					["Production cost", order.total_cost == null ? "—" : formatCurrency(order.total_cost)],
					["Finished unit cost", order.unit_cost == null ? "—" : formatCurrency(order.unit_cost)]
				].map(([label, value]) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Card, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardContent, {
					className: "p-4",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "text-[10px] uppercase tracking-wider text-muted-foreground font-medium",
						children: label
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "text-lg font-bold mt-1 tabular-nums",
						children: value
					})]
				}) }, label))
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "grid gap-4 lg:grid-cols-[1.3fr_1fr]",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardHeader, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardTitle, {
					className: "text-sm",
					children: "Components"
				}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardContent, {
					className: "p-0",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "overflow-x-auto",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
							className: "w-full text-sm min-w-[560px]",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", {
								className: "bg-muted/40 border-b border-border",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", { children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
										className: "text-left px-4 py-2.5 font-semibold text-muted-foreground",
										children: "Component"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
										className: "text-right px-4 py-2.5 font-semibold text-muted-foreground",
										children: "Consumed"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
										className: "text-right px-4 py-2.5 font-semibold text-muted-foreground",
										children: "Wastage"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
										className: "text-right px-4 py-2.5 font-semibold text-muted-foreground",
										children: "Cost"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
										className: "text-left px-4 py-2.5 font-semibold text-muted-foreground",
										children: "Basis"
									})
								] })
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tbody", { children: items.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tr", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								colSpan: 5,
								className: "px-4 py-8 text-center text-muted-foreground",
								children: "No components."
							}) }) : items.map((item) => {
								const actual = Number(item.actual_quantity ?? item.quantity_base ?? 0);
								const template = Number(item.template_quantity ?? item.quantity_base ?? 0);
								return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
									className: "border-b border-border/60 last:border-0",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("td", {
											className: "px-4 py-2.5",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
												className: "font-medium",
												children: item.component_name || item.component?.name || "Component"
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
												className: "text-[10px] text-muted-foreground",
												children: item.component_sku || item.component?.sku || "—"
											})]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("td", {
											className: "px-4 py-2.5 text-right tabular-nums",
											children: [
												actual.toLocaleString(),
												" ",
												item.unit || item.component?.base_unit_id || ""
											]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
											className: "px-4 py-2.5 text-right tabular-nums",
											children: Math.max(0, actual - template).toLocaleString()
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
											className: "px-4 py-2.5 text-right tabular-nums",
											children: item.total_cost == null ? "Incomplete" : formatCurrency(item.total_cost)
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
											className: "px-4 py-2.5 text-xs text-muted-foreground",
											children: item.cost_basis || "—"
										})
									]
								}, item.id);
							}) })]
						})
					})
				})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardHeader, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardTitle, {
					className: "text-sm",
					children: "Execution"
				}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardContent, {
					className: "space-y-3 text-sm",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex justify-between",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-muted-foreground",
								children: "Created"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: formatDateTime(order.created_at) })]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex justify-between",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-muted-foreground",
								children: "Started"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: order.started_at ? formatDateTime(order.started_at) : "—" })]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex justify-between",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-muted-foreground",
								children: "Completed"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: order.completed_at ? formatDateTime(order.completed_at) : "—" })]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex justify-between",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-muted-foreground",
								children: "Run"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "font-mono text-xs",
								children: run?.run_number || "—"
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex justify-between",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-muted-foreground",
								children: "Finished movement"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "font-mono text-xs",
								children: order.finished_inventory_transaction_id || "—"
							})]
						}),
						order.reversal_inventory_transaction_id && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex justify-between",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-muted-foreground",
								children: "Reversal movement"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "font-mono text-xs",
								children: order.reversal_inventory_transaction_id
							})]
						}),
						canManage && (order.status === "draft" || order.status === "in_progress") && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "space-y-2 rounded-lg border border-border p-3",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
									className: "block text-xs font-medium",
									children: ["Actual output quantity", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
										type: "number",
										min: "0.000001",
										step: "any",
										value: actualQuantity,
										onChange: (e) => setActualQuantity(e.target.value),
										className: "mt-1 w-full h-9 rounded-lg border border-input bg-background px-2 text-sm"
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
									onClick: execute,
									disabled: pending,
									className: "w-full",
									children: "Complete production"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-[10px] text-muted-foreground",
									children: "Components are consumed at the actual output scale and finished goods are received in stock."
								})
							]
						}),
						canManage && order.status === "draft" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "space-y-2 rounded-lg border border-border p-3",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "text-xs font-semibold",
									children: "Update draft"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
									type: "number",
									min: "0.000001",
									step: "any",
									value: draftQuantity,
									onChange: (e) => setDraftQuantity(e.target.value),
									className: "w-full h-8 rounded-lg border border-input bg-background px-2 text-xs"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
									value: draftLocation,
									onChange: (e) => setDraftLocation(e.target.value),
									placeholder: "Location",
									className: "w-full h-8 rounded-lg border border-input bg-background px-2 text-xs"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("textarea", {
									value: draftNotes,
									onChange: (e) => setDraftNotes(e.target.value),
									rows: 2,
									placeholder: "Notes",
									className: "w-full rounded-lg border border-input bg-background px-2 py-1.5 text-xs resize-none"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
									size: "sm",
									variant: "outline",
									onClick: updateDraft,
									disabled: pending,
									className: "w-full",
									children: "Save draft"
								})
							]
						})
					]
				})] })]
			}),
			order.finished_inventory_transaction && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardHeader, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardTitle, {
				className: "text-sm",
				children: "Finished-Goods Receipt"
			}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardContent, {
				className: "text-sm text-muted-foreground",
				children: [
					Number(order.finished_inventory_transaction.quantity).toLocaleString(),
					" base units received at ",
					order.finished_inventory_transaction.unit_cost == null ? "incomplete cost" : formatCurrency(order.finished_inventory_transaction.unit_cost),
					" per unit."
				]
			})] })
		]
	});
}
//#endregion
export { ProductionDetail as default };
