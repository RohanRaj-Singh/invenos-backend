import { i as __toESM, t as require_react } from "./react-DCO0ASPG.js";
import { t as RotateCcw } from "./rotate-ccw-DB3zy8KA.js";
import { t as Store } from "./store-BIRNZhQW.js";
import { t as TriangleAlert } from "./triangle-alert-D5zO2woV.js";
import { t as cn } from "./utils-Bim8RyS4.js";
import { t as require_jsx_runtime } from "./jsx-runtime-BjJQA5sn.js";
import { t as Button } from "./button-phKcTdak.js";
import { a as DialogTitle, i as DialogHeader, n as DialogContent, t as Dialog } from "./dialog-BC59qFP1.js";
import { At as usePage, Dt as toast, dt as Trash2, gt as Search, kt as router3, pt as ShoppingCart, ut as Users, yt as Package } from "./app-BJCY_l2M.js";
import { n as CardContent, t as Card } from "./card-DQfOgTjC.js";
import { t as Badge } from "./badge-BfSUOZdI.js";
import { t as usePermission } from "./PermissionGuard-27QiFHJH.js";
//#region resources/js/Pages/utilities/RecycleBin.tsx
var import_react = /* @__PURE__ */ __toESM(require_react(), 1);
var import_jsx_runtime = require_jsx_runtime();
function RecycleBinPage() {
	const { props } = usePage();
	const items = props.items || [];
	const filters = props.filters || {};
	const [typeFilter, setTypeFilter] = (0, import_react.useState)(filters.type || "all");
	const [search, setSearch] = (0, import_react.useState)(filters.search || "");
	const [selected, setSelected] = (0, import_react.useState)(/* @__PURE__ */ new Set());
	const [confirmDelete, setConfirmDelete] = (0, import_react.useState)(null);
	const [confirmPermanent, setConfirmPermanent] = (0, import_react.useState)(false);
	const filtered = (0, import_react.useMemo)(() => {
		return items.filter((item) => {
			if (typeFilter !== "all" && item.type !== typeFilter) return false;
			if (search) {
				const q = search.toLowerCase();
				return item.name.toLowerCase().includes(q) || item.identifier.toLowerCase().includes(q);
			}
			return true;
		});
	}, [
		items,
		typeFilter,
		search
	]);
	const typeCounts = (0, import_react.useMemo)(() => {
		const counts = { all: items.length };
		for (const item of items) counts[item.type] = (counts[item.type] || 0) + 1;
		return counts;
	}, [items]);
	const toggleSelect = (key) => {
		setSelected((prev) => {
			const next = new Set(prev);
			if (next.has(key)) next.delete(key);
			else next.add(key);
			return next;
		});
	};
	const restoreItem = (item) => {
		router3.post(`/utilities/recycle-bin/${item.type}/${item.id}/restore`, {}, {
			onSuccess: () => toast.success(`${item.name} restored`),
			onError: (err) => toast.error(Object.values(err).join(", "))
		});
	};
	const permanentDelete = (item) => {
		router3.delete(`/utilities/recycle-bin/${item.type}/${item.id}`, {
			onSuccess: () => {
				toast.success(`${item.name} permanently deleted`);
				setConfirmPermanent(false);
				setConfirmDelete(null);
			},
			onError: (err) => toast.error(Object.values(err).join(", "))
		});
	};
	const typeIcon = (type) => {
		switch (type) {
			case "product": return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Package, { className: "size-4" });
			case "contact": return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Users, { className: "size-4" });
			case "sale": return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ShoppingCart, { className: "size-4" });
			case "purchase": return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Store, { className: "size-4" });
			default: return null;
		}
	};
	const typeLabel = (type) => {
		switch (type) {
			case "product": return "Product";
			case "contact": return "Contact";
			case "sale": return "Sale";
			case "purchase": return "Purchase";
			default: return type;
		}
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto space-y-6 pb-24",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center gap-2 text-muted-foreground mb-1",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash2, { className: "size-5" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "text-xs font-semibold uppercase tracking-wider",
						children: "Utilities"
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "text-xl sm:text-2xl font-semibold tracking-tight",
					children: "Recycle Bin"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "text-sm text-muted-foreground mt-1",
					children: [
						items.length,
						" deleted ",
						items.length === 1 ? "record" : "records"
					]
				})
			] }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-center gap-2 flex-wrap",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "relative flex-1 min-w-[200px]",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Search, { className: "absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
						type: "text",
						placeholder: "Search deleted records...",
						value: search,
						onChange: (e) => setSearch(e.target.value),
						className: "w-full h-10 pl-9 pr-3 rounded-xl border border-input bg-background text-sm outline-none focus:border-ring transition-colors"
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
					value: typeFilter,
					onChange: (e) => setTypeFilter(e.target.value),
					className: "h-10 px-3 rounded-xl border border-input bg-background text-sm outline-none focus:border-ring",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("option", {
							value: "all",
							children: [
								"All (",
								typeCounts.all || 0,
								")"
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("option", {
							value: "products",
							children: [
								"Products (",
								typeCounts.products || 0,
								")"
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("option", {
							value: "contacts",
							children: [
								"Contacts (",
								typeCounts.contacts || 0,
								")"
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("option", {
							value: "sales",
							children: [
								"Sales (",
								typeCounts.sales || 0,
								")"
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("option", {
							value: "purchases",
							children: [
								"Purchases (",
								typeCounts.purchases || 0,
								")"
							]
						})
					]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Card, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardContent, {
				className: "p-0",
				children: filtered.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "text-center py-16 text-sm text-muted-foreground",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash2, { className: "size-10 mx-auto mb-3 text-muted-foreground/30" }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "font-medium text-foreground mb-1",
							children: "Recycle Bin is empty"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-xs",
							children: "Deleted records will appear here."
						})
					]
				}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "divide-y divide-border",
					children: filtered.map((item) => {
						const key = `${item.type}-${item.id}`;
						return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: cn("flex items-center gap-3 px-4 py-3 transition-colors hover:bg-muted/30", selected.has(key) && "bg-primary/5"),
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
									type: "checkbox",
									checked: selected.has(key),
									onChange: () => toggleSelect(key),
									className: "size-4 rounded border-gray-300 accent-primary shrink-0"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex items-center gap-2 min-w-0 flex-1",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "size-9 rounded-lg bg-muted flex items-center justify-center shrink-0",
										children: typeIcon(item.type)
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "min-w-0 flex-1",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "flex items-center gap-2",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
													className: "text-sm font-medium truncate",
													children: item.name
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
													variant: "outline",
													className: "text-[10px] px-1.5 py-0 h-4 font-normal shrink-0",
													children: typeLabel(item.type)
												})]
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "flex items-center gap-2 text-[11px] text-muted-foreground mt-0.5",
												children: [
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: item.identifier }),
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "·" }),
													/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: ["Deleted ", item.deleted_by ? `by ${item.deleted_by}` : ""] }),
													item.reason && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "·" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
														className: "italic",
														children: [
															"\"",
															item.reason,
															"\""
														]
													})] })
												]
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
												className: "text-[10px] text-muted-foreground/60 mt-0.5",
												children: item.impact
											})
										]
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex items-center gap-1 shrink-0",
									children: [usePermission("lifecycle", "restore") && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
										onClick: () => restoreItem(item),
										className: "flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-primary hover:bg-primary/5 transition-colors",
										title: "Restore",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(RotateCcw, { className: "size-3.5" }), " Restore"]
									}), usePermission("lifecycle", "permanentDelete") && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
										onClick: () => {
											setConfirmDelete(item);
											setConfirmPermanent(true);
										},
										className: "flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-red-500 hover:bg-red-50 transition-colors",
										title: "Permanently delete",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash2, { className: "size-3.5" })
									})]
								})
							]
						}, key);
					})
				})
			}) }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Dialog, {
				open: confirmPermanent && confirmDelete !== null,
				onOpenChange: (v) => {
					if (!v) {
						setConfirmPermanent(false);
						setConfirmDelete(null);
					}
				},
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogContent, {
					className: "sm:max-w-md gap-0 p-0",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogHeader, {
						className: "p-5 pb-0",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogTitle, {
							className: "text-base flex items-center gap-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TriangleAlert, { className: "size-5 text-red-500" }), "Permanently Delete?"]
						})
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "p-5 space-y-4",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "text-sm text-muted-foreground",
								children: [
									"This action ",
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: "cannot be undone" }),
									". The record will be permanently removed from the system."
								]
							}),
							confirmDelete && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "rounded-lg bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 p-3 text-sm",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: confirmDelete.name }),
									" · ",
									typeLabel(confirmDelete.type)
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex gap-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
									variant: "outline",
									onClick: () => {
										setConfirmPermanent(false);
										setConfirmDelete(null);
									},
									className: "flex-1",
									children: "Cancel"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
									onClick: () => confirmDelete && permanentDelete(confirmDelete),
									className: "flex-1 gap-1.5 bg-red-600 hover:bg-red-700",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash2, { className: "size-4" }), " Permanently Delete"]
								})]
							})
						]
					})]
				})
			})
		]
	});
}
//#endregion
export { RecycleBinPage as default };
