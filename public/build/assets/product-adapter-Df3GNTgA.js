import { t as UNITS } from "./units-CsePzNz6.js";
//#region resources/js/lib/product-adapter.ts
/**
* Derives legacy PackagingConfig[] from the new sellingUnits model.
* This lets all POS code continue to work without changes.
*
* Each selling unit becomes a PackagingConfig with:
*   - purchasePrice calculated from purchaseConfig (or 0 if no purchase config)
*   - salePrice from the selling unit
*/
function derivePackaging(product) {
	return product.sellingUnits.map((su) => ({
		name: su.name,
		quantity: su.quantity,
		purchasePrice: calculateSellingUnitCost(product, su.id),
		salePrice: su.salePrice,
		barcode: su.barcode,
		sku: su.sku
	}));
}
/**
* Calculate the cost for a specific selling unit.
* Spreads the purchase cost across base units, then multiplies by the
* selling unit's quantity.
*
* @example For a product with purchaseConfig: { cost: 750, quantity: 100 }
*          and a selling unit with quantity: 10
*          → costPerBaseUnit = 750 / 100 = 7.5
*          → sellingUnitCost = 7.5 * 10 = 75
*/
function calculateSellingUnitCost(product, sellingUnitId) {
	const su = product.sellingUnits.find((u) => u.id === sellingUnitId);
	if (!su) return 0;
	if (!product.purchaseConfig) return 0;
	return product.purchaseConfig.cost / product.purchaseConfig.quantity * su.quantity;
}
function calculateMargin(salePrice, cost) {
	const profit = salePrice - cost;
	return {
		profit,
		marginPercent: salePrice > 0 ? profit / salePrice * 100 : 0
	};
}
/**
* Get the default selling unit for a product.
* Returns the one marked isDefault, or the first one in the array.
*/
function getDefaultSellingUnit(product) {
	return product.sellingUnits.find((u) => u.isDefault) || product.sellingUnits[0];
}
/**
* Derive the old baseUnit string from baseUnitId.
*/
function deriveBaseUnitName(baseUnitId) {
	return UNITS[baseUnitId]?.name || baseUnitId;
}
/**
* Ensure a product has both old and new fields populated.
* If only new fields exist, derive old ones.
* If only old fields exist (e.g. from localStorage), derive new ones.
*
* This is idempotent and safe to call on any product.
*/
function ensureBackwardCompat(product) {
	if (product.sellingUnits?.length > 0 && (!product.packaging || product.packaging.length === 0)) product.packaging = derivePackaging(product);
	if (product.baseUnitId && !product.baseUnit) product.baseUnit = deriveBaseUnitName(product.baseUnitId);
	if (product.packaging?.length > 0 && (!product.sellingUnits || product.sellingUnits.length === 0)) product.sellingUnits = product.packaging.map((pkg, idx) => ({
		id: `su-legacy-${product.id}-${idx}`,
		name: pkg.name,
		unitId: product.baseUnitId || "piece",
		quantity: pkg.quantity,
		salePrice: pkg.salePrice,
		barcode: pkg.barcode,
		sku: pkg.sku,
		isDefault: idx === 0
	}));
	if (product.baseUnit && !product.baseUnitId) {
		const name = product.baseUnit;
		product.baseUnitId = Object.values(UNITS).find((u) => u.name.toLowerCase() === name.toLowerCase() || u.id.toLowerCase() === name.toLowerCase())?.id || "piece";
	}
	return product;
}
//#endregion
export { getDefaultSellingUnit as i, calculateSellingUnitCost as n, ensureBackwardCompat as r, calculateMargin as t };
