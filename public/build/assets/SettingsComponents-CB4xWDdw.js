import { t as cn } from "./utils-Bim8RyS4.js";
import { t as require_jsx_runtime } from "./jsx-runtime-BjJQA5sn.js";
import { Dt as router3, Ot as usePage } from "./app-CwPUaRAl.js";
//#region resources/js/Pages/settings/components/SettingsComponents.tsx
var import_jsx_runtime = require_jsx_runtime();
var SETTINGS_SECTIONS = [
	{
		id: "general",
		label: "General",
		href: "/settings"
	},
	{
		id: "business",
		label: "Business",
		href: "/settings/business"
	},
	{
		id: "pos",
		label: "POS",
		href: "/settings/pos"
	},
	{
		id: "inventory",
		label: "Inventory",
		href: "/settings/inventory"
	},
	{
		id: "sales",
		label: "Sales",
		href: "/settings/sales"
	},
	{
		id: "purchases",
		label: "Purchases",
		href: "/settings/purchases"
	},
	{
		id: "receipt",
		label: "Receipt",
		href: "/settings/receipt"
	},
	{
		id: "backup",
		label: "Backup & Restore",
		href: "/settings/backup"
	},
	{
		id: "about",
		label: "About System",
		href: "/settings/about"
	}
];
function SettingsLayout({ children }) {
	const { url } = usePage();
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "md:hidden",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "border-b border-border bg-background",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "overflow-x-auto no-scrollbar",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "flex gap-1 px-4 py-2 min-w-max",
					children: SETTINGS_SECTIONS.map((s) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						onClick: () => router3.visit(s.href),
						className: cn("whitespace-nowrap px-3 py-2 rounded-lg text-xs font-medium transition-colors min-h-[36px]", url === s.href ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground border border-border"),
						children: s.label
					}, s.id))
				})
			})
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { children })]
	}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "hidden md:flex md:flex-row",
		style: { height: "calc(100vh - 57px)" },
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex flex-col w-48 shrink-0 border-r border-border p-3 space-y-0.5",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3 py-2",
				children: "Settings"
			}), SETTINGS_SECTIONS.map((s) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				onClick: () => router3.visit(s.href),
				className: cn("text-left px-3 py-1.5 rounded-md text-xs font-medium transition-colors", url === s.href ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground hover:bg-muted"),
				children: s.label
			}, s.id))]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "flex-1 overflow-y-auto",
			children
		})]
	})] });
}
function SettingsSection({ title, description, children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "space-y-4",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
			className: "text-base font-semibold",
			children: title
		}), description && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "text-xs text-muted-foreground mt-0.5",
			children: description
		})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "space-y-3",
			children
		})]
	});
}
function SettingsCard({ children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "rounded-xl border border-border bg-card p-5 space-y-4",
		children
	});
}
function SettingsRow({ label, description, children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 sm:gap-4 py-2",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex-1 min-w-0",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "text-sm font-medium text-foreground",
				children: label
			}), description && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "text-xs text-muted-foreground mt-0.5",
				children: description
			})]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "shrink-0 w-full sm:w-auto",
			children
		})]
	});
}
function SettingsInput({ value, onChange, placeholder, type = "text" }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
		type,
		value,
		onChange: (e) => onChange(e.target.value),
		placeholder,
		className: "w-full sm:w-48 h-9 px-3 rounded-lg border border-input bg-background text-xs outline-none focus:border-ring transition-colors"
	});
}
function SettingsSelect({ value, onChange, options }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("select", {
		value,
		onChange: (e) => onChange(e.target.value),
		className: "w-full sm:w-48 h-9 px-3 rounded-lg border border-input bg-background text-xs outline-none focus:border-ring transition-colors",
		children: options.map((o) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
			value: o.value,
			children: o.label
		}, o.value))
	});
}
function SettingsToggle({ enabled, onChange }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
		type: "button",
		onClick: () => onChange(!enabled),
		className: cn("relative inline-flex h-5 w-9 shrink-0 rounded-full border-2 border-transparent transition-colors cursor-pointer", enabled ? "bg-primary" : "bg-muted-foreground/30"),
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: cn("pointer-events-none inline-block size-4 rounded-full bg-white shadow transform ring-0 transition-transform", enabled ? "translate-x-4" : "translate-x-0") })
	});
}
function SettingsSaveBar({ onSave, hasChanges }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "sticky bottom-0 bg-card border-t border-border px-5 py-3 flex justify-end gap-3",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
			onClick: onSave,
			disabled: !hasChanges,
			className: "px-4 py-2 text-sm font-medium rounded-lg bg-primary text-primary-foreground shadow-sm hover:bg-primary/90 transition-colors disabled:opacity-40 disabled:cursor-not-allowed",
			children: "Save Changes"
		})
	});
}
//#endregion
export { SettingsCard, SettingsInput, SettingsLayout, SettingsRow, SettingsSaveBar, SettingsSection, SettingsSelect, SettingsToggle };
