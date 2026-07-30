import { i as __toESM, t as require_react } from "./react-DCO0ASPG.js";
import { t as createLucideIcon } from "./createLucideIcon--nD-f_FR.js";
import { t as CircleCheck } from "./circle-check-DoVrqruV.js";
import { t as RotateCcw } from "./rotate-ccw-DB3zy8KA.js";
import { n as generatedPOSCustomers } from "./generator-B2FA13cc.js";
import { t as cn } from "./utils-Bim8RyS4.js";
import { t as require_jsx_runtime } from "./jsx-runtime-BjJQA5sn.js";
import { t as Button } from "./button-phKcTdak.js";
import { a as DialogTitle, i as DialogHeader, n as DialogContent, t as Dialog } from "./dialog-C6yKUL3Q.js";
import { E as mockProducts, F as getPaymentDisplayState, gt as Plus, lt as Trash2, mt as Search, ot as X, rt as formatCurrency } from "./app-DRCb4nuk.js";
/**
* @license lucide-react v1.26.0 - ISC
*
* This source code is licensed under the ISC license.
* See the LICENSE file in the root directory of this source tree.
*/
var Pause = createLucideIcon("pause", [["rect", {
	x: "14",
	y: "3",
	width: "5",
	height: "18",
	rx: "1",
	key: "kaeet6"
}], ["rect", {
	x: "5",
	y: "3",
	width: "5",
	height: "18",
	rx: "1",
	key: "1wsw3u"
}]]);
//#endregion
//#region resources/js/data/pos.ts
var posCustomers = generatedPOSCustomers;
var COLORS = [
	"from-sky-500/20 to-sky-600/10",
	"from-violet-500/20 to-violet-600/10",
	"from-emerald-500/20 to-emerald-600/10",
	"from-amber-500/20 to-amber-600/10",
	"from-rose-500/20 to-rose-600/10",
	"from-cyan-500/20 to-cyan-600/10",
	"from-orange-500/20 to-orange-600/10",
	"from-pink-500/20 to-pink-600/10"
];
var posProducts = mockProducts.filter((p) => p.status !== "out-of-stock").map((p, i) => ({
	...p,
	_color: COLORS[i % COLORS.length]
}));
function filterPOSProducts(search, category) {
	let result = posProducts;
	if (search) {
		const q = search.toLowerCase();
		result = result.filter((p) => p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q) || p.barcode.includes(q));
	}
	if (category !== "all") result = result.filter((p) => p.category === category);
	return result;
}
//#endregion
//#region resources/js/features/transactions/search/SearchBar.tsx
var import_react = /* @__PURE__ */ __toESM(require_react(), 1);
var import_jsx_runtime = require_jsx_runtime();
function TransactionSearchBar({ search, onSearchChange, showResults, onShowResultsChange, results, onAddProduct, placeholder = "Search product by name or SKU..." }) {
	const inputRef = (0, import_react.useRef)(null);
	const [highlighted, setHighlighted] = (0, import_react.useState)(0);
	const handleKeyDown = (e) => {
		if (!showResults || results.length === 0) return;
		if (e.key === "ArrowDown") {
			e.preventDefault();
			setHighlighted((prev) => (prev + 1) % results.length);
			return;
		}
		if (e.key === "ArrowUp") {
			e.preventDefault();
			setHighlighted((prev) => (prev - 1 + results.length) % results.length);
			return;
		}
		if (e.key === "Enter") {
			e.preventDefault();
			if (results[highlighted]) {
				onAddProduct(results[highlighted]);
				setHighlighted(0);
			}
			return;
		}
		if (e.key === "Escape") {
			onSearchChange("");
			onShowResultsChange(false);
			setHighlighted(0);
		}
	};
	const handleChange = (value) => {
		onSearchChange(value);
		onShowResultsChange(!!value.trim());
		setHighlighted(0);
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "px-5 py-3 bg-card shrink-0 relative",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "relative",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Search, { className: "absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
					ref: inputRef,
					type: "text",
					value: search,
					onChange: (e) => handleChange(e.target.value),
					onFocus: () => {
						if (search.trim()) onShowResultsChange(true);
					},
					onBlur: () => {
						setTimeout(() => onShowResultsChange(false), 150);
					},
					onKeyDown: handleKeyDown,
					placeholder,
					className: "w-full h-10 pl-10 pr-4 rounded-lg border border-input bg-background text-sm outline-none focus:border-ring transition-colors"
				}),
				search && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					onClick: () => {
						onSearchChange("");
						onShowResultsChange(false);
						setHighlighted(0);
						inputRef.current?.focus();
					},
					className: "absolute right-2 top-1/2 -translate-y-1/2 flex items-center justify-center size-6 rounded-md hover:bg-muted text-muted-foreground",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { className: "size-3.5" })
				})
			]
		}), showResults && results.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "absolute left-5 right-5 top-full mt-1 z-50 rounded-xl border border-border bg-popover shadow-lg overflow-hidden",
			children: results.map((product, idx) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
				onMouseDown: (e) => {
					e.preventDefault();
					onAddProduct(product);
					setHighlighted(0);
				},
				onMouseEnter: () => setHighlighted(idx),
				className: cn("flex items-center gap-3 w-full px-3 py-2.5 text-left transition-colors", idx === highlighted ? "bg-muted" : "hover:bg-muted/50"),
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "flex items-center justify-center size-8 rounded-lg bg-muted text-muted-foreground shrink-0",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, { className: "size-4" })
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex-1 min-w-0",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "text-sm font-medium text-foreground truncate",
							children: product.name
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "text-[11px] text-muted-foreground",
							children: [product.sku, product.sellingUnits?.[0] && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
								" ",
								"· ",
								product.sellingUnits[0].name,
								" ·",
								" ",
								formatCurrency(product.sellingUnits[0].salePrice ?? 0)
							] })]
						})]
					}),
					idx === highlighted && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("kbd", {
						className: "hidden sm:inline-flex items-center px-1 py-0.5 text-[9px] text-muted-foreground bg-muted rounded font-sans",
						children: "⏎"
					})
				]
			}, product.id))
		})]
	});
}
//#endregion
//#region resources/js/features/transactions/payment/PaymentPanel.tsx
var DEFAULT_METHODS = [
	{
		id: "cash",
		label: "Cash",
		color: "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20"
	},
	{
		id: "card",
		label: "Card",
		color: "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20"
	},
	{
		id: "transfer",
		label: "Transfer",
		color: "bg-purple-50 text-purple-700 border-purple-200 hover:bg-purple-100 dark:bg-purple-500/10 dark:text-purple-400 dark:border-purple-500/20"
	},
	{
		id: "easypaisa",
		label: "Easypaisa",
		color: "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20"
	},
	{
		id: "jazzcash",
		label: "JazzCash",
		color: "bg-red-50 text-red-700 border-red-200 hover:bg-red-100 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20"
	}
];
function PaymentPanel({ paymentMethod, onMethodChange, amountPaid, onAmountChange, grandTotal, methods = DEFAULT_METHODS, cartEmpty, onHold, onClear, onRecord, holdLabel = "Hold", recordLabel = "Record Sale", showHold = true, onQuickPay }) {
	const displayState = getPaymentDisplayState(parseFloat(amountPaid) || 0, grandTotal);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "border-t border-border bg-card px-5 py-3 shrink-0",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex flex-col sm:flex-row sm:items-center gap-3",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "flex items-center gap-1.5",
					children: methods.map((m) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						onClick: () => onMethodChange(m.id),
						className: cn("px-3 py-1.5 rounded-lg text-xs font-medium border transition-all capitalize", paymentMethod === m.id ? `${m.color} shadow-sm` : "border-transparent text-muted-foreground hover:bg-muted hover:text-foreground"),
						children: m.label
					}, m.id))
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center gap-2",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-xs text-muted-foreground whitespace-nowrap",
							children: "Amount:"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center gap-1",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-xs text-muted-foreground",
								children: "Rs."
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								type: "number",
								value: amountPaid,
								onChange: (e) => onAmountChange(e.target.value),
								placeholder: String(grandTotal),
								className: "w-24 h-8 px-2 rounded-md border border-input bg-background text-sm font-semibold text-right outline-none focus:border-ring tabular-nums",
								min: "0"
							})]
						}),
						displayState.type === "change" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: "text-sm font-semibold text-emerald-600 dark:text-emerald-400 tabular-nums ml-2",
							children: ["Change: ", formatCurrency(displayState.amount)]
						}),
						displayState.type === "outstanding" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: "text-[11px] text-amber-600 dark:text-amber-400 ml-2 whitespace-nowrap",
							children: [formatCurrency(displayState.amount), " outstanding"]
						})
					]
				}),
				onQuickPay && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center gap-1",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							onClick: () => onQuickPay("full"),
							className: cn("px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors border", amountPaid === String(grandTotal) ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20" : "text-muted-foreground hover:text-foreground hover:bg-muted border-transparent"),
							children: "Full"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							onClick: () => onQuickPay("half"),
							className: cn("px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors border", amountPaid === String(Math.ceil(grandTotal / 2)) ? "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20" : "text-muted-foreground hover:text-foreground hover:bg-muted border-transparent"),
							children: "Half"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							onClick: () => onQuickPay("none"),
							className: cn("px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors border", amountPaid === "0" ? "bg-red-50 text-red-700 border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20" : "text-muted-foreground hover:text-foreground hover:bg-muted border-transparent"),
							children: "None"
						})
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center gap-2 sm:ml-auto",
					children: [
						showHold && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
							variant: "outline",
							size: "sm",
							className: "gap-1.5 h-9",
							disabled: cartEmpty,
							onClick: onHold,
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pause, { className: "size-3.5" }),
								" ",
								holdLabel
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
							variant: "outline",
							size: "sm",
							className: "gap-1.5 h-9",
							onClick: onClear,
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(RotateCcw, { className: "size-3.5" }), " Clear"]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
							size: "sm",
							className: "gap-1.5 h-9 shadow-sm",
							disabled: cartEmpty,
							onClick: onRecord,
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CircleCheck, { className: "size-3.5" }),
								" ",
								recordLabel,
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("kbd", {
									className: "hidden sm:inline-flex items-center ml-1.5 px-1 py-0 text-[9px] bg-primary-foreground/20 rounded",
									children: "⌘⏎"
								})
							]
						})
					]
				})
			]
		})
	});
}
//#endregion
//#region resources/js/features/transactions/dialogs/ClearConfirmDialog.tsx
function ConfirmClearDialog({ open, onOpenChange, itemCount, onConfirm }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Dialog, {
		open,
		onOpenChange,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogContent, {
			className: "sm:max-w-sm gap-0 p-0",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogHeader, {
				className: "p-5 pb-0",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTitle, {
					className: "text-base",
					children: "Clear Cart?"
				})
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "p-5 space-y-4",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "text-sm text-muted-foreground",
					children: [
						"Remove all ",
						itemCount,
						" item",
						itemCount > 1 ? "s" : "",
						"? This cannot be undone."
					]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						variant: "outline",
						className: "flex-1 h-10",
						onClick: () => onOpenChange(false),
						children: "Cancel"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
						variant: "destructive",
						className: "flex-1 h-10 gap-1.5",
						onClick: onConfirm,
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash2, { className: "size-4" }), " Clear All"]
					})]
				})]
			})]
		})
	});
}
//#endregion
export { posCustomers as a, filterPOSProducts as i, PaymentPanel as n, posProducts as o, TransactionSearchBar as r, ConfirmClearDialog as t };
