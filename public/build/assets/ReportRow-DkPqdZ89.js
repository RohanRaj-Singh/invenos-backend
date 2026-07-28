import { t as require_jsx_runtime } from "./jsx-runtime-BjJQA5sn.js";
//#region resources/js/Pages/reports/components/ReportRow.tsx
var import_jsx_runtime = require_jsx_runtime();
function ReportRow({ label, value, positive, negative, bold, large }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex items-center justify-between text-sm",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: "text-muted-foreground",
			children: label
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: `${bold ? "font-bold" : "font-semibold"} ${large ? "text-lg" : ""} ${positive ? "text-emerald-600 dark:text-emerald-400" : ""} ${negative ? "text-red-600 dark:text-red-400" : ""}`,
			children: value
		})]
	});
}
//#endregion
export { ReportRow };
