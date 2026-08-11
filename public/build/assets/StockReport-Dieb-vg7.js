import { i as __toESM, t as require_react } from "./react-DCO0ASPG.js";
import { t as createLucideIcon } from "./createLucideIcon--nD-f_FR.js";
import { t as ChevronLeft } from "./chevron-left-BWkIAWWi.js";
import { t as ClipboardList } from "./clipboard-list-vYbzP_6F.js";
import { t as ReportToolbar } from "./ReportToolbar-CVj7CZRk.js";
import { t as TrendingUp } from "./trending-up-CRrMyRfV.js";
import { t as TriangleAlert } from "./triangle-alert-D5zO2woV.js";
import { t as Undo2 } from "./undo-2-DpEiivq2.js";
import { t as cn } from "./utils-Bim8RyS4.js";
import { t as require_jsx_runtime } from "./jsx-runtime-BjJQA5sn.js";
import { Ot as router3, St as ChevronRight, ht as Search, it as formatCurrencyShort, kt as usePage, rt as formatCurrency, vt as Package } from "./app-C0kkOB79.js";
import { t as ReportLayout } from "./ReportLayout-647vA4sZ.js";
import { t as SummaryCards } from "./SummaryCards-CMizigbC.js";
import { StatusBadge } from "./StatusBadge-CC0s9xUX.js";
/**
* @license lucide-react v1.26.0 - ISC
*
* This source code is licensed under the ISC license.
* See the LICENSE file in the root directory of this source tree.
*/
var Layers = createLucideIcon("layers", [
	["path", {
		d: "M12.83 2.18a2 2 0 0 0-1.66 0L2.6 6.08a1 1 0 0 0 0 1.83l8.58 3.91a2 2 0 0 0 1.66 0l8.58-3.9a1 1 0 0 0 0-1.83z",
		key: "zw3jo"
	}],
	["path", {
		d: "M2 12a1 1 0 0 0 .58.91l8.6 3.91a2 2 0 0 0 1.65 0l8.58-3.9A1 1 0 0 0 22 12",
		key: "1wduqc"
	}],
	["path", {
		d: "M2 17a1 1 0 0 0 .58.91l8.6 3.91a2 2 0 0 0 1.65 0l8.58-3.9A1 1 0 0 0 22 17",
		key: "kqbvx6"
	}]
]);
//#endregion
//#region resources/js/Pages/reports/StockReport.tsx
var import_react = /* @__PURE__ */ __toESM(require_react(), 1);
var import_jsx_runtime = require_jsx_runtime();
var PAGE_SIZES = [
	10,
	25,
	50,
	100,
	250
];
var fmt = (n) => Number(n ?? 0).toLocaleString();
function pageWindow(current, last) {
	if (last <= 7) return Array.from({ length: last }, (_, i) => i + 1);
	const pages = [1];
	const lo = Math.max(2, current - 1);
	const hi = Math.min(last - 1, current + 1);
	if (lo > 2) pages.push("…");
	for (let i = lo; i <= hi; i++) pages.push(i);
	if (hi < last - 1) pages.push("…");
	pages.push(last);
	return pages;
}
function Section({ title, icon, children, className }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
		className: cn("rounded-xl border border-border bg-card p-4 sm:p-5", className),
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h2", {
			className: "text-sm font-semibold text-foreground flex items-center gap-2 mb-3",
			children: [icon, title]
		}), children]
	});
}
function MovementTable({ movement }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "max-w-md",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("table", {
			className: "w-full text-sm",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tbody", { children: [
				[
					"Opening Stock",
					movement.opening_stock,
					false
				],
				[
					"Purchased",
					movement.purchased,
					false
				],
				[
					"Sold",
					movement.sold,
					true
				],
				[
					"Sale Returns",
					movement.sale_returns,
					false
				],
				[
					"Purchase Returns",
					movement.purchase_returns,
					true
				],
				[
					"Adjustments",
					movement.adjustments,
					movement.adjustments < 0
				],
				[
					"Closing Stock",
					movement.closing_stock,
					false
				]
			].map(([label, value, subtract]) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
				className: "border-b border-border last:border-0",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
					className: "py-1.5 text-muted-foreground",
					children: label
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
					className: "py-1.5 text-right font-medium tabular-nums",
					children: label === "Adjustments" ? `${value >= 0 ? "+" : "−"}${fmt(Math.abs(value))}` : `${subtract ? "−" : value >= 0 && label !== "Opening Stock" ? "+" : ""}${fmt(value)}`
				})]
			}, label)) })
		})
	});
}
function StockReportPage() {
	const { props } = usePage();
	const page = props;
	const report = page.report || {};
	const categories = page.categories || [];
	const filters = page.filters || {};
	const meta = report.meta || null;
	const summary = report.summary || {
		total_products: 0,
		total_stock: 0,
		total_value: 0,
		low_stock: 0,
		out_of_stock: 0,
		negative_stock: 0
	};
	const attention = report.attention || {
		negative: [],
		out_of_stock: [],
		low_stock: []
	};
	const movement = report.movement || null;
	const topSelling = report.top_selling || [];
	const mostReturned = report.most_returned || [];
	const valuation = report.valuation || {
		method: "",
		total_value: 0,
		rows: []
	};
	const byCategory = report.by_category || [];
	const products = report.products || [];
	const [search, setSearch] = (0, import_react.useState)(filters.search || "");
	const [category, setCategory] = (0, import_react.useState)(filters.category_id ? String(filters.category_id) : "all");
	const [status, setStatus] = (0, import_react.useState)(filters.status || "all");
	const [dateFrom, setDateFrom] = (0, import_react.useState)(filters.date_from || "");
	const [dateTo, setDateTo] = (0, import_react.useState)(filters.date_to || "");
	const [perPage, setPerPage] = (0, import_react.useState)(filters.per_page || 25);
	const isFirstRender = (0, import_react.useRef)(true);
	const buildParams = (0, import_react.useCallback)((page, overrides) => ({
		search,
		category_id: category === "all" ? "" : category,
		status: status === "all" ? "" : status,
		date_from: dateFrom,
		date_to: dateTo,
		per_page: String(perPage),
		page: page ? String(page) : "",
		...overrides
	}), [
		search,
		category,
		status,
		dateFrom,
		dateTo,
		perPage
	]);
	const fetchPage = (0, import_react.useCallback)((page) => {
		router3.get("/reports/stock", buildParams(page), {
			preserveState: true,
			preserveScroll: true,
			replace: true,
			only: [
				"report",
				"categories",
				"filters"
			]
		});
	}, [buildParams]);
	(0, import_react.useEffect)(() => {
		if (isFirstRender.current) {
			isFirstRender.current = false;
			return;
		}
		const t = setTimeout(() => fetchPage(1), 300);
		return () => clearTimeout(t);
	}, [
		search,
		category,
		status,
		dateFrom,
		dateTo,
		perPage,
		fetchPage
	]);
	const filterUrl = (0, import_react.useCallback)((base, extra) => {
		const params = new URLSearchParams();
		if (search) params.set("search", search);
		if (category !== "all") params.set("category_id", category);
		if (status !== "all") params.set("status", status);
		if (dateFrom) params.set("date_from", dateFrom);
		if (dateTo) params.set("date_to", dateTo);
		if (extra) for (const [k, v] of Object.entries(extra)) params.set(k, v);
		const qs = params.toString();
		return qs ? `${base}?${qs}` : base;
	}, [
		search,
		category,
		status,
		dateFrom,
		dateTo
	]);
	const handlePrint = (0, import_react.useCallback)(() => {
		window.open(filterUrl("/reports/stock/print"), "_blank");
	}, [filterUrl]);
	const handleRefresh = (0, import_react.useCallback)(() => {
		fetchPage(meta?.current_page || 1);
	}, [fetchPage, meta]);
	const cards = (0, import_react.useMemo)(() => [
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
			value: formatCurrency(summary.total_value),
			positive: true
		},
		{
			label: "Low Stock",
			value: fmt(summary.low_stock),
			negative: summary.low_stock > 0
		},
		{
			label: "Out of Stock",
			value: fmt(summary.out_of_stock),
			negative: summary.out_of_stock > 0
		},
		{
			label: "Negative Stock",
			value: fmt(summary.negative_stock),
			negative: summary.negative_stock > 0
		}
	], [summary]);
	const from = !meta || meta.total === 0 ? 0 : (meta.current_page - 1) * meta.per_page + 1;
	const to = meta ? Math.min(meta.current_page * meta.per_page, meta.total) : products.length;
	const attentionGroups = [
		["negative", "Negative Stock"],
		["out_of_stock", "Out of Stock"],
		["low_stock", "Low Stock"]
	];
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(ReportLayout, {
		title: "Stock Report",
		subtitle: "Inventory intelligence — levels, movement, valuation & attention",
		icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Package, { className: "size-5 text-primary" }),
		toolbar: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ReportToolbar, {
			onPrint: handlePrint,
			onRefresh: handleRefresh,
			csvExportUrl: filterUrl("/reports/stock/export/csv"),
			excelExportUrl: filterUrl("/reports/stock/export/excel"),
			pdfExportUrl: filterUrl("/reports/share/stock", { format: "pdf" }),
			shareUrl: "/reports/share/stock",
			reportTitle: "Stock Report",
			currentFilters: {
				search,
				category_id: category === "all" ? "" : category,
				status: status === "all" ? "" : status,
				date_from: dateFrom,
				date_to: dateTo
			}
		}),
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "relative lg:col-span-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Search, { className: "absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							value: search,
							onChange: (e) => setSearch(e.target.value),
							placeholder: "Search product, SKU or barcode...",
							className: "w-full h-9 pl-8 pr-3 rounded-lg border border-input bg-background text-sm outline-none focus:border-ring focus:ring-1 focus:ring-ring/30"
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
						value: category,
						onChange: (e) => setCategory(e.target.value),
						className: "h-9 rounded-lg border border-input bg-background px-2 text-sm outline-none focus:border-ring focus:ring-1 focus:ring-ring/30",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
							value: "all",
							children: "All categories"
						}), categories.map((c) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
							value: String(c.id),
							children: c.name
						}, c.id))]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
						value: status,
						onChange: (e) => setStatus(e.target.value),
						className: "h-9 rounded-lg border border-input bg-background px-2 text-sm outline-none focus:border-ring focus:ring-1 focus:ring-ring/30",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
								value: "all",
								children: "All statuses"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
								value: "in-stock",
								children: "In Stock"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
								value: "low-stock",
								children: "Low Stock"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
								value: "out-of-stock",
								children: "Out of Stock"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
								value: "negative",
								children: "Negative Stock"
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center gap-1",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								type: "date",
								value: dateFrom,
								onChange: (e) => setDateFrom(e.target.value),
								className: "h-9 flex-1 min-w-0 rounded-lg border border-input bg-background px-2 text-sm outline-none focus:border-ring focus:ring-1 focus:ring-ring/30",
								title: "From date"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-muted-foreground text-xs",
								children: "to"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								type: "date",
								value: dateTo,
								onChange: (e) => setDateTo(e.target.value),
								className: "h-9 flex-1 min-w-0 rounded-lg border border-input bg-background px-2 text-sm outline-none focus:border-ring focus:ring-1 focus:ring-ring/30",
								title: "To date"
							})
						]
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "text-xs text-muted-foreground",
				children: [
					"Showing ",
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "font-medium text-foreground",
						children: meta ? `${from}–${to}` : products.length
					}),
					" of ",
					meta?.total ?? products.length,
					" products",
					report.period && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
						className: "ml-2",
						children: [
							"· Movement period: ",
							new Date(report.period.from).toLocaleDateString("en-GB", {
								day: "numeric",
								month: "short"
							}),
							" — ",
							new Date(report.period.to).toLocaleDateString("en-GB", {
								day: "numeric",
								month: "short",
								year: "numeric"
							})
						]
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SummaryCards, {
				cards,
				columns: 6
			}),
			attentionGroups.some(([k]) => attention[k].length > 0) && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Section, {
				title: "Needs Attention",
				icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TriangleAlert, { className: "size-4 text-amber-500" }),
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "grid grid-cols-1 md:grid-cols-3 gap-4",
					children: attentionGroups.map(([key, label]) => {
						const rows = attention[key];
						if (rows.length === 0) return null;
						return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2",
							children: label
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
							className: "space-y-1.5",
							children: rows.map((a) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
								className: "flex items-center justify-between gap-2 text-sm",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "truncate",
									title: a.name,
									children: a.name
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
									className: cn("tabular-nums shrink-0", a.stock_quantity < 0 ? "text-red-600 font-medium" : "text-muted-foreground"),
									children: [
										fmt(a.stock_quantity),
										" ",
										a.unit || ""
									]
								})]
							}, a.id))
						})] }, key);
					})
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "grid grid-cols-1 lg:grid-cols-2 gap-4",
				children: [movement && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Section, {
					title: "Stock Movement",
					icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Layers, { className: "size-4 text-primary" }),
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(MovementTable, { movement })
				}), valuation.rows.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Section, {
					title: "Stock Valuation",
					icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ClipboardList, { className: "size-4 text-primary" }),
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-xs text-muted-foreground mb-3",
							children: valuation.method
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "text-2xl font-bold text-foreground mb-4",
							children: formatCurrency(valuation.total_value)
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "space-y-2",
							children: valuation.rows.map((v) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-center justify-between gap-2 text-sm",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "truncate",
										title: v.product,
										children: v.product
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
										className: "text-muted-foreground shrink-0",
										children: [
											fmt(v.quantity),
											" ",
											v.unit || "",
											" × ",
											formatCurrencyShort(v.cost)
										]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "tabular-nums font-medium shrink-0",
										children: formatCurrency(v.value)
									})
								]
							}, `${v.product}-${v.sku}`))
						})
					]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "grid grid-cols-1 lg:grid-cols-2 gap-4",
				children: [topSelling.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Section, {
					title: "Top Selling Products",
					icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TrendingUp, { className: "size-4 text-emerald-600" }),
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
						className: "w-full text-sm",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
							className: "text-[11px] text-muted-foreground uppercase tracking-wider border-b border-border",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
									className: "text-left font-medium pb-2",
									children: "Product"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
									className: "text-right font-medium pb-2",
									children: "Qty"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
									className: "text-right font-medium pb-2",
									children: "Revenue"
								})
							]
						}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tbody", { children: topSelling.map((t) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
							className: "border-b border-border last:border-0",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									className: "py-2 truncate max-w-[220px]",
									title: t.product_name,
									children: t.product_name
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									className: "py-2 text-right tabular-nums",
									children: fmt(t.qty)
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									className: "py-2 text-right tabular-nums font-medium",
									children: formatCurrency(t.revenue)
								})
							]
						}, t.product_id)) })]
					})
				}), mostReturned.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Section, {
					title: "Most Returned Products",
					icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Undo2, { className: "size-4 text-amber-600" }),
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
						className: "w-full text-sm",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
							className: "text-[11px] text-muted-foreground uppercase tracking-wider border-b border-border",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
									className: "text-left font-medium pb-2",
									children: "Product"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
									className: "text-right font-medium pb-2",
									children: "Qty"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
									className: "text-right font-medium pb-2",
									children: "Value"
								})
							]
						}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tbody", { children: mostReturned.map((m) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
							className: "border-b border-border last:border-0",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									className: "py-2 truncate max-w-[220px]",
									title: m.product_name,
									children: m.product_name
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									className: "py-2 text-right tabular-nums",
									children: fmt(m.qty)
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									className: "py-2 text-right tabular-nums font-medium",
									children: formatCurrency(m.value)
								})
							]
						}, m.product_id)) })]
					})
				})]
			}),
			byCategory.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Section, {
				title: "Inventory by Category",
				icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Layers, { className: "size-4 text-primary" }),
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2",
					children: byCategory.map((cat) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "rounded-lg border border-border bg-muted/40 p-3",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "text-[10px] text-muted-foreground font-medium uppercase tracking-wider truncate",
								title: cat.category,
								children: cat.category
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "text-sm font-semibold text-foreground mt-1",
								children: [cat.products, " products"]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "text-xs text-muted-foreground mt-0.5",
								children: formatCurrency(cat.value)
							})
						]
					}, cat.category))
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Section, {
				title: "Products",
				icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Package, { className: "size-4 text-primary" }),
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "overflow-x-auto",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
						className: "w-full text-sm min-w-[760px]",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
							className: "text-[11px] text-muted-foreground uppercase tracking-wider border-b-2 border-foreground/80",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
									className: "text-left font-semibold py-2 w-[24%]",
									children: "Product"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
									className: "text-left font-semibold py-2 w-[12%]",
									children: "SKU"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
									className: "text-left font-semibold py-2 w-[14%]",
									children: "Category"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
									className: "text-right font-semibold py-2 w-[9%]",
									children: "Stock"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
									className: "text-right font-semibold py-2 w-[9%]",
									children: "Sold"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
									className: "text-right font-semibold py-2 w-[10%]",
									children: "Purchased"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
									className: "text-right font-semibold py-2 w-[13%]",
									children: "Value"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
									className: "text-center font-semibold py-2 w-[9%]",
									children: "Status"
								})
							]
						}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tbody", { children: products.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tr", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
							colSpan: 8,
							className: "py-8 text-center text-muted-foreground",
							children: "No products found."
						}) }) : products.map((p) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
							className: "border-b border-border last:border-0 hover:bg-muted/40 transition-colors",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("td", {
									className: "py-2 pr-2",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "font-medium truncate",
										title: p.name,
										children: p.name
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "text-[10px] text-muted-foreground truncate",
										children: p.category || "—"
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									className: "py-2",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("code", {
										className: "text-[11px] font-mono bg-muted px-1 py-0.5 rounded",
										children: p.sku || "—"
									})
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									className: "py-2 text-xs text-muted-foreground truncate max-w-[120px]",
									title: p.category || "",
									children: p.category || "—"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									className: "py-2 text-right tabular-nums font-semibold",
									children: fmt(p.stock_quantity)
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									className: "py-2 text-right tabular-nums text-muted-foreground",
									children: fmt(p.sold)
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									className: "py-2 text-right tabular-nums text-muted-foreground",
									children: fmt(p.purchased)
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									className: "py-2 text-right tabular-nums",
									children: formatCurrency(p.value)
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									className: "py-2 text-center",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(StatusBadge, {
										status: p.status,
										kind: "stock"
									})
								})
							]
						}, p.id)) })]
					})
				})
			}),
			meta && meta.last_page > 1 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-center justify-between gap-4 border-t border-border pt-4",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center gap-2 text-xs text-muted-foreground",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "whitespace-nowrap",
						children: "Rows / page:"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("select", {
						value: perPage,
						onChange: (e) => setPerPage(Number(e.target.value)),
						className: "h-8 rounded-lg border border-input bg-background px-2 text-xs outline-none focus:border-ring focus:ring-1 focus:ring-ring/30",
						children: PAGE_SIZES.map((n) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
							value: n,
							children: n
						}, n))
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center gap-1",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							onClick: () => fetchPage(meta.current_page - 1),
							disabled: meta.current_page <= 1,
							className: "inline-flex items-center gap-1 px-2.5 h-8 rounded-lg border border-input text-xs font-medium hover:bg-muted transition-colors disabled:opacity-40 cursor-pointer",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronLeft, { className: "size-4" }), " Prev"]
						}),
						pageWindow(meta.current_page, meta.last_page).map((p, i) => p === "…" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "px-1.5 text-xs text-muted-foreground",
							children: "…"
						}, `ellipsis-${i}`) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							onClick: () => fetchPage(p),
							className: cn("min-w-8 h-8 px-2 rounded-lg text-xs font-medium transition-colors cursor-pointer", p === meta.current_page ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground hover:bg-muted"),
							children: p
						}, p)),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							onClick: () => fetchPage(meta.current_page + 1),
							disabled: meta.current_page >= meta.last_page,
							className: "inline-flex items-center gap-1 px-2.5 h-8 rounded-lg border border-input text-xs font-medium hover:bg-muted transition-colors disabled:opacity-40 cursor-pointer",
							children: ["Next ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronRight, { className: "size-4" })]
						})
					]
				})]
			})
		]
	});
}
//#endregion
export { StockReportPage as default };
