import { i as __toESM, t as require_react } from "./react-DCO0ASPG.js";
import { t as ArrowLeft } from "./arrow-left-CE4TWQlw.js";
import { t as ChevronUp } from "./chevron-up-BF5n-Dc8.js";
import { t as CircleCheck } from "./circle-check-DoVrqruV.js";
import { t as RotateCcw } from "./rotate-ccw-DB3zy8KA.js";
import { t as cn } from "./utils-Bim8RyS4.js";
import { t as require_jsx_runtime } from "./jsx-runtime-BjJQA5sn.js";
import { t as Button } from "./button-phKcTdak.js";
import { a as DialogTitle, i as DialogHeader, n as DialogContent, t as Dialog } from "./dialog-CsGPEqqr.js";
import { C as purchaseBills, Dt as router3, St as ChevronDown, Tt as toast, _t as Package, a as getCurrentUserName, k as allSales, mt as Search, ot as X, rt as formatCurrency } from "./app-CwPUaRAl.js";
import { t as Badge } from "./badge-BfSUOZdI.js";
import { t as ConfirmTransactionDialog } from "./ConfirmDialog-CtMET35V.js";
import { t as useTransactionRecorder } from "./useTransactionRecorder-BJxKNWIm.js";
//#region resources/js/Pages/returns/ReturnPage.tsx
var import_react = /* @__PURE__ */ __toESM(require_react(), 1);
var import_jsx_runtime = require_jsx_runtime();
var RETURN_REASONS = [
	{
		value: "defective",
		label: "Defective"
	},
	{
		value: "wrong_item",
		label: "Wrong Item"
	},
	{
		value: "changed_mind",
		label: "Changed Mind"
	},
	{
		value: "expired",
		label: "Expired"
	},
	{
		value: "damaged",
		label: "Damaged"
	},
	{
		value: "quality",
		label: "Quality Issue"
	},
	{
		value: "other",
		label: "Other"
	}
];
var CONDITIONS = [
	{
		value: "resellable",
		label: "Resellable"
	},
	{
		value: "damaged",
		label: "Damaged"
	},
	{
		value: "expired",
		label: "Expired"
	}
];
function ReturnPage({ strategy, backPath, title, isPurchase }) {
	const { record } = useTransactionRecorder();
	const [searchRef, setSearchRef] = (0, import_react.useState)(() => {
		if (typeof window !== "undefined") return new URLSearchParams(window.location.search).get("ref") || "";
		return "";
	});
	const [originalTx, setOriginalTx] = (0, import_react.useState)(null);
	const [returnItems, setReturnItems] = (0, import_react.useState)([]);
	const [refundMethod, setRefundMethod] = (0, import_react.useState)("cash");
	const [showConfirm, setShowConfirm] = (0, import_react.useState)(false);
	const [showReceipt, setShowReceipt] = (0, import_react.useState)(false);
	const [receiptRef, setReceiptRef] = (0, import_react.useState)("");
	const [loaded, setLoaded] = (0, import_react.useState)(false);
	const [highlighted, setHighlighted] = (0, import_react.useState)(0);
	const [mobileOpenItems, setMobileOpenItems] = (0, import_react.useState)(/* @__PURE__ */ new Set());
	const toggleMobileOpen = (idx) => {
		setMobileOpenItems((prev) => {
			const next = new Set(prev);
			if (next.has(idx)) next.delete(idx);
			else next.add(idx);
			return next;
		});
	};
	const transactions = (0, import_react.useMemo)(() => {
		return (isPurchase ? purchaseBills.map((b) => ({
			id: b.id,
			ref: b.invoiceRef,
			date: b.date,
			party: b.supplierName,
			total: b.totalAmount,
			items: b.items.length,
			itemsList: b.items
		})) : allSales.map((s) => ({
			id: s.id,
			ref: s.invoiceNumber,
			date: s.date,
			party: s.customerName || "Walk-in Customer",
			total: s.grandTotal,
			items: s.items.length,
			itemsList: s.items
		}))).sort((a, b) => b.date.localeCompare(a.date));
	}, [isPurchase]);
	const filteredTx = (0, import_react.useMemo)(() => {
		const q = searchRef.toLowerCase().trim();
		if (!q) return transactions.slice(0, 15);
		return transactions.filter((tx) => tx.ref.toLowerCase().includes(q) || tx.party.toLowerCase().includes(q) || String(tx.total).includes(q) || tx.itemsList.some((item) => (item.productName || item.name || "").toLowerCase().includes(q))).slice(0, 15);
	}, [searchRef, transactions]);
	(0, import_react.useEffect)(() => {
		const ref = new URLSearchParams(window.location.search).get("ref");
		if (ref && !loaded) setSearchRef(ref);
	}, []);
	const selectTransaction = (0, import_react.useCallback)((tx) => {
		if (isPurchase) {
			const bill = purchaseBills.find((b) => b.id === tx.id);
			if (!bill) return;
			setOriginalTx(bill);
			setReturnItems(bill.items.map((item) => ({
				originalLineId: item.id,
				productId: item.productId,
				productName: item.productName,
				unitName: item.purchasePackName,
				originalQty: item.purchaseQuantity,
				originalPrice: item.unitCost,
				originalTotal: item.totalCost,
				maxReturnable: item.purchaseQuantity,
				returnQty: 0,
				selected: false,
				reason: "other",
				condition: "resellable",
				restock: false
			})));
		} else {
			const sale = allSales.find((s) => s.id === tx.id);
			if (!sale) return;
			setOriginalTx(sale);
			setReturnItems(sale.items.map((item) => ({
				originalLineId: item.id,
				productId: item.productId,
				productName: item.name,
				unitName: item.packagingName,
				originalQty: item.packagingQuantity,
				originalPrice: item.unitPrice,
				originalTotal: item.total,
				maxReturnable: item.packagingQuantity,
				returnQty: 0,
				selected: false,
				reason: "other",
				condition: "resellable",
				restock: true
			})));
		}
		setLoaded(true);
		setSearchRef("");
		setHighlighted(0);
	}, [isPurchase]);
	(0, import_react.useEffect)(() => {
		const ref = new URLSearchParams(window.location.search).get("ref");
		if (ref && !loaded) {
			const match = transactions.find((tx) => tx.ref === ref);
			if (match) selectTransaction(match);
		}
	}, [loaded]);
	const toggleItem = (idx) => {
		setReturnItems((prev) => prev.map((item, i) => i === idx ? {
			...item,
			selected: !item.selected,
			returnQty: !item.selected ? item.maxReturnable : 0
		} : item));
	};
	const setReturnQty = (idx, qty) => {
		setReturnItems((prev) => prev.map((item, i) => i === idx ? {
			...item,
			returnQty: Math.max(0, Math.min(qty, item.maxReturnable))
		} : item));
	};
	const setReason = (idx, reason) => {
		setReturnItems((prev) => prev.map((item, i) => i === idx ? {
			...item,
			reason,
			condition: reason === "defective" || reason === "damaged" ? "damaged" : item.condition
		} : item));
	};
	const setCondition = (idx, condition) => {
		setReturnItems((prev) => prev.map((item, i) => i === idx ? {
			...item,
			condition,
			restock: condition === "resellable"
		} : item));
	};
	const selectedItems = returnItems.filter((r) => r.selected && r.returnQty > 0);
	const refundTotal = selectedItems.reduce((sum, r) => sum + r.originalPrice * r.returnQty, 0);
	const handleProcessReturn = (0, import_react.useCallback)(() => {
		if (selectedItems.length === 0) return;
		const result = record({
			strategy,
			items: selectedItems.map((r) => ({
				id: `ret-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
				productId: r.productId,
				name: r.productName,
				sellingUnitId: r.productId,
				packagingName: r.unitName,
				packagingQuantity: r.returnQty,
				baseUnitQuantity: 1,
				baseQuantity: r.returnQty,
				unitPrice: r.originalPrice,
				total: r.originalPrice * r.returnQty,
				category: "",
				restock: r.restock
			})),
			partyId: originalTx && "supplierId" in originalTx ? originalTx.supplierId : originalTx && "customerName" in originalTx ? null : null,
			partyName: originalTx && "supplierName" in originalTx ? originalTx.supplierName : originalTx && "customerName" in originalTx ? originalTx.customerName ?? "" : "",
			discount: 0,
			discountPct: 0,
			paymentMethod: refundMethod,
			amountPaid: String(refundTotal),
			subtotal: refundTotal,
			grandTotal: refundTotal,
			date: (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
			createdBy: getCurrentUserName()
		});
		setReceiptRef(result.receipt.invoiceNumber);
		setShowReceipt(true);
		toast.success(`${title} recorded: ${result.receipt.invoiceNumber}`);
	}, [
		selectedItems,
		strategy,
		originalTx,
		refundTotal,
		refundMethod,
		record,
		title
	]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "h-full flex flex-col overflow-hidden",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "px-5 py-3 border-b border-border bg-card shrink-0",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "flex items-center justify-between",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center gap-3",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							onClick: () => backPath ? router3.visit(backPath) : window.history.back(),
							className: "flex items-center justify-center size-10 rounded-lg hover:bg-muted transition-colors active:scale-95",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowLeft, { className: "size-5 text-muted-foreground" })
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
							className: "text-lg font-bold text-foreground leading-tight",
							children: title
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "text-[11px] text-muted-foreground",
							children: [
								(/* @__PURE__ */ new Date()).toLocaleDateString("en-PK", {
									weekday: "short",
									day: "numeric",
									month: "short",
									year: "numeric"
								}),
								" · ",
								(/* @__PURE__ */ new Date()).toLocaleTimeString("en-PK", {
									hour: "2-digit",
									minute: "2-digit"
								})
							]
						})] })]
					})
				})
			}),
			!loaded && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex-1 overflow-y-auto",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "px-5 py-3 bg-card shrink-0 sticky top-0 z-10 border-b border-border",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "relative",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Search, { className: "absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								type: "text",
								value: searchRef,
								onChange: (e) => {
									setSearchRef(e.target.value);
									setHighlighted(0);
								},
								onKeyDown: (e) => {
									if (e.key === "ArrowDown") {
										e.preventDefault();
										setHighlighted((prev) => Math.min(prev + 1, filteredTx.length - 1));
									} else if (e.key === "ArrowUp") {
										e.preventDefault();
										setHighlighted((prev) => Math.max(prev - 1, 0));
									} else if (e.key === "Enter") {
										e.preventDefault();
										if (filteredTx[highlighted]) selectTransaction(filteredTx[highlighted]);
									}
								},
								placeholder: `Search ${isPurchase ? "purchase" : "sale"} invoice by number, ${isPurchase ? "supplier" : "customer"}, product, or amount...`,
								className: "w-full h-10 pl-10 pr-4 rounded-lg border border-input bg-background text-sm outline-none focus:border-ring",
								autoFocus: true
							}),
							searchRef && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								onClick: () => {
									setSearchRef("");
									setHighlighted(0);
								},
								className: "absolute right-2 top-1/2 -translate-y-1/2 flex items-center justify-center size-6 rounded-md hover:bg-muted text-muted-foreground",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { className: "size-3.5" })
							})
						]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-[10px] text-muted-foreground mt-1.5",
						children: searchRef ? `${filteredTx.length} match${filteredTx.length !== 1 ? "es" : ""}` : `Recent ${isPurchase ? "purchases" : "sales"} — select one to return`
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "divide-y divide-border",
					children: filteredTx.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "text-center py-16 text-sm text-muted-foreground",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Package, { className: "size-10 text-muted-foreground/20 mx-auto mb-3" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", { children: [
							"No ",
							isPurchase ? "purchase" : "sale",
							" invoices found"
						] })]
					}) : filteredTx.map((tx, idx) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						onClick: () => selectTransaction(tx),
						className: cn("w-full flex items-center gap-3 px-5 py-3 text-left transition-colors", idx === highlighted ? "bg-muted" : "hover:bg-muted/50"),
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "flex items-center justify-center size-9 rounded-lg bg-muted shrink-0",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Package, { className: "size-4 text-muted-foreground" })
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex-1 min-w-0",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex items-center gap-2",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "text-sm font-semibold text-foreground",
										children: tx.ref
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "text-[10px] text-muted-foreground",
										children: tx.date
									})]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "text-xs text-muted-foreground mt-0.5",
									children: [
										tx.party,
										" · ",
										tx.items,
										" item",
										tx.items !== 1 ? "s" : "",
										" · ",
										formatCurrency(tx.total)
									]
								})]
							}),
							idx === highlighted && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("kbd", {
								className: "hidden sm:inline-flex items-center px-1 py-0.5 text-[9px] text-muted-foreground bg-muted rounded font-sans",
								children: "⏎"
							})
						]
					}, tx.id))
				})]
			}),
			loaded && originalTx && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex-1 overflow-y-auto px-5 py-4 space-y-4",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex flex-wrap items-center gap-x-3 gap-y-1 text-sm",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
								variant: "outline",
								className: "text-xs shrink-0",
								children: isPurchase ? originalTx.invoiceRef : originalTx.invoiceNumber
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-muted-foreground text-xs sm:text-sm truncate max-w-[180px] sm:max-w-none",
								children: isPurchase ? originalTx.supplierName : originalTx.customerName || "Walk-in Customer"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-muted-foreground text-xs sm:text-sm",
								children: isPurchase ? originalTx.date : originalTx.date
							})
						]
					}),
					returnItems.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "text-center py-12 text-sm text-muted-foreground",
						children: "No items in this invoice."
					}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "hidden md:block rounded-xl border border-border overflow-hidden",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
							className: "w-full",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
								className: "border-b border-border bg-muted/30",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Th, {
										className: "w-10",
										children: "#"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Th, { children: "Item" }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Th, {
										className: "w-20 text-center",
										children: "Orig Qty"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Th, {
										className: "w-20 text-center",
										children: "Return"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Th, {
										className: "w-32",
										children: "Reason"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Th, {
										className: "w-28",
										children: "Condition"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Th, {
										className: "w-24 text-right",
										children: "Refund"
									})
								]
							}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tbody", { children: returnItems.map((item, idx) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
								className: cn("border-b border-border", item.selected && "bg-primary/5"),
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Td, {
										className: "w-10 text-center",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
											type: "checkbox",
											checked: item.selected,
											onChange: () => toggleItem(idx),
											className: "size-4 rounded border-input"
										})
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Td, {
										className: "min-w-0",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
											className: "text-sm font-medium text-foreground truncate max-w-[200px]",
											children: item.productName
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "text-[10px] text-muted-foreground",
											children: [
												item.unitName,
												" · ",
												formatCurrency(item.originalPrice),
												" each"
											]
										})]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Td, {
										className: "w-20 text-center",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "text-sm tabular-nums text-muted-foreground",
											children: item.originalQty
										})
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Td, {
										className: "w-20 text-center",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
											type: "number",
											value: item.returnQty || "",
											onChange: (e) => setReturnQty(idx, parseInt(e.target.value) || 0),
											disabled: !item.selected,
											className: "w-16 h-7 px-1 rounded border border-input bg-background text-sm text-center outline-none focus:border-ring tabular-nums disabled:opacity-30",
											min: 0,
											max: item.maxReturnable
										})
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Td, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("select", {
										value: item.reason,
										onChange: (e) => setReason(idx, e.target.value),
										disabled: !item.selected,
										className: "w-full h-8 px-2 rounded-lg border border-input bg-background text-xs outline-none focus:border-ring focus:ring-1 focus:ring-ring/20 disabled:opacity-30 cursor-pointer disabled:cursor-default",
										children: RETURN_REASONS.map((r) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
											value: r.value,
											children: r.label
										}, r.value))
									}) }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Td, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("select", {
										value: item.condition,
										onChange: (e) => setCondition(idx, e.target.value),
										disabled: !item.selected,
										className: "w-full h-8 px-2 rounded-lg border border-input bg-background text-xs outline-none focus:border-ring focus:ring-1 focus:ring-ring/20 disabled:opacity-30 cursor-pointer disabled:cursor-default",
										children: CONDITIONS.map((c) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
											value: c.value,
											children: c.label
										}, c.value))
									}) }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Td, {
										className: "w-24 text-right",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: cn("text-sm font-semibold tabular-nums", item.selected && item.returnQty > 0 ? "text-foreground" : "text-muted-foreground"),
											children: item.selected && item.returnQty > 0 ? formatCurrency(item.originalPrice * item.returnQty) : "—"
										})
									})
								]
							}, item.originalLineId)) })]
						})
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "md:hidden space-y-2",
						children: returnItems.map((item, idx) => {
							const isOpen = mobileOpenItems.has(idx);
							return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: cn("rounded-xl border border-border overflow-hidden transition-colors", item.selected && "border-primary/30 bg-primary/[0.02]"),
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex items-center gap-3 p-3",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
											type: "checkbox",
											checked: item.selected,
											onChange: () => toggleItem(idx),
											className: "size-4 rounded border-input shrink-0"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "flex-1 min-w-0",
											onClick: () => item.selected && toggleMobileOpen(idx),
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "flex items-center justify-between gap-2",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
													className: "text-sm font-medium text-foreground truncate",
													children: item.productName
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
													className: "text-xs font-semibold tabular-nums shrink-0",
													children: item.selected && item.returnQty > 0 ? formatCurrency(item.originalPrice * item.returnQty) : "—"
												})]
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "flex items-center gap-2 text-[11px] text-muted-foreground mt-0.5",
												children: [
													/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [
														item.unitName,
														" · Rs.",
														item.originalPrice
													] }),
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "·" }),
													/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: ["Orig: ", item.originalQty] }),
													item.selected && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "·" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
														className: "text-primary font-medium",
														children: ["Return: ", item.returnQty]
													})] })
												]
											})]
										}),
										item.selected && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
											onClick: () => toggleMobileOpen(idx),
											className: "flex items-center justify-center size-6 rounded-md hover:bg-muted text-muted-foreground shrink-0",
											children: isOpen ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronUp, { className: "size-4" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronDown, { className: "size-4" })
										})
									]
								}), isOpen && item.selected && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "px-3 pb-3 pt-1 border-t border-border space-y-2.5",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex items-center gap-3",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "flex-1",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
												className: "text-[10px] text-muted-foreground font-medium uppercase tracking-wider mb-1 block",
												children: "Return Qty"
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
												type: "number",
												value: item.returnQty || "",
												onChange: (e) => setReturnQty(idx, parseInt(e.target.value) || 0),
												className: "w-full h-9 px-3 rounded-lg border border-input bg-background text-sm outline-none focus:border-ring tabular-nums",
												min: 0,
												max: item.maxReturnable
											})]
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "flex-1",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
												className: "text-[10px] text-muted-foreground font-medium uppercase tracking-wider mb-1 block",
												children: "Reason"
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("select", {
												value: item.reason,
												onChange: (e) => setReason(idx, e.target.value),
												className: "w-full h-9 px-2 rounded-lg border border-input bg-background text-xs outline-none focus:border-ring",
												children: RETURN_REASONS.map((r) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
													value: r.value,
													children: r.label
												}, r.value))
											})]
										})]
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex items-center gap-3",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "flex-1",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
												className: "text-[10px] text-muted-foreground font-medium uppercase tracking-wider mb-1 block",
												children: "Condition"
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("select", {
												value: item.condition,
												onChange: (e) => setCondition(idx, e.target.value),
												className: "w-full h-9 px-2 rounded-lg border border-input bg-background text-xs outline-none focus:border-ring",
												children: CONDITIONS.map((c) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
													value: c.value,
													children: c.label
												}, c.value))
											})]
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
											className: "flex-1 pt-5",
											children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
												className: "text-sm font-semibold text-foreground tabular-nums",
												children: formatCurrency(item.originalPrice * item.returnQty)
											})
										})]
									})]
								})]
							}, item.originalLineId);
						})
					})] }),
					selectedItems.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "flex justify-end",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "w-full md:w-72 space-y-2",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex items-center justify-between text-sm",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "text-muted-foreground",
										children: "Items returning"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "font-semibold",
										children: selectedItems.length
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex items-center justify-between text-sm",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "text-muted-foreground",
										children: "Total units"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "font-semibold",
										children: selectedItems.reduce((s, r) => s + r.returnQty, 0)
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex items-center justify-between text-sm gap-3",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "text-muted-foreground shrink-0",
										children: "Refund method"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
										value: refundMethod,
										onChange: (e) => setRefundMethod(e.target.value),
										className: "h-9 px-3 rounded-lg border border-input bg-background text-sm outline-none focus:border-ring flex-1 md:flex-none",
										children: [
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
												children: "Transfer"
											})
										]
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex items-center justify-between pt-2 border-t border-border",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "text-base font-bold text-foreground",
										children: "Refund Total"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "text-lg font-bold text-foreground tabular-nums",
										children: formatCurrency(refundTotal)
									})]
								})
							]
						})
					})
				]
			}), loaded && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "border-t border-border bg-card px-5 py-3 shrink-0",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:justify-between",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
						variant: "outline",
						size: "sm",
						className: "gap-1.5 justify-center sm:justify-start",
						onClick: () => {
							setLoaded(false);
							setOriginalTx(null);
							setSearchRef("");
						},
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(RotateCcw, { className: "size-3.5" }), " Change Invoice"]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
						size: "default",
						className: "gap-1.5 shadow-sm",
						disabled: selectedItems.length === 0,
						onClick: () => setShowConfirm(true),
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CircleCheck, { className: "size-3.5" }), " Process Return"]
					})]
				})
			})] }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ConfirmTransactionDialog, {
				open: showConfirm,
				onOpenChange: setShowConfirm,
				itemCount: selectedItems.length,
				items: selectedItems.map((r) => ({
					name: r.productName,
					qty: r.returnQty,
					cost: r.originalPrice,
					total: r.originalPrice * r.returnQty,
					unitName: r.unitName
				})),
				subtotal: refundTotal,
				grandTotal: refundTotal,
				amountPaid: String(refundTotal),
				partyName: isPurchase ? originalTx?.supplierName ?? null : originalTx?.customerName ?? null,
				showParty: true,
				paymentMethod: refundMethod,
				title: isPurchase ? "Confirm Purchase Return" : "Confirm Sale Return",
				actionLabel: "Process Return",
				onConfirm: handleProcessReturn
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Dialog, {
				open: showReceipt,
				onOpenChange: (v) => {
					if (!v) setShowReceipt(false);
				},
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogContent, {
					className: "sm:max-w-sm gap-0 p-0",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogHeader, {
						className: "p-5 pb-0",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogTitle, {
							className: "text-base",
							children: [title, " Recorded"]
						})
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "p-5 space-y-4",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "rounded-xl bg-emerald-50 dark:bg-emerald-500/10 p-4 text-center",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CircleCheck, { className: "size-10 text-emerald-500 mx-auto mb-2" }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "font-semibold text-foreground",
									children: receiptRef
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
									className: "text-sm text-muted-foreground mt-1",
									children: [
										selectedItems.length,
										" item",
										selectedItems.length !== 1 ? "s" : "",
										" returned · ",
										formatCurrency(refundTotal),
										" refund"
									]
								})
							]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							className: "w-full gap-1",
							onClick: () => {
								setShowReceipt(false);
								router3.visit(backPath);
							},
							children: "Done"
						})]
					})]
				})
			})
		]
	});
}
function Th({ children, className }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
		className: cn("px-3 py-2.5 text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wider", className),
		children
	});
}
function Td({ children, className }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
		className: cn("px-3 py-2", className),
		children
	});
}
//#endregion
export { ReturnPage as default };
