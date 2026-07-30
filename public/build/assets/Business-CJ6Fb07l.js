import { i as __toESM, t as require_react } from "./react-DCO0ASPG.js";
import { t as Building2 } from "./building-2-DGTQudO_.js";
import { t as require_jsx_runtime } from "./jsx-runtime-BjJQA5sn.js";
import { Dt as router3, Ot as usePage, Tt as toast } from "./app-DRCb4nuk.js";
import { SettingsCard, SettingsInput, SettingsLayout, SettingsRow, SettingsSaveBar, SettingsSection } from "./SettingsComponents-95Qwkq1l.js";
//#region resources/js/Pages/settings/Business.tsx
var import_react = /* @__PURE__ */ __toESM(require_react(), 1);
var import_jsx_runtime = require_jsx_runtime();
function BusinessSettingsPage() {
	const { props } = usePage();
	const business = (props.settings || {}).business || {};
	const [draft, setDraft] = (0, import_react.useState)({ ...business });
	const origStr = JSON.stringify(business);
	const hasChanges = JSON.stringify(draft) !== origStr;
	const save = () => {
		router3.put("/settings", { business: draft }, {
			onSuccess: () => toast.success("Business settings saved"),
			onError: () => toast.error("Failed to save settings")
		});
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SettingsLayout, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "p-4 sm:p-6 lg:p-8 max-w-3xl mx-auto space-y-6",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-start gap-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "size-10 rounded-xl bg-gradient-to-br from-blue-600/20 to-blue-600/5 flex items-center justify-center shrink-0",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Building2, { className: "size-5 text-blue-600" })
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "text-xl font-semibold tracking-tight",
					children: "Business Settings"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-sm text-muted-foreground mt-0.5",
					children: "Your business information appears on receipts, reports, and invoices."
				})] })]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SettingsSection, {
				title: "Business Information",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SettingsCard, { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SettingsRow, {
						label: "Business Name",
						description: "Displayed on receipts and reports",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SettingsInput, {
							value: draft.business_name || "",
							onChange: (v) => setDraft({
								...draft,
								business_name: v
							})
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SettingsRow, {
						label: "Business Address",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							value: draft.address || "",
							onChange: (e) => setDraft({
								...draft,
								address: e.target.value
							}),
							className: "w-full sm:w-64 h-9 px-3 rounded-lg border border-input bg-background text-xs outline-none focus:border-ring"
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SettingsRow, {
						label: "Phone Number",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SettingsInput, {
							value: draft.phone || "",
							onChange: (v) => setDraft({
								...draft,
								phone: v
							})
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SettingsRow, {
						label: "Email Address",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SettingsInput, {
							value: draft.email || "",
							onChange: (v) => setDraft({
								...draft,
								email: v
							})
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SettingsRow, {
						label: "Website",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SettingsInput, {
							value: draft.website || "",
							onChange: (v) => setDraft({
								...draft,
								website: v
							})
						})
					})
				] })
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SettingsSection, {
				title: "Localization",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SettingsCard, { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SettingsRow, {
						label: "Currency",
						description: "Default currency for all transactions",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
							value: draft.currency || "PKR",
							onChange: (e) => setDraft({
								...draft,
								currency: e.target.value
							}),
							className: "w-full sm:w-48 h-9 px-3 rounded-lg border border-input bg-background text-xs outline-none focus:border-ring",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
									value: "PKR",
									children: "PKR - Pakistani Rupee"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
									value: "USD",
									children: "USD - US Dollar"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
									value: "INR",
									children: "INR - Indian Rupee"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
									value: "AED",
									children: "AED - UAE Dirham"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
									value: "SAR",
									children: "SAR - Saudi Riyal"
								})
							]
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SettingsRow, {
						label: "Currency Symbol",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SettingsInput, {
							value: draft.currency_symbol || "Rs.",
							onChange: (v) => setDraft({
								...draft,
								currency_symbol: v
							})
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SettingsRow, {
						label: "Timezone",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
							value: draft.timezone || "Asia/Karachi",
							onChange: (e) => setDraft({
								...draft,
								timezone: e.target.value
							}),
							className: "w-full sm:w-48 h-9 px-3 rounded-lg border border-input bg-background text-xs outline-none focus:border-ring",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
									value: "Asia/Karachi",
									children: "Asia/Karachi (PKT)"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
									value: "Asia/Dubai",
									children: "Asia/Dubai (GST)"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
									value: "Asia/Kolkata",
									children: "Asia/Kolkata (IST)"
								})
							]
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SettingsRow, {
						label: "Date Format",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
							value: draft.date_format || "YYYY-MM-DD",
							onChange: (e) => setDraft({
								...draft,
								date_format: e.target.value
							}),
							className: "w-full sm:w-48 h-9 px-3 rounded-lg border border-input bg-background text-xs outline-none focus:border-ring",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
									value: "YYYY-MM-DD",
									children: "YYYY-MM-DD"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
									value: "DD-MM-YYYY",
									children: "DD-MM-YYYY"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
									value: "MM/DD/YYYY",
									children: "MM/DD/YYYY"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
									value: "DD/MM/YYYY",
									children: "DD/MM/YYYY"
								})
							]
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SettingsRow, {
						label: "Time Format",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
							value: draft.time_format || "12h",
							onChange: (e) => setDraft({
								...draft,
								time_format: e.target.value
							}),
							className: "w-full sm:w-48 h-9 px-3 rounded-lg border border-input bg-background text-xs outline-none focus:border-ring",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
								value: "12h",
								children: "12-hour (AM/PM)"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
								value: "24h",
								children: "24-hour"
							})]
						})
					})
				] })
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SettingsSection, {
				title: "Description",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SettingsCard, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SettingsRow, {
					label: "Business Description",
					description: "Short description for internal use",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
						value: draft.description || "",
						onChange: (e) => setDraft({
							...draft,
							description: e.target.value
						}),
						className: "w-full sm:w-64 h-9 px-3 rounded-lg border border-input bg-background text-xs outline-none focus:border-ring"
					})
				}) })
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SettingsSaveBar, {
				onSave: save,
				hasChanges
			})
		]
	}) });
}
//#endregion
export { BusinessSettingsPage as default };
