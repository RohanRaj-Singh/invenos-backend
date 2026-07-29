import { i as __toESM, t as require_react } from "./react-DCO0ASPG.js";
import { t as createLucideIcon } from "./createLucideIcon--nD-f_FR.js";
import { t as ArrowLeft } from "./arrow-left-CE4TWQlw.js";
import { t as Check } from "./check-BFfFFZZu.js";
import { t as Pencil } from "./pencil-CSxonttV.js";
import { t as cn } from "./utils-Bim8RyS4.js";
import { t as require_jsx_runtime } from "./jsx-runtime-BjJQA5sn.js";
import { Et as router3, S as getExpenseCategories, _t as Plus, at as formatCurrency, b as addExpenseCategory, ht as Search, lt as Wallet, w as updateExpenseCategory, x as archiveExpenseCategory } from "./app-fzdHvqQg.js";
import { n as CardContent, t as Card } from "./card-DQfOgTjC.js";
import { t as Badge } from "./badge-BfSUOZdI.js";
/**
* @license lucide-react v1.26.0 - ISC
*
* This source code is licensed under the ISC license.
* See the LICENSE file in the root directory of this source tree.
*/
var Archive = createLucideIcon("archive", [
	["rect", {
		width: "20",
		height: "5",
		x: "2",
		y: "3",
		rx: "1",
		key: "1wp1u1"
	}],
	["path", {
		d: "M4 8v11a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8",
		key: "1s80jp"
	}],
	["path", {
		d: "M10 12h4",
		key: "a56b0p"
	}]
]);
/**
* @license lucide-react v1.26.0 - ISC
*
* This source code is licensed under the ISC license.
* See the LICENSE file in the root directory of this source tree.
*/
var Palette = createLucideIcon("palette", [
	["path", {
		d: "M12 22a1 1 0 0 1 0-20 10 9 0 0 1 10 9 5 5 0 0 1-5 5h-2.25a1.75 1.75 0 0 0-1.4 2.8l.3.4a1.75 1.75 0 0 1-1.4 2.8z",
		key: "e79jfc"
	}],
	["circle", {
		cx: "13.5",
		cy: "6.5",
		r: ".5",
		fill: "currentColor",
		key: "1okk4w"
	}],
	["circle", {
		cx: "17.5",
		cy: "10.5",
		r: ".5",
		fill: "currentColor",
		key: "f64h9f"
	}],
	["circle", {
		cx: "6.5",
		cy: "12.5",
		r: ".5",
		fill: "currentColor",
		key: "qy21gx"
	}],
	["circle", {
		cx: "8.5",
		cy: "7.5",
		r: ".5",
		fill: "currentColor",
		key: "fotxhn"
	}]
]);
//#endregion
//#region resources/js/Pages/expenses/ExpenseCategories.tsx
var import_react = /* @__PURE__ */ __toESM(require_react(), 1);
var import_jsx_runtime = require_jsx_runtime();
var DEFAULT_COLORS = [
	"#ef4444",
	"#f59e0b",
	"#3b82f6",
	"#8b5cf6",
	"#06b6d4",
	"#ec4899",
	"#f97316",
	"#14b8a6",
	"#6366f1",
	"#a855f7",
	"#0ea5e9",
	"#e11d48",
	"#78716c",
	"#10b981",
	"#64748b"
];
function ExpenseCategoriesPage() {
	const [search, setSearch] = (0, import_react.useState)("");
	const [showForm, setShowForm] = (0, import_react.useState)(false);
	const [editingId, setEditingId] = (0, import_react.useState)(null);
	const [name, setName] = (0, import_react.useState)("");
	const [description, setDescription] = (0, import_react.useState)("");
	const [color, setColor] = (0, import_react.useState)(DEFAULT_COLORS[0]);
	const categories = (0, import_react.useMemo)(() => getExpenseCategories(), []);
	const filtered = (0, import_react.useMemo)(() => {
		if (!search.trim()) return categories;
		const q = search.toLowerCase();
		return categories.filter((c) => c.name.toLowerCase().includes(q) || c.description.toLowerCase().includes(q));
	}, [categories, search]);
	const openAdd = () => {
		setEditingId(null);
		setName("");
		setDescription("");
		setColor(DEFAULT_COLORS[0]);
		setShowForm(true);
	};
	const openEdit = (id) => {
		const cat = categories.find((c) => c.id === id);
		if (!cat) return;
		setEditingId(id);
		setName(cat.name);
		setDescription(cat.description);
		setColor(cat.color);
		setShowForm(true);
	};
	const handleSave = () => {
		if (!name.trim()) return;
		if (editingId) updateExpenseCategory(editingId, {
			name,
			description,
			color
		});
		else addExpenseCategory({
			id: `exp-cat-${String(Date.now()).slice(-6)}`,
			name,
			description,
			color,
			icon: "Wallet",
			active: true
		});
		setShowForm(false);
		setEditingId(null);
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto space-y-5",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-center justify-between",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
					onClick: () => router3.visit("/expenses"),
					className: "inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowLeft, { className: "size-4" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Back to Expenses" })]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
					onClick: openAdd,
					className: "inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium shadow-sm hover:bg-primary/90 transition-colors",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, { className: "size-4" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "hidden sm:inline",
						children: "Add Category"
					})]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-start gap-4",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "size-12 rounded-xl bg-gradient-to-br from-red-500/20 to-red-500/5 flex items-center justify-center shrink-0",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Palette, { className: "size-6 text-red-600 dark:text-red-400" })
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "text-xl sm:text-2xl font-semibold tracking-tight",
					children: "Expense Categories"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "text-sm text-muted-foreground mt-1",
					children: [
						categories.length,
						" categories · ",
						categories.filter((c) => c.active).length,
						" active"
					]
				})] })]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "relative max-w-xs",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Search, { className: "absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
					type: "text",
					placeholder: "Search categories...",
					value: search,
					onChange: (e) => setSearch(e.target.value),
					className: "w-full h-10 pl-9 pr-3 rounded-xl border border-input bg-background text-sm outline-none focus:border-ring focus:ring-1 focus:ring-ring/30 transition-colors"
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3",
				children: [filtered.map((cat) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Card, {
					size: "sm",
					className: cn(cat.active ? "" : "opacity-60"),
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardContent, {
						className: "p-4",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-start justify-between mb-3",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex items-center gap-3",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "size-10 rounded-lg flex items-center justify-center",
										style: { backgroundColor: cat.color + "20" },
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Wallet, {
											className: "size-5",
											style: { color: cat.color }
										})
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "text-sm font-semibold text-foreground",
										children: cat.name
									}), !cat.active && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
										variant: "outline",
										className: "text-[9px] ml-1 px-1 py-0 h-4",
										children: "Archived"
									})] })]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex items-center gap-0.5",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
										onClick: () => openEdit(cat.id),
										className: "flex items-center justify-center size-7 rounded-md hover:bg-muted text-muted-foreground transition-colors",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pencil, { className: "size-3.5" })
									}), cat.active && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
										onClick: () => {
											archiveExpenseCategory(cat.id);
											window.location.reload();
										},
										className: "flex items-center justify-center size-7 rounded-md hover:bg-muted text-muted-foreground transition-colors",
										title: "Archive",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Archive, { className: "size-3.5" })
									})]
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-xs text-muted-foreground mb-3",
								children: cat.description
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-center gap-3 text-xs",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
									className: "text-muted-foreground",
									children: [
										cat.expenseCount,
										" expense",
										cat.expenseCount !== 1 ? "s" : ""
									]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "font-semibold text-foreground",
									children: formatCurrency(cat.totalSpent)
								})]
							}),
							cat.lastUsed && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "text-[10px] text-muted-foreground mt-1",
								children: ["Last used: ", cat.lastUsed]
							})
						]
					})
				}, cat.id)), filtered.length === 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "col-span-full text-center py-12 text-sm text-muted-foreground",
					children: "No categories found."
				})]
			}),
			showForm && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "fixed inset-0 z-50 flex items-center justify-center bg-black/40",
				onClick: () => setShowForm(false),
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "bg-background rounded-xl p-6 max-w-sm mx-4 w-full shadow-2xl",
					onClick: (e) => e.stopPropagation(),
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
							className: "text-base font-semibold mb-4",
							children: editingId ? "Edit Category" : "Add Category"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "space-y-4",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
									className: "block text-sm font-medium mb-1.5",
									children: "Name"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
									type: "text",
									value: name,
									onChange: (e) => setName(e.target.value),
									placeholder: "Category name",
									autoFocus: true,
									className: "w-full h-10 px-3 rounded-xl border border-input bg-background text-sm outline-none focus:border-ring transition-colors"
								})] }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
									className: "block text-sm font-medium mb-1.5",
									children: "Description"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
									type: "text",
									value: description,
									onChange: (e) => setDescription(e.target.value),
									placeholder: "Brief description",
									className: "w-full h-10 px-3 rounded-xl border border-input bg-background text-sm outline-none focus:border-ring transition-colors"
								})] }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
									className: "block text-sm font-medium mb-1.5",
									children: "Color"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "flex flex-wrap gap-2",
									children: DEFAULT_COLORS.map((c) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
										onClick: () => setColor(c),
										className: cn("size-8 rounded-full border-2 transition-all", color === c ? "border-foreground scale-110" : "border-transparent"),
										style: { backgroundColor: c },
										children: color === c && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Check, { className: "size-3.5 text-white mx-auto" })
									}, c))
								})] })
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center justify-end gap-2 mt-6",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								onClick: () => setShowForm(false),
								className: "px-4 py-2 text-sm font-medium rounded-lg border border-border hover:bg-muted transition-colors",
								children: "Cancel"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								onClick: handleSave,
								disabled: !name.trim(),
								className: "px-4 py-2 text-sm font-medium rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-40",
								children: editingId ? "Update" : "Save"
							})]
						})
					]
				})
			})
		]
	});
}
//#endregion
export { ExpenseCategoriesPage as default };
