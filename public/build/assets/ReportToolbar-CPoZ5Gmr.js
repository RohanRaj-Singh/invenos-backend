import { r as __exportAll } from "./react-DCO0ASPG.js";
import { t as createLucideIcon } from "./createLucideIcon--nD-f_FR.js";
import { t as FileText } from "./file-text-CkmQ0M6N.js";
import { t as Printer } from "./printer-SCaoHvv-.js";
import { t as RefreshCw } from "./refresh-cw-DGGw9qMI.js";
import { t as require_jsx_runtime } from "./jsx-runtime-BjJQA5sn.js";
import { wt as toast } from "./app-DGjxHKeP.js";
/**
* @license lucide-react v1.26.0 - ISC
*
* This source code is licensed under the ISC license.
* See the LICENSE file in the root directory of this source tree.
*/
var FileSpreadsheet = createLucideIcon("file-spreadsheet", [
	["path", {
		d: "M6 22a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.704.706l3.588 3.588A2.4 2.4 0 0 1 20 8v12a2 2 0 0 1-2 2z",
		key: "1oefj6"
	}],
	["path", {
		d: "M14 2v5a1 1 0 0 0 1 1h5",
		key: "wfsgrz"
	}],
	["path", {
		d: "M8 13h2",
		key: "yr2amv"
	}],
	["path", {
		d: "M14 13h2",
		key: "un5t4a"
	}],
	["path", {
		d: "M8 17h2",
		key: "2yhykz"
	}],
	["path", {
		d: "M14 17h2",
		key: "10kma7"
	}]
]);
//#endregion
//#region resources/js/Pages/reports/components/ReportToolbar.tsx
var ReportToolbar_exports = /* @__PURE__ */ __exportAll({ ReportToolbar: () => ReportToolbar });
var import_jsx_runtime = require_jsx_runtime();
function ReportToolbar({ onPrint, onExportPdf, onExportExcel, onRefresh }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "flex items-center gap-1",
		children: [
			{
				label: "Print",
				icon: Printer,
				onClick: onPrint
			},
			{
				label: "PDF",
				icon: FileText,
				onClick: onExportPdf || (() => toast.info("PDF export will be available after backend integration"))
			},
			{
				label: "Excel",
				icon: FileSpreadsheet,
				onClick: onExportExcel || (() => toast.info("Excel export will be available after backend integration"))
			},
			{
				label: "Refresh",
				icon: RefreshCw,
				onClick: onRefresh || (() => window.location.reload())
			}
		].map((a) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
			onClick: a.onClick,
			className: "inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-border text-xs font-medium hover:bg-muted transition-colors cursor-pointer",
			title: a.label === "PDF" || a.label === "Excel" ? "Available after backend integration" : void 0,
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(a.icon, { className: "size-3.5" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "hidden sm:inline",
				children: a.label
			})]
		}, a.label))
	});
}
//#endregion
export { ReportToolbar_exports as n, ReportToolbar as t };
