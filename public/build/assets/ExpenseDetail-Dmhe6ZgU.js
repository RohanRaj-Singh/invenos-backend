import { i as __toESM, t as require_react } from "./react-DCO0ASPG.js";
import { t as ArrowLeft } from "./arrow-left-CE4TWQlw.js";
import { t as Calendar } from "./calendar-Bnm5D-Dd.js";
import { t as DollarSign } from "./dollar-sign-DFlcCTeu.js";
import { t as FileText } from "./file-text-CkmQ0M6N.js";
import { t as Pencil } from "./pencil-CSxonttV.js";
import { t as Printer } from "./printer-SCaoHvv-.js";
import { t as Trash2 } from "./trash-2-D6E37i_K.js";
import { t as User } from "./user-DLTIgJdv.js";
import { t as cn } from "./utils-Bim8RyS4.js";
import { t as require_jsx_runtime } from "./jsx-runtime-BjJQA5sn.js";
import { C as getExpenseCategoryById, Dt as usePage, Et as router3, Tt as Link_default, at as formatCurrency, lt as Wallet, u as useApplication, v as deleteExpense, wt as toast, y as getExpenseByNumber } from "./app-DfjygdMU.js";
import { i as CardTitle, n as CardContent, r as CardHeader, t as Card } from "./card-DQfOgTjC.js";
import { t as Badge } from "./badge-BfSUOZdI.js";
//#region resources/js/Pages/expenses/ExpenseDetail.tsx
var import_react = /* @__PURE__ */ __toESM(require_react(), 1);
var import_jsx_runtime = require_jsx_runtime();
var METHOD_COLORS = {
	cash: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400",
	card: "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-500/10 dark:text-blue-400",
	transfer: "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-500/10 dark:text-purple-400",
	easypaisa: "bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-500/10 dark:text-orange-400",
	jazzcash: "bg-green-50 text-green-700 border-green-200 dark:bg-green-500/10 dark:text-green-400"
};
function ExpenseDetailPage() {
	const { url } = usePage();
	const id = url.split("/").pop() || "";
	const { eventBus } = useApplication();
	const [showDelete, setShowDelete] = (0, import_react.useState)(false);
	const expense = getExpenseByNumber(id || "");
	if (!expense) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex flex-col items-center justify-center py-24 text-sm text-muted-foreground",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Wallet, { className: "size-12 text-muted-foreground/30 mb-4" }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "text-lg font-semibold text-foreground mb-1",
					children: "Expense Not Found"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mb-4",
					children: "This expense doesn't exist."
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Link_default, {
					href: "/expenses",
					className: "inline-flex items-center gap-1.5 px-3.5 py-2 rounded-lg border border-border text-sm font-medium hover:bg-muted transition-colors",
					children: "Back to Expenses"
				})
			]
		})
	});
	const category = getExpenseCategoryById(expense.categoryId);
	const handleDelete = () => {
		deleteExpense(expense.id);
		eventBus.emit("ExpenseDeleted", {
			type: "ExpenseDeleted",
			expenseId: expense.id,
			timestamp: (/* @__PURE__ */ new Date()).toISOString()
		});
		toast.success(`Expense ${expense.expenseNumber} deleted`);
		router3.visit("/expenses");
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
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center gap-2",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							onClick: () => window.print(),
							className: "inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-border text-xs font-medium hover:bg-muted transition-colors",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Printer, { className: "size-3.5" }), "Print"]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Link_default, {
							href: `/expenses/${expense.expenseNumber}/edit`,
							className: "inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-border text-xs font-medium hover:bg-muted transition-colors",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pencil, { className: "size-3.5" }), "Edit"]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							onClick: () => setShowDelete(true),
							className: "inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-red-200 text-xs font-medium text-red-600 hover:bg-red-50 transition-colors",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash2, { className: "size-3.5" }), "Delete"]
						})
					]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-start gap-4",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "size-12 sm:size-14 rounded-xl bg-gradient-to-br from-red-500/20 to-red-500/5 flex items-center justify-center shrink-0",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Wallet, { className: "size-6 sm:size-7 text-red-600 dark:text-red-400" })
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex-1 min-w-0",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center gap-3 flex-wrap",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
							className: "text-xl sm:text-2xl font-semibold tracking-tight",
							children: expense.expenseNumber
						}), category && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
							variant: "outline",
							className: "text-[10px] px-2 py-0 h-5",
							children: category.name
						})]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center gap-2 mt-1 text-sm text-muted-foreground flex-wrap",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "font-medium text-foreground",
								children: expense.paidTo || "Unknown"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "·" }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: expense.date }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "·" }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: expense.createdBy })
						]
					})]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "grid grid-cols-2 sm:grid-cols-4 gap-3",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(StatCard, {
						label: "Amount",
						value: formatCurrency(expense.amount),
						bold: true,
						negative: true
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(StatCard, {
						label: "Payment Method",
						value: expense.paymentMethod,
						positive: true
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(StatCard, {
						label: "Category",
						value: category?.name || "Unknown"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(StatCard, {
						label: "Reference",
						value: expense.referenceNumber || "—"
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardHeader, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardTitle, { children: "Expense Information" }) }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardContent, {
				className: "space-y-4",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(InfoRow, {
						icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DollarSign, { className: "size-4" }),
						label: "Amount",
						value: formatCurrency(expense.amount)
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(InfoRow, {
						icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Calendar, { className: "size-4" }),
						label: "Date",
						value: expense.date
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(InfoRow, {
						icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Wallet, { className: "size-4" }),
						label: "Category",
						value: category?.name || "Unknown"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(InfoRow, {
						icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(User, { className: "size-4" }),
						label: "Paid To",
						value: expense.paidTo || "—"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(InfoRow, {
						icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Wallet, { className: "size-4" }),
						label: "Payment Method",
						value: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
							variant: "outline",
							className: cn("text-[10px] px-1.5 py-0 h-5", METHOD_COLORS[expense.paymentMethod]),
							children: expense.paymentMethod
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(InfoRow, {
						icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(FileText, { className: "size-4" }),
						label: "Reference",
						value: expense.referenceNumber || "—"
					}),
					expense.notes && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "pt-2 border-t border-border",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-xs text-muted-foreground mb-1.5",
							children: "Notes"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-sm",
							children: expense.notes
						})]
					})
				]
			})] }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardHeader, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardTitle, { children: "Timeline" }) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardContent, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "space-y-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TimelineEntry, {
					icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Wallet, { className: "size-4" }),
					title: "Expense Recorded",
					description: `${expense.expenseNumber} — ${formatCurrency(expense.amount)} ${expense.categoryName ? `(${expense.categoryName})` : ""}`,
					date: expense.date,
					active: true
				}), expense.updatedAt && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TimelineEntry, {
					icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pencil, { className: "size-4" }),
					title: "Expense Updated",
					description: "Details were modified",
					date: expense.updatedAt.split("T")[0]
				})]
			}) })] }),
			showDelete && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "fixed inset-0 z-50 flex items-center justify-center bg-black/40",
				onClick: () => setShowDelete(false),
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "bg-background rounded-xl p-6 max-w-sm mx-4 shadow-2xl",
					onClick: (e) => e.stopPropagation(),
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
							className: "text-base font-semibold mb-2",
							children: "Delete Expense?"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "text-sm text-muted-foreground mb-4",
							children: [
								"Are you sure you want to delete ",
								expense.expenseNumber,
								"? This cannot be undone."
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center justify-end gap-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								onClick: () => setShowDelete(false),
								className: "px-4 py-2 text-sm font-medium rounded-lg border border-border hover:bg-muted transition-colors",
								children: "Cancel"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								onClick: handleDelete,
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
function StatCard({ label, value, bold, positive, negative }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Card, {
		size: "sm",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardContent, {
			className: "p-4",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "text-[11px] text-muted-foreground uppercase tracking-wider mb-1",
				children: label
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: cn("text-lg tracking-tight", bold ? "font-bold" : "font-semibold", positive && "text-emerald-600", negative && "text-red-600"),
				children: value
			})]
		})
	});
}
function InfoRow({ icon, label, value }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex items-center gap-3 py-2.5 px-3 rounded-lg hover:bg-muted/50 transition-colors",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "flex items-center justify-center size-8 rounded-lg bg-muted shrink-0",
			children: icon
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex-1 min-w-0",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "text-xs text-muted-foreground",
				children: label
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "text-sm font-medium text-foreground",
				children: value
			})]
		})]
	});
}
function TimelineEntry({ icon, title, description, date, active }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex gap-3",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: cn("flex items-center justify-center size-8 rounded-lg shrink-0 mt-0.5", active ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"),
				children: icon
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex-1 min-w-0",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "text-sm font-medium text-foreground",
					children: title
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "text-xs text-muted-foreground",
					children: description
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "text-xs text-muted-foreground shrink-0",
				children: date
			})
		]
	});
}
//#endregion
export { ExpenseDetailPage as default };
