import { i as __toESM, t as require_react } from "./react-DCO0ASPG.js";
import { n as getInventorySettings, s as updateSettings } from "./settings-B-1z6X8M.js";
import { t as require_jsx_runtime } from "./jsx-runtime-BjJQA5sn.js";
import { Tt as toast, _t as Package } from "./app-CwPUaRAl.js";
import { SettingsCard, SettingsInput, SettingsLayout, SettingsRow, SettingsSaveBar, SettingsSection, SettingsToggle } from "./SettingsComponents-CaMbgP0I.js";
//#region resources/js/Pages/settings/Inventory.tsx
var import_react = /* @__PURE__ */ __toESM(require_react(), 1);
var import_jsx_runtime = require_jsx_runtime();
function InventorySettingsPage() {
	const [orig, setOrig] = (0, import_react.useState)(() => getInventorySettings());
	const [draft, setDraft] = (0, import_react.useState)({ ...orig });
	(0, import_react.useEffect)(() => {
		const s = getInventorySettings();
		setOrig(s);
		setDraft({ ...s });
	}, []);
	const hasChanges = JSON.stringify(draft) !== JSON.stringify(orig);
	const save = () => {
		updateSettings({ inventory: draft });
		setOrig({ ...draft });
		toast.success("Inventory settings saved");
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SettingsLayout, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "p-4 sm:p-6 lg:p-8 max-w-3xl mx-auto space-y-6",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-start gap-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "size-10 rounded-xl bg-gradient-to-br from-purple-600/20 to-purple-600/5 flex items-center justify-center shrink-0",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Package, { className: "size-5 text-purple-600" })
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "text-xl font-semibold tracking-tight",
					children: "Inventory Settings"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-sm text-muted-foreground mt-0.5",
					children: "Stock management preferences and defaults."
				})] })]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SettingsSection, {
				title: "Stock Configuration",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SettingsCard, { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SettingsRow, {
						label: "Allow Negative Stock",
						description: "Allow stock to go below zero",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SettingsToggle, {
							enabled: draft.allowNegativeStock,
							onChange: (v) => setDraft({
								...draft,
								allowNegativeStock: v
							})
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SettingsRow, {
						label: "Low Stock Threshold",
						description: "Default threshold for low-stock warnings",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SettingsInput, {
							value: String(draft.lowStockThreshold),
							onChange: (v) => setDraft({
								...draft,
								lowStockThreshold: parseInt(v) || 0
							}),
							type: "number"
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SettingsRow, {
						label: "Default Stock Unit",
						description: "Primary unit for inventory tracking",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
							value: draft.defaultStockUnit,
							onChange: (e) => setDraft({
								...draft,
								defaultStockUnit: e.target.value
							}),
							className: "w-full sm:w-48 h-9 px-3 rounded-lg border border-input bg-background text-xs outline-none focus:border-ring",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
									value: "piece",
									children: "Piece"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
									value: "kg",
									children: "Kilogram"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
									value: "g",
									children: "Gram"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
									value: "liter",
									children: "Liter"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
									value: "ml",
									children: "Milliliter"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
									value: "meter",
									children: "Meter"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
									value: "tablet",
									children: "Tablet"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
									value: "capsule",
									children: "Capsule"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
									value: "bottle",
									children: "Bottle"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
									value: "packet",
									children: "Packet"
								})
							]
						})
					})
				] })
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SettingsSection, {
				title: "Product Configuration",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SettingsCard, { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SettingsRow, {
						label: "Auto Generate SKU",
						description: "Automatically generate SKU for new products",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SettingsToggle, {
							enabled: draft.autoGenerateSKU,
							onChange: (v) => setDraft({
								...draft,
								autoGenerateSKU: v
							})
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SettingsRow, {
						label: "Barcode Format",
						description: "Default barcode symbology",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
							value: draft.barcodeFormat,
							onChange: (e) => setDraft({
								...draft,
								barcodeFormat: e.target.value
							}),
							className: "w-full sm:w-48 h-9 px-3 rounded-lg border border-input bg-background text-xs outline-none focus:border-ring",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
									value: "CODE128",
									children: "CODE128"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
									value: "EAN13",
									children: "EAN-13"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
									value: "UPC",
									children: "UPC"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
									value: "QR",
									children: "QR Code"
								})
							]
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SettingsRow, {
						label: "Stock Valuation Method",
						description: "Method used to calculate inventory value (placeholder)",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SettingsInput, {
							value: draft.stockValuationMethod,
							onChange: (v) => setDraft({
								...draft,
								stockValuationMethod: v
							})
						})
					})
				] })
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SettingsSaveBar, {
				onSave: save,
				hasChanges
			})
		]
	}) });
}
//#endregion
export { InventorySettingsPage as default };
