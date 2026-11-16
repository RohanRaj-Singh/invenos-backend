import { a as __toESM, n as require_react, t as require_jsx_runtime } from "./jsx-runtime-Do9val7F.js";
import { Dt as Beaker, Mt as usePage, jt as router3, kt as toast } from "./app-C7AUNtSc.js";
import { SettingsCard, SettingsLayout, SettingsRow, SettingsSaveBar, SettingsSection } from "./SettingsComponents-BTMvZpAN.js";
//#region resources/js/Pages/settings/Composition.tsx
var import_react = /* @__PURE__ */ __toESM(require_react(), 1);
var import_jsx_runtime = require_jsx_runtime();
var DEFAULT_MARGIN = 30;
function CompositionSettingsPage() {
	const { props } = usePage();
	const initial = ((props.settings || {}).composition || {}).target_margin_percent ?? DEFAULT_MARGIN;
	const [margin, setMargin] = (0, import_react.useState)(String(initial));
	const hasChanges = margin !== String(initial);
	const parsed = Number(margin);
	const isValid = margin.trim() !== "" && Number.isFinite(parsed) && parsed >= 0 && parsed < 100;
	const save = () => {
		if (!isValid) {
			toast.error("Target margin must be between 0 and 99.99");
			return;
		}
		router3.put("/settings", { composition: { target_margin_percent: parsed } }, {
			onSuccess: () => toast.success("Formula pricing settings saved"),
			onError: () => toast.error("Failed to save settings")
		});
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SettingsLayout, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "p-4 sm:p-6 lg:p-8 max-w-3xl mx-auto space-y-6",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-start gap-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "size-10 rounded-xl bg-gradient-to-br from-teal-600/20 to-teal-600/5 flex items-center justify-center shrink-0",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Beaker, { className: "size-5 text-teal-600" })
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "text-xl font-semibold tracking-tight",
					children: "Formula Pricing"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-sm text-muted-foreground mt-0.5",
					children: "The target profit margin used to recommend selling prices for formulas."
				})] })]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SettingsSection, {
				title: "Target Margin",
				description: "Applied to every formula as pricing guidance. It never changes a price automatically.",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SettingsCard, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SettingsRow, {
					label: "Target Gross Margin (%)",
					description: "Share of the selling price that should remain as profit after ingredient cost.",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
						type: "number",
						min: "0",
						max: "99.99",
						step: "0.01",
						value: margin,
						onChange: (event) => setMargin(event.target.value),
						"aria-label": "Target gross margin percent",
						className: "w-full sm:w-32 h-9 px-3 rounded-lg border border-input bg-background text-xs tabular-nums outline-none focus:border-ring"
					})
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "px-3 pb-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "text-[11px] leading-relaxed text-muted-foreground",
						children: [
							"Default is ",
							DEFAULT_MARGIN,
							"%. Recommended price = ingredient cost ÷ (1 − margin ÷ 100). For example, a cost of Rs. 700 at ",
							DEFAULT_MARGIN,
							"% recommends Rs. 1,000."
						]
					}), !isValid && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-1.5 text-[11px] font-medium text-red-600",
						children: "Enter a margin from 0 up to 99.99. A gross margin cannot reach 100%."
					})]
				})] })
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "rounded-xl border border-border bg-muted/30 p-3 text-[11px] leading-relaxed text-muted-foreground",
				children: [
					"This is a ",
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "font-medium text-foreground",
						children: "gross margin"
					}),
					", not a markup. A 30% margin means 30% of the price is profit; a 30% markup on Rs. 700 would be Rs. 910, not Rs. 1,000."
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SettingsSaveBar, {
				onSave: save,
				hasChanges
			})
		]
	}) });
}
//#endregion
export { CompositionSettingsPage as default };
