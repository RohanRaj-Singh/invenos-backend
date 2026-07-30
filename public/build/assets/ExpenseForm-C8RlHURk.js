import { i as __toESM, t as require_react } from "./react-DCO0ASPG.js";
import { t as ArrowLeft } from "./arrow-left-CE4TWQlw.js";
import { t as Save } from "./save-D4S_dtxM.js";
import { t as require_jsx_runtime } from "./jsx-runtime-BjJQA5sn.js";
import { At as usePage, Dt as toast, kt as router3, lt as Wallet, vt as Plus } from "./app-BJCY_l2M.js";
import { i as CardTitle, n as CardContent, r as CardHeader, t as Card } from "./card-DQfOgTjC.js";
//#region resources/js/Pages/expenses/ExpenseForm.tsx
var import_react = /* @__PURE__ */ __toESM(require_react(), 1);
var import_jsx_runtime = require_jsx_runtime();
var PAYMENT_METHODS = [
	{
		value: "cash",
		label: "Cash"
	},
	{
		value: "card",
		label: "Card"
	},
	{
		value: "transfer",
		label: "Bank Transfer"
	},
	{
		value: "easypaisa",
		label: "Easypaisa"
	},
	{
		value: "jazzcash",
		label: "JazzCash"
	}
];
function ExpenseFormPage() {
	const { url, props } = usePage();
	const id = url.split("/").pop() || "";
	const categories = props.categories || [];
	const isEditing = id && !id.startsWith("new") && !isNaN(Number(id));
	const [date, setDate] = (0, import_react.useState)((/* @__PURE__ */ new Date()).toISOString().split("T")[0]);
	const [categoryInput, setCategoryInput] = (0, import_react.useState)("");
	const [categoryId, setCategoryId] = (0, import_react.useState)(categories[0]?.id || "");
	const [isNewCategory, setIsNewCategory] = (0, import_react.useState)(false);
	const [amount, setAmount] = (0, import_react.useState)("");
	const [paidTo, setPaidTo] = (0, import_react.useState)("");
	const [paymentMethod, setPaymentMethod] = (0, import_react.useState)("cash");
	const [notes, setNotes] = (0, import_react.useState)("");
	const [errors, setErrors] = (0, import_react.useState)({});
	const [showSuggestions, setShowSuggestions] = (0, import_react.useState)(false);
	const suggestionRef = (0, import_react.useRef)(null);
	(0, import_react.useEffect)(() => {
		const handler = (e) => {
			if (suggestionRef.current && !suggestionRef.current.contains(e.target)) setShowSuggestions(false);
		};
		document.addEventListener("mousedown", handler);
		return () => document.removeEventListener("mousedown", handler);
	}, []);
	(0, import_react.useEffect)(() => {
		if (!id || !isEditing) return;
		const expense = props.expense;
		if (expense) {
			setDate(expense.date || (/* @__PURE__ */ new Date()).toISOString().split("T")[0]);
			setCategoryInput(expense.category?.name || "");
			setCategoryId(String(expense.category_id || ""));
			setAmount(String(expense.amount || ""));
			setPaidTo(expense.paid_to || "");
			setPaymentMethod(expense.payment_method || "cash");
			setNotes(expense.notes || "");
		}
	}, [id, isEditing]);
	const validate = () => {
		const errs = {};
		if (!categoryId) errs.categoryId = "Category is required";
		if (!amount || parseFloat(amount) <= 0) errs.amount = "Amount must be greater than zero";
		if (!date) errs.date = "Date is required";
		setErrors(errs);
		return Object.keys(errs).length === 0;
	};
	const handleKeyDown = (e) => {
		if (e.key === "Enter" && !e.shiftKey && !e.ctrlKey && !e.metaKey) {
			e.preventDefault();
			handleSubmit(false);
		}
	};
	const resetForm = (0, import_react.useCallback)((opts = {}) => {
		setDate((/* @__PURE__ */ new Date()).toISOString().split("T")[0]);
		setCategoryInput("");
		setCategoryId(opts.categoryId ?? "");
		setAmount("");
		setPaidTo("");
		setNotes("");
		setErrors({});
	}, []);
	const handleSubmit = (andNext = false) => {
		if (!validate()) {
			toast.error("Please fix the errors before saving.");
			return;
		}
		const payload = {
			date,
			category_id: categoryId,
			amount: Math.round(parseFloat(amount) * 100) / 100,
			paid_to: paidTo,
			payment_method: paymentMethod,
			notes
		};
		if (isEditing) router3.put(`/expenses/${id}`, payload, {
			onSuccess: () => {
				toast.success("Expense updated");
				if (!andNext) router3.visit("/expenses");
				else resetForm({
					amount: true,
					date: true,
					notes: true
				});
			},
			onError: (errs) => {
				const first = Object.values(errs)[0];
				toast.error(String(first || "Failed to update expense"));
			}
		});
		else router3.post("/expenses", payload, {
			onSuccess: () => {
				toast.success("Expense added");
				if (!andNext) router3.visit("/expenses");
				else resetForm({
					amount: true,
					date: true,
					notes: true
				});
			},
			onError: (errs) => {
				const first = Object.values(errs)[0];
				toast.error(String(first || "Failed to add expense"));
			}
		});
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto space-y-5",
		onKeyDown: handleKeyDown,
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "flex items-center justify-between",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
					onClick: () => router3.visit("/expenses"),
					className: "inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowLeft, { className: "size-4" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Back to Expenses" })]
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-start gap-4",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "size-12 rounded-xl bg-gradient-to-br from-red-500/20 to-red-500/5 flex items-center justify-center shrink-0",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Wallet, { className: "size-6 text-red-600 dark:text-red-400" })
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "text-xl sm:text-2xl font-semibold tracking-tight",
					children: isEditing ? "Edit Expense" : "Add Expense"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-sm text-muted-foreground mt-1",
					children: isEditing ? "Update the expense details below." : "Record a new business expense."
				})] })]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardHeader, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardTitle, { children: "Expense Details" }) }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardContent, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "grid grid-cols-1 sm:grid-cols-2 gap-5",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
							className: "block text-sm font-medium mb-1.5",
							children: ["Expense Date ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-red-500",
								children: "*"
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							type: "date",
							value: date,
							onChange: (e) => setDate(e.target.value),
							className: "w-full h-10 px-3 rounded-xl border border-input bg-background text-sm outline-none focus:border-ring focus:ring-1 focus:ring-ring/30 transition-colors"
						}),
						errors.date && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-xs text-red-500 mt-1",
							children: errors.date
						})
					] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "relative",
						ref: suggestionRef,
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
								className: "block text-sm font-medium mb-1.5",
								children: ["Category ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-red-500",
									children: "*"
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "relative",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
									type: "text",
									value: categoryInput,
									onChange: (e) => {
										setCategoryInput(e.target.value);
										setShowSuggestions(true);
										const match = categories.find((c) => c.name.toLowerCase() === e.target.value.toLowerCase());
										if (match) {
											setCategoryId(match.id);
											setIsNewCategory(false);
										} else setCategoryId("");
									},
									onFocus: () => setShowSuggestions(true),
									placeholder: "Search or type a category...",
									className: "w-full h-10 px-3 rounded-xl border border-input bg-background text-sm outline-none focus:border-ring focus:ring-1 focus:ring-ring/30 transition-colors",
									autoComplete: "off"
								}), categoryInput && !isNewCategory && !categoryId && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
									onClick: () => {
										const name = categoryInput.trim();
										if (!name) return;
										router3.post("/expenses/categories", { name }, {
											onSuccess: (page) => {
												const created = (page.props.categories || []).find((c) => c.name === name);
												setCategoryId(created ? String(created.id) : "");
												setIsNewCategory(true);
												setShowSuggestions(false);
												toast.success(`Category "${name}" created`);
											},
											onError: () => toast.error("Failed to create category")
										});
									},
									className: "absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 px-2 py-1 rounded-md bg-primary text-primary-foreground text-[11px] font-medium hover:bg-primary/90 transition-colors",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, { className: "size-3" }), " Add New"]
								})]
							}),
							showSuggestions && categoryInput && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "absolute z-20 top-full mt-1 left-0 right-0 bg-background border border-border rounded-xl shadow-lg max-h-48 overflow-y-auto",
								children: [categories.filter((c) => c.name.toLowerCase().includes(categoryInput.toLowerCase()) && c.id !== categoryId).map((c) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
									type: "button",
									onClick: () => {
										setCategoryInput(c.name);
										setCategoryId(c.id);
										setIsNewCategory(false);
										setShowSuggestions(false);
									},
									className: "w-full flex items-center gap-2 px-3 py-2 text-sm text-left hover:bg-muted transition-colors",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "size-6 rounded",
										style: { backgroundColor: c.color + "30" }
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: c.name })]
								}, c.id)), categories.filter((c) => c.name.toLowerCase().includes(categoryInput.toLowerCase()) && c.id !== categoryId).length === 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "px-3 py-3 text-sm text-muted-foreground",
									children: [
										"No matching category.",
										" ",
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
											type: "button",
											onClick: () => {
												const name = categoryInput.trim();
												if (!name) return;
												router3.post("/expenses/categories", { name }, {
													onSuccess: (page) => {
														const created = (page.props.categories || []).find((c) => c.name === name);
														setCategoryId(created ? String(created.id) : "");
														setIsNewCategory(true);
														setShowSuggestions(false);
														toast.success(`Category "${name}" created`);
													},
													onError: () => toast.error("Failed to create category")
												});
											},
											className: "text-primary font-medium hover:underline",
											children: [
												"Add \"",
												categoryInput.trim(),
												"\""
											]
										})
									]
								})]
							}),
							errors.categoryId && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-xs text-red-500 mt-1",
								children: errors.categoryId
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
							className: "block text-sm font-medium mb-1.5",
							children: ["Amount (Rs.) ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-red-500",
								children: "*"
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							type: "number",
							min: "0",
							step: "0.01",
							value: amount,
							onChange: (e) => setAmount(e.target.value),
							placeholder: "0.00",
							className: "w-full h-10 px-3 rounded-xl border border-input bg-background text-sm outline-none focus:border-ring focus:ring-1 focus:ring-ring/30 transition-colors"
						}),
						errors.amount && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-xs text-red-500 mt-1",
							children: errors.amount
						})
					] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
						className: "block text-sm font-medium mb-1.5",
						children: "Paid To"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
						type: "text",
						value: paidTo,
						onChange: (e) => setPaidTo(e.target.value),
						placeholder: "Vendor or payee name",
						className: "w-full h-10 px-3 rounded-xl border border-input bg-background text-sm outline-none focus:border-ring focus:ring-1 focus:ring-ring/30 transition-colors"
					})] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
							className: "block text-sm font-medium mb-1.5",
							children: ["Payment Method ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-red-500",
								children: "*"
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("select", {
							value: paymentMethod,
							onChange: (e) => setPaymentMethod(e.target.value),
							className: "w-full h-10 px-3 rounded-xl border border-input bg-background text-sm outline-none focus:border-ring focus:ring-1 focus:ring-ring/30 transition-colors",
							children: PAYMENT_METHODS.map((pm) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
								value: pm.value,
								children: pm.label
							}, pm.value))
						}),
						errors.paymentMethod && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-xs text-red-500 mt-1",
							children: errors.paymentMethod
						})
					] })
				]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-5",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
					className: "block text-sm font-medium mb-1.5",
					children: "Notes"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("textarea", {
					value: notes,
					onChange: (e) => setNotes(e.target.value),
					placeholder: "Optional notes about this expense",
					rows: 3,
					className: "w-full px-3 py-2 rounded-xl border border-input bg-background text-sm outline-none focus:border-ring focus:ring-1 focus:ring-ring/30 transition-colors resize-none"
				})]
			})] })] }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-center justify-end gap-3",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						onClick: () => router3.visit("/expenses"),
						className: "px-4 py-2.5 text-sm font-medium rounded-lg border border-border hover:bg-muted transition-colors",
						children: "Cancel"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						onClick: () => handleSubmit(true),
						className: "px-4 py-2.5 text-sm font-medium rounded-lg border border-border hover:bg-muted transition-colors",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "hidden sm:inline",
							children: "Save & Add Next"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "sm:hidden",
							children: "Add Next"
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						onClick: () => handleSubmit(false),
						className: "inline-flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium rounded-lg bg-primary text-primary-foreground shadow-sm hover:bg-primary/90 transition-colors",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Save, { className: "size-4" }), isEditing ? "Update Expense" : "Save Expense"]
					})
				]
			})
		]
	});
}
//#endregion
export { ExpenseFormPage as default };
