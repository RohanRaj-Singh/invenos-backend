import { i as __toESM, t as require_react } from "./react-DCO0ASPG.js";
import { t as ArrowLeft } from "./arrow-left-CE4TWQlw.js";
import { t as Save } from "./save-D4S_dtxM.js";
import { t as UserCog } from "./user-cog-B7p5Sm6w.js";
import { t as require_jsx_runtime } from "./jsx-runtime-BjJQA5sn.js";
import { Dt as router3, Ot as usePage, Tt as toast, c as updatePermissions, n as PERMISSION_GROUPS, o as getUser } from "./app-DxiW8KTt.js";
import { n as CardContent, t as Card } from "./card-D1ktOUWx.js";
import { SettingsLayout, SettingsSection } from "./SettingsComponents-C8Wof90c.js";
//#region resources/js/Pages/settings/Permissions.tsx
var import_react = /* @__PURE__ */ __toESM(require_react(), 1);
var import_jsx_runtime = require_jsx_runtime();
function PermissionsPage() {
	const { url } = usePage();
	const id = url.split("/").pop() || "";
	const user = (0, import_react.useMemo)(() => getUser(id || ""), [id]);
	const [perms, setPerms] = (0, import_react.useState)(null);
	(0, import_react.useEffect)(() => {
		if (user?.permissions) setPerms(JSON.parse(JSON.stringify(user.permissions)));
	}, [user]);
	if (!user || user.role !== "salesman") return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SettingsLayout, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "p-8 text-center text-sm text-muted-foreground",
		children: "User not found or not a salesman."
	}) });
	const setPerm = (group, action, value) => {
		if (!perms) return;
		setPerms({
			...perms,
			[group]: {
				...perms[group],
				[action]: value
			}
		});
	};
	const handleSave = () => {
		if (!perms) return;
		updatePermissions(user.id, perms);
		toast.success(`Permissions updated for ${user.name}`);
		router3.visit("/settings/users");
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SettingsLayout, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto space-y-6",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "flex items-center justify-between",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
					onClick: () => router3.visit("/settings/users"),
					className: "inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors min-h-[36px]",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowLeft, { className: "size-4" }), " Back to Users"]
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-start gap-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "size-10 rounded-xl bg-gradient-to-br from-indigo-600/20 to-indigo-600/5 flex items-center justify-center shrink-0",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(UserCog, { className: "size-5 text-indigo-600" })
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h1", {
					className: "text-xl font-semibold tracking-tight",
					children: ["Permissions — ", user.name]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-sm text-muted-foreground mt-0.5",
					children: "Configure what this user can access."
				})] })]
			}),
			perms && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SettingsSection, {
				title: "Module Permissions",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3",
					children: PERMISSION_GROUPS.map((group) => {
						const groupPerms = perms[group.key];
						const allOn = group.actions.every((a) => groupPerms[a.action]);
						return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Card, {
							size: "sm",
							className: group.actions.some((a) => groupPerms[a.action]) ? "border-primary/20" : "",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardContent, {
								className: "p-4 space-y-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex items-center justify-between",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h4", {
										className: "text-sm font-semibold",
										children: group.label
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
										onClick: () => group.actions.forEach((a) => setPerm(group.key, a.action, !allOn)),
										className: "text-[10px] text-muted-foreground hover:text-foreground transition-colors",
										children: allOn ? "Clear all" : "Select all"
									})]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "space-y-1",
									children: group.actions.map((a) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
										className: "flex items-center justify-between text-xs min-h-[36px] py-1.5 cursor-pointer hover:bg-muted/30 rounded px-2 -mx-1 transition-colors",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: a.label }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
											type: "checkbox",
											checked: groupPerms[a.action] === true,
											onChange: (e) => setPerm(group.key, a.action, e.target.checked),
											className: "size-3.5 rounded border-input accent-primary"
										})]
									}, a.action))
								})]
							})
						}, group.key);
					})
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex flex-col-reverse sm:flex-row items-stretch sm:items-center justify-end gap-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					onClick: () => router3.visit("/settings/users"),
					className: "px-4 py-2.5 text-sm font-medium rounded-lg border border-border hover:bg-muted transition-colors",
					children: "Cancel"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
					onClick: handleSave,
					className: "inline-flex items-center justify-center gap-1.5 px-4 py-2.5 text-sm font-medium rounded-lg bg-primary text-primary-foreground shadow-sm hover:bg-primary/90 transition-colors",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Save, { className: "size-4" }), " Save Permissions"]
				})]
			})
		]
	}) });
}
//#endregion
export { PermissionsPage as default };
