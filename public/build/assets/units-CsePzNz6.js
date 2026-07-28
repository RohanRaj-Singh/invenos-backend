//#region resources/js/lib/units.ts
var UNITS = {
	piece: {
		id: "piece",
		name: "Piece",
		measurementType: "count",
		baseFactor: 1,
		baseUnitId: "piece"
	},
	capsule: {
		id: "capsule",
		name: "Capsule",
		measurementType: "count",
		baseFactor: 1,
		baseUnitId: "piece"
	},
	tablet: {
		id: "tablet",
		name: "Tablet",
		measurementType: "count",
		baseFactor: 1,
		baseUnitId: "piece"
	},
	bottle: {
		id: "bottle",
		name: "Bottle",
		measurementType: "count",
		baseFactor: 1,
		baseUnitId: "piece"
	},
	box: {
		id: "box",
		name: "Box",
		measurementType: "count",
		baseFactor: 1,
		baseUnitId: "piece"
	},
	strip: {
		id: "strip",
		name: "Strip",
		measurementType: "count",
		baseFactor: 1,
		baseUnitId: "piece"
	},
	carton: {
		id: "carton",
		name: "Carton",
		measurementType: "count",
		baseFactor: 1,
		baseUnitId: "piece"
	},
	packet: {
		id: "packet",
		name: "Packet",
		measurementType: "count",
		baseFactor: 1,
		baseUnitId: "piece"
	},
	roll: {
		id: "roll",
		name: "Roll",
		measurementType: "count",
		baseFactor: 1,
		baseUnitId: "piece"
	},
	inhaler: {
		id: "inhaler",
		name: "Inhaler",
		measurementType: "count",
		baseFactor: 1,
		baseUnitId: "piece"
	},
	mg: {
		id: "mg",
		name: "mg",
		measurementType: "weight",
		baseFactor: 1,
		baseUnitId: "mg"
	},
	g: {
		id: "g",
		name: "Gram",
		measurementType: "weight",
		baseFactor: 1e3,
		baseUnitId: "mg"
	},
	kg: {
		id: "kg",
		name: "KG",
		measurementType: "weight",
		baseFactor: 1e6,
		baseUnitId: "mg"
	},
	ml: {
		id: "ml",
		name: "mL",
		measurementType: "volume",
		baseFactor: 1,
		baseUnitId: "ml"
	},
	liter: {
		id: "liter",
		name: "Liter",
		measurementType: "volume",
		baseFactor: 1e3,
		baseUnitId: "ml"
	},
	cm: {
		id: "cm",
		name: "cm",
		measurementType: "length",
		baseFactor: 1,
		baseUnitId: "cm"
	},
	meter: {
		id: "meter",
		name: "Meter",
		measurementType: "length",
		baseFactor: 100,
		baseUnitId: "cm"
	}
};
function getUnit(id) {
	return UNITS[id];
}
function getUnitsByType(type) {
	return Object.values(UNITS).filter((u) => u.measurementType === type);
}
/**
* Find a unit by its display name (case-insensitive).
* Useful for backward compat when upgrading from string-based unit names.
*
* @example findUnitByName('KG') → UNITS.kg
* @example findUnitByName('Gram') → UNITS.g
*/
function findUnitByName(name) {
	const normalized = name.trim().toLowerCase();
	return Object.values(UNITS).find((u) => u.name.toLowerCase() === normalized || u.id.toLowerCase() === normalized);
}
/**
* Convert a value between two units.
* Returns null if units are incompatible (different measurement types).
*
* @example convert(2, 'kg', 'g') → 2000
* @example convert(500, 'ml', 'liter') → 0.5
* @example convert(1, 'kg', 'ml') → null (incompatible)
*/
function convert(value, fromId, toId) {
	const from = UNITS[fromId];
	const to = UNITS[toId];
	if (!from || !to) return null;
	if (from.baseUnitId !== to.baseUnitId) return null;
	return value * from.baseFactor / to.baseFactor;
}
/**
* Get units grouped by measurement type, suitable for an optgroup/grouped selector.
* Each group has a label (e.g. "Count", "Weight") and an array of options.
*/
function getBaseUnitOptions() {
	const groups = [];
	for (const type of [
		"count",
		"weight",
		"volume",
		"length"
	]) {
		const units = getUnitsByType(type);
		if (units.length > 0) groups.push({
			label: type.charAt(0).toUpperCase() + type.slice(1),
			options: units.map((u) => ({
				value: u.id,
				label: u.name
			}))
		});
	}
	return groups;
}
/**
* Get a sensible default base unit for a product category.
* Falls back to 'piece' for unknown categories.
*/
function getDefaultUnitForCategory(category) {
	const cat = category.toLowerCase();
	if (cat.includes("medicine")) return "capsule";
	if (cat.includes("grocery")) return "kg";
	if (cat.includes("cosmetic") || cat.includes("skincare")) return "piece";
	if (cat.includes("mobile") || cat.includes("electronic")) return "piece";
	if (cat.includes("clinic")) return "piece";
	return "piece";
}
//#endregion
export { getDefaultUnitForCategory as a, getBaseUnitOptions as i, convert as n, getUnit as o, findUnitByName as r, UNITS as t };
