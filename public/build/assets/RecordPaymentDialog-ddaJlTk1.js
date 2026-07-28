import { i as __toESM, t as require_react } from "./react-DCO0ASPG.js";
import { t as createLucideIcon } from "./createLucideIcon--nD-f_FR.js";
import { t as Banknote } from "./banknote-B76zKt2w.js";
import { t as Building2 } from "./building-2-DGTQudO_.js";
import { t as cn } from "./utils-Bim8RyS4.js";
import { t as require_jsx_runtime } from "./jsx-runtime-BjJQA5sn.js";
import { t as Button } from "./button-phKcTdak.js";
import { a as DialogTitle, i as DialogHeader, n as DialogContent, t as Dialog } from "./dialog-DIpOEEmk.js";
import { a as getCurrentUserName, at as formatCurrency, bt as CreditCard, f as addTransaction, g as mockContacts, gt as Receipt, lt as Wallet, wt as toast } from "./app-DfjygdMU.js";
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
function RecordPaymentDialog({ open, onClose, contact: presetContact, direction: presetDirection, linkedSaleId, maxAmount, onSuccess }) {
	const [direction, setDirection] = (0, import_react.useState)(presetDirection || "in");
	const [contactSearch, setContactSearch] = (0, import_react.useState)("");
	const [selectedContact, setSelectedContact] = (0, import_react.useState)(presetContact || null);
	const [selectedMethod, setSelectedMethod] = (0, import_react.useState)(null);
	const [amount, setAmount] = (0, import_react.useState)(maxAmount ? maxAmount.toString() : "");
	const [reference, setReference] = (0, import_react.useState)("");
	const [note, setNote] = (0, import_react.useState)("");
	const [paymentDate, setPaymentDate] = (0, import_react.useState)((/* @__PURE__ */ new Date()).toISOString().split("T")[0]);
	const [processing, setProcessing] = (0, import_react.useState)(false);
	const amountValue = parseFloat(amount) || 0;
	const isValid = selectedContact && selectedMethod && amountValue > 0;
	const searchResults = contactSearch.trim() ? mockContacts.filter((c) => c.name.toLowerCase().includes(contactSearch.toLowerCase()) || c.phone.includes(contactSearch)).slice(0, 8) : [];
	const handleSubmit = () => {
		if (!isValid || !selectedContact || !selectedMethod) return;
		const finalAmount = maxAmount ? Math.min(amountValue, maxAmount) : amountValue;
		setProcessing(true);
		setTimeout(() => {
			addTransaction({
				contactId: selectedContact.id,
				direction,
				type: direction === "in" ? "collection" : "refund",
				date: paymentDate,
				amount: finalAmount,
				method: selectedMethod,
				description: note || `Payment ${direction === "in" ? "received" : "sent"}`,
				linkedSaleId,
				createdBy: getCurrentUserName()
			});
			toast.success(`${direction === "in" ? "Payment received" : "Payment sent"} — ${formatCurrency(finalAmount)}`);
			setProcessing(false);
			onSuccess?.();
			onClose();
		}, 400);
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Dialog, {
		open,
		onOpenChange: (v) => {
			if (!v && !processing) onClose();
		},
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogContent, {
			className: "sm:max-w-sm gap-0 p-0",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogHeader, {
				className: "p-5 pb-0",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "flex items-center justify-between",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTitle, {
						className: "text-base",
						children: "Record Payment"
					})
				})
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "p-5 space-y-4",
				children: [
					!presetDirection && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center gap-2 bg-muted rounded-lg p-0.5",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							onClick: () => setDirection("in"),
							className: cn("flex-1 px-3 py-1.5 rounded-md text-xs font-medium transition-colors", direction === "in" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"),
							children: "Money In"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							onClick: () => setDirection("out"),
							className: cn("flex-1 px-3 py-1.5 rounded-md text-xs font-medium transition-colors", direction === "out" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"),
							children: "Money Out"
						})]
					}),
					presetContact ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "rounded-xl bg-muted/30 p-3 space-y-1",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "text-xs text-muted-foreground",
							children: "Party"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "text-sm font-medium",
							children: presetContact.name
						})]
					}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "space-y-1.5",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
								className: "text-xs font-medium text-foreground",
								children: "Party"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								type: "text",
								placeholder: "Search contact...",
								value: contactSearch,
								onChange: (e) => {
									setContactSearch(e.target.value);
									setSelectedContact(null);
								},
								className: "w-full h-10 px-3 rounded-lg border border-input bg-background text-sm outline-none focus:border-ring focus:ring-1 focus:ring-ring/30"
							}),
							contactSearch && searchResults.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "rounded-lg border border-border bg-popover shadow-sm max-h-48 overflow-y-auto",
								children: searchResults.map((c) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
									onClick: () => {
										setSelectedContact(c);
										setContactSearch(c.name);
									},
									className: "flex items-center justify-between w-full px-3 py-2 text-sm hover:bg-muted text-left",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "font-medium",
										children: c.name
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "text-xs text-muted-foreground",
										children: c.phone
									})]
								}, c.id))
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "space-y-1.5",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
								className: "text-xs font-medium text-foreground",
								children: "Amount (Rs.)"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								type: "number",
								value: amount,
								onChange: (e) => setAmount(e.target.value),
								className: "w-full h-10 px-3 rounded-lg border border-input bg-background text-sm outline-none focus:border-ring focus:ring-1 focus:ring-ring/30",
								min: "1",
								autoFocus: true
							}),
							maxAmount && amountValue > maxAmount && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
								className: "text-[11px] text-amber-600",
								children: ["Max ", formatCurrency(maxAmount)]
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "space-y-1.5",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
							className: "text-xs font-medium text-foreground",
							children: "Payment Method"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "grid grid-cols-5 gap-2",
							children: methods.map((m) => {
								const Icon = m.icon;
								const isSel = selectedMethod === m.id;
								return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
									onClick: () => setSelectedMethod(m.id),
									className: cn("flex flex-col items-center gap-1 p-2.5 rounded-xl border-2 transition-all", isSel ? "border-primary bg-primary/5 ring-1 ring-primary/20" : "border-border hover:border-muted-foreground/30"),
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, { className: cn("size-4", isSel ? "text-primary" : "text-muted-foreground") }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "text-[9px] font-medium leading-tight text-center",
										children: m.label
									})]
								}, m.id);
							})
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "space-y-1.5",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
							className: "text-xs font-medium text-foreground",
							children: "Reference (optional)"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							type: "text",
							value: reference,
							onChange: (e) => setReference(e.target.value),
							placeholder: "e.g. INV-001 or CHQ-123",
							className: "w-full h-10 px-3 rounded-lg border border-input bg-background text-sm outline-none focus:border-ring focus:ring-1 focus:ring-ring/30"
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "space-y-1.5",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
							className: "text-xs font-medium text-foreground",
							children: "Note (optional)"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							type: "text",
							value: note,
							onChange: (e) => setNote(e.target.value),
							placeholder: "Internal note...",
							className: "w-full h-10 px-3 rounded-lg border border-input bg-background text-sm outline-none focus:border-ring focus:ring-1 focus:ring-ring/30"
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "space-y-1.5",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
							className: "text-xs font-medium text-foreground",
							children: "Date"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							type: "date",
							value: paymentDate,
							onChange: (e) => setPaymentDate(e.target.value),
							className: "w-full h-10 px-3 rounded-lg border border-input bg-background text-sm outline-none focus:border-ring focus:ring-1 focus:ring-ring/30"
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						size: "lg",
						className: "w-full h-11 gap-1.5 shadow-sm",
						disabled: !isValid || processing,
						onClick: handleSubmit,
						children: processing ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: "flex items-center gap-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "size-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin" }), "Processing..."]
						}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Receipt, { className: "size-4" }), direction === "in" ? "Record Payment" : "Record Payout"] })
					})
				]
			})]
		})
	});
}
//#endregion
export { RecordPaymentDialog as default, Smartphone as t };
