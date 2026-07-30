import { i as __toESM, t as require_react } from "./react-DCO0ASPG.js";
import { a as getSalesSettings, s as updateSettings } from "./settings-B-1z6X8M.js";
import { t as require_jsx_runtime } from "./jsx-runtime-BjJQA5sn.js";
import { Tt as toast, ft as ShoppingBag } from "./app-DQEL3DJY.js";
import { SettingsCard, SettingsInput, SettingsLayout, SettingsRow, SettingsSaveBar, SettingsSection, SettingsToggle } from "./SettingsComponents-CJLQq7Td.js";
//#region resources/js/Pages/settings/Sales.tsx
var import_react = /* @__PURE__ */ __toESM(require_react(), 1);
var import_jsx_runtime = require_jsx_runtime();
function SalesSettingsPage() {
	const [orig, setOrig] = (0, import_react.useState)(() => getSalesSettings());
	const [draft, setDraft] = (0, import_react.useState)({ ...orig });
	(0, import_react.useEffect)(() => {
		const s = getSalesSettings();
		setOrig(s);
		setDraft({ ...s });
	}, []);
	const hasChanges = JSON.stringify(draft) !== JSON.stringify(orig);
	const save = () => {
		updateSettings({ sales: draft });
		setOrig({ ...draft });
		toast.success("Sales settings saved");
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SettingsLayout, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "p-4 sm:p-6 lg:p-8 max-w-3xl mx-auto space-y-6",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-start gap-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "size-10 rounded-xl bg-gradient-to-br from-amber-600/20 to-amber-600/5 flex items-center justify-center shrink-0",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ShoppingBag, { className: "size-5 text-amber-600" })
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "text-xl font-semibold tracking-tight",
					children: "Sales Settings"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-sm text-muted-foreground mt-0.5",
					children: "Invoice numbering, tax, discount and sale preferences."
				})] })]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SettingsSection, {
				title: "Invoice Configuration",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SettingsCard, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SettingsRow, {
					label: "Invoice Prefix",
					description: "Prefix used before invoice numbers (e.g. INV-)",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SettingsInput, {
						value: draft.invoicePrefix,
						onChange: (v) => setDraft({
							...draft,
							invoicePrefix: v
						})
					})
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SettingsRow, {
					label: "Invoice Number Format",
					description: "Format pattern for invoice numbers",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
						value: draft.invoiceNumberFormat,
						onChange: (e) => setDraft({
							...draft,
							invoiceNumberFormat: e.target.value
						}),
						className: "w-full sm:w-48 h-9 px-3 rounded-lg border border-input bg-background text-xs outline-none focus:border-ring",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
								value: "{PREFIX}{NUMBER}",
								children: "INV-00001"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
								value: "{PREFIX}{DATE}-{NUMBER}",
								children: "INV-20260723-001"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
								value: "{YEAR}{NUMBER}",
								children: "202600001"
							})
						]
					})
				})] })
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SettingsSection, {
				title: "Defaults",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SettingsCard, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SettingsRow, {
					label: "Default Tax (%)",
					description: "Default tax rate applied to new sales",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SettingsInput, {
						value: String(draft.defaultTax),
						onChange: (v) => setDraft({
							...draft,
							defaultTax: parseFloat(v) || 0
						}),
						type: "number"
					})
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SettingsRow, {
					label: "Default Discount (%)",
					description: "Default discount applied to new sales",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SettingsInput, {
						value: String(draft.defaultDiscount),
						onChange: (v) => setDraft({
							...draft,
							defaultDiscount: parseFloat(v) || 0
						}),
						type: "number"
					})
				})] })
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SettingsSection, {
				title: "Behaviour",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SettingsCard, { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SettingsRow, {
						label: "Allow Price Override",
						description: "Allow changing prices at the point of sale",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SettingsToggle, {
							enabled: draft.allowPriceOverride,
							onChange: (v) => setDraft({
								...draft,
								allowPriceOverride: v
							})
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SettingsRow, {
						label: "Allow Backdated Sales",
						description: "Allow creating sales with past dates",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SettingsToggle, {
							enabled: draft.allowBackdatedSales,
							onChange: (v) => setDraft({
								...draft,
								allowBackdatedSales: v
							})
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SettingsRow, {
						label: "Round Totals",
						description: "Round invoice totals to nearest whole number",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SettingsToggle, {
							enabled: draft.roundTotals,
							onChange: (v) => setDraft({
								...draft,
								roundTotals: v
							})
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SettingsRow, {
						label: "Enable Draft Sales",
						description: "Allow saving sales as drafts (placeholder)",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SettingsToggle, {
							enabled: draft.enableDraftSales,
							onChange: (v) => setDraft({
								...draft,
								enableDraftSales: v
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
export { SalesSettingsPage as default };
