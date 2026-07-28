var settings = structuredClone({
	business: {
		businessName: "Invenos",
		businessLogo: "",
		address: "123 Main Street, Lahore, Pakistan",
		phone: "+92 300 1234567",
		email: "info@invenos.com",
		website: "https://invenos.com",
		currency: "PKR",
		currencySymbol: "Rs.",
		timezone: "Asia/Karachi",
		dateFormat: "YYYY-MM-DD",
		timeFormat: "12h",
		description: "Cloud Inventory & POS System"
	},
	pos: {
		defaultCustomer: "Walk-in Customer",
		defaultPaymentMethod: "cash",
		receiptSize: "80mm",
		autoPrintReceipt: false,
		showProductImages: true,
		enableHoldSales: true,
		barcodeScannerEnabled: true,
		keyboardShortcutsEnabled: true,
		confirmBeforeDeleting: true,
		autoFocusBarcode: false
	},
	inventory: {
		allowNegativeStock: false,
		lowStockThreshold: 10,
		defaultStockUnit: "piece",
		autoGenerateSKU: true,
		barcodeFormat: "CODE128",
		defaultCategory: "",
		stockValuationMethod: "fifo"
	},
	sales: {
		invoicePrefix: "INV-",
		invoiceNumberFormat: "{PREFIX}{NUMBER}",
		defaultTax: 0,
		defaultDiscount: 0,
		allowPriceOverride: true,
		allowBackdatedSales: false,
		roundTotals: true,
		enableDraftSales: false
	},
	purchases: {
		purchasePrefix: "PUR-",
		purchaseNumberFormat: "{PREFIX}{NUMBER}",
		autoUpdateCostPrice: true,
		defaultSupplier: "",
		allowBackdatedPurchases: false,
		requireSupplier: true
	},
	receipt: {
		headerText: "Thank you for your business!",
		footerText: "Goods once sold will not be taken back.",
		showBusinessLogo: true,
		printAddress: true,
		printPhone: true,
		printTaxNumber: false,
		printBarcode: false,
		printQRCode: false,
		paperWidth: 80
	}
});
var listeners = [];
function getSettings() {
	return settings;
}
function getBusinessSettings() {
	return settings.business;
}
function getPOSSettings() {
	return settings.pos;
}
function getInventorySettings() {
	return settings.inventory;
}
function getSalesSettings() {
	return settings.sales;
}
function getPurchaseSettings() {
	return settings.purchases;
}
function updateSettings(updates) {
	settings = {
		...settings,
		...updates,
		business: updates.business ? {
			...settings.business,
			...updates.business
		} : settings.business,
		pos: updates.pos ? {
			...settings.pos,
			...updates.pos
		} : settings.pos,
		inventory: updates.inventory ? {
			...settings.inventory,
			...updates.inventory
		} : settings.inventory,
		sales: updates.sales ? {
			...settings.sales,
			...updates.sales
		} : settings.sales,
		purchases: updates.purchases ? {
			...settings.purchases,
			...updates.purchases
		} : settings.purchases,
		receipt: updates.receipt ? {
			...settings.receipt,
			...updates.receipt
		} : settings.receipt
	};
	for (const fn of listeners) fn();
	return settings;
}
//#endregion
export { getSalesSettings as a, getPurchaseSettings as i, getInventorySettings as n, getSettings as o, getPOSSettings as r, updateSettings as s, getBusinessSettings as t };
