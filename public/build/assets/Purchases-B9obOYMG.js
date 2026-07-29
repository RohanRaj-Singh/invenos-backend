import { i as __toESM, t as require_react } from "./react-DCO0ASPG.js";
import { t as ArrowDownLeft } from "./arrow-down-left-CsNVWlHD.js";
import { i as getPurchaseSettings, s as updateSettings } from "./settings-B-1z6X8M.js";
import { t as require_jsx_runtime } from "./jsx-runtime-BjJQA5sn.js";
import { wt as toast } from "./app-fzdHvqQg.js";
import { SettingsCard, SettingsInput, SettingsLayout, SettingsRow, SettingsSaveBar, SettingsSection, SettingsToggle } from "./SettingsComponents-Bk8fwpHg.js";
//#region resources/js/Pages/settings/Purchases.tsx
var import_react = /* @__PURE__ */ __toESM(require_react(), 1);
var import_jsx_runtime = require_jsx_runtime();
function PurchaseSettingsPage() {
	const [orig, setOrig] = (0, import_react.useState)(() => getPurchaseSettings());
	const [draft, setDraft] = (0, import_react.useState)({ ...orig });
	(0, import_react.useEffect)(() => {
		const s = getPurchaseSettings();
		setOrig(s);
		setDraft({ ...s });
	}, []);
	const hasChanges = JSON.stringify(draft) !== JSON.stringify(orig);
	const save = () => {
		updateSettings({ purchases: draft });
		setOrig({ ...draft });
		toast.success("Purchase settings saved");
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SettingsLayout, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "p-4 sm:p-6 lg:p-8 max-w-3xl mx-auto space-y-6",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-start gap-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "size-10 rounded-xl bg-gradient-to-br from-orange-600/20 to-orange-600/5 flex items-center justify-center shrink-0",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowDownLeft, { className: "size-5 text-orange-600" })
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "text-xl font-semibold tracking-tight",
					children: "Purchase Settings"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-sm text-muted-foreground mt-0.5",
					children: "Purchase order numbering, cost update and supplier preferences."
				})] })]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SettingsSection, {
				title: "Purchase Numbering",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SettingsCard, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SettingsRow, {
					label: "Purchase Prefix",
					description: "Prefix used before purchase numbers (e.g. PUR-)",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SettingsInput, {
						value: draft.purchasePrefix,
						onChange: (v) => setDraft({
							...draft,
							purchasePrefix: v
						})
					})
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SettingsRow, {
					label: "Purchase Number Format",
					description: "Format pattern for purchase references",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
						value: draft.purchaseNumberFormat,
						onChange: (e) => setDraft({
							...draft,
							purchaseNumberFormat: e.target.value
						}),
						className: "w-48 h-9 px-3 rounded-lg border border-input bg-background text-xs outline-none focus:border-ring",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
							value: "{PREFIX}{NUMBER}",
							children: "PUR-00001"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
							value: "{PREFIX}{DATE}-{NUMBER}",
							children: "PUR-20260723-001"
						})]
					})
				})] })
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SettingsSection, {
				title: "Behaviour",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SettingsCard, { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SettingsRow, {
						label: "Auto Update Cost Price",
						description: "Update product cost price when receiving purchase",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SettingsToggle, {
							enabled: draft.autoUpdateCostPrice,
							onChange: (v) => setDraft({
								...draft,
								autoUpdateCostPrice: v
							})
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SettingsRow, {
						label: "Require Supplier",
						description: "Force selecting a supplier for purchases",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SettingsToggle, {
							enabled: draft.requireSupplier,
							onChange: (v) => setDraft({
								...draft,
								requireSupplier: v
							})
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SettingsRow, {
						label: "Allow Backdated Purchases",
						description: "Allow creating purchases with past dates",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SettingsToggle, {
							enabled: draft.allowBackdatedPurchases,
							onChange: (v) => setDraft({
								...draft,
								allowBackdatedPurchases: v
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
export { PurchaseSettingsPage as default };
