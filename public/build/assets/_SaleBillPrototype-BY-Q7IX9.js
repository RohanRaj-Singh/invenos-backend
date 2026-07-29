import { i as __toESM, t as require_react } from "./react-DCO0ASPG.js";
import { t as FileText } from "./file-text-CkmQ0M6N.js";
import { t as Minus } from "./minus-jjDOQ6-9.js";
import { i as filterPOSProducts, n as PaymentPanel, o as posProducts, r as TransactionSearchBar, t as ConfirmClearDialog } from "./ClearConfirmDialog-2mnieNM_.js";
import { t as Trash2 } from "./trash-2-D6E37i_K.js";
import { o as getUnit } from "./units-CsePzNz6.js";
import { a as getSalesSettings } from "./settings-B-1z6X8M.js";
import { t as cn } from "./utils-Bim8RyS4.js";
import { t as require_jsx_runtime } from "./jsx-runtime-BjJQA5sn.js";
import { F as itemsRequiredRule, G as computeSubtotal, H as computeLineDiscount, L as validateCart, N as allSales, R as generateInvoiceRef, U as computeLineGrossTotal, V as computeGrandTotal, W as computeLineTotal, _t as Plus, a as getCurrentUserName, st as formatCurrency, wt as toast } from "./app-BLMvu7I3.js";
import { i as getDefaultSellingUnit } from "./product-adapter-Df3GNTgA.js";
import { a as getStepForUnit, i as getIncrementForUnit, n as ReceiptDialog, o as computeCustomUnitPrice, r as CustomerSelect, s as computePricePerBaseUnit, t as TransactionSummary } from "./CartSummary-pAaOfqzw.js";
import EditableQuantity from "./EditableQuantity-BBISzTwJ.js";
import { t as ConfirmTransactionDialog } from "./ConfirmDialog-BA_PWESg.js";
import { t as useTransactionRecorder } from "./useTransactionRecorder-DS2pM9a8.js";
//#region resources/js/domain/transactions/strategies/sale.ts
var import_react = /* @__PURE__ */ __toESM(require_react(), 1);
var import_jsx_runtime = require_jsx_runtime();
function productToInfo(p) {
	return {
		id: p.id,
		name: p.name,
		sku: p.sku,
		category: p.category,
		baseUnitId: p.baseUnitId,
		sellingUnits: p.sellingUnits.map((su) => ({
			id: su.id,
			name: su.name,
			quantity: su.quantity,
			salePrice: su.salePrice
		})),
		purchaseConfig: p.purchaseConfig ? {
			unitId: p.purchaseConfig.unitId,
			quantity: p.purchaseConfig.quantity,
			cost: p.purchaseConfig.cost,
			name: p.purchaseConfig.name
		} : null
	};
}
function createCustomUnitOptions(product) {
	const unit = getUnit(product.baseUnitId);
	if (!unit) return [];
	const bu = product.baseUnitId;
	const opts = [];
	if (unit.measurementType === "weight") {
		opts.push({
			id: "__custom_gram",
			label: "Per Gram",
			factor: bu === "kg" ? .001 : 1
		});
		opts.push({
			id: "__custom_kg",
			label: "Per KG",
			factor: bu === "kg" ? 1 : 1e3
		});
	}
	if (unit.measurementType === "volume") {
		opts.push({
			id: "__custom_ml",
			label: "Per mL",
			factor: bu === "liter" ? .001 : 1
		});
		opts.push({
			id: "__custom_liter",
			label: "Per Liter",
			factor: bu === "liter" ? 1 : 1e3
		});
	}
	if (unit.measurementType === "length") {
		opts.push({
			id: "__custom_cm",
			label: "Per cm",
			factor: bu === "meter" ? .01 : 1
		});
		opts.push({
			id: "__custom_meter",
			label: "Per Meter",
			factor: bu === "meter" ? 1 : 100
		});
	}
	return opts;
}
var CACHED_PRODUCTS = posProducts.map(productToInfo);
var saleStrategy = {
	type: "sale",
	getInventoryMultiplier: () => -1,
	getInventoryTransactionType: () => "sale",
	getInventoryEffects(tx) {
		return tx.items.map((item) => ({
			productId: item.productId,
			quantity: -item.baseQuantity,
			type: "sale",
			reference: tx.invoiceRef
		}));
	},
	getFinancialDirection: () => "in",
	getFinancialTransactionType: () => "collection",
	getFinancialEffect(tx) {
		if (tx.amountPaid <= 0) return null;
		return {
			direction: "in",
			type: "collection",
			amount: tx.amountPaid,
			method: tx.paymentMethod,
			partyId: tx.partyId ?? "ct-001",
			reference: tx.invoiceRef
		};
	},
	requiresParty: () => false,
	getDefaultParty: () => ({
		id: "cust-0",
		name: "Walk-in Customer",
		role: "customer",
		isWalkIn: true
	}),
	getPartyRole: () => "customer",
	generateInvoiceRef: () => {
		return generateInvoiceRef(getSalesSettings().invoicePrefix.replace(/-+$/, "").replace(/[^A-Z-]/gi, "") || "INV", allSales.length + 1);
	},
	getInvoicePrefix: () => getSalesSettings().invoicePrefix || "INV-",
	generateReceipt(tx) {
		const paid = tx.amountPaid;
		const grandTotal = tx.grandTotal;
		return {
			invoiceNumber: tx.invoiceRef,
			transactionId: tx.id,
			items: tx.items,
			subtotal: tx.subtotal,
			discount: tx.discount,
			grandTotal,
			amountPaid: paid,
			outstanding: Math.max(0, grandTotal - paid),
			paymentStatus: tx.paymentStatus,
			method: tx.paymentMethod ?? "cash",
			partyName: tx.partyName,
			transactionType: "sale"
		};
	},
	getDefaultUnit(product) {
		const raw = posProducts.find((p) => p.id === product.id);
		if (!raw) return null;
		const su = getDefaultSellingUnit(raw);
		if (!su) return null;
		return {
			id: su.id,
			name: su.name,
			quantity: su.quantity,
			salePrice: su.salePrice
		};
	},
	getAvailableUnits(product) {
		return product.sellingUnits;
	},
	getCustomUnitOptions(product) {
		return createCustomUnitOptions(product);
	},
	getDefaultPrice(_product, unit) {
		return unit.salePrice ?? 0;
	},
	getAvailableProducts() {
		return CACHED_PRODUCTS;
	},
	searchProducts(query) {
		return filterPOSProducts(query, "all").slice(0, 8).map(productToInfo);
	},
	supportsDiscount: () => true,
	supportsPerItemDiscount: () => true,
	supportsPriceOverride: () => true,
	supportsPayment: () => true,
	supportsPartialPayment: () => true,
	supportsHeldTransactions: () => true,
	getValidationRules: () => [itemsRequiredRule],
	validate(cart) {
		return validateCart(cart, saleStrategy);
	},
	getLabels: () => ({
		pageTitle: "Create Sale",
		partyLabel: "Customer",
		partyPlaceholder: "Search customer...",
		confirmTitle: "Confirm Sale",
		confirmAction: "Confirm Sale",
		receiptTitle: "Sale Successful",
		receiptDetailRoute: (id) => `/sales/${id}`,
		searchPlaceholder: "Search product by name, SKU, or barcode...",
		emptyCart: "No items yet",
		emptyCartHint: "Search for a product above to add it to the bill",
		paymentLabel: "Amount Received",
		recordAction: "Record Sale",
		holdAction: "Hold",
		clearAction: "Clear"
	})
};
//#endregion
//#region resources/js/Pages/pos/_SaleBillPrototype.tsx
var CART_KEY = "invenos-pos-cart";
var DISCOUNT_KEY = "invenos-pos-discount";
var CUSTOMER_KEY = "invenos-pos-customer";
var HELD_KEY = "invenos-pos-held";
function saveCartState(cart, discount, customer) {
	try {
		sessionStorage.setItem(CART_KEY, JSON.stringify(cart));
		sessionStorage.setItem(DISCOUNT_KEY, String(discount));
		sessionStorage.setItem(CUSTOMER_KEY, JSON.stringify(customer));
	} catch {}
}
function loadCartState() {
	try {
		const cartRaw = sessionStorage.getItem(CART_KEY);
		const discountRaw = sessionStorage.getItem(DISCOUNT_KEY);
		const customerRaw = sessionStorage.getItem(CUSTOMER_KEY);
		if (!cartRaw) return null;
		return {
			cart: JSON.parse(cartRaw),
			discount: discountRaw ? parseFloat(discountRaw) : 0,
			customer: customerRaw ? JSON.parse(customerRaw) : null
		};
	} catch {
		return null;
	}
}
function clearCartState() {
	sessionStorage.removeItem(CART_KEY);
	sessionStorage.removeItem(DISCOUNT_KEY);
	sessionStorage.removeItem(CUSTOMER_KEY);
}
function getHeldSales() {
	try {
		return JSON.parse(sessionStorage.getItem(HELD_KEY) || "[]");
	} catch {
		return [];
	}
}
function holdSaleItem(sale) {
	const held = getHeldSales();
	held.push(sale);
	try {
		sessionStorage.setItem(HELD_KEY, JSON.stringify(held));
	} catch {}
}
var DEFAULT_CUSTOMER = {
	id: "cust-0",
	name: "Walk-in Customer",
	phone: ""
};
function SaleBillPage() {
	const [cart, setCart] = (0, import_react.useState)([]);
	const [customer, setCustomer] = (0, import_react.useState)(DEFAULT_CUSTOMER);
	const [discount, setDiscount] = (0, import_react.useState)(0);
	const [discountInput, setDiscountInput] = (0, import_react.useState)("");
	const [search, setSearch] = (0, import_react.useState)("");
	const [showResults, setShowResults] = (0, import_react.useState)(false);
	const [paymentMethod, setPaymentMethod] = (0, import_react.useState)("cash");
	const [amountPaid, setAmountPaid] = (0, import_react.useState)("");
	const [showReceipt, setShowReceipt] = (0, import_react.useState)(false);
	const [receiptData, setReceiptData] = (0, import_react.useState)(null);
	const [showConfirm, setShowConfirm] = (0, import_react.useState)(false);
	const [showClearConfirm, setShowClearConfirm] = (0, import_react.useState)(false);
	const [priceOverrides, setPriceOverrides] = (0, import_react.useState)({});
	const [discountPcts, setDiscountPcts] = (0, import_react.useState)({});
	const [editingPrice, setEditingPrice] = (0, import_react.useState)(null);
	const [editingDisc, setEditingDisc] = (0, import_react.useState)(null);
	const [editValue, setEditValue] = (0, import_react.useState)("");
	const editInputRef = (0, import_react.useRef)(null);
	const restoredRef = (0, import_react.useRef)(false);
	const searchInputRef = (0, import_react.useRef)(null);
	(0, import_react.useRef)(null);
	const { record } = useTransactionRecorder();
	(0, import_react.useEffect)(() => {
		if (restoredRef.current) return;
		restoredRef.current = true;
		const saved = loadCartState();
		if (saved && saved.cart.length > 0) {
			setCart(saved.cart);
			setDiscount(saved.discount);
			if (saved.customer) setCustomer(saved.customer);
		}
	}, []);
	(0, import_react.useEffect)(() => {
		saveCartState(cart, discount, customer);
	}, [
		cart,
		discount,
		customer
	]);
	(0, import_react.useEffect)(() => {
		if (cart.length === 0) return;
		const handler = (e) => {
			e.preventDefault();
			e.returnValue = "";
		};
		window.addEventListener("beforeunload", handler);
		return () => window.removeEventListener("beforeunload", handler);
	}, [cart.length]);
	(0, import_react.useEffect)(() => {
		if (editingPrice || editingDisc) editInputRef.current?.focus();
	}, [editingPrice, editingDisc]);
	(0, import_react.useEffect)(() => {
		const handler = (e) => {
			if ((e.ctrlKey || e.metaKey) && e.key === "Enter" && cart.length > 0) {
				e.preventDefault();
				setShowConfirm(true);
			}
		};
		window.addEventListener("keydown", handler);
		return () => window.removeEventListener("keydown", handler);
	}, [cart.length]);
	const computedCart = (0, import_react.useMemo)(() => cart.map((item) => {
		const price = priceOverrides[item.productId] ?? item.unitPrice;
		const pctDiscount = discountPcts[item.productId] || 0;
		const grossTotal = computeLineGrossTotal(item.packagingQuantity, price);
		const flatDiscount = computeLineDiscount(grossTotal, pctDiscount);
		return {
			...item,
			unitPrice: price,
			total: computeLineTotal(grossTotal, flatDiscount),
			grossTotal
		};
	}), [
		cart,
		priceOverrides,
		discountPcts
	]);
	const subtotal = (0, import_react.useMemo)(() => computeSubtotal(computedCart.map((i) => i.total)), [computedCart]);
	const grandTotal = (0, import_react.useMemo)(() => computeGrandTotal(subtotal, discount), [subtotal, discount]);
	const sessionCount = (0, import_react.useMemo)(() => allSales.length + 1, []);
	const searchResults = (0, import_react.useMemo)(() => {
		if (!search.trim()) return [];
		return filterPOSProducts(search, "all").slice(0, 8);
	}, [search]);
	const addToCart = (0, import_react.useCallback)((product) => {
		const defaultSU = getDefaultSellingUnit(product);
		if (!defaultSU) return;
		setCart((prev) => {
			if (prev.find((c) => c.productId === product.id)) return prev.map((c) => c.productId === product.id ? {
				...c,
				packagingQuantity: c.packagingQuantity + 1,
				baseQuantity: (c.packagingQuantity + 1) * defaultSU.quantity,
				total: (c.packagingQuantity + 1) * c.unitPrice
			} : c);
			return [...prev, {
				id: `ci-${Date.now()}`,
				productId: product.id,
				name: product.name,
				sellingUnitId: defaultSU.id,
				packagingName: defaultSU.name,
				packagingQuantity: 1,
				baseUnitQuantity: defaultSU.quantity,
				baseQuantity: defaultSU.quantity,
				unitPrice: defaultSU.salePrice,
				total: defaultSU.salePrice,
				category: product.category
			}];
		});
		setSearch("");
		setShowResults(false);
		searchInputRef.current?.focus();
	}, []);
	const updateQuantity = (0, import_react.useCallback)((productId, delta) => {
		setCart((prev) => prev.map((c) => {
			if (c.productId !== productId) return c;
			const n = c.packagingQuantity + delta;
			if (n <= 0) return null;
			return {
				...c,
				packagingQuantity: n,
				baseQuantity: n * c.baseUnitQuantity,
				total: n * c.unitPrice
			};
		}).filter(Boolean));
	}, []);
	const getSellingUnits = (0, import_react.useCallback)((productId) => {
		return posProducts.find((p) => p.id === productId)?.sellingUnits ?? [];
	}, []);
	const getCustomUnitOptions = (0, import_react.useCallback)((productId) => {
		const product = posProducts.find((p) => p.id === productId);
		if (!product) return [];
		const unit = getUnit(product.baseUnitId);
		if (!unit) return [];
		const bu = product.baseUnitId;
		const opts = [];
		if (unit.measurementType === "weight") {
			opts.push({
				id: "__custom_gram",
				label: "Per Gram",
				factor: bu === "kg" ? .001 : 1
			});
			opts.push({
				id: "__custom_kg",
				label: "Per KG",
				factor: bu === "kg" ? 1 : 1e3
			});
		}
		if (unit.measurementType === "volume") {
			opts.push({
				id: "__custom_ml",
				label: "Per mL",
				factor: bu === "liter" ? .001 : 1
			});
			opts.push({
				id: "__custom_liter",
				label: "Per Liter",
				factor: bu === "liter" ? 1 : 1e3
			});
		}
		if (unit.measurementType === "length") {
			opts.push({
				id: "__custom_cm",
				label: "Per cm",
				factor: bu === "meter" ? .01 : 1
			});
			opts.push({
				id: "__custom_meter",
				label: "Per Meter",
				factor: bu === "meter" ? 1 : 100
			});
		}
		return opts;
	}, []);
	const handleChangeUnit = (0, import_react.useCallback)((productId, sellingUnitId) => {
		const product = posProducts.find((p) => p.id === productId);
		if (!product) return;
		if (sellingUnitId.startsWith("__custom_")) {
			const opt = getCustomUnitOptions(productId).find((o) => o.id === sellingUnitId);
			if (!opt) return;
			const defaultSU = getDefaultSellingUnit(product);
			const unitPrice = computeCustomUnitPrice(defaultSU ? computePricePerBaseUnit(defaultSU.salePrice, defaultSU.quantity) : 0, opt.factor);
			setCart((prev) => prev.map((c) => c.productId !== productId ? c : {
				...c,
				sellingUnitId,
				packagingName: opt.label,
				baseUnitQuantity: opt.factor,
				baseQuantity: c.packagingQuantity * opt.factor,
				unitPrice,
				total: c.packagingQuantity * unitPrice
			}));
			setPriceOverrides((prev) => {
				const r = { ...prev };
				delete r[productId];
				return r;
			});
			return;
		}
		const su = product.sellingUnits.find((s) => s.id === sellingUnitId);
		if (!su) return;
		setCart((prev) => prev.map((c) => c.productId !== productId ? c : {
			...c,
			sellingUnitId: su.id,
			packagingName: su.name,
			baseUnitQuantity: su.quantity,
			baseQuantity: c.packagingQuantity * su.quantity,
			unitPrice: su.salePrice,
			total: c.packagingQuantity * su.salePrice
		}));
		setPriceOverrides((prev) => {
			const r = { ...prev };
			delete r[productId];
			return r;
		});
	}, [getCustomUnitOptions]);
	const handleRemoveItem = (0, import_react.useCallback)((productId) => {
		const item = cart.find((c) => c.productId === productId);
		setCart((prev) => prev.filter((c) => c.productId !== productId));
		setPriceOverrides((prev) => {
			const r = { ...prev };
			delete r[productId];
			return r;
		});
		setDiscountPcts((prev) => {
			const r = { ...prev };
			delete r[productId];
			return r;
		});
		if (item) toast(`${item.name} removed`, {
			action: {
				label: "Undo",
				onClick: () => setCart((prev) => {
					const idx = cart.findIndex((c) => c.productId === productId);
					const copy = [...prev];
					if (idx >= 0 && idx <= copy.length) copy.splice(idx, 0, item);
					else copy.push(item);
					return copy;
				})
			},
			duration: 4e3
		});
	}, [cart]);
	const startEditPrice = (0, import_react.useCallback)((productId, currentPrice) => {
		setEditingDisc(null);
		setEditingPrice(productId);
		setEditValue(String(priceOverrides[productId] ?? currentPrice));
	}, [priceOverrides]);
	const commitPrice = (0, import_react.useCallback)(() => {
		if (editingPrice) {
			const val = parseFloat(editValue);
			if (!isNaN(val) && val > 0) setPriceOverrides((prev) => ({
				...prev,
				[editingPrice]: val
			}));
		}
		setEditingPrice(null);
		setEditValue("");
	}, [editingPrice, editValue]);
	const startEditDisc = (0, import_react.useCallback)((productId) => {
		setEditingPrice(null);
		setEditingDisc(productId);
		setEditValue(String(discountPcts[productId] ?? ""));
	}, [discountPcts]);
	const commitDisc = (0, import_react.useCallback)(() => {
		if (editingDisc) {
			const val = parseFloat(editValue);
			if (!isNaN(val) && val >= 0 && val <= 100) setDiscountPcts((prev) => ({
				...prev,
				[editingDisc]: val
			}));
			else if (editValue === "" || editValue === "0") setDiscountPcts((prev) => {
				const r = { ...prev };
				delete r[editingDisc];
				return r;
			});
		}
		setEditingDisc(null);
		setEditValue("");
	}, [editingDisc, editValue]);
	const handleEditKeyDown = (e) => {
		if (e.key === "Enter") {
			if (editingPrice) commitPrice();
			else if (editingDisc) commitDisc();
		}
		if (e.key === "Escape") {
			setEditingPrice(null);
			setEditingDisc(null);
			setEditValue("");
		}
	};
	const handleQuickPay = (0, import_react.useCallback)((type) => {
		if (type === "full") setAmountPaid(String(grandTotal));
		else if (type === "half") setAmountPaid(String(Math.ceil(grandTotal / 2)));
		else setAmountPaid("0");
	}, [grandTotal]);
	const resetSale = (0, import_react.useCallback)(() => {
		setCart([]);
		setDiscount(0);
		setDiscountInput("");
		setCustomer(DEFAULT_CUSTOMER);
		setPriceOverrides({});
		setDiscountPcts({});
		setAmountPaid("");
		clearCartState();
		setTimeout(() => searchInputRef.current?.focus(), 100);
	}, []);
	const handleHoldSale = (0, import_react.useCallback)(() => {
		if (cart.length === 0) return;
		holdSaleItem({
			id: `held-${Date.now()}`,
			customer,
			items: [...cart],
			discount,
			subtotal,
			grandTotal,
			heldAt: (/* @__PURE__ */ new Date()).toLocaleString()
		});
		resetSale();
		toast.success("Sale held — you can resume it from POS");
	}, [
		cart,
		customer,
		discount,
		subtotal,
		grandTotal,
		resetSale
	]);
	const handleRecordSale = (0, import_react.useCallback)(() => {
		if (cart.length === 0) return;
		const today = (/* @__PURE__ */ new Date()).toISOString().split("T")[0];
		const result = record({
			strategy: saleStrategy,
			items: computedCart,
			partyId: customer.id === "cust-0" ? null : customer.id,
			partyName: customer.name,
			discount,
			discountPct: 0,
			paymentMethod,
			amountPaid,
			subtotal,
			grandTotal,
			date: today,
			createdBy: getCurrentUserName()
		});
		setReceiptData({
			...result.receipt,
			saleId: result.receipt.transactionId,
			customer,
			method: result.receipt.method,
			paymentStatus: result.receipt.paymentStatus
		});
		setShowReceipt(true);
		resetSale();
	}, [
		cart,
		computedCart,
		subtotal,
		discount,
		grandTotal,
		customer,
		paymentMethod,
		amountPaid,
		record,
		resetSale
	]);
	const handleNewSale = (0, import_react.useCallback)(() => {
		setShowReceipt(false);
		setReceiptData(null);
		resetSale();
	}, [resetSale]);
	const getQuantityIncrement = (0, import_react.useCallback)((productId) => {
		const item = cart.find((c) => c.productId === productId);
		if (!item?.sellingUnitId) return 1;
		return getIncrementForUnit(item.sellingUnitId);
	}, [cart]);
	const getQuantityStep = (0, import_react.useCallback)((productId) => {
		const item = cart.find((c) => c.productId === productId);
		if (!item?.sellingUnitId) return "1";
		return getStepForUnit(item.sellingUnitId);
	}, [cart]);
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
							className: "flex items-center justify-center size-10 rounded-xl bg-primary/10 text-primary",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(FileText, { className: "size-5" })
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center gap-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
								className: "text-lg font-bold text-foreground leading-tight",
								children: "Create Sale"
							}), cart.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "inline-flex items-center px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-semibold",
								children: [
									cart.length,
									" item",
									cart.length > 1 ? "s" : ""
								]
							})]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
							className: "text-[11px] text-muted-foreground",
							children: [
								(/* @__PURE__ */ new Date()).toLocaleDateString("en-PK", {
									weekday: "short",
									day: "numeric",
									month: "short",
									year: "numeric"
								}),
								" ",
								"·",
								" ",
								(/* @__PURE__ */ new Date()).toLocaleTimeString("en-PK", {
									hour: "2-digit",
									minute: "2-digit"
								})
							]
						})] })]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center gap-3",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
							className: "text-xs text-muted-foreground",
							children: ["Session #", sessionCount]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CustomerSelect, {
							value: customer,
							onChange: setCustomer
						})]
					})]
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TransactionSearchBar, {
				search,
				onSearchChange: setSearch,
				showResults,
				onShowResultsChange: setShowResults,
				results: searchResults,
				onAddProduct: (product) => addToCart(product),
				placeholder: "Search product by name, SKU, or barcode... (Enter to add)"
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
									children: "Unit"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Th, {
									className: "w-24 text-center",
									children: "Qty"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Th, {
									className: "w-24 text-right",
									children: "Price"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Th, {
									className: "w-20 text-right",
									children: "Disc%"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Th, {
									className: "w-28 text-right",
									children: "Total"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Th, { className: "w-10" })
							]
						}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tbody", { children: cart.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tr", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("td", {
							colSpan: 8,
							className: "text-center py-16 text-sm text-muted-foreground",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FileText, { className: "size-10 text-muted-foreground/20 mx-auto mb-3" }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "font-medium text-foreground",
									children: "No items yet"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-xs mt-1",
									children: "Search for a product above to add it to the bill"
								})
							]
						}) }) : cart.map((item, idx) => {
							const product = posProducts.find((p) => p.id === item.productId);
							const sellingUnits = getSellingUnits(item.productId);
							const customOpts = getCustomUnitOptions(item.productId);
							const pct = discountPcts[item.productId];
							const computedItem = computedCart.find((c) => c.productId === item.productId) ?? item;
							const isEditingPrice = editingPrice === item.productId;
							const isEditingDisc = editingDisc === item.productId;
							const qtyIncrement = getQuantityIncrement(item.productId);
							const qtyStep = getQuantityStep(item.productId);
							return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
								className: "border-b border-border hover:bg-muted/20 transition-colors",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Td, {
										className: "w-10 text-center text-xs text-muted-foreground",
										children: idx + 1
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Td, {
										className: "min-w-0",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
											className: "text-sm font-medium text-foreground truncate max-w-[200px]",
											children: item.name
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
											className: "text-[10px] text-muted-foreground",
											children: product?.sku
										})]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Td, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
										value: item.sellingUnitId || "",
										onChange: (e) => handleChangeUnit(item.productId, e.target.value),
										className: "w-full h-8 px-2 rounded-md border border-input bg-background text-xs outline-none focus:border-ring",
										children: [sellingUnits.map((su) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
											value: su.id,
											children: su.name
										}, su.id)), customOpts.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("optgroup", {
											label: "Custom amount",
											children: customOpts.map((opt) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
												value: opt.id,
												children: opt.label
											}, opt.id))
										})]
									}) }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Td, {
										className: "w-24 text-center",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "flex items-center justify-center gap-0.5",
											children: [
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
													onClick: () => updateQuantity(item.productId, -qtyIncrement),
													className: "flex items-center justify-center size-7 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors",
													children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Minus, { className: "size-3" })
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)(EditableQuantity, {
													value: item.packagingQuantity,
													onChange: (delta) => updateQuantity(item.productId, delta),
													step: qtyStep
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
													onClick: () => updateQuantity(item.productId, qtyIncrement),
													className: "flex items-center justify-center size-7 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors",
													children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, { className: "size-3" })
												})
											]
										})
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Td, {
										className: "w-24 text-right",
										children: isEditingPrice ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "flex items-center justify-end gap-1",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "text-[10px] text-muted-foreground",
												children: "Rs."
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
												ref: editInputRef,
												type: "number",
												value: editValue,
												onChange: (e) => setEditValue(e.target.value),
												onBlur: commitPrice,
												onKeyDown: handleEditKeyDown,
												className: "w-20 h-7 px-2 rounded border border-primary bg-background text-sm font-semibold text-right outline-none tabular-nums",
												autoFocus: true
											})]
										}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
											onClick: () => startEditPrice(item.productId, item.unitPrice),
											className: "text-sm font-semibold tabular-nums hover:bg-muted/50 px-1.5 py-0.5 rounded transition-colors",
											title: "Click to edit price",
											children: formatCurrency(computedItem.unitPrice)
										})
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Td, {
										className: "w-20 text-right",
										children: isEditingDisc ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "flex items-center justify-end gap-1",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
												ref: editInputRef,
												type: "number",
												value: editValue,
												onChange: (e) => setEditValue(e.target.value),
												onBlur: commitDisc,
												onKeyDown: handleEditKeyDown,
												className: "w-16 h-7 px-2 rounded border border-primary bg-background text-sm font-semibold text-right outline-none tabular-nums",
												autoFocus: true,
												min: "0",
												max: "100"
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "text-xs text-muted-foreground",
												children: "%"
											})]
										}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
											onClick: () => startEditDisc(item.productId),
											className: cn("text-sm font-semibold tabular-nums hover:bg-muted/50 px-1.5 py-0.5 rounded transition-colors", pct ? "text-amber-600" : "text-muted-foreground"),
											title: "Click to set discount %",
											children: pct && pct > 0 ? `${pct}%` : "—"
										})
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Td, {
										className: "w-28 text-right",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: cn("text-sm font-bold tabular-nums", computedItem.total > 0 ? "text-foreground" : "text-red-500"),
											children: formatCurrency(computedItem.total)
										})
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Td, {
										className: "w-10 text-center",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
											onClick: () => handleRemoveItem(item.productId),
											className: "flex items-center justify-center size-7 rounded-md hover:bg-red-50 text-muted-foreground hover:text-red-500 transition-colors",
											title: "Remove item",
											children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash2, { className: "size-3.5" })
										})
									})
								]
							}, item.id);
						}) })]
					})
				}), cart.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TransactionSummary, {
					subtotal,
					discount,
					discountInput,
					grandTotal,
					onDiscountChange: (v) => {
						setDiscount(v);
						setDiscountInput("");
					},
					onDiscountInputChange: setDiscountInput,
					onDiscountPctChange: setDiscount
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PaymentPanel, {
				paymentMethod,
				onMethodChange: setPaymentMethod,
				amountPaid,
				onAmountChange: setAmountPaid,
				grandTotal,
				cartEmpty: cart.length === 0,
				onHold: handleHoldSale,
				onClear: () => cart.length > 0 ? setShowClearConfirm(true) : resetSale(),
				onRecord: () => setShowConfirm(true),
				onQuickPay: handleQuickPay
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ReceiptDialog, {
				open: showReceipt,
				saleData: receiptData,
				onClose: () => setShowReceipt(false),
				onNewSale: handleNewSale
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ConfirmTransactionDialog, {
				open: showConfirm,
				onOpenChange: setShowConfirm,
				itemCount: cart.length,
				items: computedCart.map((c) => ({
					name: c.name,
					qty: c.packagingQuantity,
					cost: c.unitPrice,
					total: c.total,
					unitName: c.packagingName
				})),
				subtotal,
				discount,
				grandTotal,
				amountPaid,
				partyName: customer.name,
				showParty: customer.name !== "Walk-in Customer",
				paymentMethod,
				onConfirm: handleRecordSale
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ConfirmClearDialog, {
				open: showClearConfirm,
				onOpenChange: setShowClearConfirm,
				itemCount: cart.length,
				onConfirm: () => {
					resetSale();
					toast.success("Cart cleared");
				}
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
export { SaleBillPage as default };
