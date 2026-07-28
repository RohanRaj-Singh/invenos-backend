import { t as require_jsx_runtime } from "./jsx-runtime-BjJQA5sn.js";
//#region resources/js/Pages/inventory/components/FormField.tsx
var import_jsx_runtime = require_jsx_runtime();
function FormField({ label, required, children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "space-y-1.5",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
			className: "block text-xs font-medium text-foreground",
			children: [label, required && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "text-red-500 ml-0.5",
				children: "*"
			})]
		}), children]
	});
}
//#endregion
export { FormField as default };
