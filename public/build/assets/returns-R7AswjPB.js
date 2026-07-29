import { E as purchaseBills, N as allSales } from "./app-fzdHvqQg.js";
//#region resources/js/data/returns.ts
function getSaleReturns() {
	return allSales.filter((s) => s.invoiceNumber.startsWith("RET-")).map((s) => ({
		id: s.id,
		returnNumber: s.invoiceNumber,
		originalInvoice: findOriginalSaleInvoice(s),
		originalSaleId: findOriginalSaleId(s),
		customerName: s.customerName || "Walk-in Customer",
		date: s.date,
		items: s.items.map((item) => ({
			originalLineId: item.id,
			productId: item.productId,
			productName: item.name,
			unitName: item.packagingName,
			originalQty: item.packagingQuantity,
			returnedQty: item.packagingQuantity,
			refundAmount: item.total,
			reason: "other",
			condition: "resellable",
			restock: true
		})),
		totalRefund: s.grandTotal,
		refundMethod: "cash",
		createdBy: s.createdBy
	})).sort((a, b) => b.date.localeCompare(a.date));
}
function getSaleReturnByNumber(ref) {
	return getSaleReturns().find((r) => r.returnNumber === ref);
}
function getPurchaseReturns() {
	return purchaseBills.filter((b) => b.invoiceRef.startsWith("PRET-")).map((b) => ({
		id: b.id,
		returnNumber: b.invoiceRef,
		originalInvoice: findOriginalPurchaseInvoice(b),
		originalPurchaseId: findOriginalPurchaseId(b),
		supplierName: b.supplierName,
		date: b.date,
		items: b.items.map((item) => ({
			originalLineId: item.id,
			productId: item.productId,
			productName: item.productName,
			unitName: item.purchasePackName,
			originalQty: item.purchaseQuantity,
			returnedQty: item.purchaseQuantity,
			refundAmount: item.totalCost,
			reason: "other",
			condition: "resellable",
			restock: true
		})),
		totalRefund: b.totalAmount,
		refundMethod: "cash",
		createdBy: b.createdBy
	})).sort((a, b) => b.date.localeCompare(a.date));
}
function getPurchaseReturnByNumber(ref) {
	return getPurchaseReturns().find((r) => r.returnNumber === ref);
}
function findOriginalSaleInvoice(returnSale) {
	const match = (returnSale.notes || "").match(/invoice\s*#?\s*(INV-\d+)/i);
	if (match) return match[1];
	return allSales.find((s) => !s.invoiceNumber.startsWith("RET-") && s.id !== returnSale.id && s.items.some((si) => returnSale.items.some((ri) => ri.productId === si.productId)))?.invoiceNumber || "Unknown";
}
function findOriginalSaleId(returnSale) {
	return allSales.find((s) => !s.invoiceNumber.startsWith("RET-") && s.id !== returnSale.id && s.items.some((si) => returnSale.items.some((ri) => ri.productId === si.productId)))?.id || "";
}
function findOriginalPurchaseInvoice(returnBill) {
	return purchaseBills.find((b) => !b.invoiceRef.startsWith("PRET-") && b.id !== returnBill.id && b.items.some((bi) => returnBill.items.some((ri) => ri.productId === bi.productId)))?.invoiceRef || "Unknown";
}
function findOriginalPurchaseId(returnBill) {
	return purchaseBills.find((b) => !b.invoiceRef.startsWith("PRET-") && b.id !== returnBill.id && b.items.some((bi) => returnBill.items.some((ri) => ri.productId === bi.productId)))?.id || "";
}
//#endregion
export { getSaleReturnByNumber as n, getPurchaseReturnByNumber as t };
