import { Nt as axios } from "./app-C7AUNtSc.js";
//#region resources/js/features/composition/api.ts
var productBase = (productId) => `/inventory/product/${productId}`;
async function fetchCompositions(productId) {
	return (await axios.get(`${productBase(productId)}/compositions`)).data.data;
}
async function fetchActiveComposition(productId, kind) {
	return (await axios.get(`${productBase(productId)}/composition`, { params: { kind } })).data.data;
}
async function createComposition(productId, payload) {
	return (await axios.post(`${productBase(productId)}/composition`, payload)).data.data;
}
async function updateComposition(productId, compositionId, payload) {
	return (await axios.put(`${productBase(productId)}/composition/${compositionId}`, payload)).data.data;
}
async function deactivateComposition(productId, compositionId) {
	return (await axios.delete(`${productBase(productId)}/composition/${compositionId}`)).data.data;
}
async function previewComposition(productId, payload) {
	return (await axios.post(`${productBase(productId)}/composition/preview`, payload)).data.data;
}
async function searchComponents(params) {
	return (await axios.get("/inventory/composition/components", { params: {
		search: params.search || void 0,
		exclude_product_id: params.excludeProductId && params.excludeProductId > 0 ? params.excludeProductId : void 0,
		per_page: params.perPage ?? 12
	} })).data;
}
/**
* Informational profitability for a POS formula line.
*
* Cost, profit and margin are resolved server-side; this call is skipped
* entirely for users without the cost permission.
*/
async function fetchProfitabilityPreview(productId, input) {
	return (await axios.post(`${productBase(productId)}/composition/cost-preview`, input)).data.data;
}
/**
* Live cost for an unsaved formula (no product id yet). Approximate by design:
* it is shown while the formula is being authored, never used for checkout.
*/
async function previewDraftCost(input) {
	return (await axios.post("/inventory/composition/draft-preview", {
		base_unit_id: input.baseUnitId,
		output_quantity: input.outputQuantity,
		output_unit_id: input.baseUnitId,
		items: input.items.map((item) => ({
			component_product_id: item.componentProductId,
			quantity: item.quantity,
			unit_id: item.unitId,
			wastage_pct: item.wastagePct
		}))
	})).data.data;
}
async function fetchComponentUnits(componentProductId) {
	return (await axios.get("/inventory/composition/units", { params: { component_product_id: componentProductId } })).data.data;
}
function compositionErrorMessage(error) {
	if (axios.isAxiosError(error)) {
		const errors = error.response?.data?.errors;
		if (errors) {
			const first = Object.values(errors)[0];
			if (Array.isArray(first)) return first[0] ?? "Invalid composition.";
			if (typeof first === "string") return first;
		}
		if (typeof error.response?.data?.message === "string") return error.response.data.message;
		if (error.message) return error.message;
	}
	return "Something went wrong while saving the composition.";
}
//#endregion
export { fetchComponentUnits as a, previewComposition as c, updateComposition as d, fetchActiveComposition as i, previewDraftCost as l, createComposition as n, fetchCompositions as o, deactivateComposition as r, fetchProfitabilityPreview as s, compositionErrorMessage as t, searchComponents as u };
