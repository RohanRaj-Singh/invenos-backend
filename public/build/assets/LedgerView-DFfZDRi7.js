import { t as createLucideIcon } from "./createLucideIcon--nD-f_FR.js";
import { t as ArrowDownLeft } from "./arrow-down-left-CsNVWlHD.js";
import { t as ArrowUpRight } from "./arrow-up-right-DJsXKh96.js";
import { t as Banknote } from "./banknote-B76zKt2w.js";
import { t as Pencil } from "./pencil-CSxonttV.js";
import { t as RotateCcw } from "./rotate-ccw-DB3zy8KA.js";
import { t as cn } from "./utils-Bim8RyS4.js";
import { t as require_jsx_runtime } from "./jsx-runtime-BjJQA5sn.js";
import { at as formatCurrency, d as FT_TYPE_CONFIG, gt as Receipt } from "./app-DCc201bC.js";
/**
* @license lucide-react v1.26.0 - ISC
*
* This source code is licensed under the ISC license.
* See the LICENSE file in the root directory of this source tree.
*/
var FileX = createLucideIcon("file-x", [
	["path", {
		d: "M6 22a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.704.706l3.588 3.588A2.4 2.4 0 0 1 20 8v12a2 2 0 0 1-2 2z",
		key: "1oefj6"
	}],
	["path", {
		d: "M14 2v5a1 1 0 0 0 1 1h5",
		key: "wfsgrz"
	}],
	["path", {
		d: "m14.5 12.5-5 5",
		key: "b62r18"
	}],
	["path", {
		d: "m9.5 12.5 5 5",
		key: "1rk7el"
	}]
]);
//#endregion
//#region resources/js/Pages/contacts/components/LedgerView.tsx
var import_jsx_runtime = require_jsx_runtime();
var iconMap = {
	invoice: Receipt,
	payment: Banknote,
	advance: ArrowDownLeft,
	refund: ArrowUpRight,
	adjustment: Pencil,
	write_off: FileX,
	credit_note: RotateCcw
};
function LedgerView({ entries }) {
	if (entries.length === 0) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "text-center py-12 text-sm text-muted-foreground",
		children: "No ledger entries yet."
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "rounded-xl border border-border overflow-hidden",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
			className: "w-full",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
				className: "border-b border-border bg-muted/40",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Th, {
						className: "w-24",
						children: "Date"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Th, {
						className: "w-20",
						children: "Type"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Th, { children: "Reference" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Th, { children: "Description" }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Th, {
						className: "text-right w-28",
						children: "Debit"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Th, {
						className: "text-right w-28",
						children: "Credit"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Th, {
						className: "text-right w-28",
						children: "Balance"
					})
				]
			}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tbody", { children: entries.map((entry) => {
				const cfg = FT_TYPE_CONFIG[entry.type];
				const Icon = iconMap[entry.type] || Receipt;
				return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
					className: "border-b border-border last:border-b-0 hover:bg-muted/20 transition-colors text-sm",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
							className: "px-4 py-2.5 text-xs text-muted-foreground",
							children: entry.date
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
							className: "px-4 py-2.5",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: cn("inline-flex items-center gap-1 text-xs font-medium", cfg?.color || "text-muted-foreground"),
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, { className: "size-3" }), cfg?.label || entry.type]
							})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
							className: "px-4 py-2.5 font-mono text-xs text-muted-foreground",
							children: entry.reference
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
							className: "px-4 py-2.5 text-muted-foreground max-w-[200px] truncate",
							children: entry.description
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
							className: "px-4 py-2.5 text-right font-medium tabular-nums",
							children: entry.debit > 0 ? formatCurrency(entry.debit) : "—"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
							className: "px-4 py-2.5 text-right font-medium tabular-nums",
							children: entry.credit > 0 ? formatCurrency(entry.credit) : "—"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("td", {
							className: cn("px-4 py-2.5 text-right font-semibold tabular-nums", entry.runningBalance > 0 ? "text-amber-600" : entry.runningBalance < 0 ? "text-emerald-600" : ""),
							children: [formatCurrency(Math.abs(entry.runningBalance)), entry.runningBalance > 0 ? " Dr" : entry.runningBalance < 0 ? " Cr" : ""]
						})
					]
				}, entry.id);
			}) })]
		})
	});
}
function Th({ children, className }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
		className: cn("px-4 py-3 text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wider", className),
		children
	});
}
//#endregion
export { LedgerView as default };
