import { i as __toESM, t as require_react } from "./react-DCO0ASPG.js";
import { t as ArrowRight } from "./arrow-right-BaJB_osx.js";
import { t as Pencil } from "./pencil-CSxonttV.js";
import { t as Trash2 } from "./trash-2-D6E37i_K.js";
import { t as cn } from "./utils-Bim8RyS4.js";
import { t as require_jsx_runtime } from "./jsx-runtime-BjJQA5sn.js";
import { Dt as usePage, Et as router3, Tt as Link_default, _t as Plus, ht as Search, lt as Wallet, st as formatCurrency } from "./app-DfjygdMU.js";
import { n as CardContent, t as Card } from "./card-DQfOgTjC.js";
import { t as Badge } from "./badge-BfSUOZdI.js";
//#region resources/js/Pages/expenses/ExpenseList.tsx
var import_react = /* @__PURE__ */ __toESM(require_react(), 1);
var import_jsx_runtime = require_jsx_runtime();
var METHOD_COLORS = {
	cash: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400",
	card: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-500/10 dark:text-blue-400",
	transfer: "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-500/10 dark:text-purple-400",
	easypaisa: "bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-500/10 dark:text-orange-400",
	jazzcash: "bg-green-50 text-green-700 border-green-200 dark:bg-green-500/10 dark:text-green-400"
};
function ExpenseListPage() {
	const [search, setSearch] = (0, import_react.useState)("");
	const [categoryFilter, setCategoryFilter] = (0, import_react.useState)("all");
	const [methodFilter, setMethodFilter] = (0, import_react.useState)("all");
	const [confirmDelete, setConfirmDelete] = (0, import_react.useState)(null);
	const { props } = usePage();
	const allExpenses = props.expenses || [];
	const allCategories = props.categories || [];
	const filtered = (0, import_react.useMemo)(() => {
		return allExpenses.filter((e) => {
			if (search) {
				const q = search.toLowerCase();
				const numMatch = (e.expense_number || "").toLowerCase().includes(q);
				const paidToMatch = (e.paid_to || "").toLowerCase().includes(q);
				const catMatch = (e.category?.name || e.category_name || "").toLowerCase().includes(q);
				const refMatch = (e.notes || "").toLowerCase().includes(q);
				if (!numMatch && !paidToMatch && !catMatch && !refMatch) return false;
			}
			if (categoryFilter !== "all" && e.category_id != categoryFilter) return false;
			if (methodFilter !== "all" && e.payment_method !== methodFilter) return false;
			return true;
		}).sort((a, b) => b.date.localeCompare(a.date));
	}, [
		allExpenses,
		search,
		categoryFilter,
		methodFilter
	]);
	const handleDelete = (expenseId) => {
		router3.delete("/expenses/" + expenseId, {
			onSuccess: () => setConfirmDelete(null),
			onError: () => setConfirmDelete(null)
		});
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-5",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-start justify-between",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center gap-2 text-red-600 mb-1",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Wallet, { className: "size-5" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-xs font-semibold uppercase tracking-wider",
							children: "Expenses"
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
						className: "text-xl sm:text-2xl font-semibold tracking-tight",
						children: "All Expenses"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "text-sm text-muted-foreground mt-1",
						children: [
							allExpenses.length,
							" expense",
							allExpenses.length !== 1 ? "s" : "",
							" recorded"
						]
					})
				] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
					onClick: () => router3.visit("/expenses/new"),
					className: "inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium shadow-sm hover:bg-primary/90 transition-colors",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, { className: "size-4" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "hidden sm:inline",
						children: "Add Expense"
					})]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-center gap-3 flex-wrap",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "relative flex-1 max-w-xs",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Search, { className: "absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							type: "text",
							placeholder: "Search by number, category, vendor...",
							value: search,
							onChange: (e) => setSearch(e.target.value),
							className: "w-full h-10 pl-9 pr-3 rounded-xl border border-input bg-background text-sm outline-none focus:border-ring focus:ring-1 focus:ring-ring/30 transition-colors"
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
						value: categoryFilter,
						onChange: (e) => setCategoryFilter(e.target.value),
						className: "h-10 px-3 rounded-xl border border-input bg-background text-sm outline-none focus:border-ring",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
							value: "all",
							children: "All Categories"
						}), allCategories.filter((c) => c.active).map((c) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
							value: c.id,
							children: c.name
						}, c.id))]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
						value: methodFilter,
						onChange: (e) => setMethodFilter(e.target.value),
						className: "h-10 px-3 rounded-xl border border-input bg-background text-sm outline-none focus:border-ring",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
								value: "all",
								children: "All Methods"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
								value: "cash",
								children: "Cash"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
								value: "card",
								children: "Card"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
								value: "transfer",
								children: "Bank Transfer"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
								value: "easypaisa",
								children: "Easypaisa"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
								value: "jazzcash",
								children: "JazzCash"
							})
						]
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "hidden sm:block",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Card, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardContent, {
					className: "p-0",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
						className: "w-full",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
							className: "border-b border-border",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Th, { children: "Expense #" }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Th, { children: "Date" }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Th, { children: "Category" }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Th, { children: "Paid To" }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Th, { children: "Method" }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Th, {
									className: "text-right",
									children: "Amount"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Th, {
									className: "w-24 text-right",
									children: "Actions"
								})
							]
						}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tbody", { children: filtered.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tr", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
							colSpan: 7,
							className: "text-center py-12 text-sm text-muted-foreground",
							children: allExpenses.length === 0 ? "No expenses recorded yet. Click \"Add Expense\" to begin." : "No expenses match your filters."
						}) }) : filtered.map((exp) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
							className: "border-b border-border hover:bg-muted/30 transition-colors",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Td, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link_default, {
									href: `/expenses/${exp.expense_number}`,
									className: "text-sm font-semibold text-foreground hover:text-primary transition-colors",
									children: exp.expense_number
								}) }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Td, {
									className: "text-sm text-muted-foreground",
									children: exp.date
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Td, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
									variant: "outline",
									className: "text-[10px] px-1.5 py-0 h-5",
									children: exp.category?.name || exp.category_name
								}) }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Td, {
									className: "text-sm",
									children: exp.paid_to
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Td, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
									variant: "outline",
									className: cn("text-[10px] px-1.5 py-0 h-5", METHOD_COLORS[exp.payment_method] || ""),
									children: exp.payment_method
								}) }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Td, {
									className: "text-sm font-semibold text-right text-red-600 dark:text-red-400",
									children: formatCurrency(exp.amount)
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Td, {
									className: "text-right",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex items-center justify-end gap-1",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
												onClick: () => router3.visit(`/expenses/${exp.expense_number}`),
												className: "flex items-center justify-center size-7 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors",
												title: "View",
												children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowRight, { className: "size-3.5" })
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
												onClick: () => router3.visit(`/expenses/${exp.expense_number}/edit`),
												className: "flex items-center justify-center size-7 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors",
												title: "Edit",
												children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pencil, { className: "size-3.5" })
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
												onClick: () => setConfirmDelete(exp.id),
												className: "flex items-center justify-center size-7 rounded-md hover:bg-red-50 text-muted-foreground hover:text-red-600 transition-colors",
												title: "Delete",
												children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash2, { className: "size-3.5" })
											})
										]
									})
								})
							]
						}, exp.id)) })]
					})
				}) })
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "sm:hidden space-y-2",
				children: filtered.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "text-center py-16 text-sm text-muted-foreground",
					children: allExpenses.length === 0 ? "No expenses recorded yet." : "No expenses match your filters."
				}) : filtered.map((exp) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					onClick: () => router3.visit(`/expenses/${exp.expense_number}`),
					className: "w-full text-left group",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Card, {
						size: "sm",
						className: "transition-all hover:shadow-sm active:scale-[0.99]",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardContent, {
							className: "p-0",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-center gap-4 px-4 py-3.5",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "flex items-center justify-center size-9 rounded-lg bg-red-50 dark:bg-red-500/10 shrink-0",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Wallet, { className: "size-4 text-red-600 dark:text-red-400" })
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex-1 min-w-0",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "flex items-center gap-2",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "text-sm font-semibold text-foreground",
												children: exp.expense_number
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
												variant: "outline",
												className: "text-[10px]",
												children: exp.category?.name || exp.category_name
											})]
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "text-xs text-muted-foreground mt-0.5",
											children: [
												exp.paid_to,
												" · ",
												exp.date
											]
										})]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "text-right shrink-0",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
											className: "text-sm font-bold text-red-600 dark:text-red-400",
											children: formatCurrency(exp.amount)
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
											className: "text-[10px] text-muted-foreground capitalize",
											children: exp.payment_method
										})]
									})
								]
							})
						})
					})
				}, exp.id))
			}),
			confirmDelete && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "fixed inset-0 z-50 flex items-center justify-center bg-black/40",
				onClick: () => setConfirmDelete(null),
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "bg-background rounded-xl p-6 max-w-sm mx-4 shadow-2xl",
					onClick: (e) => e.stopPropagation(),
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
							className: "text-base font-semibold mb-2",
							children: "Delete Expense?"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-sm text-muted-foreground mb-4",
							children: "This action cannot be undone. Are you sure you want to delete this expense?"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center justify-end gap-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								onClick: () => setConfirmDelete(null),
								className: "px-4 py-2 text-sm font-medium rounded-lg border border-border hover:bg-muted transition-colors",
								children: "Cancel"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								onClick: () => handleDelete(confirmDelete),
								className: "px-4 py-2 text-sm font-medium rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors",
								children: "Delete"
							})]
						})
					]
				})
			})
		]
	});
}
function Th({ children, className }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
		className: cn("px-4 py-3 text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wider", className),
		children
	});
}
function Td({ children, className }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
		className: cn("px-4 py-3", className),
		children
	});
}
//#endregion
export { ExpenseListPage as default };
