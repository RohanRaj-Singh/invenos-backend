import { t as require_jsx_runtime } from "./jsx-runtime-Do9val7F.js";
import { t as cn } from "./utils-Bim8RyS4.js";
import { Dt as usePage } from "./app-CO4ODFtf.js";
//#region resources/js/Pages/reports/components/ReportLayout.tsx
var import_jsx_runtime = require_jsx_runtime();
function ReportLayout({ title, subtitle, icon, children, toolbar, pending }) {
	const { props } = usePage();
	const biz = props.settings?.business || {};
	const businessName = biz.business_name || "Invenos";
	const contactLine = [
		biz.address,
		biz.phone,
		biz.email,
		biz.website
	].filter(Boolean).join(" · ");
	const printedAt = (/* @__PURE__ */ new Date()).toLocaleString();
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "report-print p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-5",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "print-only mb-4",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-start justify-between border-b border-gray-300 pb-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-lg font-bold text-gray-900",
							children: businessName
						}),
						contactLine && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-[10px] text-gray-500 mt-0.5",
							children: contactLine
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-sm text-gray-800 mt-1",
							children: title
						}),
						subtitle && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-xs text-gray-500",
							children: subtitle
						})
					] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "text-right text-[10px] text-gray-500",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", { children: ["Printed ", printedAt] })
					})]
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-start justify-between",
				"data-print": "hide",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-start gap-3",
					children: [icon && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "size-10 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center shrink-0 mt-0.5",
						children: icon
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
						className: "text-xl sm:text-2xl font-semibold tracking-tight",
						children: title
					}), subtitle && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-sm text-muted-foreground mt-1",
						children: subtitle
					})] })]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "flex items-center gap-2",
					children: toolbar
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				"aria-busy": pending,
				className: cn("space-y-5 transition-opacity duration-200", pending && "opacity-60 pointer-events-none"),
				children
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "text-[10px] text-muted-foreground border-t border-border pt-3 flex items-center justify-between",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: ["Generated: ", printedAt] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [businessName, biz.phone ? ` · ${biz.phone}` : ""] })]
			})
		]
	});
}
//#endregion
export { ReportLayout };
