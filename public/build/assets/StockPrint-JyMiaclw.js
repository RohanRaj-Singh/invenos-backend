import { t as Printer } from "./printer-SCaoHvv-.js";
import { t as require_jsx_runtime } from "./jsx-runtime-BjJQA5sn.js";
import { t as Button } from "./button-phKcTdak.js";
import { kt as usePage, st as X } from "./app-Us-FuJbD.js";
import { n as PrintLayout, t as BusinessHeader } from "./BusinessHeader-D9afPnK8.js";
//#region resources/js/features/reporting/components/ReportDocumentTable.tsx
var import_jsx_runtime = require_jsx_runtime();
/**
* Print-tuned table for report documents.
*
* - `thead { display: table-header-group }` (set by PrintLayout) repeats the
*   header on every page for page-spanning tables.
* - `tr { page-break-inside: avoid }` (set by PrintLayout) keeps rows intact.
* - Explicit column widths stop long names/values from pushing siblings around.
* - `tabular-nums` keeps currency columns from jittering.
*/
function ReportDocumentTable({ columns, rows, keyExtractor, emptyMessage = "No records." }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
		className: "doc-table w-full border-collapse",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("style", { children: `
        .doc-table thead th {
          border-bottom: 2px solid #111827;
          padding: 5px 6px;
          text-align: left;
          font-size: 8.5px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.3px;
          color: #6b7280;
        }
        .doc-table tbody td {
          padding: 4px 6px;
          border-bottom: 1px solid #e5e7eb;
          font-size: 9.5px;
          vertical-align: top;
          overflow-wrap: anywhere;
          word-break: break-word;
        }
        .doc-table tbody tr:last-child td { border-bottom: none; }
      ` }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tr", { children: columns.map((c) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
				style: {
					width: c.width,
					textAlign: c.align === "right" ? "right" : c.align === "center" ? "center" : "left"
				},
				children: c.header
			}, c.key)) }) }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("tbody", { children: rows.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tr", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
				colSpan: columns.length,
				style: {
					padding: "10px 6px",
					color: "#9ca3af"
				},
				children: emptyMessage
			}) }) : rows.map((row) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tr", {
				style: { pageBreakInside: "avoid" },
				children: columns.map((c) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
					className: c.align === "right" || c.align === "center" ? "tabular-nums" : void 0,
					style: {
						textAlign: c.align === "right" ? "right" : c.align === "center" ? "center" : "left",
						fontVariantNumeric: c.align === "right" || c.align === "center" ? "tabular-nums" : void 0
					},
					children: c.render(row)
				}, c.key))
			}, keyExtractor(row))) })
		]
	});
}
//#endregion
//#region resources/js/Pages/reports/StockPrint.tsx
var fmt = (n) => Number(n ?? 0).toLocaleString();
var Rs = (n) => `Rs ${fmt(n)}`;
function StatusBadge({ status }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
		className: `inline-block px-2 py-0.5 rounded-full text-[8px] font-semibold uppercase border ${{
			"in-stock": "bg-emerald-50 text-emerald-700 border-emerald-200",
			"low-stock": "bg-amber-50 text-amber-700 border-amber-200",
			"out-of-stock": "bg-red-50 text-red-700 border-red-200"
		}[status] || "bg-gray-50 text-gray-600 border-gray-200"}`,
		children: status.replace("-", " ")
	});
}
function SectionTitle({ children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
		className: "text-[10px] font-bold uppercase tracking-wide text-gray-700 mt-5 mb-1.5 pb-1 border-b border-gray-200",
		children
	});
}
function StockPrintPage() {
	const { props } = usePage();
	const report = props.report || {};
	const settings = props.settings || {};
	const business = settings.business || {};
	const receipt = settings.receipt || {};
	const summary = report.summary || {};
	const movement = report.movement || {};
	const attention = report.attention || {
		negative: [],
		out_of_stock: [],
		low_stock: []
	};
	const topSelling = report.top_selling || [];
	const mostReturned = report.most_returned || [];
	const valuation = report.valuation || {
		method: "",
		total_value: 0,
		rows: []
	};
	const products = report.products || [];
	const period = report.period || {
		from: "",
		to: ""
	};
	const summaryCards = [
		{
			label: "Total Products",
			value: fmt(summary.total_products)
		},
		{
			label: "Total Stock",
			value: fmt(summary.total_stock)
		},
		{
			label: "Inventory Value",
			value: Rs(summary.total_value),
			tone: "emerald"
		},
		{
			label: "Low Stock",
			value: fmt(summary.low_stock),
			tone: summary.low_stock ? "red" : void 0
		},
		{
			label: "Out of Stock",
			value: fmt(summary.out_of_stock),
			tone: summary.out_of_stock ? "red" : void 0
		},
		{
			label: "Negative Stock",
			value: fmt(summary.negative_stock),
			tone: summary.negative_stock ? "red" : void 0
		}
	];
	const movementRows = [
		["Opening Stock", fmt(movement.opening_stock)],
		["Purchased", `+${fmt(movement.purchased)}`],
		["Sold", `−${fmt(movement.sold)}`],
		["Sale Returns", `+${fmt(movement.sale_returns)}`],
		["Purchase Returns", `−${fmt(movement.purchase_returns)}`],
		["Adjustments", `${Number(movement.adjustments ?? 0) >= 0 ? "+" : "−"}${fmt(Math.abs(Number(movement.adjustments ?? 0)))}`],
		["Closing Stock", fmt(movement.closing_stock)]
	];
	const topSellingCols = [
		{
			key: "name",
			header: "Product",
			render: (r) => r.product_name
		},
		{
			key: "qty",
			header: "Qty",
			width: "18%",
			align: "right",
			render: (r) => fmt(r.qty)
		},
		{
			key: "revenue",
			header: "Revenue",
			width: "22%",
			align: "right",
			render: (r) => Rs(r.revenue)
		},
		{
			key: "inv",
			header: "Invoices",
			width: "18%",
			align: "right",
			render: (r) => fmt(r.invoice_count)
		}
	];
	const mostReturnedCols = [
		{
			key: "name",
			header: "Product",
			render: (r) => r.product_name
		},
		{
			key: "qty",
			header: "Qty",
			width: "18%",
			align: "right",
			render: (r) => fmt(r.qty)
		},
		{
			key: "value",
			header: "Value",
			width: "22%",
			align: "right",
			render: (r) => Rs(r.value)
		},
		{
			key: "count",
			header: "Returns",
			width: "18%",
			align: "right",
			render: (r) => fmt(r.return_count)
		}
	];
	const valuationCols = [
		{
			key: "product",
			header: "Product",
			width: "30%",
			render: (r) => r.product
		},
		{
			key: "sku",
			header: "SKU",
			width: "14%",
			render: (r) => r.sku || "—"
		},
		{
			key: "qty",
			header: "Qty",
			width: "12%",
			align: "right",
			render: (r) => `${fmt(r.quantity)} ${r.unit || ""}`.trim()
		},
		{
			key: "cost",
			header: "Cost",
			width: "14%",
			align: "right",
			render: (r) => Rs(r.cost)
		},
		{
			key: "value",
			header: "Value",
			width: "16%",
			align: "right",
			render: (r) => Rs(r.value)
		}
	];
	const productCols = [
		{
			key: "name",
			header: "Product",
			width: "26%",
			render: (r) => r.name
		},
		{
			key: "sku",
			header: "SKU",
			width: "12%",
			render: (r) => r.sku || "—"
		},
		{
			key: "category",
			header: "Category",
			width: "16%",
			render: (r) => r.category || "—"
		},
		{
			key: "stock",
			header: "Stock",
			width: "9%",
			align: "right",
			render: (r) => `${fmt(r.stock_quantity)} ${r.unit || ""}`.trim()
		},
		{
			key: "sold",
			header: "Sold",
			width: "9%",
			align: "right",
			render: (r) => fmt(r.sold)
		},
		{
			key: "purchased",
			header: "Purchased",
			width: "10%",
			align: "right",
			render: (r) => fmt(r.purchased)
		},
		{
			key: "value",
			header: "Value",
			width: "12%",
			align: "right",
			render: (r) => Rs(r.value)
		},
		{
			key: "status",
			header: "Status",
			width: "9%",
			align: "center",
			render: (r) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(StatusBadge, { status: r.status })
		}
	];
	const subtitle = period.from && period.to ? `Inventory levels & movement — ${new Date(period.from).toLocaleDateString("en-GB", {
		day: "numeric",
		month: "short",
		year: "numeric"
	})} to ${new Date(period.to).toLocaleDateString("en-GB", {
		day: "numeric",
		month: "short",
		year: "numeric"
	})}` : "Inventory levels & movement";
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "bg-gray-100 min-h-screen",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "no-print bg-white border-b border-gray-200 px-4 sm:px-6 py-3 flex items-center justify-between gap-3",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
				variant: "ghost",
				size: "sm",
				onClick: () => window.history.back(),
				className: "gap-1.5 text-gray-600 hover:text-gray-900",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { className: "size-4" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "hidden sm:inline",
					children: "Close"
				})]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
				onClick: () => window.print(),
				className: "gap-2 shadow-sm",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Printer, { className: "size-4" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "hidden sm:inline",
					children: "Print"
				})]
			})]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(PrintLayout, { children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(BusinessHeader, {
				business,
				receipt,
				title: "STOCK REPORT"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
				className: "text-[10px] text-gray-500 mb-4",
				children: [
					subtitle,
					" · Generated ",
					(/* @__PURE__ */ new Date()).toLocaleString("en-GB", {
						day: "numeric",
						month: "short",
						year: "numeric",
						hour: "numeric",
						minute: "2-digit"
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "grid grid-cols-3 gap-2 mb-4",
				children: summaryCards.map((c) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "border border-gray-200 rounded-md px-3 py-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "text-[7.5px] uppercase tracking-wider text-gray-400 font-semibold",
						children: c.label
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: `text-[13px] font-bold mt-0.5 ${c.tone === "emerald" ? "text-emerald-600" : c.tone === "red" ? "text-red-600" : "text-gray-900"}`,
						children: c.value
					})]
				}, c.label))
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SectionTitle, { children: "Inventory Movement" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("table", {
				className: "doc-table w-full border-collapse",
				style: { maxWidth: "360px" },
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tbody", { children: movementRows.map(([label, value]) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
					style: { pageBreakInside: "avoid" },
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
						style: {
							padding: "4px 6px",
							borderBottom: "1px solid #e5e7eb",
							fontSize: "9.5px"
						},
						children: label
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
						className: "tabular-nums",
						style: {
							padding: "4px 6px",
							borderBottom: "1px solid #e5e7eb",
							fontSize: "9.5px",
							textAlign: "right",
							fontVariantNumeric: "tabular-nums"
						},
						children: value
					})]
				}, label)) })
			}),
			[
				["negative", "Negative Stock"],
				["out_of_stock", "Out of Stock"],
				["low_stock", "Low Stock"]
			].some(([k]) => (attention[k] || []).length > 0) && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SectionTitle, { children: "Needs Attention" }), [
				["negative", "Negative Stock"],
				["out_of_stock", "Out of Stock"],
				["low_stock", "Low Stock"]
			].map(([key, label]) => {
				const rows = attention[key] || [];
				if (rows.length === 0) return null;
				return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mb-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "text-[8px] font-semibold uppercase tracking-wide text-gray-500 mb-1",
						children: label
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("table", {
						className: "doc-table w-full border-collapse",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tbody", { children: rows.map((a) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
							style: { pageBreakInside: "avoid" },
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								style: {
									padding: "3px 6px",
									borderBottom: "1px solid #e5e7eb",
									fontSize: "9.5px"
								},
								children: a.name
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("td", {
								className: "tabular-nums",
								style: {
									padding: "3px 6px",
									borderBottom: "1px solid #e5e7eb",
									fontSize: "9.5px",
									textAlign: "right",
									fontVariantNumeric: "tabular-nums"
								},
								children: [
									fmt(a.stock_quantity),
									" ",
									a.unit || ""
								]
							})]
						}, a.id)) })
					})]
				}, key);
			})] }),
			topSelling.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SectionTitle, { children: "Top Selling Products" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ReportDocumentTable, {
				columns: topSellingCols,
				rows: topSelling,
				keyExtractor: (r) => r.product_name
			})] }),
			mostReturned.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SectionTitle, { children: "Most Returned Products" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ReportDocumentTable, {
				columns: mostReturnedCols,
				rows: mostReturned,
				keyExtractor: (r) => r.product_name
			})] }),
			valuation.rows.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SectionTitle, { children: "Stock Valuation" }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-[8.5px] text-gray-500 mb-1",
					children: valuation.method
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ReportDocumentTable, {
					columns: valuationCols,
					rows: valuation.rows,
					keyExtractor: (r) => `${r.product}-${r.sku}`
				})
			] }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SectionTitle, { children: "Products" }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ReportDocumentTable, {
				columns: productCols,
				rows: products,
				keyExtractor: (r) => String(r.id),
				emptyMessage: "No products found."
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-6 pt-2 border-t border-gray-200 text-center text-[8.5px] text-gray-400",
				children: [
					business.business_name || "Invenos",
					" POS — Generated ",
					(/* @__PURE__ */ new Date()).toLocaleString("en-GB", {
						day: "numeric",
						month: "short",
						year: "numeric",
						hour: "numeric",
						minute: "2-digit"
					})
				]
			})
		] })]
	});
}
//#endregion
export { StockPrintPage as default };
