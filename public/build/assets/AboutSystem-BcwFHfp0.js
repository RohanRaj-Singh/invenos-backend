import { t as createLucideIcon } from "./createLucideIcon--nD-f_FR.js";
import { t as Database } from "./database-DaDd39fs.js";
import { t as Info } from "./info-afhqMDHO.js";
import { t as Server } from "./server-KMs3Vr65.js";
import { t as cn } from "./utils-Bim8RyS4.js";
import { t as require_jsx_runtime } from "./jsx-runtime-BjJQA5sn.js";
import { _t as Package } from "./app-CwPUaRAl.js";
import { n as CardContent, t as Card } from "./card-D1ktOUWx.js";
import { SettingsCard, SettingsLayout, SettingsSection } from "./SettingsComponents-CaMbgP0I.js";
/**
* @license lucide-react v1.26.0 - ISC
*
* This source code is licensed under the ISC license.
* See the LICENSE file in the root directory of this source tree.
*/
var Cpu = createLucideIcon("cpu", [
	["path", {
		d: "M12 20v2",
		key: "1lh1kg"
	}],
	["path", {
		d: "M12 2v2",
		key: "tus03m"
	}],
	["path", {
		d: "M17 20v2",
		key: "1rnc9c"
	}],
	["path", {
		d: "M17 2v2",
		key: "11trls"
	}],
	["path", {
		d: "M2 12h2",
		key: "1t8f8n"
	}],
	["path", {
		d: "M2 17h2",
		key: "7oei6x"
	}],
	["path", {
		d: "M2 7h2",
		key: "asdhe0"
	}],
	["path", {
		d: "M20 12h2",
		key: "1q8mjw"
	}],
	["path", {
		d: "M20 17h2",
		key: "1fpfkl"
	}],
	["path", {
		d: "M20 7h2",
		key: "1o8tra"
	}],
	["path", {
		d: "M7 20v2",
		key: "4gnj0m"
	}],
	["path", {
		d: "M7 2v2",
		key: "1i4yhu"
	}],
	["rect", {
		x: "4",
		y: "4",
		width: "16",
		height: "16",
		rx: "2",
		key: "1vbyd7"
	}],
	["rect", {
		x: "8",
		y: "8",
		width: "8",
		height: "8",
		rx: "1",
		key: "z9xiuo"
	}]
]);
/**
* @license lucide-react v1.26.0 - ISC
*
* This source code is licensed under the ISC license.
* See the LICENSE file in the root directory of this source tree.
*/
var Globe = createLucideIcon("globe", [
	["circle", {
		cx: "12",
		cy: "12",
		r: "10",
		key: "1mglay"
	}],
	["path", {
		d: "M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20",
		key: "13o1zl"
	}],
	["path", {
		d: "M2 12h20",
		key: "9i4pu4"
	}]
]);
//#endregion
//#region resources/js/Pages/settings/AboutSystem.tsx
var import_jsx_runtime = require_jsx_runtime();
var INFO = [
	{
		label: "Application Name",
		value: "Invenos"
	},
	{
		label: "Version",
		value: "1.0.0 (MVP)"
	},
	{
		label: "Build Number",
		value: "20260723.1"
	},
	{
		label: "Environment",
		value: "Development"
	},
	{
		label: "Data Source",
		value: "In-Memory (Mock)"
	},
	{
		label: "License",
		value: "MIT (placeholder)"
	}
];
var TECH = [
	{
		label: "Frontend",
		value: "React 19 + TypeScript",
		icon: Cpu
	},
	{
		label: "Build Tool",
		value: "Vite 6",
		icon: Package
	},
	{
		label: "Styling",
		value: "Tailwind CSS v4",
		icon: Globe
	},
	{
		label: "UI Framework",
		value: "shadcn/ui",
		icon: Server
	},
	{
		label: "State",
		value: "React Hooks + Event Bus",
		icon: Database
	},
	{
		label: "Routing",
		value: "React Router v7",
		icon: Globe
	},
	{
		label: "Data",
		value: "Deterministic Seed Generator",
		icon: Database
	}
];
var STATUS = [
	{
		label: "Application",
		status: "Operational",
		color: "text-emerald-500"
	},
	{
		label: "Dashboard",
		status: "Live",
		color: "text-emerald-500"
	},
	{
		label: "Database",
		status: "Mock (In-Memory)",
		color: "text-amber-500"
	},
	{
		label: "API Server",
		status: "Not Connected",
		color: "text-slate-400"
	},
	{
		label: "Authentication",
		status: "Single User",
		color: "text-cyan-500"
	}
];
function AboutSystemPage() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SettingsLayout, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "p-4 sm:p-6 lg:p-8 max-w-3xl mx-auto space-y-6",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-start gap-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "size-12 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center shrink-0",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Info, { className: "size-6 text-primary" })
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "text-xl font-semibold tracking-tight",
					children: "About System"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-sm text-muted-foreground mt-0.5",
					children: "Application information, technology stack, and system status."
				})] })]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "flex items-center justify-center py-6",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center gap-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "size-14 rounded-2xl bg-primary flex items-center justify-center",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Package, { className: "size-7 text-primary-foreground" })
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "text-2xl font-bold tracking-tight",
						children: "Invenos"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "text-sm text-muted-foreground",
						children: "Cloud Inventory & POS v1.0.0"
					})] })]
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SettingsSection, {
				title: "Application Information",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SettingsCard, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "space-y-1",
					children: INFO.map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center justify-between py-2 px-3 rounded-lg hover:bg-muted/50 transition-colors",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-sm text-muted-foreground",
							children: item.label
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-sm font-medium",
							children: item.value
						})]
					}, item.label))
				}) })
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SettingsSection, {
				title: "Technology Stack",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SettingsCard, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "space-y-1",
					children: TECH.map((item) => {
						const Icon = item.icon;
						return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center gap-3 py-2 px-3 rounded-lg hover:bg-muted/50 transition-colors",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "size-8 rounded-lg bg-muted flex items-center justify-center shrink-0",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, { className: "size-4 text-muted-foreground" })
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex-1",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "text-xs text-muted-foreground",
									children: item.label
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "text-sm font-medium",
									children: item.value
								})]
							})]
						}, item.label);
					})
				}) })
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SettingsSection, {
				title: "System Status",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "grid grid-cols-1 sm:grid-cols-2 gap-3",
					children: STATUS.map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Card, {
						size: "sm",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardContent, {
							className: "p-4",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-center gap-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: cn("size-2 rounded-full", item.color.replace("text-", "bg-")) }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "text-sm font-medium",
									children: item.label
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: cn("text-xs font-medium", item.color),
									children: item.status
								})] })]
							})
						})
					}, item.label))
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "text-center text-xs text-muted-foreground pb-6",
				children: "Built with React 19, TypeScript, Tailwind CSS v4 & shadcn/ui"
			})
		]
	}) });
}
//#endregion
export { AboutSystemPage as default };
