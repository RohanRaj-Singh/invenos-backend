import { t as Building2 } from "./building-2-DGTQudO_.js";
import { t as Database } from "./database-DaDd39fs.js";
import { t as Info } from "./info-afhqMDHO.js";
import { t as cn } from "./utils-Bim8RyS4.js";
import { t as require_jsx_runtime } from "./jsx-runtime-BjJQA5sn.js";
import { Dt as router3, _t as Package, dt as ShoppingCart, ft as ShoppingBag, ht as Receipt, pt as Settings2 } from "./app-CwPUaRAl.js";
import { n as CardContent, t as Card } from "./card-D1ktOUWx.js";
//#region resources/js/Pages/settings/Index.tsx
var import_jsx_runtime = require_jsx_runtime();
var SECTIONS = [
	{
		id: "business",
		label: "Business Settings",
		desc: "Business name, address, currency, and contact info",
		icon: Building2,
		href: "/settings/business",
		color: "text-blue-600"
	},
	{
		id: "pos",
		label: "POS Settings",
		desc: "Default customer, payment method, receipt size, and scan options",
		icon: ShoppingCart,
		href: "/settings/pos",
		color: "text-emerald-600"
	},
	{
		id: "inventory",
		label: "Inventory Settings",
		desc: "Stock thresholds, units, SKU generation, and valuation",
		icon: Package,
		href: "/settings/inventory",
		color: "text-purple-600"
	},
	{
		id: "sales",
		label: "Sales Settings",
		desc: "Invoice prefix, tax, discount, and sale behaviour",
		icon: ShoppingBag,
		href: "/settings/sales",
		color: "text-amber-600"
	},
	{
		id: "purchases",
		label: "Purchase Settings",
		desc: "Purchase prefix, cost price updates, supplier defaults",
		icon: ShoppingBag,
		href: "/settings/purchases",
		color: "text-orange-600"
	},
	{
		id: "receipt",
		label: "Receipt Settings",
		desc: "Receipt header, footer, logo, and paper size",
		icon: Receipt,
		href: "/settings/receipt",
		color: "text-rose-600"
	},
	{
		id: "backup",
		label: "Backup & Restore",
		desc: "Create and restore system backups",
		icon: Database,
		href: "/settings/backup",
		color: "text-cyan-600"
	},
	{
		id: "about",
		label: "About System",
		desc: "Version, tech stack, and system information",
		icon: Info,
		href: "/settings/about",
		color: "text-slate-600"
	}
];
function SettingsDashboardPage() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto space-y-5",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex items-start gap-3",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "size-10 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center shrink-0",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Settings2, { className: "size-5 text-primary" })
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
				className: "text-xl sm:text-2xl font-semibold tracking-tight",
				children: "Settings"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-sm text-muted-foreground mt-1",
				children: "Configure your application preferences"
			})] })]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "grid grid-cols-1 sm:grid-cols-2 gap-4",
			children: SECTIONS.map((s) => {
				const Icon = s.icon;
				return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					onClick: () => router3.visit(s.href),
					className: "w-full text-left group",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Card, {
						size: "sm",
						className: "transition-all hover:shadow-md hover:border-primary/20 active:scale-[0.99] h-full",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardContent, {
							className: "p-5",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-start gap-4",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: cn("size-10 rounded-lg flex items-center justify-center shrink-0 bg-muted group-hover:bg-primary/10 transition-colors", s.color),
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, { className: "size-5" })
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex-1 min-w-0",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
										className: "text-sm font-semibold",
										children: s.label
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "text-xs text-muted-foreground mt-0.5",
										children: s.desc
									})]
								})]
							})
						})
					})
				}, s.id);
			})
		})]
	});
}
//#endregion
export { SettingsDashboardPage as default };
