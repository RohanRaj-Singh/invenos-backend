import { t as LoaderCircle } from "./loader-circle-CdtlPMRw.js";
import { t as cn } from "./utils-Bim8RyS4.js";
import { t as require_jsx_runtime } from "./jsx-runtime-BjJQA5sn.js";
//#region resources/js/Pages/reports/components/ReportLoading.tsx
var import_jsx_runtime = require_jsx_runtime();
function ReportLoading({ message = "Loading report...", className }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: cn("flex flex-col items-center justify-center py-24 text-sm text-muted-foreground", className),
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "size-8 animate-spin mb-3 text-primary/60" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "font-medium",
			children: message
		})]
	});
}
function SkeletonCard() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "rounded-xl border border-border bg-card p-4 animate-pulse",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "h-3 w-20 bg-muted rounded mb-2" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "h-6 w-28 bg-muted rounded" })]
	});
}
function SkeletonTable({ rows = 5, cols = 5 }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "rounded-xl border border-border overflow-hidden animate-pulse",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "bg-muted/30 px-4 py-3 border-b border-border flex gap-4",
			children: Array.from({ length: cols }).map((_, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "h-3 w-24 bg-muted rounded" }, i))
		}), Array.from({ length: rows }).map((_, r) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "px-4 py-3 border-b border-border flex gap-4",
			children: Array.from({ length: cols }).map((_, c) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "h-3 w-24 bg-muted/60 rounded",
				style: { width: c === 0 ? "120px" : c === 1 ? "80px" : "100px" }
			}, c))
		}, r))]
	});
}
//#endregion
export { ReportLoading, SkeletonCard, SkeletonTable };
