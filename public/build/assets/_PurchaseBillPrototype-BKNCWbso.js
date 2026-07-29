import { i as __toESM, t as require_react } from "./react-DCO0ASPG.js";
import { t as ArrowRight } from "./arrow-right-BaJB_osx.js";
import { t as Building2 } from "./building-2-DGTQudO_.js";
import { t as CircleCheck } from "./circle-check-DoVrqruV.js";
import { t as Minus } from "./minus-jjDOQ6-9.js";
import { n as PaymentPanel, r as TransactionSearchBar, t as ConfirmClearDialog } from "./ClearConfirmDialog-O4Qfa4cY.js";
import { t as Phone } from "./phone-CSvtNg5c.js";
import { t as Printer } from "./printer-SCaoHvv-.js";
import { n as Store, t as purchaseStrategy } from "./purchase-BNajUrbd.js";
import { t as Trash2 } from "./trash-2-D6E37i_K.js";
import { o as getUnit } from "./units-CsePzNz6.js";
import { t as cn } from "./utils-Bim8RyS4.js";
import { t as require_jsx_runtime } from "./jsx-runtime-BjJQA5sn.js";
import { t as Button } from "./button-phKcTdak.js";
import { a as DialogTitle, i as DialogHeader, n as DialogContent, t as Dialog } from "./dialog-Dkfzz8n9.js";
import { E as purchaseBills, St as ChevronDown, _t as Plus, a as getCurrentUserName, ct as X, g as mockContacts, ht as Search, k as mockProducts, st as formatCurrency, wt as toast, xt as ChevronRight } from "./app-fzdHvqQg.js";
import { n as calculateSellingUnitCost, t as calculateMargin } from "./product-adapter-Df3GNTgA.js";
import { t as useNavigate } from "./chunk-KS7C4IRE-CdoDKP7j.js";
import { t as ConfirmTransactionDialog } from "./ConfirmDialog-B6BrB1ZO.js";
import { t as useTransactionRecorder } from "./useTransactionRecorder-oXXWqI_k.js";
//#region resources/js/Pages/purchases/_PurchaseBillPrototype.tsx
var import_react = /* @__PURE__ */ __toESM(require_react(), 1);
var import_jsx_runtime = require_jsx_runtime();
function SupplierCombobox({ supplier, onSelect, onClear }) {
	const [open, setOpen] = (0, import_react.useState)(false);
	const [query, setQuery] = (0, import_react.useState)("");
	const suppliers = (0, import_react.useMemo)(() => mockContacts.filter((c) => c.roles.includes("supplier")), []);
	const filtered = (0, import_react.useMemo)(() => {
		if (!query) return suppliers;
		const q = query.toLowerCase();
		return suppliers.filter((s) => s.name.toLowerCase().includes(q) || s.phone.includes(q) || s.contactPerson && s.contactPerson.toLowerCase().includes(q));
	}, [query, suppliers]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "relative",
		children: [supplier ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex items-center gap-2 px-3 py-2 rounded-lg border border-emerald-200 bg-emerald-50 dark:bg-emerald-500/10 dark:border-emerald-800",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Building2, { className: "size-4 text-emerald-600" }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex-1 min-w-0",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "text-sm font-medium truncate",
						children: supplier.name
					}), supplier.phone && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "text-[10px] text-muted-foreground",
						children: supplier.phone
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					onClick: onClear,
					className: "flex items-center justify-center size-6 rounded-md hover:bg-red-100 text-muted-foreground hover:text-red-500",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { className: "size-3.5" })
				})
			]
		}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
			onClick: () => setOpen(!open),
			className: "flex items-center gap-2 w-full px-3 py-2 rounded-lg border border-input bg-background text-sm text-muted-foreground hover:border-ring transition-colors",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Building2, { className: "size-4" }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Select supplier" }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronDown, { className: "size-4 ml-auto" })
			]
		}), open && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "fixed inset-0 z-40",
			onClick: () => setOpen(false)
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "absolute left-0 right-0 top-full mt-1 z-50 rounded-xl border border-border bg-popover shadow-lg overflow-hidden",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "p-2",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "relative",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Search, { className: "absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
						type: "text",
						placeholder: "Search suppliers...",
						value: query,
						onChange: (e) => setQuery(e.target.value),
						className: "w-full h-8 pl-8 pr-3 rounded-lg bg-muted text-xs outline-none",
						autoFocus: true
					})]
				})
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "max-h-48 overflow-y-auto",
				children: filtered.map((s) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
					onClick: () => {
						onSelect(s);
						setOpen(false);
						setQuery("");
					},
					className: "flex items-center gap-3 w-full px-3 py-2 text-left hover:bg-muted transition-colors",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "flex items-center justify-center size-7 rounded-full bg-muted text-muted-foreground",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Building2, { className: "size-3.5" })
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex-1 min-w-0",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "text-xs font-medium truncate",
							children: s.name
						}), s.phone && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center gap-1 text-[10px] text-muted-foreground",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Phone, { className: "size-2.5" }), s.phone]
						})]
					})]
				}, s.id))
			})]
		})] })]
	});
}
function PurchaseBillPage() {
	const [supplier, setSupplier] = (0, import_react.useState)(null);
	const [cart, setCart] = (0, import_react.useState)([]);
	const [search, setSearch] = (0, import_react.useState)("");
	const [showResults, setShowResults] = (0, import_react.useState)(false);
	const [date, setDate] = (0, import_react.useState)(() => (/* @__PURE__ */ new Date()).toISOString().split("T")[0]);
	const [amountPaid, setAmountPaid] = (0, import_react.useState)("");
	const [paymentMethod, setPaymentMethod] = (0, import_react.useState)("cash");
	const [showConfirm, setShowConfirm] = (0, import_react.useState)(false);
	const [showReceipt, setShowReceipt] = (0, import_react.useState)(false);
	const [showClearConfirm, setShowClearConfirm] = (0, import_react.useState)(false);
	const [receiptRef, setReceiptRef] = (0, import_react.useState)("");
	const [receiptId, setReceiptId] = (0, import_react.useState)("");
	const [receiptCount, setReceiptCount] = (0, import_react.useState)(0);
	const [discount, setDiscount] = (0, import_react.useState)(0);
	const [discountInput, setDiscountInput] = (0, import_react.useState)("");
	const [discountMode, setDiscountMode] = (0, import_react.useState)("flat");
	const [costOverrides, setCostOverrides] = (0, import_react.useState)({});
	const [editingCost, setEditingCost] = (0, import_react.useState)(null);
	const [editingProductId, setEditingProductId] = (0, import_react.useState)(null);
	const [editValue, setEditValue] = (0, import_react.useState)("");
	const [expandedItems, setExpandedItems] = (0, import_react.useState)(/* @__PURE__ */ new Set());
	const editInputRef = (0, import_react.useRef)(null);
	const searchInputRef = (0, import_react.useRef)(null);
	const { record } = useTransactionRecorder();
	const navigate = useNavigate();
	const filteredProducts = (0, import_react.useMemo)(() => {
		if (!search.trim()) return [];
		const q = search.toLowerCase();
		return mockProducts.filter((p) => p.name.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q) || p.category.toLowerCase().includes(q)).slice(0, 8);
	}, [search]);
	const subtotal = (0, import_react.useMemo)(() => cart.reduce((s, c) => s + (costOverrides[c.productId] ?? c.unitCost) * c.purchaseQuantity, 0), [cart, costOverrides]);
	const grandTotal = (0, import_react.useMemo)(() => Math.max(0, subtotal - discount), [subtotal, discount]);
	const { lastCosts, getStockLabel } = (0, import_react.useMemo)(() => {
		const lc = {};
		const sl = {};
		for (const p of mockProducts) sl[p.id] = {
			qty: p.stockQuantity,
			lowStock: p.lowStockThreshold
		};
		for (const item of cart) for (const bill of purchaseBills) {
			const found = bill.items.find((bi) => bi.productId === item.productId);
			if (found && !lc[item.productId]) lc[item.productId] = {
				cost: found.unitCost,
				date: bill.date
			};
		}
		const getStockLabel = (productId) => sl[productId] || {
			qty: 0,
			lowStock: 10
		};
		return {
			lastCosts: lc,
			getStockLabel
		};
	}, [cart]);
	const toggleExpand = (0, import_react.useCallback)((itemId) => {
		setExpandedItems((prev) => {
			const next = new Set(prev);
			if (next.has(itemId)) next.delete(itemId);
			else next.add(itemId);
			return next;
		});
	}, []);
	const startEditCost = (0, import_react.useCallback)((itemId, productId, currentCost) => {
		setEditingCost(itemId);
		setEditingProductId(productId);
		setEditValue(String(costOverrides[productId] ?? currentCost));
	}, [costOverrides]);
	const commitCost = (0, import_react.useCallback)(() => {
		if (editingProductId) {
			const val = parseFloat(editValue);
			if (!isNaN(val) && val > 0) setCostOverrides((prev) => ({
				...prev,
				[editingProductId]: val
			}));
		}
		setEditingCost(null);
		setEditingProductId(null);
		setEditValue("");
	}, [editingProductId, editValue]);
	const handleEditKeyDown = (e) => {
		if (e.key === "Enter") commitCost();
		if (e.key === "Escape") {
			setEditingCost(null);
			setEditValue("");
		}
	};
	(0, import_react.useEffect)(() => {
		if (editingCost) editInputRef.current?.focus();
	}, [editingCost]);
	const handleChangeUnit = (0, import_react.useCallback)((itemId, unitId) => {
		const item = cart.find((c) => c.id === itemId);
		if (!item) return;
		const product = mockProducts.find((p) => p.id === item.productId);
		if (!product) return;
		if (unitId === product.baseUnitId) {
			const costPerBase = product.purchaseConfig ? product.purchaseConfig.cost / product.purchaseConfig.quantity : item.unitCost / item.purchasePackQty;
			setCart((prev) => prev.map((c) => c.id !== itemId ? c : {
				...c,
				purchasePackName: product.baseUnitId,
				purchasePackQty: 1,
				unitCost: Math.round(costPerBase * 100) / 100,
				totalCost: c.purchaseQuantity * (Math.round(costPerBase * 100) / 100)
			}));
			setCostOverrides((prev) => {
				const r = { ...prev };
				delete r[product.id];
				return r;
			});
		} else if (unitId.startsWith("__custom_")) {
			const opt = purchaseStrategy.getCustomUnitOptions({
				id: product.id,
				name: product.name,
				sku: product.sku,
				category: product.category,
				baseUnitId: product.baseUnitId,
				sellingUnits: []
			}).find((o) => o.id === unitId);
			if (!opt) return;
			const costPerBase = product.purchaseConfig ? product.purchaseConfig.cost / product.purchaseConfig.quantity : item.unitCost / item.purchasePackQty;
			const newCost = Math.round(costPerBase * opt.factor * 100) / 100;
			setCart((prev) => prev.map((c) => c.id !== itemId ? c : {
				...c,
				purchasePackName: opt.label,
				purchasePackQty: opt.factor,
				unitCost: newCost,
				totalCost: c.purchaseQuantity * newCost
			}));
			setCostOverrides((prev) => {
				const r = { ...prev };
				delete r[item.productId];
				return r;
			});
		} else {
			const pc = product.purchaseConfig;
			if (!pc) return;
			setCart((prev) => prev.map((c) => c.id !== itemId ? c : {
				...c,
				purchasePackName: pc.name || "Purchase Pack",
				purchasePackQty: pc.quantity,
				unitCost: pc.cost,
				totalCost: c.purchaseQuantity * pc.cost
			}));
			setCostOverrides((prev) => {
				const r = { ...prev };
				delete r[product.id];
				return r;
			});
		}
	}, [cart]);
	const addToCart = (0, import_react.useCallback)((product) => {
		const raw = mockProducts.find((p) => p.id === product.id);
		if (!raw?.purchaseConfig) return;
		const pc = raw.purchaseConfig;
		const baseUnitDef = getUnit(raw.baseUnitId);
		if (!baseUnitDef) return;
		const packName = pc.name || `${pc.quantity} ${baseUnitDef.name}`;
		setCart((prev) => {
			if (prev.find((c) => c.productId === product.id)) return prev.map((c) => c.productId === product.id ? {
				...c,
				purchaseQuantity: c.purchaseQuantity + 1,
				totalCost: (c.purchaseQuantity + 1) * c.unitCost
			} : c);
			const item = {
				id: `pbi-${Date.now()}`,
				productId: raw.id,
				productName: raw.name,
				purchasePackName: packName,
				purchasePackQty: pc.quantity,
				purchaseQuantity: 1,
				baseUnitId: raw.baseUnitId,
				baseUnitName: baseUnitDef.name,
				unitCost: pc.cost,
				totalCost: pc.cost
			};
			return [...prev, item];
		});
		setSearch("");
		setShowResults(false);
		searchInputRef.current?.focus();
	}, []);
	const updateQuantity = (0, import_react.useCallback)((itemId, delta) => {
		setCart((prev) => prev.map((c) => {
			if (c.id !== itemId) return c;
			const n = c.purchaseQuantity + delta;
			if (n <= 0) return null;
			return {
				...c,
				purchaseQuantity: n,
				totalCost: n * c.unitCost
			};
		}).filter(Boolean));
	}, []);
	const removeItem = (0, import_react.useCallback)((itemId) => {
		setCart((prev) => prev.filter((c) => c.id !== itemId));
	}, []);
	const handleQuickPay = (0, import_react.useCallback)((type) => {
		if (type === "full") setAmountPaid(String(subtotal));
		else if (type === "half") setAmountPaid(String(Math.ceil(subtotal / 2)));
		else setAmountPaid("0");
	}, [subtotal]);
	const resetPurchase = (0, import_react.useCallback)(() => {
		setCart([]);
		setAmountPaid("");
		setDiscount(0);
		setDiscountInput("");
		setCostOverrides({});
		setExpandedItems(/* @__PURE__ */ new Set());
		setTimeout(() => searchInputRef.current?.focus(), 100);
	}, []);
	const handleRecordPurchase = (0, import_react.useCallback)(() => {
		if (!supplier) {
			toast.error("Please select a supplier");
			return;
		}
		if (cart.length === 0) {
			toast.error("Cart is empty");
			return;
		}
		const today = date;
		const result = record({
			strategy: purchaseStrategy,
			items: cart.map((c) => ({
				id: c.id,
				productId: c.productId,
				name: c.productName,
				sellingUnitId: c.baseUnitId,
				packagingName: c.purchasePackName,
				packagingQuantity: c.purchaseQuantity,
				baseUnitQuantity: c.purchasePackQty,
				baseQuantity: c.purchasePackQty * c.purchaseQuantity,
				unitPrice: costOverrides[c.productId] ?? c.unitCost,
				total: (costOverrides[c.productId] ?? c.unitCost) * c.purchaseQuantity,
				category: ""
			})),
			partyId: supplier.id,
			partyName: supplier.name,
			discount,
			discountPct: 0,
			paymentMethod,
			amountPaid,
			subtotal,
			grandTotal,
			date: today,
			createdBy: getCurrentUserName()
		});
		setReceiptRef(result.receipt.invoiceNumber);
		setReceiptId(result.receipt.transactionId);
		setReceiptCount(cart.length);
		setShowReceipt(true);
		setCart([]);
		setAmountPaid("");
		setDiscount(0);
		setDiscountInput("");
		setCostOverrides({});
		setExpandedItems(/* @__PURE__ */ new Set());
		toast.success(`Purchase ${result.receipt.invoiceNumber} recorded`);
		setTimeout(() => searchInputRef.current?.focus(), 100);
	}, [
		supplier,
		cart,
		subtotal,
		grandTotal,
		discount,
		paymentMethod,
		amountPaid,
		date,
		record,
		costOverrides
	]);
	const getSellingUnitBreakdown = (0, import_react.useCallback)((item) => {
		const product = mockProducts.find((p) => p.id === item.productId);
		if (!product) return [];
		return product.sellingUnits.map((su) => {
			const costPerUnit = calculateSellingUnitCost(product, su.id);
			const yieldQty = item.purchaseQuantity * (item.purchasePackQty / su.quantity);
			const revenue = yieldQty * su.salePrice;
			const { profit, marginPercent } = calculateMargin(su.salePrice, costPerUnit);
			return {
				name: su.name,
				costPerUnit,
				yieldQty,
				revenue,
				profit,
				marginPercent,
				salePrice: su.salePrice
			};
		});
	}, []);
	cart.reduce((sum, c) => sum + c.purchaseQuantity, 0);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "h-full flex flex-col overflow-hidden",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "px-5 py-3 border-b border-border bg-card shrink-0",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center justify-between",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center gap-3",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "flex items-center justify-center size-10 rounded-xl bg-amber-500/10 text-amber-600",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Store, { className: "size-5" })
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "flex items-center gap-2",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
								className: "text-lg font-bold text-foreground leading-tight",
								children: "New Purchase"
							})
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "text-[11px] text-muted-foreground",
							children: [
								new Date(date).toLocaleDateString("en-PK", {
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
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "w-64",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SupplierCombobox, {
							supplier,
							onSelect: setSupplier,
							onClear: () => setSupplier(null)
						}), supplier && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: cn("mt-1.5 text-[10px]", supplier.currentBalance > 0 ? "text-amber-600 font-medium" : supplier.currentBalance < 0 ? "text-emerald-600 font-medium" : "text-muted-foreground"),
							children: supplier.currentBalance > 0 ? `You owe: ${formatCurrency(supplier.currentBalance)}` : supplier.currentBalance < 0 ? `Credit: ${formatCurrency(Math.abs(supplier.currentBalance))}` : "Balance: Rs. 0"
						})]
					})]
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TransactionSearchBar, {
				search,
				onSearchChange: setSearch,
				showResults,
				onShowResultsChange: setShowResults,
				results: filteredProducts.map((p) => ({
					id: p.id,
					name: p.name,
					sku: p.sku,
					sellingUnits: [{
						name: p.purchaseConfig?.name || "Pack",
						salePrice: p.purchaseConfig?.cost
					}]
				})),
				onAddProduct: addToCart,
				placeholder: "Search product by name or SKU... (Enter to add)"
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex-1 overflow-y-auto px-5 py-4",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "rounded-xl border border-border overflow-hidden",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
						className: "w-full",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
							className: "border-b border-border bg-muted/40",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Th, {
									className: "w-10",
									children: "#"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Th, { children: "Product" }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Th, {
									className: "w-32",
									children: "Pack"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Th, {
									className: "w-20 text-center",
									children: "Qty"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Th, {
									className: "w-28 text-right",
									children: "Cost"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Th, {
									className: "w-28 text-right",
									children: "Total"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Th, { className: "w-10" })
							]
						}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tbody", { children: cart.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tr", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("td", {
							colSpan: 7,
							className: "text-center py-16 text-sm text-muted-foreground",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Store, { className: "size-10 text-muted-foreground/20 mx-auto mb-3" }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "font-medium text-foreground",
									children: "No items yet"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-xs mt-1",
									children: "Search for a product above, press Enter to add"
								})
							]
						}) }) : cart.map((item, idx) => {
							const breakdown = getSellingUnitBreakdown(item);
							const stock = getStockLabel(item.productId);
							const lc = lastCosts[item.productId];
							const effectiveCost = costOverrides[item.productId] ?? item.unitCost;
							const priceChange = lc && lc.cost > 0 ? (effectiveCost - lc.cost) / lc.cost * 100 : 0;
							const showPriceAlert = lc && Math.abs(priceChange) >= 5;
							const isExpanded = expandedItems.has(item.id);
							stock.lowStock > 0 && stock.qty / stock.lowStock;
							return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
								className: "border-b border-border hover:bg-muted/20 transition-colors group",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Td, {
										className: "w-10 text-center text-xs text-muted-foreground",
										children: idx + 1
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Td, {
										className: "min-w-0",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
												className: "text-sm font-medium text-foreground truncate max-w-[200px]",
												children: item.productName
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
												className: "text-[10px] text-muted-foreground",
												children: item.baseUnitName
											}),
											breakdown.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "mt-0.5",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
													onClick: () => toggleExpand(item.id),
													className: "flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground transition-colors",
													children: [isExpanded ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronDown, { className: "size-3" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronRight, { className: "size-3" }), "Sell as:"]
												}), isExpanded && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
													className: "mt-1 flex flex-wrap gap-1",
													children: breakdown.map((su) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
														className: "text-[10px] px-1.5 py-0.5 rounded bg-muted/50 inline-flex items-center gap-1",
														children: [
															/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
																className: "font-medium text-foreground",
																children: su.name
															}),
															/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
																className: "text-muted-foreground",
																children: [
																	"@",
																	formatCurrency(su.costPerUnit),
																	" → ",
																	formatCurrency(su.salePrice)
																]
															}),
															/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
																className: cn("font-medium", su.marginPercent > 0 ? "text-emerald-600" : "text-red-500"),
																children: [su.marginPercent.toFixed(0), "%"]
															})
														]
													}, su.name))
												})]
											})
										]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Td, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
										value: item.purchasePackName === item.baseUnitId ? item.baseUnitId : "purchase-pack",
										onChange: (e) => handleChangeUnit(item.id, e.target.value),
										className: "w-full h-8 px-2 rounded-md border border-input bg-background text-xs outline-none focus:border-ring",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
												value: "purchase-pack",
												children: item.purchasePackName
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("option", {
												value: item.baseUnitId,
												children: ["Per ", item.baseUnitName]
											}),
											(() => {
												const product = mockProducts.find((p) => p.id === item.productId);
												if (!product) return null;
												const customOpts = purchaseStrategy.getCustomUnitOptions({
													id: product.id,
													name: product.name,
													sku: product.sku,
													category: product.category,
													baseUnitId: product.baseUnitId,
													sellingUnits: []
												});
												if (customOpts.length === 0) return null;
												return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("optgroup", {
													label: "Custom amount",
													children: customOpts.map((opt) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
														value: opt.id,
														children: opt.label
													}, opt.id))
												});
											})()
										]
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "text-[10px] text-muted-foreground",
										children: [
											"× ",
											item.purchasePackQty,
											" ",
											item.baseUnitName
										]
									})] }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Td, {
										className: "w-20 text-center",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "flex items-center justify-center gap-0.5",
											children: [
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
													onClick: () => updateQuantity(item.id, -1),
													className: "flex items-center justify-center size-6 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors shrink-0",
													children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Minus, { className: "size-3" })
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
													type: "number",
													value: item.purchaseQuantity,
													onChange: (e) => {
														const v = parseFloat(e.target.value);
														if (!isNaN(v) && v > 0) updateQuantity(item.id, v - item.purchaseQuantity);
													},
													className: "w-12 h-7 px-1 rounded border border-input bg-background text-sm font-semibold text-center outline-none focus:border-ring tabular-nums",
													min: "0",
													step: item.purchasePackQty < 1 ? "0.1" : "1"
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
													onClick: () => updateQuantity(item.id, 1),
													className: "flex items-center justify-center size-6 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors shrink-0",
													children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, { className: "size-3" })
												})
											]
										})
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Td, {
										className: "w-28 text-right",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [editingCost === item.id ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
											ref: editInputRef,
											type: "number",
											value: editValue,
											onChange: (e) => setEditValue(e.target.value),
											onBlur: commitCost,
											onKeyDown: handleEditKeyDown,
											className: "w-24 h-7 px-2 rounded border border-primary bg-background text-sm font-semibold text-right outline-none tabular-nums",
											autoFocus: true
										}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
											onClick: () => startEditCost(item.id, item.productId, effectiveCost),
											className: cn("text-sm font-semibold tabular-nums hover:bg-muted/50 px-1.5 py-0.5 rounded transition-colors", costOverrides[item.productId] ? "text-amber-600" : ""),
											children: formatCurrency(effectiveCost)
										}), lc && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: cn("text-[10px] tabular-nums", Math.abs(priceChange) >= 5 ? "text-amber-600 font-medium" : "text-muted-foreground"),
											children: ["was ", formatCurrency(lc.cost)]
										})] })
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Td, {
										className: "w-28 text-right",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "text-sm font-bold tabular-nums",
											children: formatCurrency(effectiveCost * item.purchaseQuantity)
										})
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Td, {
										className: "w-10 text-center",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
											onClick: () => removeItem(item.id),
											className: "flex items-center justify-center size-7 rounded-md hover:bg-red-50 text-muted-foreground hover:text-red-500 transition-colors",
											title: "Remove",
											children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash2, { className: "size-3.5" })
										})
									}),
									showPriceAlert && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tr", {
										className: "border-b border-border",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
											colSpan: 7,
											className: "px-3 py-1.5 text-[10px]",
											children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
												className: cn("inline-flex items-center gap-1 font-medium", priceChange > 0 ? "text-amber-600" : "text-emerald-600"),
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "inline-block size-1 rounded-full bg-current" }), priceChange > 0 ? `Cost is ${priceChange.toFixed(1)}% above last purchase (${formatCurrency(lc.cost)}${lc.date ? `, ${lc.date}` : ""})` : `Cost is ${Math.abs(priceChange).toFixed(1)}% below last purchase (${formatCurrency(lc.cost)})`]
											})
										})
									})
								]
							}, item.id);
						}) })]
					})
				}), cart.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "flex justify-end mt-4",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "w-72 space-y-2",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-center justify-between text-sm",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-muted-foreground",
									children: "Subtotal"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "font-semibold text-foreground",
									children: formatCurrency(subtotal)
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-center justify-between text-sm gap-3",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-muted-foreground shrink-0",
									children: "Discount"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex items-center gap-1.5",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex items-center rounded-lg border border-input bg-muted/30 p-0.5",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
											onClick: () => {
												setDiscountMode("flat");
												setDiscountInput("");
											},
											className: cn("px-2 py-0.5 rounded-md text-[11px] font-medium transition-colors", discountMode === "flat" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"),
											children: "Rs."
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
											onClick: () => {
												setDiscountMode("pct");
												setDiscount(0);
											},
											className: cn("px-2 py-0.5 rounded-md text-[11px] font-medium transition-colors", discountMode === "pct" ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"),
											children: "%"
										})]
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
										type: "number",
										value: discountMode === "flat" ? discount || "" : discountInput,
										onChange: (e) => {
											const v = parseFloat(e.target.value) || 0;
											if (discountMode === "flat") {
												setDiscount(v);
												setDiscountInput("");
											} else {
												setDiscountInput(e.target.value);
												setDiscount(Math.round(subtotal * (Math.min(v, 100) / 100)));
											}
										},
										placeholder: "0",
										className: "w-20 h-8 px-2 rounded-md border border-input bg-background text-sm text-right outline-none focus:border-ring tabular-nums",
										min: "0",
										max: discountMode === "pct" ? 100 : void 0
									})]
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-center justify-between pt-2 border-t border-border",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-base font-bold text-foreground",
									children: "Grand Total"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-lg font-bold text-foreground tabular-nums",
									children: formatCurrency(grandTotal)
								})]
							})
						]
					})
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PaymentPanel, {
				paymentMethod,
				onMethodChange: setPaymentMethod,
				amountPaid,
				onAmountChange: setAmountPaid,
				grandTotal,
				cartEmpty: cart.length === 0,
				onClear: () => cart.length > 0 ? setShowClearConfirm(true) : resetPurchase(),
				onRecord: () => {
					if (!supplier) {
						toast.error("Please select a supplier first");
						return;
					}
					if (cart.length === 0) {
						toast.error("Cart is empty");
						return;
					}
					setShowConfirm(true);
				},
				onQuickPay: handleQuickPay,
				holdLabel: "Save Draft",
				recordLabel: "Record Purchase",
				showHold: false
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ConfirmTransactionDialog, {
				open: showConfirm,
				onOpenChange: setShowConfirm,
				itemCount: cart.length,
				items: cart.map((c) => ({
					name: c.productName,
					qty: c.purchaseQuantity,
					cost: costOverrides[c.productId] ?? c.unitCost,
					total: (costOverrides[c.productId] ?? c.unitCost) * c.purchaseQuantity,
					unitName: c.purchasePackName
				})),
				subtotal,
				discount,
				grandTotal,
				amountPaid,
				partyName: supplier?.name ?? null,
				showParty: !!supplier,
				paymentMethod,
				title: "Confirm Purchase",
				actionLabel: "Record Purchase",
				onConfirm: handleRecordPurchase
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ConfirmClearDialog, {
				open: showClearConfirm,
				onOpenChange: setShowClearConfirm,
				itemCount: cart.length,
				onConfirm: () => {
					resetPurchase();
					toast.success("Cart cleared");
				}
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
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTitle, {
							className: "text-base",
							children: "Purchase Recorded"
						})
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "p-5 space-y-4",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
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
											receiptCount,
											" item",
											receiptCount > 1 ? "s" : "",
											" · ",
											formatCurrency(grandTotal)
										]
									}),
									supplier && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "text-xs text-muted-foreground mt-0.5",
										children: supplier.name
									})
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex gap-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
									variant: "outline",
									size: "sm",
									className: "flex-1 gap-1",
									onClick: () => {
										toast.success("Printing...");
										window.print();
									},
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Printer, { className: "size-3.5" }), " Print"]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
									variant: "outline",
									size: "sm",
									className: "flex-1 gap-1",
									onClick: () => {
										setShowReceipt(false);
										navigate(`/purchases/${receiptId}`);
									},
									children: ["View ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowRight, { className: "size-3.5" })]
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
								className: "w-full gap-1",
								onClick: () => {
									setShowReceipt(false);
									resetPurchase();
								},
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, { className: "size-3.5" }), " New Purchase"]
							})
						]
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
export { PurchaseBillPage as default };
