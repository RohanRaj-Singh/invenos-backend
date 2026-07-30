import { t as ArrowRight } from "./arrow-right-BaJB_osx.js";
import { t as Calendar } from "./calendar-Bnm5D-Dd.js";
import { t as CircleCheck } from "./circle-check-DoVrqruV.js";
import { t as Clock } from "./clock-zPxdzOK3.js";
import { t as cn } from "./utils-Bim8RyS4.js";
import { t as require_jsx_runtime } from "./jsx-runtime-BjJQA5sn.js";
import { wt as Activity } from "./app-DQEL3DJY.js";
import { n as CardContent, t as Card } from "./card-D1ktOUWx.js";
import { t as Badge } from "./badge-BfSUOZdI.js";
//#region resources/js/Pages/clinic/components/TreatmentsHistory.tsx
var import_jsx_runtime = require_jsx_runtime();
var statusConfig = {
	ongoing: {
		label: "Ongoing",
		class: "bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400 border-blue-200 dark:border-blue-800",
		icon: Activity
	},
	completed: {
		label: "Completed",
		class: "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800",
		icon: CircleCheck
	},
	planned: {
		label: "Planned",
		class: "bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-400 border-amber-200 dark:border-amber-800",
		icon: Clock
	}
};
function TreatmentsHistory({ treatments }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "space-y-3",
		children: [treatments.map((treatment) => {
			const config = statusConfig[treatment.status];
			const StatusIcon = config?.icon || Activity;
			return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Card, {
				size: "sm",
				className: "overflow-hidden",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardContent, {
					className: "p-0",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "p-4",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-start justify-between gap-3 mb-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex items-center gap-2.5",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: cn("flex items-center justify-center size-9 rounded-lg shrink-0", config?.class?.split(" ").slice(0, 2).join(" ") || "bg-muted text-muted-foreground"),
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(StatusIcon, { className: "size-4" })
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h5", {
										className: "text-sm font-semibold text-foreground",
										children: treatment.name
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "text-xs text-muted-foreground",
										children: treatment.doctor
									})] })]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
									variant: "outline",
									className: cn("text-[10px] px-2 py-0 h-5 font-medium shrink-0", config?.class || ""),
									children: config?.label || treatment.status
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-xs text-muted-foreground leading-relaxed mb-3",
								children: treatment.description
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-center justify-between gap-4",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex items-center gap-3 text-xs text-muted-foreground",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
										className: "flex items-center gap-1",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Calendar, { className: "size-3" }), treatment.startDate]
									}), treatment.endDate && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowRight, { className: "size-3" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: treatment.endDate })] })]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex items-center gap-2 min-w-0",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "w-20 sm:w-24 h-1.5 rounded-full bg-muted overflow-hidden shrink-0",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
											className: cn("h-full rounded-full transition-all", treatment.status === "completed" ? "bg-emerald-500" : treatment.status === "ongoing" ? "bg-blue-500" : "bg-amber-400"),
											style: { width: `${treatment.progress}%` }
										})
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
										className: "text-[11px] font-medium text-muted-foreground shrink-0",
										children: [treatment.progress, "%"]
									})]
								})]
							})
						]
					})
				})
			}, treatment.id);
		}), treatments.length === 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "text-center py-12 text-sm text-muted-foreground",
			children: "No treatment records found."
		})]
	});
}
//#endregion
export { TreatmentsHistory as default };
