import { o as getUnit } from "./units-CsePzNz6.js";
//#region resources/js/lib/product-unit-display.ts
/**
* Product Unit Display — Presentation-Only Helpers
*
* This file contains ONLY formatting and presentation logic.
* No business rules, no measurementType checks, no string comparisons on unit IDs.
*
* resolveUnitDisplay is a thin formatting wrapper — it uses the canonical UNITS
* registry for lookup. API resources should provide base_unit_name directly;
* this is a transient helper until all API responses include resolved names.
*
* Business logic lives in \App\Domains\Products\Services\ProductUnitService.
*/
/**
* Resolve a unit ID to its display name.
* Uses the canonical UNITS registry — no business logic.
*
* TRANSIENT: Once API resources expose base_unit_name, prefer using that directly.
*
* @example resolveUnitDisplay('kg') → 'Kilogram (kg)'
* @example resolveUnitDisplay(null) → 'Unit'
*/
function resolveUnitDisplay(unitId) {
	if (!unitId) return "Unit";
	return getUnit(unitId)?.name || unitId || "Unit";
}
/**
* Format stock quantity with pluralization.
*
* @example formatStock(150, 'Capsule') → "150 Capsules"
* @example formatStock(2.5, 'kg') → "2.5 kg"
*/
function formatStock(quantity, unitName) {
	if (!unitName) return String(quantity);
	return `${Number.isInteger(quantity) ? quantity.toString() : quantity.toFixed(2)} ${quantity !== 1 && isPluralizable(unitName) ? pluralize(unitName) : unitName}`;
}
/**
* Pluralize a unit name for display.
*/
function pluralize(unitName) {
	const lower = unitName.toLowerCase();
	if (lower.endsWith("s") && !lower.endsWith("us")) return unitName;
	if (lower.endsWith("x") || lower.endsWith("ch") || lower.endsWith("sh") || lower.endsWith("s")) return unitName + "es";
	if (lower.endsWith("y") && ![
		"ay",
		"ey",
		"iy",
		"oy",
		"uy"
	].some((suf) => lower.endsWith(suf))) return unitName.slice(0, -1) + "ies";
	return unitName + "s";
}
function isPluralizable(unitName) {
	return !(/* @__PURE__ */ new Set([
		"kg",
		"kilogram (kg)",
		"g",
		"gram (g)",
		"mg",
		"milligram (mg)",
		"l",
		"litre (l)",
		"liter (l)",
		"ml",
		"millilitre (ml)",
		"m",
		"meter",
		"cm",
		"centimetre (cm)"
	])).has(unitName.toLowerCase().trim());
}
//#endregion
export { resolveUnitDisplay as n, formatStock as t };
