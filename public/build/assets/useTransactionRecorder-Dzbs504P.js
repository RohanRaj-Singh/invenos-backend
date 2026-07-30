import { i as __toESM, t as require_react } from "./react-DCO0ASPG.js";
import { u as useApplication } from "./app-DxiW8KTt.js";
//#region resources/js/features/transactions/cart/cart-domain.ts
var import_react = /* @__PURE__ */ __toESM(require_react(), 1);
function cartItemToLineItem(item) {
	return {
		id: item.id,
		productId: item.productId,
		productName: item.name,
		sku: void 0,
		unitId: item.sellingUnitId ?? "",
		unitName: item.packagingName,
		quantity: item.packagingQuantity,
		baseUnitFactor: item.baseUnitQuantity,
		baseQuantity: item.baseQuantity,
		unitPrice: item.unitPrice,
		total: item.total,
		category: item.category
	};
}
function buildCartState(items, partyId, partyName, discount, discountPct, paymentMethod, amountPaid) {
	return {
		items: items.map((item) => ({
			...cartItemToLineItem(item),
			priceOverride: item.priceOverride
		})),
		partyId,
		partyName,
		discount,
		discountPct,
		paymentMethod,
		amountPaid
	};
}
//#endregion
//#region resources/js/features/transactions/useTransactionRecorder.ts
function useTransactionRecorder() {
	const { transactionOrchestrator } = useApplication();
	return { record: (0, import_react.useCallback)((params) => {
		const cart = buildCartState(params.items, params.partyId, params.partyName, params.discount, params.discountPct, params.paymentMethod, parseFloat(params.amountPaid) || params.grandTotal);
		return { receipt: transactionOrchestrator.execute(params.strategy, cart, {
			method: params.paymentMethod,
			amount: parseFloat(params.amountPaid) || params.grandTotal
		}, params.date, params.createdBy).receipt };
	}, [transactionOrchestrator]) };
}
//#endregion
export { useTransactionRecorder as t };
