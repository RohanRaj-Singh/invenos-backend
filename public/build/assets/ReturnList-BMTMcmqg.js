import { i as __toESM, t as require_react } from "./react-DCO0ASPG.js";
import { t as ArrowRight } from "./arrow-right-BaJB_osx.js";
import { t as RotateCcw } from "./rotate-ccw-DB3zy8KA.js";
import { t as require_jsx_runtime } from "./jsx-runtime-BjJQA5sn.js";
import { C as purchaseBills, Dt as router3, k as allSales, mt as Search, rt as formatCurrency } from "./app-CwPUaRAl.js";
import { n as CardContent, t as Card } from "./card-D1ktOUWx.js";
import { t as Badge } from "./badge-BfSUOZdI.js";
//#region resources/js/Pages/returns/ReturnList.tsx
var import_react = /* @__PURE__ */ __toESM(require_react(), 1);
var import_jsx_runtime = require_jsx_runtime();
function ReturnListPage({ source, title, emptyMessage }) {
	const [search, setSearch] = (0, import_react.useState)("");
	const returns = (0, import_react.useMemo)(() => {
		if (source === "sale") return allSales.filter((s) => s.invoiceNumber.startsWith("RET-")).map((s) => ({
			id: s.id,
			ref: s.invoiceNumber,
			date: s.date,
			party: s.customerName || "Walk-in Customer",
			total: s.grandTotal,
			itemCount: s.items.length
		}));
		return purchaseBills.filter((b) => b.invoiceRef.startsWith("PRET-")).map((b) => ({
			id: b.id,
			ref: b.invoiceRef,
			date: b.date,
			party: b.supplierName,
			total: b.totalAmount,
			itemCount: b.items.length
		}));
	}, [source]);
	const filtered = (0, import_react.useMemo)(() => {
		if (!search.trim()) return returns.sort((a, b) => b.date.localeCompare(a.date));
		const q = search.toLowerCase();
		return returns.filter((r) => r.ref.toLowerCase().includes(q) || r.party.toLowerCase().includes(q)).sort((a, b) => b.date.localeCompare(a.date));
	}, [returns, search]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-5",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-start justify-between",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center gap-2 text-amber-600 mb-1",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(RotateCcw, { className: "size-5" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-xs font-semibold uppercase tracking-wider",
							children: "Returns"
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
						className: "text-xl sm:text-2xl font-semibold tracking-tight",
						children: title
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "text-sm text-muted-foreground mt-1",
						children: [
							returns.length,
							" return",
							returns.length !== 1 ? "s" : "",
							" recorded"
						]
					})
				] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
					onClick: () => router3.visit(source === "sale" ? "/returns/sale" : "/returns/purchase"),
					className: "inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium shadow-sm hover:bg-primary/90 transition-colors",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(RotateCcw, { className: "size-4" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "hidden sm:inline",
						children: "New Return"
					})]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "flex items-center gap-3 flex-wrap",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "relative flex-1 max-w-xs",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Search, { className: "absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
						type: "text",
						placeholder: "Search by return number or name...",
						value: search,
						onChange: (e) => setSearch(e.target.value),
						className: "w-full h-10 pl-9 pr-3 rounded-xl border border-input bg-background text-sm outline-none focus:border-ring focus:ring-1 focus:ring-ring/30 transition-colors"
					})]
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "space-y-2",
				children: filtered.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "text-center py-16 text-sm text-muted-foreground",
					children: returns.length === 0 ? emptyMessage : "No returns found matching your search."
				}) : filtered.map((ret) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					onClick: () => router3.visit(source === "sale" ? `/sales/returns/${ret.ref}` : `/purchases/returns/${ret.ref}`),
					className: "w-full text-left group",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Card, {
						size: "sm",
						className: "transition-all hover:shadow-sm hover:border-primary/20 active:scale-[0.99]",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardContent, {
							className: "p-0",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-center gap-4 px-4 py-3.5",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex-1 min-w-0 grid grid-cols-2 sm:grid-cols-5 gap-3 items-center",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "sm:col-span-2",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "flex items-center gap-2",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
													className: "text-sm font-semibold text-foreground",
													children: ret.ref
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
													variant: "outline",
													className: "text-[10px] bg-amber-50 text-amber-700 border-amber-200",
													children: "Return"
												})]
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
												className: "text-xs text-muted-foreground mt-0.5",
												children: ret.party
											})]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
											className: "text-[11px] text-muted-foreground",
											children: "Items"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
											className: "text-xs font-medium",
											children: ret.itemCount
										})] }),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
											className: "text-[11px] text-muted-foreground",
											children: "Refund"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
											className: "text-sm font-semibold text-foreground",
											children: formatCurrency(ret.total)
										})] }),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
											className: "text-[11px] text-muted-foreground",
											children: "Date"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
											className: "text-xs",
											children: ret.date
										})] })
									]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowRight, { className: "size-4 text-muted-foreground/30 group-hover:text-muted-foreground transition-colors shrink-0" })]
							})
						})
					})
				}, ret.id))
			})
		]
	});
}
//#endregion
export { ReturnListPage as default };
