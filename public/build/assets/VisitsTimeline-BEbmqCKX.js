import { t as Calendar } from "./calendar-Bnm5D-Dd.js";
import { t as CircleCheck } from "./circle-check-DoVrqruV.js";
import { t as Clock } from "./clock-zPxdzOK3.js";
import { t as FileText } from "./file-text-CkmQ0M6N.js";
import { t as cn } from "./utils-Bim8RyS4.js";
import { t as require_jsx_runtime } from "./jsx-runtime-BjJQA5sn.js";
import { Et as router3, st as formatCurrency } from "./app-DfjygdMU.js";
import { t as Badge } from "./badge-BfSUOZdI.js";
//#region resources/js/Pages/clinic/components/VisitsTimeline.tsx
var import_jsx_runtime = require_jsx_runtime();
var statusConfig = {
	completed: {
		label: "Completed",
		icon: CircleCheck,
		class: "text-emerald-600 dark:text-emerald-400",
		bgClass: "bg-emerald-50 dark:bg-emerald-950/30"
	},
	"follow-up": {
		label: "Follow-up",
		icon: Clock,
		class: "text-amber-600 dark:text-amber-400",
		bgClass: "bg-amber-50 dark:bg-amber-950/30"
	},
	scheduled: {
		label: "Scheduled",
		icon: Calendar,
		class: "text-blue-600 dark:text-blue-400",
		bgClass: "bg-blue-50 dark:bg-blue-950/30"
	}
};
var payStatusCfg = {
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
function groupByMonth(items, dateField) {
	const g = {};
	for (const v of items) {
		const d = v[dateField] || "";
		const parts = d.split("-");
		const key = parts.length >= 2 ? `${[
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
		][parseInt(parts[1]) - 1] || ""} ${parts[0]}` : d;
		if (!g[key]) g[key] = [];
		g[key].push(v);
	}
	return g;
}
function VisitsTimeline({ consultations, visits, salesMap }) {
	const items = consultations || visits || [];
	const grouped = groupByMonth(items, consultations ? "visit_date" : "visitDate");
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "space-y-6",
		children: [Object.entries(grouped).map(([monthYear, monthItems]) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h4", {
			className: "text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 px-1",
			children: monthYear
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "space-y-2",
			children: monthItems.map((item, idx) => {
				const cfg = statusConfig[item.status] || statusConfig.completed;
				const StatusIcon = cfg.icon;
				const isLast = idx === monthItems.length - 1;
				const sale = item.sale || item.saleId && salesMap?.get(item.saleId) || null;
				const ps = sale ? payStatusCfg[sale.payment_status || sale.paymentStatus] : null;
				const visitDate = item.visit_date || item.visitDate || "";
				const fee = item.consultation_fee ?? item.consultationFee ?? 0;
				return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "relative flex gap-3 group",
					children: [
						!isLast && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "absolute left-[15px] top-8 bottom-[-8px] w-px bg-border" }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: cn("relative z-10 flex items-center justify-center size-8 rounded-full shrink-0 mt-0.5 ring-1 ring-border", cfg.bgClass),
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(StatusIcon, { className: cn("size-4", cfg.class) })
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "flex-1 min-w-0 pb-2",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "rounded-xl border border-border bg-card p-3.5 transition-colors hover:bg-muted/30 cursor-pointer",
								onClick: () => router3.visit(`/clinic/visit/${item.id}`),
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex items-start justify-between gap-3 mb-1.5",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "flex items-center gap-2",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "text-xs font-medium text-muted-foreground",
												children: visitDate
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
												variant: "outline",
												className: cn("text-[10px] px-1.5 py-0 h-4 font-medium", cfg.class),
												children: cfg.label
											})]
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
											className: "text-xs font-semibold shrink-0",
											children: ["Rs. ", fee.toLocaleString()]
										})]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h5", {
										className: "text-sm font-semibold text-foreground",
										children: item.type || "General Consultation"
									}),
									item.doctor && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "text-xs text-muted-foreground mt-0.5",
										children: item.doctor
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "mt-2 pt-2 border-t border-border",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "flex items-start gap-1.5",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FileText, { className: "size-3 text-muted-foreground mt-0.5 shrink-0" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
												className: "text-xs font-medium text-foreground",
												children: item.diagnosis
											}), item.notes && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
												className: "text-[11px] text-muted-foreground mt-0.5 leading-relaxed",
												children: item.notes
											})] })]
										})
									}),
									sale && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "mt-2 pt-2 border-t border-border flex items-center justify-between",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "flex items-center gap-3 text-xs",
											children: [
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
													className: "font-medium text-foreground",
													children: sale.invoice_number || sale.invoiceNumber
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
													className: cn("font-medium", ps?.cls || ""),
													children: ps?.label || sale.payment_status || sale.paymentStatus
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
													className: "text-muted-foreground",
													children: [sale.items?.length || sale.itemCount || 0, " items"]
												})
											]
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "flex items-center gap-2",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "text-sm font-semibold text-foreground",
												children: formatCurrency(sale.grand_total ?? sale.grandTotal ?? 0)
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
												onClick: (e) => {
													e.stopPropagation();
													router3.visit(`/sales/${sale.id}`);
												},
												className: "text-[11px] text-primary hover:underline shrink-0",
												children: "Sale →"
											})]
										})]
									})
								]
							})
						})
					]
				}, item.id);
			})
		})] }, monthYear)), items.length === 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "text-center py-12 text-sm text-muted-foreground",
			children: "No visit records found."
		})]
	});
}
//#endregion
export { VisitsTimeline as default };
