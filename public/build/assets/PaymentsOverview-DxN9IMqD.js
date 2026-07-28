import { t as ArrowDownRight } from "./arrow-down-right-BcfBYVKI.js";
import { t as ArrowUpRight } from "./arrow-up-right-DJsXKh96.js";
import { t as Banknote } from "./banknote-B76zKt2w.js";
import { t as CalendarDays } from "./calendar-days-CE0jslca.js";
import { t as require_jsx_runtime } from "./jsx-runtime-BjJQA5sn.js";
import { at as formatCurrency } from "./app-DfjygdMU.js";
import { i as CardTitle, n as CardContent, r as CardHeader, t as Card } from "./card-DQfOgTjC.js";
//#region resources/js/Pages/clinic/components/PaymentsOverview.tsx
var import_jsx_runtime = require_jsx_runtime();
function PaymentsOverview({ payments, totalPaid, totalOutstanding }) {
	const lastPayment = payments.length > 0 ? payments[0] : null;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "space-y-4",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "grid grid-cols-3 gap-3",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Card, {
					size: "sm",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardContent, {
						className: "p-4",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center justify-between mb-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-[11px] font-medium text-muted-foreground uppercase tracking-wider",
								children: "Outstanding"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "flex items-center justify-center size-7 rounded-md bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowDownRight, { className: "size-3.5" })
							})]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "text-lg font-bold tracking-tight text-amber-600 dark:text-amber-400",
							children: formatCurrency(totalOutstanding)
						})]
					})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Card, {
					size: "sm",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardContent, {
						className: "p-4",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center justify-between mb-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-[11px] font-medium text-muted-foreground uppercase tracking-wider",
								children: "Total Paid"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "flex items-center justify-center size-7 rounded-md bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowUpRight, { className: "size-3.5" })
							})]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "text-lg font-bold tracking-tight text-emerald-600 dark:text-emerald-400",
							children: formatCurrency(totalPaid)
						})]
					})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Card, {
					size: "sm",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardContent, {
						className: "p-4",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center justify-between mb-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-[11px] font-medium text-muted-foreground uppercase tracking-wider",
								children: "Last Payment"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "flex items-center justify-center size-7 rounded-md bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CalendarDays, { className: "size-3.5" })
							})]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "text-[13px] font-bold tracking-tight",
							children: lastPayment?.date || "—"
						})]
					})
				})
			]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardHeader, {
			className: "flex-row items-center justify-between",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardTitle, { children: "Payment History" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
				className: "text-xs text-muted-foreground",
				children: [payments.length, " entries"]
			})]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardContent, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "space-y-1",
			children: [payments.map((payment) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-center gap-3 py-2.5 px-3 rounded-lg hover:bg-muted/50 transition-colors",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "flex items-center justify-center size-8 rounded-lg bg-emerald-50 dark:bg-emerald-500/10 shrink-0",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Banknote, { className: "size-4 text-emerald-600 dark:text-emerald-400" })
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex-1 min-w-0",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center gap-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-sm font-medium text-foreground capitalize",
								children: payment.method
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "text-[10px] font-medium text-emerald-600",
								children: ["· ", payment.reference]
							})]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center gap-2 text-xs text-muted-foreground",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: payment.date }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "·" }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Sale payment" })
							]
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
						className: "text-sm font-semibold text-foreground shrink-0",
						children: ["Rs. ", payment.amount.toLocaleString()]
					})
				]
			}, payment.id)), payments.length === 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "text-center py-8 text-sm text-muted-foreground",
				children: "No payment records."
			})]
		}) })] })]
	});
}
//#endregion
export { PaymentsOverview as default };
