import { i as __toESM, t as require_react } from "./react-DCO0ASPG.js";
import { t as Building2 } from "./building-2-DGTQudO_.js";
import { t as DollarSign } from "./dollar-sign-DFlcCTeu.js";
import { t as LoaderCircle } from "./loader-circle-CdtlPMRw.js";
import { t as Save } from "./save-D4S_dtxM.js";
import { t as User } from "./user-DLTIgJdv.js";
import { t as cn } from "./utils-Bim8RyS4.js";
import { t as require_jsx_runtime } from "./jsx-runtime-BjJQA5sn.js";
import { t as Button } from "./button-phKcTdak.js";
import { Dt as toast, ct as X, kt as router3, ut as Users } from "./app-BJCY_l2M.js";
import { i as CardTitle, n as CardContent, r as CardHeader, t as Card } from "./card-DQfOgTjC.js";
//#region resources/js/Pages/contacts/AddContact.tsx
var import_react = /* @__PURE__ */ __toESM(require_react(), 1);
var import_jsx_runtime = require_jsx_runtime();
var ROLES = [
	{
		value: "customer",
		label: "Customer"
	},
	{
		value: "supplier",
		label: "Supplier"
	},
	{
		value: "patient",
		label: "Patient"
	}
];
function AddContactPage() {
	const [type, setType] = (0, import_react.useState)("person");
	const [name, setName] = (0, import_react.useState)("");
	const [companyName, setCompanyName] = (0, import_react.useState)("");
	const [phone, setPhone] = (0, import_react.useState)("");
	const [email, setEmail] = (0, import_react.useState)("");
	const [cnic, setCnic] = (0, import_react.useState)("");
	const [address, setAddress] = (0, import_react.useState)("");
	const [roles, setRoles] = (0, import_react.useState)([]);
	const [openingBalance, setOpeningBalance] = (0, import_react.useState)("");
	const [balanceType, setBalanceType] = (0, import_react.useState)("receivable");
	const [notes, setNotes] = (0, import_react.useState)("");
	const toggleRole = (role) => {
		setRoles((prev) => prev.includes(role) ? prev.filter((r) => r !== role) : [...prev, role]);
	};
	const [saving, setSaving] = (0, import_react.useState)(false);
	const handleSave = () => {
		if (!name.trim() || !phone.trim()) {
			toast.error("Name and phone are required");
			return;
		}
		if (roles.length === 0) {
			toast.error("At least one role is required");
			return;
		}
		setSaving(true);
		const payload = {
			type,
			roles,
			name: name.trim(),
			phone: phone.trim(),
			email: email.trim() || void 0,
			cnic: cnic.trim() || void 0,
			address: address.trim() || void 0,
			opening_balance: openingBalance ? parseFloat(openingBalance) : 0,
			balance_type: balanceType,
			notes: notes.trim() || void 0
		};
		if (type === "organization") {
			payload.company_name = companyName.trim() || void 0;
			payload.contact_person = name.trim() || void 0;
			if (companyName.trim()) payload.name = companyName.trim();
		}
		router3.post("/contacts", payload, {
			onSuccess: () => {
				toast.success(`Contact created!`);
				setSaving(false);
			},
			onError: (errors) => {
				const messages = Object.values(errors).join(", ");
				toast.error(messages || "Failed to create contact");
				setSaving(false);
			}
		});
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto space-y-5",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex items-center justify-between",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
				className: "text-xl sm:text-2xl font-semibold tracking-tight",
				children: "Add Contact"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-sm text-muted-foreground mt-1",
				children: "Create a new person or organization contact."
			})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-center gap-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
					variant: "outline",
					size: "sm",
					onClick: () => router3.visit("/contacts"),
					className: "gap-1.5",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { className: "size-3.5" }), " Cancel"]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
					size: "sm",
					onClick: handleSave,
					disabled: saving,
					className: "gap-1.5 shadow-sm",
					children: [saving ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "size-3.5 animate-spin" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Save, { className: "size-3.5" }), saving ? "Saving..." : "Save Contact"]
				})]
			})]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "grid grid-cols-1 lg:grid-cols-5 gap-6",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "lg:col-span-3 space-y-5",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardHeader, {
						className: "flex-row items-center gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Users, { className: "size-4 text-primary" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardTitle, { children: "Contact Type" })]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardContent, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex gap-3",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							onClick: () => setType("person"),
							className: cn("flex items-center gap-3 flex-1 p-4 rounded-xl border-2 transition-all", type === "person" ? "border-primary bg-primary/5" : "border-border hover:border-muted-foreground/30"),
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(User, { className: cn("size-5", type === "person" ? "text-primary" : "text-muted-foreground") }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "text-left",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "text-sm font-medium",
									children: "Person"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "text-xs text-muted-foreground",
									children: "Patient, Customer, Doctor"
								})]
							})]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							onClick: () => setType("organization"),
							className: cn("flex items-center gap-3 flex-1 p-4 rounded-xl border-2 transition-all", type === "organization" ? "border-primary bg-primary/5" : "border-border hover:border-muted-foreground/30"),
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Building2, { className: cn("size-5", type === "organization" ? "text-primary" : "text-muted-foreground") }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "text-left",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "text-sm font-medium",
									children: "Organization"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "text-xs text-muted-foreground",
									children: "Supplier, Company"
								})]
							})]
						})]
					}) })] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardHeader, {
						className: "flex-row items-center gap-2",
						children: [type === "person" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(User, { className: "size-4 text-primary" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Building2, { className: "size-4 text-primary" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardTitle, { children: type === "person" ? "Personal Information" : "Company Information" })]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardContent, {
						className: "space-y-4",
						children: [
							type === "person" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(FormField, {
								label: "Full Name",
								required: true,
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
									type: "text",
									placeholder: "e.g. Muhammad Ali",
									value: name,
									onChange: (e) => setName(e.target.value),
									className: "w-full h-10 px-3 rounded-lg border border-input bg-background text-sm outline-none focus:border-ring focus:ring-1 focus:ring-ring/30"
								})
							}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FormField, {
								label: "Company Name",
								required: true,
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
									type: "text",
									placeholder: "e.g. ABC Pharma",
									value: companyName,
									onChange: (e) => setCompanyName(e.target.value),
									className: "w-full h-10 px-3 rounded-lg border border-input bg-background text-sm outline-none focus:border-ring focus:ring-1 focus:ring-ring/30"
								})
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(FormField, {
								label: "Contact Person",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
									type: "text",
									placeholder: "e.g. Mr. Khalid Mehmood",
									value: name,
									onChange: (e) => setName(e.target.value),
									className: "w-full h-10 px-3 rounded-lg border border-input bg-background text-sm outline-none focus:border-ring focus:ring-1 focus:ring-ring/30"
								})
							})] }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "grid grid-cols-1 sm:grid-cols-2 gap-4",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FormField, {
									label: "Phone",
									required: true,
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
										type: "text",
										placeholder: "e.g. 0300-1234567",
										value: phone,
										onChange: (e) => setPhone(e.target.value),
										className: "w-full h-10 px-3 rounded-lg border border-input bg-background text-sm outline-none focus:border-ring focus:ring-1 focus:ring-ring/30"
									})
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(FormField, {
									label: "Email",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
										type: "email",
										placeholder: "email@example.com",
										value: email,
										onChange: (e) => setEmail(e.target.value),
										className: "w-full h-10 px-3 rounded-lg border border-input bg-background text-sm outline-none focus:border-ring focus:ring-1 focus:ring-ring/30"
									})
								})]
							}),
							type === "person" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(FormField, {
								label: "CNIC (Optional)",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
									type: "text",
									placeholder: "e.g. 35201-1234567-1",
									value: cnic,
									onChange: (e) => setCnic(e.target.value),
									className: "w-full h-10 px-3 rounded-lg border border-input bg-background text-sm outline-none focus:border-ring focus:ring-1 focus:ring-ring/30"
								})
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FormField, {
								label: "Address",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
									type: "text",
									placeholder: "Full address",
									value: address,
									onChange: (e) => setAddress(e.target.value),
									className: "w-full h-10 px-3 rounded-lg border border-input bg-background text-sm outline-none focus:border-ring focus:ring-1 focus:ring-ring/30"
								})
							})
						]
					})] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardHeader, {
						className: "flex-row items-center gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Users, { className: "size-4 text-primary" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardTitle, { children: "Role Assignment" })]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardContent, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-xs text-muted-foreground mb-3",
						children: "A contact can have multiple roles. This determines how they appear across the system."
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "grid grid-cols-3 gap-3",
						children: ROLES.map((role) => {
							const isSelected = roles.includes(role.value);
							return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
								onClick: () => toggleRole(role.value),
								className: cn("p-3 rounded-xl border-2 text-left transition-all", isSelected ? "border-primary bg-primary/5" : "border-border hover:border-muted-foreground/30"),
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: cn("text-xs font-medium", isSelected ? "text-primary" : "text-muted-foreground"),
									children: role.label
								}), isSelected && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "text-[10px] text-primary mt-0.5",
									children: "✓ Selected"
								})]
							}, role.value);
						})
					})] })] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardHeader, {
						className: "flex-row items-center gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DollarSign, { className: "size-4 text-primary" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardTitle, { children: "Financial Information" })]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardContent, {
						className: "space-y-4",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "grid grid-cols-1 sm:grid-cols-2 gap-4",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FormField, {
								label: "Opening Balance (Rs.)",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
									type: "number",
									placeholder: "0",
									value: openingBalance,
									onChange: (e) => setOpeningBalance(e.target.value),
									className: "w-full h-10 px-3 rounded-lg border border-input bg-background text-sm outline-none focus:border-ring focus:ring-1 focus:ring-ring/30",
									min: "0"
								})
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(FormField, {
								label: "Balance Type",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex gap-2",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
										onClick: () => setBalanceType("receivable"),
										className: cn("flex-1 px-3 py-2 rounded-lg border text-sm font-medium transition-all", balanceType === "receivable" ? "border-amber-400 bg-amber-50 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400" : "border-border text-muted-foreground"),
										children: "Receivable"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
										onClick: () => setBalanceType("payable"),
										className: cn("flex-1 px-3 py-2 rounded-lg border text-sm font-medium transition-all", balanceType === "payable" ? "border-blue-400 bg-blue-50 text-blue-700 dark:bg-blue-500/10 dark:text-blue-400" : "border-border text-muted-foreground"),
										children: "Payable"
									})]
								})
							})]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(FormField, {
							label: "Notes",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("textarea", {
								placeholder: "Internal notes about this contact...",
								value: notes,
								onChange: (e) => setNotes(e.target.value),
								rows: 3,
								className: "w-full px-3 py-2 rounded-lg border border-input bg-background text-sm outline-none focus:border-ring focus:ring-1 focus:ring-ring/30 resize-none"
							})
						})]
					})] })
				]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "lg:col-span-2",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "sticky top-20 space-y-4",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
						size: "sm",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardHeader, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardTitle, { children: "Contact Summary" }) }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardContent, {
							className: "space-y-2",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SummaryRow, {
									label: "Type",
									value: type === "person" ? "Person" : "Organization"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SummaryRow, {
									label: "Name",
									value: type === "person" ? name || "—" : companyName || "—"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SummaryRow, {
									label: "Phone",
									value: phone || "—"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SummaryRow, {
									label: "Roles",
									value: roles.length > 0 ? roles.join(", ") : "None selected"
								}),
								openingBalance && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SummaryRow, {
									label: "Opening Balance",
									value: `Rs. ${openingBalance} (${balanceType})`
								})
							]
						})]
					})
				})
			})]
		})]
	});
}
function FormField({ label, required, children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "space-y-1.5",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
			className: "block text-xs font-medium text-foreground",
			children: [label, required && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "text-red-500 ml-0.5",
				children: "*"
			})]
		}), children]
	});
}
function SummaryRow({ label, value }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex items-center justify-between",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: "text-xs text-muted-foreground",
			children: label
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: "text-xs font-medium text-foreground text-right max-w-[60%] truncate",
			children: value
		})]
	});
}
//#endregion
export { AddContactPage as default };
