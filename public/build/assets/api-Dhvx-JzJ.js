import { Nt as axios } from "./app-ByfccPpi.js";
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
		exclude_product_id: params.excludeProductId ?? void 0,
		per_page: params.perPage ?? 12
	} })).data;
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
export { fetchComponentUnits as a, searchComponents as c, fetchActiveComposition as i, updateComposition as l, createComposition as n, fetchCompositions as o, deactivateComposition as r, previewComposition as s, compositionErrorMessage as t };
