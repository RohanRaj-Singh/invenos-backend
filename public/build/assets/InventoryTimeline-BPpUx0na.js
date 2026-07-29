import { t as createLucideIcon } from "./createLucideIcon--nD-f_FR.js";
import { t as FlaskConical } from "./flask-conical-CsbPzWAT.js";
import { t as PackagePlus } from "./package-plus-BjX_WD8A.js";
import { t as TrendingDown } from "./trending-down-CfQNbrbW.js";
import { t as TriangleAlert } from "./triangle-alert-D5zO2woV.js";
import { t as cn } from "./utils-Bim8RyS4.js";
import { t as require_jsx_runtime } from "./jsx-runtime-BjJQA5sn.js";
import { A as TRANSACTION_CONFIG, Ct as ChartColumn, j as groupTransactionsByDate } from "./app-DCc201bC.js";
/**
* @license lucide-react v1.26.0 - ISC
*
* This source code is licensed under the ISC license.
* See the LICENSE file in the root directory of this source tree.
*/
var ArrowRightLeft = createLucideIcon("arrow-right-left", [
	["path", {
		d: "m16 3 4 4-4 4",
		key: "1x1c3m"
	}],
	["path", {
		d: "M20 7H4",
		key: "zbl0bi"
	}],
	["path", {
		d: "m8 21-4-4 4-4",
		key: "h9nckh"
	}],
	["path", {
		d: "M4 17h16",
		key: "g4d7ey"
	}]
]);
/**
* @license lucide-react v1.26.0 - ISC
*
* This source code is licensed under the ISC license.
* See the LICENSE file in the root directory of this source tree.
*/
var Undo2 = createLucideIcon("undo-2", [["path", {
	d: "M9 14 4 9l5-5",
	key: "102s5s"
}], ["path", {
	d: "M4 9h10.5a5.5 5.5 0 0 1 5.5 5.5a5.5 5.5 0 0 1-5.5 5.5H11",
	key: "f3b9sd"
}]]);
//#endregion
//#region resources/js/Pages/inventory/components/InventoryTimeline.tsx
var import_jsx_runtime = require_jsx_runtime();
var iconMap = {
	PackagePlus,
	TrendingDown,
	Undo2,
	BarChart3: ChartColumn,
	AlertTriangle: TriangleAlert,
	FlaskConical,
	ArrowRightLeft
};
function fmtDate(dateStr) {
	if (!dateStr) return "";
	try {
		const d = new Date(dateStr);
		if (isNaN(d.getTime())) return dateStr;
		return `${d.getDate()} ${[
			"Jan",
			"Feb",
			"Mar",
			"Apr",
			"May",
			"Jun",
			"Jul",
			"Aug",
			"Sep",
			"Oct",
			"Nov",
			"Dec"
		][d.getMonth()]} ${d.getFullYear()}`;
	} catch {
		return dateStr;
	}
}
function InventoryTimeline({ transactions }) {
	const groups = groupTransactionsByDate(transactions);
	if (transactions.length === 0) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "text-center py-12 text-sm text-muted-foreground",
		children: "No inventory transactions recorded."
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "space-y-6",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex flex-wrap gap-2 text-xs",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SummaryBadge, {
					label: "Purchases",
					amount: transactions.filter((t) => t.type === "purchase").reduce((s, t) => s + t.quantity, 0),
					type: "purchase"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SummaryBadge, {
					label: "Sold",
					amount: Math.abs(transactions.filter((t) => t.type === "sale").reduce((s, t) => s + t.quantity, 0)),
					type: "sale"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SummaryBadge, {
					label: "Damaged",
					amount: Math.abs(transactions.filter((t) => t.type === "damage").reduce((s, t) => s + t.quantity, 0)),
					type: "damage"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SummaryBadge, {
					label: "Consumed",
					amount: Math.abs(transactions.filter((t) => t.type === "consumption").reduce((s, t) => s + t.quantity, 0)),
					type: "consumption"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SummaryBadge, {
					label: "Returned",
					amount: transactions.filter((t) => t.type === "return").reduce((s, t) => s + t.quantity, 0),
					type: "return"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SummaryBadge, {
					label: "Adjusted",
					amount: Math.abs(transactions.filter((t) => t.type === "adjustment").reduce((s, t) => s + t.quantity, 0)),
					type: "adjustment"
				})
			]
		}), Array.from(groups.entries()).map(([dateStr, txns]) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex items-center gap-2 mb-3",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "text-xs font-semibold text-muted-foreground uppercase tracking-wider",
					children: fmtDate(dateStr)
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "h-px flex-1 bg-border" }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "text-[10px] text-muted-foreground tabular-nums",
					children: fmtDate(dateStr)
				})
			]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "space-y-1",
			children: txns.map((txn, idx) => {
				const config = TRANSACTION_CONFIG[txn.type];
				const Icon = iconMap[txn.type] || PackagePlus;
				const isLast = idx === txns.length - 1;
				const qty = txn.quantity ?? 0;
				const unit = txn.unit || "units";
				const bal = txn.runningBalance ?? 0;
				return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "relative flex gap-3 group pl-1",
					children: [
						!isLast && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "absolute left-[19px] top-9 bottom-0 w-px bg-border" }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: cn("relative z-10 flex items-center justify-center size-9 rounded-xl shrink-0 mt-0.5 ring-1 ring-border", config?.bgClass || "bg-muted"),
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, { className: cn("size-4", config?.color || "text-muted-foreground") })
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "flex-1 min-w-0 pb-2 pt-1",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-start justify-between gap-3",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "min-w-0",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "flex items-center gap-2",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
												className: cn("text-sm font-semibold", qty > 0 ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"),
												children: [
													qty > 0 ? "+" : "",
													Math.abs(qty).toLocaleString(),
													" ",
													unit
												]
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "text-xs font-medium text-foreground/70 bg-muted px-1.5 py-0.5 rounded",
												children: config?.label || txn.type
											})]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "text-xs text-muted-foreground mt-0.5",
											children: txn.reference
										}),
										txn.notes && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "text-[11px] text-muted-foreground/70 mt-0.5 italic",
											children: txn.notes
										})
									]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "text-right shrink-0",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "text-xs font-semibold text-foreground tabular-nums",
										children: Number.isFinite(bal) ? bal.toLocaleString() : "0"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "text-[10px] text-muted-foreground",
										children: txn.user || ""
									})]
								})]
							})
						})
					]
				}, txn.id);
			})
		})] }, dateStr))]
	});
}
function SummaryBadge({ label, amount, type }) {
	const config = TRANSACTION_CONFIG[type];
	const amt = amount ?? 0;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
		className: cn("inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium", config.inflow ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"),
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [config.inflow ? "+" : "-", Math.abs(amt).toLocaleString()] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: "text-muted-foreground",
			children: label
		})]
	});
}
//#endregion
export { InventoryTimeline as default };
