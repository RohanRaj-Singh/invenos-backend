import { t as require_jsx_runtime } from "./jsx-runtime-BjJQA5sn.js";
//#region resources/js/Pages/inventory/components/SessionCounter.tsx
var import_jsx_runtime = require_jsx_runtime();
function SessionCounter({ count }) {
	if (count === 0) return null;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
		className: "inline-flex items-center gap-1.5 rounded-full bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 px-2.5 py-0.5 text-[11px] font-medium whitespace-nowrap",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "size-1.5 rounded-full bg-emerald-500" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [count, " added"] }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "text-[10px]",
				children: "🟢"
			})
		]
	});
}
//#endregion
export { SessionCounter as default };
