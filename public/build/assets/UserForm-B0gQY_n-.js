import { i as __toESM, t as require_react } from "./react-DCO0ASPG.js";
import { t as ArrowLeft } from "./arrow-left-CE4TWQlw.js";
import { t as Save } from "./save-D4S_dtxM.js";
import { t as require_jsx_runtime } from "./jsx-runtime-BjJQA5sn.js";
import { Dt as usePage, Et as router3, c as updatePermissions, l as updateUser, n as PERMISSION_GROUPS, o as getUser, r as addUser, t as useAuth, ut as Users, wt as toast } from "./app-DCc201bC.js";
import { n as CardContent, t as Card } from "./card-DQfOgTjC.js";
import { SettingsCard, SettingsLayout, SettingsSection, SettingsToggle } from "./SettingsComponents-Ceiiz-s4.js";
//#region resources/js/Pages/settings/UserForm.tsx
var import_react = /* @__PURE__ */ __toESM(require_react(), 1);
var import_jsx_runtime = require_jsx_runtime();
function UserFormPage() {
	const { url } = usePage();
	const id = url.split("/").pop() || "";
	const auth = useAuth();
	const isNew = !id || id === "new";
	const existing = (0, import_react.useMemo)(() => id && !isNew ? getUser(id) : void 0, [id]);
	const [name, setName] = (0, import_react.useState)("");
	const [username, setUsername] = (0, import_react.useState)("");
	const [password, setPassword] = (0, import_react.useState)("");
	const [phone, setPhone] = (0, import_react.useState)("");
	const [active, setActive] = (0, import_react.useState)(true);
	const [perms, setPerms] = (0, import_react.useState)(null);
	(0, import_react.useEffect)(() => {
		if (existing) {
			setName(existing.name);
			setUsername(existing.username);
			setPhone(existing.phone);
			setActive(existing.active);
			if (existing.permissions) setPerms(JSON.parse(JSON.stringify(existing.permissions)));
		}
	}, [existing]);
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
		if (!name.trim() || !username.trim()) {
			toast.error("Name and username are required");
			return;
		}
		if (existing) {
			updateUser(existing.id, {
				name,
				username,
				phone,
				active
			});
			if (perms && existing.role === "salesman") updatePermissions(existing.id, perms);
			toast.success(`User "${name}" updated`);
			router3.visit("/settings/users");
		} else {
			if (!password) {
				toast.error("Password is required");
				return;
			}
			addUser({
				name,
				username,
				password,
				phone,
				role: "salesman"
			});
			toast.success(`User "${name}" created`);
			router3.visit("/settings/users");
		}
	};
	const isEditingSelf = existing?.id === auth.user?.id;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SettingsLayout, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "p-4 sm:p-6 lg:p-8 max-w-3xl mx-auto space-y-6",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "flex items-center justify-between",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
					onClick: () => router3.visit("/settings/users"),
					className: "inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowLeft, { className: "size-4" }), " Back to Users"]
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-start gap-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "size-10 rounded-xl bg-gradient-to-br from-indigo-600/20 to-indigo-600/5 flex items-center justify-center shrink-0",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Users, { className: "size-5 text-indigo-600" })
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "text-xl font-semibold tracking-tight",
					children: isNew ? "Add Salesman" : "Edit User"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-sm text-muted-foreground mt-0.5",
					children: isNew ? "Create a new user with limited permissions." : "Update user details and permissions."
				})] })]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SettingsSection, {
				title: "User Information",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SettingsCard, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "grid grid-cols-1 sm:grid-cols-2 gap-4",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
							className: "block text-xs font-medium mb-1.5",
							children: "Full Name"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							value: name,
							onChange: (e) => setName(e.target.value),
							placeholder: "e.g. Muhammad Saleem",
							className: "w-full h-9 px-3 rounded-lg border border-input bg-background text-xs outline-none focus:border-ring"
						})] }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
							className: "block text-xs font-medium mb-1.5",
							children: "Username"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							value: username,
							onChange: (e) => setUsername(e.target.value),
							placeholder: "e.g. saleem",
							className: "w-full h-9 px-3 rounded-lg border border-input bg-background text-xs outline-none focus:border-ring"
						})] }),
						isNew && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
							className: "block text-xs font-medium mb-1.5",
							children: "Password"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							type: "password",
							value: password,
							onChange: (e) => setPassword(e.target.value),
							placeholder: "Set a password",
							className: "w-full h-9 px-3 rounded-lg border border-input bg-background text-xs outline-none focus:border-ring"
						})] }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
							className: "block text-xs font-medium mb-1.5",
							children: "Phone (optional)"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							value: phone,
							onChange: (e) => setPhone(e.target.value),
							placeholder: "+92 3XX XXXXXXX",
							className: "w-full h-9 px-3 rounded-lg border border-input bg-background text-xs outline-none focus:border-ring"
						})] }),
						!isNew && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
							className: "block text-xs font-medium mb-1.5",
							children: "Role"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "h-9 flex items-center text-sm font-medium capitalize",
							children: existing?.role
						})] }),
						!isNew && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "flex items-center gap-3",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
								className: "block text-xs font-medium mb-1.5",
								children: "Active"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SettingsToggle, {
								enabled: active,
								onChange: setActive
							})] })
						})
					]
				}) })
			}),
			(existing?.role === "salesman" || isNew) && perms && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SettingsSection, {
				title: "Permissions",
				description: "Control what this user can access.",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "grid grid-cols-1 sm:grid-cols-2 gap-3",
					children: PERMISSION_GROUPS.map((group) => {
						const groupPerms = perms[group.key];
						return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Card, {
							size: "sm",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardContent, {
								className: "p-4 space-y-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h4", {
									className: "text-sm font-semibold",
									children: group.label
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "space-y-1.5",
									children: group.actions.map((a) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
										className: "flex items-center justify-between text-xs py-1 cursor-pointer hover:bg-muted/30 rounded px-1 -mx-1 transition-colors",
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
			isEditingSelf && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "text-xs text-muted-foreground bg-muted/50 rounded-lg px-4 py-3",
				children: "You are currently logged in as this user. Changes take effect immediately."
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-center justify-end gap-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					onClick: () => router3.visit("/settings/users"),
					className: "px-4 py-2 text-sm font-medium rounded-lg border border-border hover:bg-muted transition-colors",
					children: "Cancel"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
					onClick: handleSave,
					className: "inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium rounded-lg bg-primary text-primary-foreground shadow-sm hover:bg-primary/90 transition-colors",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Save, { className: "size-4" }),
						" ",
						isNew ? "Create User" : "Save Changes"
					]
				})]
			})
		]
	}) });
}
//#endregion
export { UserFormPage as default };
