import { i as __toESM, t as require_react } from "./react-DCO0ASPG.js";
import { t as createLucideIcon } from "./createLucideIcon--nD-f_FR.js";
import { t as ArrowLeft } from "./arrow-left-CE4TWQlw.js";
import { t as Banknote } from "./banknote-B76zKt2w.js";
import { t as Building2 } from "./building-2-DGTQudO_.js";
import { t as MapPin } from "./map-pin-DxxNuOgU.js";
import { t as Phone } from "./phone-CSvtNg5c.js";
import { t as User } from "./user-DLTIgJdv.js";
import { t as cn } from "./utils-Bim8RyS4.js";
import { t as require_jsx_runtime } from "./jsx-runtime-BjJQA5sn.js";
import { t as Button } from "./button-phKcTdak.js";
import { Dt as router3, Ot as usePage, rt as formatCurrency, wt as Activity } from "./app-DQEL3DJY.js";
import { i as CardTitle, n as CardContent, r as CardHeader, t as Card } from "./card-D1ktOUWx.js";
import { RoleBadgeList } from "./RoleBadge-DzaHTYkk.js";
/**
* @license lucide-react v1.26.0 - ISC
*
* This source code is licensed under the ISC license.
* See the LICENSE file in the root directory of this source tree.
*/
var Mail = createLucideIcon("mail", [["path", {
	d: "m22 7-8.991 5.727a2 2 0 0 1-2.009 0L2 7",
	key: "132q7q"
}], ["rect", {
	x: "2",
	y: "4",
	width: "20",
	height: "16",
	rx: "2",
	key: "izxlao"
}]]);
//#endregion
//#region resources/js/Pages/contacts/ContactDetail.tsx
var import_react = /* @__PURE__ */ __toESM(require_react(), 1);
var import_jsx_runtime = require_jsx_runtime();
var tabs = [{
	id: "overview",
	label: "Overview",
	icon: User
}, {
	id: "transactions",
	label: "Transactions",
	icon: Activity
}];
function ContactDetailPage() {
	const { props } = usePage();
	const { contact, transactions } = props;
	const txnList = transactions || [];
	const [activeTab, setActiveTab] = (0, import_react.useState)("overview");
	if (!contact) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto pb-20 sm:pb-8",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex flex-col items-center justify-center py-24 text-sm text-muted-foreground",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(User, { className: "size-12 text-muted-foreground/30 mb-4" }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "text-lg font-semibold text-foreground mb-1",
					children: "Contact not found"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					variant: "outline",
					onClick: () => router3.visit("/contacts"),
					children: "Back to Contacts"
				})
			]
		})
	});
	const isPerson = contact.type === "person";
	const balance = contact.current_balance || 0;
	const isPayable = contact.balance_type === "payable";
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto space-y-5 pb-20 sm:pb-8",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "flex items-center justify-between",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
					onClick: () => router3.visit("/contacts"),
					className: "inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowLeft, { className: "size-4" }),
						" ",
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Back to contacts" })
					]
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
				className: "overflow-hidden",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "h-16 sm:h-24 bg-gradient-to-r from-primary/80 to-primary/40" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardContent, {
					className: "p-0",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "px-5 pb-5",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-end gap-4 -mt-10 mb-4",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: cn("size-16 sm:size-20 rounded-xl ring-4 ring-background flex items-center justify-center text-xl sm:text-2xl font-bold shadow-sm", isPerson ? "bg-purple-100 text-purple-600 dark:bg-purple-900/50 dark:text-purple-300" : "bg-blue-100 text-blue-600 dark:bg-blue-900/50 dark:text-blue-300"),
									children: isPerson ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(User, { className: "size-7" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Building2, { className: "size-7" })
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "pt-2",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
											className: "text-xl sm:text-2xl font-semibold tracking-tight",
											children: contact.name
										}),
										contact.company_name && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "text-sm text-muted-foreground",
											children: contact.company_name
										}),
										contact.contact_person && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
											className: "text-xs text-muted-foreground",
											children: ["Contact: ", contact.contact_person]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
											className: "mt-1",
											children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(RoleBadgeList, { roles: contact.roles })
										})
									]
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-1.5 sm:gap-3",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CompactInfo, {
										icon: Phone,
										label: "Phone",
										value: contact.phone
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CompactInfo, {
										icon: Mail,
										label: "Email",
										value: contact.email || "—"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CompactInfo, {
										icon: MapPin,
										label: "Address",
										value: contact.address || "—"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex items-center gap-1.5 sm:gap-2.5 text-xs sm:text-sm",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
											className: "flex items-center justify-center size-6 sm:size-8 rounded-lg bg-muted shrink-0",
											children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Banknote, { className: "size-3 sm:size-3.5 text-muted-foreground" })
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "min-w-0",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
												className: "text-[10px] sm:text-xs text-muted-foreground truncate",
												children: isPayable ? "Payable" : "Receivable"
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
												className: cn("text-xs sm:text-sm font-semibold truncate", balance > 0 ? isPayable ? "text-blue-600" : "text-amber-600" : "text-muted-foreground"),
												children: formatCurrency(Math.abs(balance))
											})]
										})]
									})
								]
							}),
							contact.cnic && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "mt-2 text-xs text-muted-foreground",
								children: ["CNIC: ", contact.cnic]
							})
						]
					})
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "border-b border-border",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "flex -mb-px overflow-x-auto scrollbar-none",
					children: tabs.map((tab) => {
						const Icon = tab.icon;
						return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							onClick: () => setActiveTab(tab.id),
							className: cn("flex items-center gap-2 px-3 sm:px-4 py-3 text-sm font-medium border-b-2 transition-colors shrink-0 whitespace-nowrap", activeTab === tab.id ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground/30"),
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, { className: "size-4" }),
								" ",
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: tab.label })
							]
						}, tab.id);
					})
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [activeTab === "overview" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Card, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardContent, {
				className: "text-center py-12 text-sm text-muted-foreground",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(User, { className: "size-8 mx-auto mb-2 text-muted-foreground/30" }),
					contact.notes && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-xs max-w-md mx-auto",
						children: contact.notes
					}),
					!contact.notes && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "No additional details." }),
					contact.opening_balance > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "text-xs mt-2",
						children: ["Opening balance: ", formatCurrency(contact.opening_balance)]
					})
				]
			}) }), activeTab === "transactions" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardHeader, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardTitle, { children: "Transaction History" }) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardContent, { children: txnList.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "text-center py-6 text-sm text-muted-foreground",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Activity, { className: "size-8 mx-auto mb-2 text-muted-foreground/30" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "No transactions yet." })]
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "space-y-1",
				children: txnList.map((txn) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center justify-between py-3 px-3 rounded-lg hover:bg-muted/50 transition-colors",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center gap-3 min-w-0 flex-1",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: cn("size-8 sm:size-9 rounded-lg flex items-center justify-center shrink-0", txn.direction === "in" ? "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10" : "bg-red-50 text-red-600 dark:bg-red-500/10"),
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Banknote, { className: "size-4" })
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "min-w-0",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "text-sm font-medium text-foreground capitalize truncate",
									children: txn.type.replace(/_/g, " ")
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "text-xs text-muted-foreground truncate",
									children: [
										formatDisplayDate(txn.date),
										" · ",
										txn.reference
									]
								}),
								txn.description && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "text-[11px] text-muted-foreground/70 truncate mt-0.5",
									children: txn.description
								})
							]
						})]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
						className: cn("text-sm font-semibold shrink-0 ml-2", txn.direction === "in" ? "text-emerald-600" : "text-red-600"),
						children: [txn.direction === "in" ? "+" : "-", formatCurrency(txn.amount)]
					})]
				}, txn.id))
			}) })] })] })
		]
	});
}
/** Compact info item for grid display */
function CompactInfo({ icon: Icon, label, value }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex items-center gap-1.5 sm:gap-2.5 text-xs sm:text-sm min-w-0",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "flex items-center justify-center size-6 sm:size-8 rounded-lg bg-muted shrink-0",
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, { className: "size-3 sm:size-3.5 text-muted-foreground" })
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "min-w-0",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "text-[10px] sm:text-xs text-muted-foreground truncate",
				children: label
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "text-xs sm:text-sm font-medium truncate",
				children: value
			})]
		})]
	});
}
function formatDisplayDate(dateStr) {
	if (!dateStr) return "—";
	try {
		const d = new Date(dateStr);
		if (isNaN(d.getTime())) return dateStr;
		return `${d.getDate().toString().padStart(2, "0")} ${[
			"Jan",
			"Feb",
			"Mar",
			"Apr",
			"May",
			"Jun",
			"Jul",
			"Aug",
			"Sep",
			"Oct",
			"Nov",
			"Dec"
		][d.getMonth()]} ${d.getFullYear()}`;
	} catch {
		return dateStr;
	}
}
//#endregion
export { ContactDetailPage as default };
