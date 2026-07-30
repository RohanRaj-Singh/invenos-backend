import { i as __toESM, t as require_react } from "./react-DCO0ASPG.js";
import { t as ArrowRight } from "./arrow-right-BaJB_osx.js";
import { t as RotateCcw } from "./rotate-ccw-DB3zy8KA.js";
import { t as require_jsx_runtime } from "./jsx-runtime-BjJQA5sn.js";
import { Dt as router3, Ot as usePage, it as formatDate, mt as Search, rt as formatCurrency } from "./app-DxiW8KTt.js";
import { n as CardContent, t as Card } from "./card-D1ktOUWx.js";
import { t as Badge } from "./badge-BfSUOZdI.js";
//#region resources/js/Pages/returns/ReturnList.tsx
var import_react = /* @__PURE__ */ __toESM(require_react(), 1);
var import_jsx_runtime = require_jsx_runtime();
function ReturnListPage() {
	const { props } = usePage();
	const returns = props.returns || [];
	const meta = props.meta || {};
	const source = props.source || "sale";
	const [search, setSearch] = (0, import_react.useState)("");
	const filtered = (0, import_react.useMemo)(() => {
		if (!search.trim()) return returns;
		const q = search.toLowerCase();
		return returns.filter((r) => r.return_number.toLowerCase().includes(q) || (r.contact?.name || "").toLowerCase().includes(q));
	}, [returns, search]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto space-y-5",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-center gap-2 text-muted-foreground mb-1",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(RotateCcw, { className: "size-5" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "text-xs font-semibold uppercase tracking-wider",
					children: "Returns"
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-center justify-between",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "text-xl sm:text-2xl font-semibold tracking-tight",
					children: source === "sale" ? "Sale Returns" : "Purchase Returns"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "relative w-64",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Search, { className: "absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
						type: "text",
						value: search,
						onChange: (e) => setSearch(e.target.value),
						placeholder: "Search by number or party...",
						className: "w-full h-10 pl-9 pr-4 rounded-xl border border-input bg-background text-sm outline-none focus:border-ring"
					})]
				})]
			}),
			filtered.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "text-center py-16 text-sm text-muted-foreground",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(RotateCcw, { className: "size-10 mx-auto mb-3 text-muted-foreground/20" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "No returns found." })]
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "grid gap-3",
				children: filtered.map((ret) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Card, {
					size: "sm",
					className: "cursor-pointer hover:bg-muted/20 transition-colors",
					onClick: () => router3.visit(`/returns/${source}/${ret.id}`),
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardContent, {
						className: "p-4 flex items-center justify-between gap-4",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "min-w-0 flex-1",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-center gap-2",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "text-sm font-semibold text-foreground",
										children: ret.return_number
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
										variant: "outline",
										className: "text-[10px] px-1.5 py-0 h-4 font-medium",
										children: ret.type || source
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: [
											"text-[10px] px-1.5 py-0.5 rounded font-medium",
											ret.status === "completed" ? "text-emerald-600 bg-emerald-50" : "",
											ret.status === "pending" ? "text-amber-600 bg-amber-50" : "",
											ret.status === "cancelled" ? "text-red-600 bg-red-50" : ""
										].join(" "),
										children: ret.status
									})
								]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "text-xs text-muted-foreground mt-0.5",
								children: [
									ret.contact?.name || "—",
									" · ",
									formatDate(ret.return_date)
								]
							})]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "text-right shrink-0",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-sm font-bold text-foreground tabular-nums",
								children: formatCurrency(ret.grand_total)
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowRight, { className: "size-3.5 text-muted-foreground ml-auto mt-0.5" })]
						})]
					})
				}, ret.id))
			}),
			meta?.total > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "text-xs text-muted-foreground text-center",
				children: [
					"Showing ",
					filtered.length,
					" of ",
					meta.total,
					" records"
				]
			})
		]
	});
}
//#endregion
export { ReturnListPage as default };
