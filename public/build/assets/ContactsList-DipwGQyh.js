import { i as __toESM, t as require_react } from "./react-DCO0ASPG.js";
import { t as ArrowRight } from "./arrow-right-BaJB_osx.js";
import { t as Building2 } from "./building-2-DGTQudO_.js";
import { t as Phone } from "./phone-CSvtNg5c.js";
import { t as User } from "./user-DLTIgJdv.js";
import { t as cn } from "./utils-Bim8RyS4.js";
import { t as require_jsx_runtime } from "./jsx-runtime-BjJQA5sn.js";
import { t as Button } from "./button-phKcTdak.js";
import { Dt as usePage, Et as router3, _t as Plus, ht as Search, st as formatCurrency, ut as Users } from "./app-DCc201bC.js";
import { n as CardContent, t as Card } from "./card-DQfOgTjC.js";
import { RoleBadgeList } from "./RoleBadge-DzaHTYkk.js";
//#region resources/js/Pages/contacts/ContactsList.tsx
var import_react = /* @__PURE__ */ __toESM(require_react(), 1);
var import_jsx_runtime = require_jsx_runtime();
var roleFilters = [
	{
		label: "All Contacts",
		value: "all"
	},
	{
		label: "Customers",
		value: "customer"
	},
	{
		label: "Suppliers",
		value: "supplier"
	},
	{
		label: "Patients",
		value: "patient"
	}
];
function ContactsListPage() {
	const { props } = usePage();
	const { contacts, meta, filters } = props;
	const [search, setSearch] = (0, import_react.useState)(filters?.search || "");
	const [roleFilter, setRoleFilter] = (0, import_react.useState)(filters?.role || "all");
	const handleSearch = (q) => {
		setSearch(q);
		router3.get("/contacts", {
			search: q,
			role: roleFilter
		}, {
			preserveState: true,
			replace: true
		});
	};
	const handleRoleFilter = (role) => {
		setRoleFilter(role);
		router3.get("/contacts", {
			search,
			role: role === "all" ? void 0 : role
		}, {
			preserveState: true,
			replace: true
		});
	};
	const displayContacts = contacts || [];
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-5",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-start justify-between",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center gap-2 text-primary mb-1",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Users, { className: "size-5" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-xs font-semibold uppercase tracking-wider text-primary",
							children: "Contacts"
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
						className: "text-xl sm:text-2xl font-semibold tracking-tight",
						children: "All Contacts"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "text-sm text-muted-foreground mt-1",
						children: [
							meta?.total || displayContacts.length,
							" contact",
							(meta?.total || displayContacts.length) !== 1 ? "s" : "",
							" across your business"
						]
					})
				] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
					onClick: () => router3.visit("/contacts/add"),
					size: "sm",
					className: "gap-1.5 shadow-sm h-9",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, { className: "size-4" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "hidden sm:inline",
						children: "Add Contact"
					})]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-center gap-3 flex-wrap",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "relative flex-1 max-w-xs",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Search, { className: "absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
						type: "text",
						placeholder: "Search by name, phone, or company...",
						value: search,
						onChange: (e) => handleSearch(e.target.value),
						className: "w-full h-10 pl-9 pr-3 rounded-xl border border-input bg-background text-sm outline-none focus:border-ring focus:ring-1 focus:ring-ring/30"
					})]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "flex items-center gap-1.5 overflow-x-auto scrollbar-none",
					children: roleFilters.map((f) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						onClick: () => handleRoleFilter(f.value),
						className: cn("text-xs font-medium px-3 py-1.5 rounded-lg border transition-colors whitespace-nowrap", roleFilter === f.value ? "bg-foreground text-background border-foreground" : "bg-background text-muted-foreground border-border hover:text-foreground"),
						children: f.label
					}, f.value))
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "hidden md:block rounded-xl border border-border overflow-hidden",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
					className: "w-full",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
						className: "border-b border-border bg-muted/30",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Th, { children: "Name" }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Th, { children: "Type" }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Th, { children: "Roles" }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Th, { children: "Phone" }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Th, { children: "Balance" }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Th, {})
						]
					}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tbody", { children: displayContacts.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tr", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("td", {
						colSpan: 6,
						className: "text-center py-16 text-sm text-muted-foreground",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Users, { className: "size-8 mx-auto mb-2 text-muted-foreground/30" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "No contacts found." })]
					}) }) : displayContacts.map((contact) => {
						const balance = contact.current_balance || 0;
						const isPerson = contact.type === "person";
						return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
							onClick: () => router3.visit(`/contacts/${contact.id}`),
							className: "border-b border-border last:border-b-0 hover:bg-muted/30 cursor-pointer transition-colors group",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									className: "px-4 py-3.5",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex items-center gap-3",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
											className: cn("size-9 rounded-lg flex items-center justify-center shrink-0", isPerson ? "bg-purple-50 text-purple-600 dark:bg-purple-500/10" : "bg-blue-50 text-blue-600 dark:bg-blue-500/10"),
											children: isPerson ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(User, { className: "size-4" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Building2, { className: "size-4" })
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
											className: "text-sm font-medium text-foreground",
											children: contact.name
										}), contact.company_name && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
											className: "text-[11px] text-muted-foreground",
											children: contact.company_name
										})] })]
									})
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									className: "px-4 py-3.5 text-sm capitalize text-muted-foreground",
									children: contact.type
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									className: "px-4 py-3.5",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(RoleBadgeList, {
										roles: contact.roles,
										size: "xs"
									})
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									className: "px-4 py-3.5",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex items-center gap-1.5 text-sm text-muted-foreground",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Phone, { className: "size-3" }), contact.phone]
									})
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									className: "px-4 py-3.5",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
										className: cn("text-sm font-semibold", balance > 0 ? contact.balance_type === "receivable" ? "text-amber-600" : "text-blue-600" : "text-muted-foreground"),
										children: [balance > 0 ? contact.balance_type === "receivable" ? "Owes " : "Owe " : "", formatCurrency(Math.abs(balance))]
									})
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									className: "px-4 py-3.5",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowRight, { className: "size-4 text-muted-foreground/0 group-hover:text-muted-foreground transition-colors" })
								})
							]
						}, contact.id);
					}) })]
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "md:hidden space-y-3",
				children: displayContacts.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "text-center py-16 text-sm text-muted-foreground",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Users, { className: "size-10 mx-auto mb-2 text-muted-foreground/30" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "No contacts found." })]
				}) : displayContacts.map((contact) => {
					const balance = contact.current_balance || 0;
					const isPerson = contact.type === "person";
					return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						onClick: () => router3.visit(`/contacts/${contact.id}`),
						className: "w-full text-left group",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Card, {
							size: "sm",
							className: "transition-all hover:shadow-sm active:scale-[0.99]",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardContent, {
								className: "p-4",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex items-start justify-between mb-3",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "flex items-center gap-3",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
												className: cn("size-10 rounded-xl flex items-center justify-center shrink-0", isPerson ? "bg-purple-50 text-purple-600 dark:bg-purple-500/10" : "bg-blue-50 text-blue-600 dark:bg-blue-500/10"),
												children: isPerson ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(User, { className: "size-5" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Building2, { className: "size-5" })
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
												className: "text-sm font-semibold text-foreground",
												children: contact.name
											}), contact.company_name && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
												className: "text-xs text-muted-foreground",
												children: contact.company_name
											})] })]
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowRight, { className: "size-4 text-muted-foreground/30 group-hover:text-muted-foreground transition-colors" })]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "flex items-center gap-2 mb-2",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(RoleBadgeList, {
											roles: contact.roles,
											size: "xs"
										})
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex items-center justify-between text-sm",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "flex items-center gap-1.5 text-muted-foreground",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Phone, { className: "size-3" }), contact.phone]
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
											className: cn("text-xs font-semibold", balance > 0 ? contact.balance_type === "receivable" ? "text-amber-600" : "text-blue-600" : "text-muted-foreground"),
											children: [balance > 0 ? contact.balance_type === "receivable" ? "Owes " : "Owe " : "", formatCurrency(Math.abs(balance))]
										})]
									})
								]
							})
						})
					}, contact.id);
				})
			})
		]
	});
}
function Th({ children, className }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
		className: cn("px-4 py-3 text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wider", className),
		children
	});
}
//#endregion
export { ContactsListPage as default };
