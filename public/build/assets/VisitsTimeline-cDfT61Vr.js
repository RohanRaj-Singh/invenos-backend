import { t as Calendar } from "./calendar-Bnm5D-Dd.js";
import { t as CircleCheck } from "./circle-check-DoVrqruV.js";
import { t as Clock } from "./clock-zPxdzOK3.js";
import { t as FileText } from "./file-text-CkmQ0M6N.js";
import { t as Pill } from "./pill-BnEdyPyP.js";
import { t as cn } from "./utils-Bim8RyS4.js";
import { t as require_jsx_runtime } from "./jsx-runtime-BjJQA5sn.js";
import { Dt as router3, it as formatDate, rt as formatCurrency, xt as ChevronRight } from "./app-DxiW8KTt.js";
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
var payStatusBadge = {
	paid: {
		label: "Paid",
		cls: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/30 dark:text-emerald-400 dark:border-emerald-800"
	},
	partial: {
		label: "Partial",
		cls: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/30 dark:text-amber-400 dark:border-amber-800"
	},
	unpaid: {
		label: "Unpaid",
		cls: "bg-red-50 text-red-700 border-red-200 dark:bg-red-950/30 dark:text-red-400 dark:border-red-800"
	}
};
function relativeTime(dateStr) {
	if (!dateStr) return "—";
	const d = new Date(dateStr);
	if (isNaN(d.getTime())) return dateStr;
	const diff = (/* @__PURE__ */ new Date()).getTime() - d.getTime();
	const days = Math.floor(diff / 864e5);
	if (days < 0) return formatDate(dateStr);
	if (days === 0) return "Today";
	if (days === 1) return "Yesterday";
	if (days < 7) return `${days} days ago`;
	if (days < 30) return `${Math.floor(days / 7)}w ago`;
	return formatDate(dateStr);
}
function groupByMonth(items, dateField) {
	const g = {};
	for (const v of items) {
		const parts = (v[dateField] || "").split("-");
		if (parts.length >= 2) {
			const key = `${[
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
			][parseInt(parts[1]) - 1] || ""} ${parts[0]}`;
			if (!g[key]) g[key] = [];
			g[key].push(v);
		}
	}
	return g;
}
function VisitsTimeline({ consultations, visits, salesMap }) {
	const grouped = groupByMonth(consultations || visits || [], consultations ? "visit_date" : "visitDate");
	const hasItems = Object.keys(grouped).length > 0;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "space-y-8",
		children: [Object.entries(grouped).map(([monthYear, monthItems]) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex items-center gap-3 mb-4",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "flex items-center justify-center size-8 rounded-xl bg-primary/10 text-primary shrink-0",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Calendar, { className: "size-4" })
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
					className: "text-sm font-semibold text-foreground tracking-tight",
					children: monthYear
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "h-px flex-1 bg-border/60" }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
					className: "text-[11px] text-muted-foreground tabular-nums",
					children: [
						monthItems.length,
						" visit",
						monthItems.length !== 1 ? "s" : ""
					]
				})
			]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "space-y-3",
			children: monthItems.map((item) => {
				const cfg = statusConfig[item.status] || statusConfig.completed;
				const StatusIcon = cfg.icon;
				const sale = item.sale || item.saleId && salesMap?.get(item.saleId) || null;
				const payStatus = sale ? payStatusBadge[sale.payment_status || sale.paymentStatus] : null;
				const visitDate = item.visit_date || item.visitDate || "";
				const consultationFee = item.consultation_fee ?? item.consultationFee ?? 0;
				const saleItems = sale?.items || [];
				const medicinesTotal = saleItems.reduce((sum, si) => sum + (si.total || 0), 0);
				const grandTotal = consultationFee + (sale?.grand_total ?? sale?.grandTotal ?? 0);
				const paidAmount = sale?.amount_paid ?? sale?.amountPaid ?? 0;
				const outstandingAmount = Math.max(0, grandTotal - paidAmount);
				return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					onClick: () => router3.visit(`/clinic/visit/${item.id}`),
					className: cn("group relative rounded-2xl border border-border/80 bg-card", "hover:border-primary/30 hover:shadow-sm hover:bg-muted/20", "transition-all duration-200 cursor-pointer overflow-hidden"),
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: cn("h-1 w-full", item.status === "completed" && "bg-emerald-500/50", item.status === "follow-up" && "bg-amber-500/50", item.status === "scheduled" && "bg-blue-500/50") }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "p-4 sm:p-5",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-start justify-between gap-3 mb-3",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex items-center gap-2.5 min-w-0",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: cn("flex items-center justify-center size-9 rounded-xl shrink-0 ring-1 ring-border/50", cfg.bgClass),
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(StatusIcon, { className: cn("size-[18px]", cfg.class) })
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "min-w-0",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "flex items-center gap-2",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "text-sm font-semibold text-foreground",
												children: formatDate(visitDate)
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "text-[11px] text-muted-foreground/70 hidden sm:inline",
												children: relativeTime(visitDate)
											})]
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "flex items-center gap-1.5 mt-0.5",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
												variant: "outline",
												className: cn("text-[10px] px-1.5 py-0 h-4 font-medium", item.status === "completed" && "text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800", item.status === "follow-up" && "text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800", item.status === "scheduled" && "text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800"),
												children: cfg.label
											}), item.type && item.type !== "General Consultation" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "text-[10px] text-muted-foreground/60 truncate max-w-[120px]",
												children: item.type
											})]
										})]
									})]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "text-right shrink-0",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "text-base font-bold text-foreground tabular-nums leading-none",
										children: formatCurrency(grandTotal)
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "text-[10px] text-muted-foreground mt-0.5",
										children: paidAmount > 0 ? `${formatCurrency(paidAmount)} paid` : "Not paid"
									})]
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-start gap-2 mb-3",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FileText, { className: "size-3.5 text-muted-foreground/70 mt-0.5 shrink-0" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "min-w-0 flex-1",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "text-sm font-medium text-foreground leading-snug",
										children: item.diagnosis || "No diagnosis recorded"
									}), item.notes && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "text-xs text-muted-foreground mt-1 line-clamp-2 leading-relaxed",
										children: item.notes
									})]
								})]
							}),
							sale && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "rounded-xl bg-muted/50 border border-border/50 p-3 sm:p-3.5",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "rounded-lg bg-background/60 px-2.5 py-2 border border-border/30",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
												className: "text-[10px] text-muted-foreground font-medium uppercase tracking-wider",
												children: "Consultation"
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
												className: "text-sm font-semibold text-foreground mt-0.5 tabular-nums",
												children: formatCurrency(consultationFee)
											})]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "rounded-lg bg-background/60 px-2.5 py-2 border border-border/30",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
												className: "text-[10px] text-muted-foreground font-medium uppercase tracking-wider",
												children: "Medicines"
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
												className: "text-sm font-semibold text-foreground mt-0.5 tabular-nums",
												children: formatCurrency(medicinesTotal)
											})]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "rounded-lg bg-background/60 px-2.5 py-2 border border-border/30",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
												className: "text-[10px] text-muted-foreground font-medium uppercase tracking-wider",
												children: "Items"
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "flex items-center gap-1 mt-0.5",
												children: [
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pill, { className: "size-3.5 text-muted-foreground/70 shrink-0" }),
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
														className: "text-sm font-semibold text-foreground tabular-nums",
														children: saleItems.length
													}),
													sale.invoice_number && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
														className: "text-[10px] text-muted-foreground/60 ml-1 font-mono",
														children: sale.invoice_number
													})
												]
											})]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "rounded-lg bg-background/60 px-2.5 py-2 border border-border/30",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
												className: "text-[10px] text-muted-foreground font-medium uppercase tracking-wider",
												children: "Payment"
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "flex items-center gap-1.5 mt-0.5",
												children: [payStatus ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
													className: cn("inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold border", payStatus.cls),
													children: payStatus.label
												}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
													className: "text-[11px] text-muted-foreground/60",
													children: "—"
												}), outstandingAmount > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
													className: "text-[11px] font-medium text-red-500 tabular-nums",
													children: [formatCurrency(outstandingAmount), " due"]
												})]
											})]
										})
									]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "mt-2 pt-2 border-t border-border/40 flex items-center justify-between text-xs",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
										className: "text-muted-foreground",
										children: [
											formatCurrency(consultationFee),
											" fee + ",
											formatCurrency(medicinesTotal),
											" medicines"
										]
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
										className: "font-bold text-foreground text-sm tabular-nums",
										children: ["Total ", formatCurrency(grandTotal)]
									})]
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "flex items-center justify-end mt-3",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
									className: "inline-flex items-center gap-1 text-xs font-medium text-primary/80 group-hover:text-primary transition-colors",
									children: ["View visit details", /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronRight, { className: "size-3.5 transition-transform group-hover:translate-x-0.5" })]
								})
							})
						]
					})]
				}, item.id);
			})
		})] }, monthYear)), !hasItems && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "text-center py-16",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "flex items-center justify-center size-14 rounded-2xl bg-muted mx-auto mb-4",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Calendar, { className: "size-6 text-muted-foreground/50" })
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
					className: "text-sm font-semibold text-foreground mb-1",
					children: "No visits yet"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-xs text-muted-foreground/70 max-w-[200px] mx-auto leading-relaxed",
					children: "Visit records will appear here once the patient has been seen."
				})
			]
		})]
	});
}
//#endregion
export { VisitsTimeline as default };
