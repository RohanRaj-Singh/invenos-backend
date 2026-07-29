import { i as __toESM, t as require_react } from "./react-DCO0ASPG.js";
import { t as createLucideIcon } from "./createLucideIcon--nD-f_FR.js";
import { t as Pencil } from "./pencil-CSxonttV.js";
import { t as Trash2 } from "./trash-2-D6E37i_K.js";
import { t as UserCog } from "./user-cog-B7p5Sm6w.js";
import { t as cn } from "./utils-Bim8RyS4.js";
import { t as require_jsx_runtime } from "./jsx-runtime-BjJQA5sn.js";
import { Et as router3, _t as Plus, i as deleteUser, l as updateUser, s as getUsers, t as useAuth, ut as Users, wt as toast } from "./app-BLMvu7I3.js";
import { n as CardContent, t as Card } from "./card-DQfOgTjC.js";
import { t as Badge } from "./badge-BfSUOZdI.js";
import { SettingsLayout } from "./SettingsComponents-k2N3o7MZ.js";
/**
* @license lucide-react v1.26.0 - ISC
*
* This source code is licensed under the ISC license.
* See the LICENSE file in the root directory of this source tree.
*/
var Shield = createLucideIcon("shield", [["path", {
	d: "M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z",
	key: "oel41y"
}]]);
/**
* @license lucide-react v1.26.0 - ISC
*
* This source code is licensed under the ISC license.
* See the LICENSE file in the root directory of this source tree.
*/
var ToggleLeft = createLucideIcon("toggle-left", [["circle", {
	cx: "9",
	cy: "12",
	r: "3",
	key: "u3jwor"
}], ["rect", {
	width: "20",
	height: "14",
	x: "2",
	y: "5",
	rx: "7",
	key: "g7kal2"
}]]);
/**
* @license lucide-react v1.26.0 - ISC
*
* This source code is licensed under the ISC license.
* See the LICENSE file in the root directory of this source tree.
*/
var ToggleRight = createLucideIcon("toggle-right", [["circle", {
	cx: "15",
	cy: "12",
	r: "3",
	key: "1afu0r"
}], ["rect", {
	width: "20",
	height: "14",
	x: "2",
	y: "5",
	rx: "7",
	key: "g7kal2"
}]]);
//#endregion
//#region resources/js/Pages/settings/UsersList.tsx
var import_react = /* @__PURE__ */ __toESM(require_react(), 1);
var import_jsx_runtime = require_jsx_runtime();
function UsersListPage() {
	const auth = useAuth();
	const [users] = (0, import_react.useState)(() => getUsers());
	const [confirmDelete, setConfirmDelete] = (0, import_react.useState)(null);
	const handleToggle = (userId, currentlyActive) => {
		updateUser(userId, { active: !currentlyActive });
		toast.success(currentlyActive ? "User disabled" : "User enabled");
	};
	const handleDelete = (userId) => {
		if (deleteUser(userId)) {
			toast.success("User deleted");
			setConfirmDelete(null);
		} else {
			toast.error("Cannot delete admin user");
			setConfirmDelete(null);
		}
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SettingsLayout, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto space-y-5",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-start justify-between",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-start gap-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "size-10 rounded-xl bg-gradient-to-br from-indigo-600/20 to-indigo-600/5 flex items-center justify-center shrink-0",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Users, { className: "size-5 text-indigo-600" })
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
						className: "text-xl font-semibold tracking-tight",
						children: "Users & Permissions"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-sm text-muted-foreground mt-0.5",
						children: "Manage users and control what each user can do."
					})] })]
				}), auth.can("settings", "access") && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
					onClick: () => router3.visit("/settings/users/new"),
					className: "inline-flex items-center gap-1.5 px-3 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium shadow-sm hover:bg-primary/90 transition-colors",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, { className: "size-4" }), " Add User"]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Card, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardContent, {
				className: "p-0",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
					className: "w-full",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
						className: "border-b border-border",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Th, { children: "User" }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Th, { children: "Username" }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Th, { children: "Role" }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Th, { children: "Status" }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Th, { children: "Last Login" }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Th, {
								className: "w-32 text-right",
								children: "Actions"
							})
						]
					}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tbody", { children: users.map((u) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
						className: "border-b border-border hover:bg-muted/30 transition-colors",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Td, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-center gap-3",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: cn("size-8 rounded-full flex items-center justify-center text-xs font-bold", u.role === "admin" ? "bg-primary/10 text-primary" : "bg-indigo-50 text-indigo-600 dark:bg-indigo-500/10"),
									children: u.name.charAt(0)
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "text-sm font-medium",
									children: u.name
								}), u.phone && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "text-xs text-muted-foreground",
									children: u.phone
								})] })]
							}) }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Td, {
								className: "text-sm font-mono",
								children: u.username
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Td, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Badge, {
								variant: "outline",
								className: cn("text-[10px] px-1.5 py-0 h-5", u.role === "admin" ? "bg-primary/10 text-primary border-primary/20" : "bg-indigo-50 text-indigo-600 border-indigo-200 dark:bg-indigo-500/10"),
								children: [u.role === "admin" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Shield, { className: "size-3 inline mr-0.5" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(UserCog, { className: "size-3 inline mr-0.5" }), u.role === "admin" ? "Admin" : "Salesman"]
							}) }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Td, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: cn("inline-flex items-center gap-1 text-xs font-medium", u.active ? "text-emerald-600" : "text-muted-foreground"),
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: cn("size-1.5 rounded-full", u.active ? "bg-emerald-500" : "bg-muted-foreground") }), u.active ? "Active" : "Inactive"]
							}) }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Td, {
								className: "text-xs text-muted-foreground",
								children: u.lastLogin ? new Date(u.lastLogin).toLocaleDateString() : "Never"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Td, {
								className: "text-right",
								children: auth.can("settings", "access") && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex items-center justify-end gap-1",
									children: [
										u.role === "salesman" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
											onClick: () => router3.visit(`/settings/users/${u.id}/permissions`),
											className: "flex items-center justify-center size-7 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors",
											title: "Permissions",
											children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(UserCog, { className: "size-3.5" })
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
											onClick: () => router3.visit(u.role === "salesman" ? `/settings/users/${u.id}/edit` : `/settings/users/${u.id}`),
											className: "flex items-center justify-center size-7 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors",
											title: "Edit",
											children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pencil, { className: "size-3.5" })
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
											onClick: () => handleToggle(u.id, u.active),
											className: "flex items-center justify-center size-7 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors",
											title: u.active ? "Disable" : "Enable",
											children: u.active ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ToggleLeft, { className: "size-3.5" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ToggleRight, { className: "size-3.5" })
										}),
										u.role !== "admin" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
											onClick: () => setConfirmDelete(u.id),
											className: "flex items-center justify-center size-7 rounded-md hover:bg-red-50 text-muted-foreground hover:text-red-600 transition-colors",
											title: "Delete",
											children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash2, { className: "size-3.5" })
										})
									]
								})
							})
						]
					}, u.id)) })]
				})
			}) }),
			confirmDelete && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "fixed inset-0 z-50 flex items-center justify-center bg-black/40",
				onClick: () => setConfirmDelete(null),
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "bg-background rounded-xl p-6 max-w-sm mx-4 shadow-2xl",
					onClick: (e) => e.stopPropagation(),
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
							className: "text-base font-semibold mb-2",
							children: "Delete User?"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-sm text-muted-foreground mb-4",
							children: "This action cannot be undone."
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center justify-end gap-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								onClick: () => setConfirmDelete(null),
								className: "px-4 py-2 text-sm font-medium rounded-lg border border-border hover:bg-muted transition-colors",
								children: "Cancel"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								onClick: () => handleDelete(confirmDelete),
								className: "px-4 py-2 text-sm font-medium rounded-lg bg-red-600 text-white hover:bg-red-700 transition-colors",
								children: "Delete"
							})]
						})
					]
				})
			})
		]
	}) });
}
function Th({ children, className }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
		className: cn("px-4 py-3 text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wider", className),
		children
	});
}
function Td({ children, className }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
		className: cn("px-4 py-3", className),
		children
	});
}
//#endregion
export { UsersListPage as default };
