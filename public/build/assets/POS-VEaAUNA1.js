import { i as __toESM, t as require_react } from "./react-DCO0ASPG.js";
import { r as getPOSSettings, s as updateSettings } from "./settings-B-1z6X8M.js";
import { t as require_jsx_runtime } from "./jsx-runtime-BjJQA5sn.js";
import { Tt as toast, dt as ShoppingCart } from "./app-DQEL3DJY.js";
import { SettingsCard, SettingsInput, SettingsLayout, SettingsRow, SettingsSaveBar, SettingsSection, SettingsToggle } from "./SettingsComponents-CJLQq7Td.js";
//#region resources/js/Pages/settings/POS.tsx
var import_react = /* @__PURE__ */ __toESM(require_react(), 1);
var import_jsx_runtime = require_jsx_runtime();
function POSSettingsPage() {
	const [orig, setOrig] = (0, import_react.useState)(() => getPOSSettings());
	const [draft, setDraft] = (0, import_react.useState)({ ...orig });
	(0, import_react.useEffect)(() => {
		const s = getPOSSettings();
		setOrig(s);
		setDraft({ ...s });
	}, []);
	const hasChanges = JSON.stringify(draft) !== JSON.stringify(orig);
	const save = () => {
		updateSettings({ pos: draft });
		setOrig({ ...draft });
		toast.success("POS settings saved");
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SettingsLayout, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "p-4 sm:p-6 lg:p-8 max-w-3xl mx-auto space-y-6",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-start gap-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "size-10 rounded-xl bg-gradient-to-br from-emerald-600/20 to-emerald-600/5 flex items-center justify-center shrink-0",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ShoppingCart, { className: "size-5 text-emerald-600" })
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "text-xl font-semibold tracking-tight",
					children: "POS Settings"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-sm text-muted-foreground mt-0.5",
					children: "Configure point-of-sale behaviour and defaults."
				})] })]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SettingsSection, {
				title: "Defaults",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SettingsCard, { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SettingsRow, {
						label: "Default Customer",
						description: "Customer selected by default for new sales",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SettingsInput, {
							value: draft.defaultCustomer,
							onChange: (v) => setDraft({
								...draft,
								defaultCustomer: v
							})
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SettingsRow, {
						label: "Default Payment Method",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
							value: draft.defaultPaymentMethod,
							onChange: (e) => setDraft({
								...draft,
								defaultPaymentMethod: e.target.value
							}),
							className: "w-full sm:w-48 h-9 px-3 rounded-lg border border-input bg-background text-xs outline-none focus:border-ring",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
									value: "cash",
									children: "Cash"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
									value: "card",
									children: "Card"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
									value: "transfer",
									children: "Bank Transfer"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
									value: "easypaisa",
									children: "Easypaisa"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
									value: "jazzcash",
									children: "JazzCash"
								})
							]
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SettingsRow, {
						label: "Receipt Size",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
							value: draft.receiptSize,
							onChange: (e) => setDraft({
								...draft,
								receiptSize: e.target.value
							}),
							className: "w-full sm:w-48 h-9 px-3 rounded-lg border border-input bg-background text-xs outline-none focus:border-ring",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
									value: "58mm",
									children: "58mm (Thermal)"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
									value: "80mm",
									children: "80mm (Thermal)"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
									value: "a4",
									children: "A4"
								})
							]
						})
					})
				] })
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SettingsSection, {
				title: "Behaviour",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SettingsCard, { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SettingsRow, {
						label: "Auto Print Receipt",
						description: "Automatically print receipt after each sale",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SettingsToggle, {
							enabled: draft.autoPrintReceipt,
							onChange: (v) => setDraft({
								...draft,
								autoPrintReceipt: v
							})
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SettingsRow, {
						label: "Show Product Images",
						description: "Display product images in POS grid",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SettingsToggle, {
							enabled: draft.showProductImages,
							onChange: (v) => setDraft({
								...draft,
								showProductImages: v
							})
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SettingsRow, {
						label: "Enable Hold Sales",
						description: "Allow pausing and resuming sales",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SettingsToggle, {
							enabled: draft.enableHoldSales,
							onChange: (v) => setDraft({
								...draft,
								enableHoldSales: v
							})
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SettingsRow, {
						label: "Barcode Scanner Enabled",
						description: "Allow barcode input for product lookup",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SettingsToggle, {
							enabled: draft.barcodeScannerEnabled,
							onChange: (v) => setDraft({
								...draft,
								barcodeScannerEnabled: v
							})
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SettingsRow, {
						label: "Keyboard Shortcuts",
						description: "Enable POS keyboard shortcuts",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SettingsToggle, {
							enabled: draft.keyboardShortcutsEnabled,
							onChange: (v) => setDraft({
								...draft,
								keyboardShortcutsEnabled: v
							})
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SettingsRow, {
						label: "Auto-Focus Barcode Field",
						description: "Automatically focus barcode input on new sale",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SettingsToggle, {
							enabled: draft.autoFocusBarcode,
							onChange: (v) => setDraft({
								...draft,
								autoFocusBarcode: v
							})
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SettingsRow, {
						label: "Confirm Before Deleting",
						description: "Show confirmation dialog before deleting items",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SettingsToggle, {
							enabled: draft.confirmBeforeDeleting,
							onChange: (v) => setDraft({
								...draft,
								confirmBeforeDeleting: v
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
export { POSSettingsPage as default };
