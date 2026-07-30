import { t as Calendar } from "./calendar-Bnm5D-Dd.js";
import { t as MapPin } from "./map-pin-DxxNuOgU.js";
import { t as Phone } from "./phone-CSvtNg5c.js";
import { t as User } from "./user-DLTIgJdv.js";
import { t as require_jsx_runtime } from "./jsx-runtime-BjJQA5sn.js";
import { n as CardContent, t as Card } from "./card-D1ktOUWx.js";
import { t as Badge } from "./badge-BfSUOZdI.js";
//#region resources/js/Pages/clinic/components/PatientHeader.tsx
var import_jsx_runtime = require_jsx_runtime();
function PatientHeader({ patient, visitCount }) {
	const initials = patient.name.split(" ").map((n) => n[0]).join("").slice(0, 2);
	const regDate = patient.created_at ? new Date(patient.created_at).toLocaleDateString("en-PK", {
		day: "numeric",
		month: "short",
		year: "numeric"
	}) : patient.registrationDate || "—";
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
		className: "overflow-hidden",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "h-20 sm:h-24 bg-gradient-to-r from-primary/80 to-primary/40" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardContent, {
			className: "p-0",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "px-5 pb-5",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-end gap-4 -mt-10 mb-4",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "size-16 sm:size-20 rounded-xl bg-background ring-4 ring-background flex items-center justify-center text-xl sm:text-2xl font-bold text-primary shadow-sm",
						children: initials
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "pt-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
							className: "text-lg sm:text-xl font-semibold tracking-tight",
							children: patient.name
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center gap-2 mt-0.5",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Badge, {
								variant: "outline",
								className: "text-[11px] px-2 py-0 h-5 font-normal",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(User, { className: "size-2.5 mr-1" }), "Patient"]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Badge, {
								variant: "secondary",
								className: "text-[11px] px-2 py-0 h-5 font-normal",
								children: [visitCount, " visits"]
							})]
						})]
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "grid grid-cols-1 sm:grid-cols-3 gap-3",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center gap-2.5 text-sm",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "flex items-center justify-center size-8 rounded-lg bg-muted shrink-0",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Phone, { className: "size-3.5 text-muted-foreground" })
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "text-xs text-muted-foreground",
								children: "Phone"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "font-medium",
								children: patient.phone
							})] })]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center gap-2.5 text-sm",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "flex items-center justify-center size-8 rounded-lg bg-muted shrink-0",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(MapPin, { className: "size-3.5 text-muted-foreground" })
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "min-w-0",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "text-xs text-muted-foreground",
									children: "Address"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "font-medium truncate",
									children: patient.address || "—"
								})]
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center gap-2.5 text-sm",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "flex items-center justify-center size-8 rounded-lg bg-muted shrink-0",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Calendar, { className: "size-3.5 text-muted-foreground" })
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "text-xs text-muted-foreground",
								children: "Registered"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "font-medium",
								children: regDate
							})] })]
						})
					]
				})]
			})
		})]
	});
}
//#endregion
export { PatientHeader as default };
