import { i as __toESM, t as require_react } from "./react-DCO0ASPG.js";
import { t as createLucideIcon } from "./createLucideIcon--nD-f_FR.js";
import { t as Banknote } from "./banknote-B76zKt2w.js";
import { t as Building2 } from "./building-2-DGTQudO_.js";
import { t as Check } from "./check-BFfFFZZu.js";
import { t as cn } from "./utils-Bim8RyS4.js";
import { t as require_jsx_runtime } from "./jsx-runtime-BjJQA5sn.js";
import { t as Button } from "./button-phKcTdak.js";
import { n as DialogContent, t as Dialog } from "./dialog-CsGPEqqr.js";
import { Dt as router3, Ot as usePage, Tt as toast, bt as CreditCard, ht as Receipt, mt as Search, rt as formatCurrency, st as Wallet } from "./app-CwPUaRAl.js";
/**
* @license lucide-react v1.26.0 - ISC
*
* This source code is licensed under the ISC license.
* See the LICENSE file in the root directory of this source tree.
*/
var Smartphone = createLucideIcon("smartphone", [["rect", {
	width: "14",
	height: "20",
	x: "5",
	y: "2",
	rx: "2",
	ry: "2",
	key: "1yt0o3"
}], ["path", {
	d: "M12 18h.01",
	key: "mhygvu"
}]]);
//#endregion
//#region resources/js/Pages/payments/components/RecordPaymentDialog.tsx
var import_react = /* @__PURE__ */ __toESM(require_react(), 1);
var import_jsx_runtime = require_jsx_runtime();
var methods = [
	{
		id: "cash",
		label: "Cash",
		icon: Banknote
	},
	{
		id: "easypaisa",
		label: "Easypaisa",
		icon: Smartphone
	},
	{
		id: "jazzcash",
		label: "JazzCash",
		icon: Wallet
	},
	{
		id: "card",
		label: "Card",
		icon: CreditCard
	},
	{
		id: "transfer",
		label: "Bank Transfer",
		icon: Building2
	}
];
function RecordPaymentDialog({ open, onClose, onSuccess, contacts: contactList }) {
	const { props } = usePage();
	const createdBy = (props.auth?.user ?? null)?.name || "System";
	const contacts = contactList?.length ? contactList : props.contacts || [];
	const searchRef = (0, import_react.useRef)(null);
	const [direction, setDirection] = (0, import_react.useState)("in");
	const [selectedMethod, setSelectedMethod] = (0, import_react.useState)(null);
	const [amount, setAmount] = (0, import_react.useState)("");
	const [reference, setReference] = (0, import_react.useState)("");
	const [note, setNote] = (0, import_react.useState)("");
	const [paymentDate, setPaymentDate] = (0, import_react.useState)((/* @__PURE__ */ new Date()).toISOString().split("T")[0]);
	const [processing, setProcessing] = (0, import_react.useState)(false);
	const [contactSearch, setContactSearch] = (0, import_react.useState)("");
	const [selectedContact, setSelectedContact] = (0, import_react.useState)(null);
	const [showContactDropdown, setShowContactDropdown] = (0, import_react.useState)(false);
	(0, import_react.useEffect)(() => {
		if (showContactDropdown) searchRef.current?.focus();
	}, [showContactDropdown]);
	const filteredContacts = (0, import_react.useMemo)(() => {
		if (!contactSearch.trim()) return contacts.slice(0, 10);
		const q = contactSearch.toLowerCase();
		return contacts.filter((c) => c.name.toLowerCase().includes(q) || c.phone.includes(q)).slice(0, 8);
	}, [contacts, contactSearch]);
	const amountValue = parseFloat(amount) || 0;
	const isValid = selectedContact && selectedMethod && amountValue > 0;
	const handleSubmit = () => {
		if (!isValid || !selectedContact || !selectedMethod) return;
		setProcessing(true);
		router3.post("/payments", {
			direction,
			contact_id: selectedContact.id,
			amount: amountValue,
			method: selectedMethod,
			reference: reference || `PMT-${Date.now().toString().slice(-6)}`,
			description: note || `${direction === "in" ? "Payment received from" : "Payment to"} ${selectedContact.name}`,
			date: paymentDate,
			created_by: createdBy
		}, {
			onSuccess: () => {
				toast.success(`${formatCurrency(amountValue)} recorded`);
				setProcessing(false);
				resetForm();
				onSuccess?.();
				onClose();
			},
			onError: (errs) => {
				toast.error(Object.values(errs)[0] || "Failed");
				setProcessing(false);
			}
		});
	};
	const resetForm = () => {
		setDirection("in");
		setSelectedContact(null);
		setContactSearch("");
		setSelectedMethod(null);
		setAmount("");
		setReference("");
		setNote("");
		setPaymentDate((/* @__PURE__ */ new Date()).toISOString().split("T")[0]);
		setShowContactDropdown(false);
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Dialog, {
		open,
		onOpenChange: (v) => {
			if (!v && !processing) {
				resetForm();
				onClose();
			}
		},
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogContent, {
			className: "sm:max-w-lg gap-0 p-0 rounded-2xl sm:rounded-xl",
			showCloseButton: true,
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "flex items-center justify-between px-5 pt-5 pb-0",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "text-lg font-semibold",
					children: "Record Payment"
				})
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "px-5 py-4 max-h-[75dvh] overflow-y-auto space-y-4",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "flex items-center gap-2 bg-muted rounded-xl p-1",
						children: ["Money In", "Money Out"].map((label, i) => {
							const val = i === 0 ? "in" : "out";
							return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								onClick: () => setDirection(val),
								className: cn("flex-1 px-4 py-2.5 rounded-lg text-sm font-medium transition-all", direction === val ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"),
								children: label
							}, val);
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "space-y-1.5",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
							className: "text-xs font-medium text-foreground",
							children: "Amount"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "relative",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-muted-foreground font-semibold",
								children: "Rs."
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								type: "number",
								value: amount,
								onChange: (e) => setAmount(e.target.value),
								className: "w-full h-12 sm:h-14 pl-10 pr-3 rounded-xl border border-input bg-background text-xl sm:text-2xl font-bold outline-none focus:border-ring transition-colors tabular-nums",
								min: "1",
								autoFocus: true
							})]
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "grid sm:grid-cols-2 gap-4",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "space-y-1.5",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
								className: "text-xs font-medium text-foreground",
								children: "Contact"
							}), selectedContact ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-center gap-2.5 px-3.5 py-2.5 sm:py-3 rounded-xl border border-emerald-200 bg-emerald-50/50 dark:bg-emerald-500/5 dark:border-emerald-800",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "size-9 rounded-full bg-emerald-100 dark:bg-emerald-500/20 flex items-center justify-center shrink-0",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Building2, { className: "size-4 text-emerald-600" })
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex-1 min-w-0",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "text-sm font-semibold truncate",
											children: selectedContact.name
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: cn("text-xs font-medium", selectedContact.current_balance > 0 ? "text-amber-600" : "text-emerald-600"),
											children: selectedContact.current_balance > 0 ? `Receivable ${formatCurrency(selectedContact.current_balance)}` : selectedContact.current_balance < 0 ? `Payable ${formatCurrency(Math.abs(selectedContact.current_balance))}` : "Settled"
										})]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
										onClick: () => {
											setSelectedContact(null);
											setContactSearch("");
										},
										className: "flex items-center justify-center size-7 rounded-lg hover:bg-red-100 dark:hover:bg-red-950/30 text-muted-foreground hover:text-red-500 shrink-0",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "size-3.5 block leading-none",
											children: "×"
										})
									})
								]
							}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "relative",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: cn("flex items-center gap-2 px-3.5 h-12 sm:h-10 rounded-xl border transition-colors cursor-pointer", showContactDropdown ? "border-ring ring-1 ring-ring/20" : "border-input hover:border-ring"),
									onClick: () => setShowContactDropdown(!showContactDropdown),
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Search, { className: "size-4 text-muted-foreground shrink-0" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
										ref: searchRef,
										type: "text",
										placeholder: "Search contact...",
										value: contactSearch,
										onChange: (e) => {
											setContactSearch(e.target.value);
											setShowContactDropdown(true);
										},
										onFocus: () => setShowContactDropdown(true),
										className: "flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
									})]
								}), showContactDropdown && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "mt-1 rounded-xl border border-border bg-popover shadow-lg overflow-hidden absolute left-0 right-0 z-50",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "max-h-56 overflow-y-auto divide-y divide-border",
										children: filteredContacts.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
											className: "px-4 py-6 text-xs text-muted-foreground text-center",
											children: "No contacts found"
										}) : filteredContacts.map((c) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
											type: "button",
											onClick: () => {
												setSelectedContact(c);
												setContactSearch("");
												setShowContactDropdown(false);
											},
											className: "flex items-center gap-3 w-full px-3.5 py-3 text-left hover:bg-muted/50 transition-colors",
											children: [
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
													className: "size-9 rounded-full bg-muted flex items-center justify-center shrink-0",
													children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Building2, { className: "size-4 text-muted-foreground" })
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
													className: "flex-1 min-w-0",
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
														className: "text-sm font-medium text-foreground truncate",
														children: c.name
													}), c.phone && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
														className: "text-xs text-muted-foreground",
														children: c.phone
													})]
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
													className: cn("text-xs font-medium shrink-0", c.current_balance > 0 ? "text-amber-600" : c.current_balance < 0 ? "text-red-500" : "text-muted-foreground"),
													children: c.current_balance > 0 ? `+${formatCurrency(c.current_balance)}` : c.current_balance < 0 ? `-${formatCurrency(Math.abs(c.current_balance))}` : "—"
												})
											]
										}, c.id))
									})
								})]
							})]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "space-y-1.5",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
								className: "text-xs font-medium text-foreground",
								children: "Method"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "flex flex-wrap gap-2",
								children: methods.map((m) => {
									const Icon = m.icon;
									const isSel = selectedMethod === m.id;
									return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
										onClick: () => setSelectedMethod(m.id),
										className: cn("flex items-center gap-2 px-3.5 py-2.5 sm:py-2 rounded-xl border-2 transition-all", isSel ? "border-primary bg-primary/5 ring-1 ring-primary/20" : "border-border hover:border-muted-foreground/30"),
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, { className: cn("size-4", isSel ? "text-primary" : "text-muted-foreground") }),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: cn("text-xs sm:text-sm font-medium", isSel ? "text-foreground" : "text-muted-foreground"),
												children: m.label
											}),
											isSel && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Check, { className: "size-3.5 text-primary" })
										]
									}, m.id);
								})
							})]
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "grid sm:grid-cols-2 gap-4",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "space-y-1.5",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
								className: "text-xs font-medium text-foreground",
								children: "Reference"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								type: "text",
								value: reference,
								onChange: (e) => setReference(e.target.value),
								placeholder: "e.g. INV-001",
								className: "w-full h-12 sm:h-10 px-3.5 rounded-xl border border-input bg-background text-sm outline-none focus:border-ring transition-colors"
							})]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "space-y-1.5",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
								className: "text-xs font-medium text-foreground",
								children: "Date"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								type: "date",
								value: paymentDate,
								onChange: (e) => setPaymentDate(e.target.value),
								className: "w-full h-12 sm:h-10 px-3.5 rounded-xl border border-input bg-background text-sm outline-none focus:border-ring transition-colors"
							})]
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "space-y-1.5",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
							className: "text-xs font-medium text-foreground",
							children: ["Note ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-muted-foreground font-normal",
								children: "(optional)"
							})]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("textarea", {
							value: note,
							onChange: (e) => setNote(e.target.value),
							placeholder: "Payment for...",
							rows: 2,
							className: "w-full rounded-xl border border-input bg-background px-3.5 py-2.5 text-sm outline-none focus:border-ring transition-colors resize-none"
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						size: "lg",
						className: "w-full h-12 sm:h-11 gap-2 text-base sm:text-sm shadow-sm rounded-xl",
						disabled: !isValid || processing,
						onClick: handleSubmit,
						children: processing ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: "flex items-center gap-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "size-4 rounded-full border-2 border-white/30 border-t-white animate-spin" }), "Processing..."]
						}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Receipt, { className: "size-4" }), direction === "in" ? "Record Payment" : "Record Payout"] })
					})
				]
			})]
		})
	});
}
//#endregion
export { RecordPaymentDialog as default, Smartphone as t };
