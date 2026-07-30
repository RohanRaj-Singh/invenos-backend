import { t as require_jsx_runtime } from "./jsx-runtime-BjJQA5sn.js";
import { tt as formatCurrency } from "./app-CwPUaRAl.js";
//#region resources/js/Pages/reports/components/helpers.tsx
var import_jsx_runtime = require_jsx_runtime();
/** Debit column — green, right-aligned, shows amount or "—" */
function debitColumn(getValue) {
	return {
		key: "debit",
		header: "Debit",
		render: (r) => {
			const v = getValue(r);
			return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "text-emerald-600 font-semibold",
				children: v > 0 ? formatCurrency(v) : "—"
			});
		},
		className: "text-right",
		sortable: true,
		sortValue: getValue
	};
}
/** Credit column �� red, right-aligned, shows amount or "—" */
function creditColumn(getValue) {
	return {
		key: "credit",
		header: "Credit",
		render: (r) => {
			const v = getValue(r);
			return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "text-red-600 font-semibold",
				children: v > 0 ? formatCurrency(v) : "—"
			});
		},
		className: "text-right",
		sortable: true,
		sortValue: getValue
	};
}
/** Reference column — monospace code styling */
function referenceColumn(getValue) {
	return {
		key: "ref",
		header: "Reference",
		render: (r) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("code", {
			className: "text-[11px] font-mono bg-muted px-1 py-0.5 rounded",
			children: getValue(r)
		})
	};
}
//#endregion
export { creditColumn, debitColumn, referenceColumn };
