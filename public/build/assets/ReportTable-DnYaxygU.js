import { i as __toESM, r as __exportAll, t as require_react } from "./react-DCO0ASPG.js";
import { t as ChevronLeft } from "./chevron-left-BWkIAWWi.js";
import { t as cn } from "./utils-Bim8RyS4.js";
import { t as require_jsx_runtime } from "./jsx-runtime-BjJQA5sn.js";
import { mt as Search, xt as ChevronRight } from "./app-DxiW8KTt.js";
import { n as CardContent, t as Card } from "./card-D1ktOUWx.js";
//#region resources/js/Pages/reports/components/ReportTable.tsx
var ReportTable_exports = /* @__PURE__ */ __exportAll({ ReportTable: () => ReportTable });
var import_react = /* @__PURE__ */ __toESM(require_react(), 1);
var import_jsx_runtime = require_jsx_runtime();
function ReportTable({ columns, data, keyExtractor, pageSize = 20, searchable, searchPlaceholder, onSearch, emptyMessage }) {
	const [search, setSearch] = (0, import_react.useState)("");
	const [page, setPage] = (0, import_react.useState)(0);
	const [sortKey, setSortKey] = (0, import_react.useState)(null);
	const [sortDir, setSortDir] = (0, import_react.useState)("desc");
	const filtered = (0, import_react.useMemo)(() => {
		if (!search || !onSearch) return data;
		return onSearch(data, search);
	}, [
		data,
		search,
		onSearch
	]);
	const sorted = (0, import_react.useMemo)(() => {
		if (!sortKey) return filtered;
		const col = columns.find((c) => c.key === sortKey);
		if (!col?.sortValue) return filtered;
		return [...filtered].sort((a, b) => {
			const va = col.sortValue(a);
			const vb = col.sortValue(b);
			const cmp = va < vb ? -1 : va > vb ? 1 : 0;
			return sortDir === "asc" ? cmp : -cmp;
		});
	}, [
		filtered,
		sortKey,
		sortDir,
		columns
	]);
	const pages = Math.max(1, Math.ceil(sorted.length / pageSize));
	const paged = sorted.slice(page * pageSize, (page + 1) * pageSize);
	const toggleSort = (key) => {
		if (sortKey === key) setSortDir((d) => d === "asc" ? "desc" : "asc");
		else {
			setSortKey(key);
			setSortDir("desc");
		}
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "space-y-3",
		children: [
			searchable && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "relative max-w-xs",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Search, { className: "absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground pointer-events-none" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
					type: "text",
					value: search,
					onChange: (e) => {
						setSearch(e.target.value);
						setPage(0);
					},
					placeholder: searchPlaceholder || "Search...",
					className: "w-full h-9 pl-9 pr-3 rounded-lg border border-input bg-background text-xs outline-none focus:border-ring"
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Card, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardContent, {
				className: "p-0 overflow-x-auto",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
					className: "w-full",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tr", {
						className: "border-b border-border",
						children: columns.map((col) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
							onClick: col.sortable ? () => toggleSort(col.key) : void 0,
							className: cn("px-4 py-3 text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wider", col.sortable && "cursor-pointer hover:text-foreground select-none", col.className),
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "inline-flex items-center gap-1",
								children: [col.header, sortKey === col.key && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-[9px]",
									children: sortDir === "asc" ? "▲" : "▼"
								})]
							})
						}, col.key))
					}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tbody", { children: paged.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tr", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
						colSpan: columns.length,
						className: "text-center py-12 text-sm text-muted-foreground",
						children: emptyMessage || "No data found."
					}) }) : paged.map((row) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tr", {
						className: "border-b border-border hover:bg-muted/30 transition-colors",
						children: columns.map((col) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
							className: cn("px-4 py-3 text-sm", col.className),
							children: col.render(row)
						}, col.key))
					}, keyExtractor(row))) })]
				})
			}) }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-center justify-between text-xs text-muted-foreground",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [
					sorted.length,
					" record",
					sorted.length !== 1 ? "s" : ""
				] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center gap-2",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							disabled: page === 0,
							onClick: () => setPage((p) => Math.max(0, p - 1)),
							className: "flex items-center justify-center size-7 rounded-md border border-border disabled:opacity-30 hover:bg-muted transition-colors",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronLeft, { className: "size-3.5" })
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: "tabular-nums",
							children: [
								"Page ",
								page + 1,
								" of ",
								pages
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							disabled: page >= pages - 1,
							onClick: () => setPage((p) => Math.min(pages - 1, p + 1)),
							className: "flex items-center justify-center size-7 rounded-md border border-border disabled:opacity-30 hover:bg-muted transition-colors",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronRight, { className: "size-3.5" })
						})
					]
				})]
			})
		]
	});
}
//#endregion
export { ReportTable_exports as n, ReportTable as t };
