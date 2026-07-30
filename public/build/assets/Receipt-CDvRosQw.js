import { i as __toESM, t as require_react } from "./react-DCO0ASPG.js";
import { t as Eye } from "./eye-C9acyGZL.js";
import { t as cn } from "./utils-Bim8RyS4.js";
import { t as require_jsx_runtime } from "./jsx-runtime-BjJQA5sn.js";
import { At as usePage, Dt as toast, _t as Receipt, kt as router3 } from "./app-BJCY_l2M.js";
import { SettingsCard, SettingsInput, SettingsLayout, SettingsRow, SettingsSaveBar, SettingsSection, SettingsToggle } from "./SettingsComponents-Jnbtj4e8.js";
//#region resources/js/Pages/settings/Receipt.tsx
var import_react = /* @__PURE__ */ __toESM(require_react(), 1);
var import_jsx_runtime = require_jsx_runtime();
function ReceiptSettingsPage() {
	const { props } = usePage();
	const settings = props.settings || {};
	const receipt = settings.receipt || {};
	const business = settings.business || {};
	const [draft, setDraft] = (0, import_react.useState)({ ...receipt });
	const origStr = JSON.stringify(receipt);
	const hasChanges = JSON.stringify(draft) !== origStr;
	const set = (key, val) => setDraft({
		...draft,
		[key]: val
	});
	const save = () => {
		router3.put("/settings", { receipt: draft }, {
			onSuccess: () => toast.success("Receipt settings saved"),
			onError: () => toast.error("Failed to save settings")
		});
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SettingsLayout, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto space-y-6",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-start gap-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "size-10 rounded-xl bg-gradient-to-br from-rose-600/20 to-rose-600/5 flex items-center justify-center shrink-0",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Receipt, { className: "size-5 text-rose-600" })
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "text-xl font-semibold tracking-tight",
					children: "Receipt Settings"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-sm text-muted-foreground mt-0.5",
					children: "Control what appears on printed Purchase Bills and Sale Invoices."
				})] })]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "grid grid-cols-1 lg:grid-cols-2 gap-6",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "space-y-5",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SettingsSection, {
							title: "Document Titles",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SettingsCard, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SettingsRow, {
								label: "Purchase Bill Title",
								description: "Heading on purchase printouts",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SettingsInput, {
									value: draft.purchase_title || "Purchase Bill",
									onChange: (v) => set("purchase_title", v)
								})
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SettingsRow, {
								label: "Sale Invoice Title",
								description: "Heading on sale printouts",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SettingsInput, {
									value: draft.sale_title || "Sale Invoice",
									onChange: (v) => set("sale_title", v)
								})
							})] })
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SettingsSection, {
							title: "Business Information Visibility",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SettingsCard, { children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SettingsRow, {
									label: "Business Logo",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SettingsToggle, {
										enabled: !!draft.show_business_logo,
										onChange: (v) => set("show_business_logo", v)
									})
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SettingsRow, {
									label: "Business Name",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SettingsToggle, {
										enabled: !!draft.show_business_name,
										onChange: (v) => set("show_business_name", v)
									})
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SettingsRow, {
									label: "Address",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SettingsToggle, {
										enabled: !!draft.show_business_address,
										onChange: (v) => set("show_business_address", v)
									})
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SettingsRow, {
									label: "Phone Number",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SettingsToggle, {
										enabled: !!draft.show_phone,
										onChange: (v) => set("show_phone", v)
									})
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SettingsRow, {
									label: "Email",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SettingsToggle, {
										enabled: !!draft.show_email,
										onChange: (v) => set("show_email", v)
									})
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SettingsRow, {
									label: "Website",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SettingsToggle, {
										enabled: !!draft.show_website,
										onChange: (v) => set("show_website", v)
									})
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SettingsRow, {
									label: "Tax Number / NTN",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SettingsToggle, {
										enabled: !!draft.show_tax_number,
										onChange: (v) => set("show_tax_number", v)
									})
								})
							] })
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SettingsSection, {
							title: "Invoice Information",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SettingsCard, { children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SettingsRow, {
									label: "Invoice Number",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SettingsToggle, {
										enabled: !!draft.show_invoice_number,
										onChange: (v) => set("show_invoice_number", v)
									})
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SettingsRow, {
									label: "Date",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SettingsToggle, {
										enabled: !!draft.show_date,
										onChange: (v) => set("show_date", v)
									})
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SettingsRow, {
									label: "Payment Status Badge",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SettingsToggle, {
										enabled: !!draft.show_payment_status,
										onChange: (v) => set("show_payment_status", v)
									})
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SettingsRow, {
									label: "Payment Method",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SettingsToggle, {
										enabled: !!draft.show_payment_method,
										onChange: (v) => set("show_payment_method", v)
									})
								})
							] })
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SettingsSection, {
							title: "Customer / Supplier Information",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SettingsCard, { children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SettingsRow, {
									label: "Name",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SettingsToggle, {
										enabled: !!draft.show_party_name,
										onChange: (v) => set("show_party_name", v)
									})
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SettingsRow, {
									label: "Phone Number",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SettingsToggle, {
										enabled: !!draft.show_party_phone,
										onChange: (v) => set("show_party_phone", v)
									})
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SettingsRow, {
									label: "Address",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SettingsToggle, {
										enabled: !!draft.show_party_address,
										onChange: (v) => set("show_party_address", v)
									})
								})
							] })
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SettingsSection, {
							title: "Items Table Columns",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SettingsCard, { children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SettingsRow, {
									label: "Unit",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SettingsToggle, {
										enabled: !!draft.show_item_unit,
										onChange: (v) => set("show_item_unit", v)
									})
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SettingsRow, {
									label: "Discount Column",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SettingsToggle, {
										enabled: !!draft.show_item_discount,
										onChange: (v) => set("show_item_discount", v)
									})
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SettingsRow, {
									label: "SKU",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SettingsToggle, {
										enabled: !!draft.show_item_sku,
										onChange: (v) => set("show_item_sku", v)
									})
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SettingsRow, {
									label: "Barcode",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SettingsToggle, {
										enabled: !!draft.show_item_barcode,
										onChange: (v) => set("show_item_barcode", v)
									})
								})
							] })
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SettingsSection, {
							title: "Totals Display",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SettingsCard, { children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SettingsRow, {
									label: "Subtotal",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SettingsToggle, {
										enabled: !!draft.show_subtotal,
										onChange: (v) => set("show_subtotal", v)
									})
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SettingsRow, {
									label: "Discount",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SettingsToggle, {
										enabled: !!draft.show_discount,
										onChange: (v) => set("show_discount", v)
									})
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SettingsRow, {
									label: "Grand Total",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SettingsToggle, {
										enabled: !!draft.show_grand_total,
										onChange: (v) => set("show_grand_total", v)
									})
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SettingsRow, {
									label: "Paid Amount",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SettingsToggle, {
										enabled: !!draft.show_paid,
										onChange: (v) => set("show_paid", v)
									})
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SettingsRow, {
									label: "Remaining Balance",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SettingsToggle, {
										enabled: !!draft.show_remaining,
										onChange: (v) => set("show_remaining", v)
									})
								})
							] })
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SettingsSection, {
							title: "Footer",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SettingsCard, { children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SettingsRow, {
									label: "Thank You Message",
									description: "Short heading above the footer",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
										value: draft.header_text || "",
										onChange: (e) => set("header_text", e.target.value),
										className: "w-full h-9 px-3 rounded-lg border border-input bg-background text-xs outline-none focus:border-ring"
									})
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SettingsRow, {
									label: "Footer Message",
									description: "Multi-line. Displayed at the bottom of every invoice.",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("textarea", {
										value: draft.footer_text || "",
										onChange: (e) => set("footer_text", e.target.value),
										rows: 3,
										className: "w-full px-3 py-2 rounded-lg border border-input bg-background text-xs outline-none focus:border-ring resize-none",
										placeholder: "Goods once sold will not be taken back."
									})
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SettingsRow, {
									label: "Terms & Conditions",
									description: "Warranty, return policy, payment terms.",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("textarea", {
										value: draft.terms_conditions || "",
										onChange: (e) => set("terms_conditions", e.target.value),
										rows: 3,
										className: "w-full px-3 py-2 rounded-lg border border-input bg-background text-xs outline-none focus:border-ring resize-none",
										placeholder: "Optional — only shown when filled in."
									})
								})
							] })
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SettingsSection, {
							title: "Signature Section",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SettingsCard, { children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SettingsRow, {
									label: "Customer Signature",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SettingsToggle, {
										enabled: !!draft.show_customer_signature,
										onChange: (v) => set("show_customer_signature", v)
									})
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SettingsRow, {
									label: "Authorized Signature",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SettingsToggle, {
										enabled: !!draft.show_authorized_signature,
										onChange: (v) => set("show_authorized_signature", v)
									})
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SettingsRow, {
									label: "Received By",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SettingsToggle, {
										enabled: !!draft.show_received_by,
										onChange: (v) => set("show_received_by", v)
									})
								})
							] })
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SettingsSection, {
							title: "Print Options",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SettingsCard, { children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SettingsRow, {
									label: "Paper Size",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
										value: draft.paper_size || "A4",
										onChange: (e) => set("paper_size", e.target.value),
										className: "w-32 h-9 px-3 rounded-lg border border-input bg-background text-xs outline-none focus:border-ring",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
												value: "A4",
												children: "A4"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
												value: "A5",
												children: "A5"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
												value: "58mm",
												children: "58mm (Thermal)"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
												value: "80mm",
												children: "80mm (Thermal)"
											})
										]
									})
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SettingsRow, {
									label: "Print Date on Document",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SettingsToggle, {
										enabled: !!draft.show_print_date,
										onChange: (v) => set("show_print_date", v)
									})
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SettingsRow, {
									label: "Page Numbers",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SettingsToggle, {
										enabled: !!draft.show_page_numbers,
										onChange: (v) => set("show_page_numbers", v)
									})
								})
							] })
						})
					]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-1.5",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Eye, { className: "size-3.5" }), " Preview"]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: cn("bg-white text-black rounded-lg shadow-sm border border-gray-200 p-4 font-mono text-[9px] leading-tight mx-auto", (draft.paper_size || "A4") === "58mm" ? "max-w-[180px]" : "max-w-[260px]"),
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "text-center mb-2",
								children: [
									draft.show_business_logo && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "w-6 h-6 bg-gray-300 rounded mx-auto mb-1" }),
									draft.show_business_name && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "font-bold text-[11px]",
										children: business.business_name || "Your Business"
									}),
									draft.show_business_address && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "text-gray-500",
										children: business.address || "123 Street"
									}),
									draft.show_phone && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "text-gray-500",
										children: business.phone || "+92-300-xxxxxxx"
									}),
									draft.show_email && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "text-gray-500",
										children: business.email || "info@example.com"
									})
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "border-t border-dashed border-gray-300 my-1.5" }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "text-center font-bold mb-1",
								children: "INVOICE"
							}),
							draft.show_invoice_number && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex justify-between text-gray-600",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Invoice #" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "INV-001" })]
							}),
							draft.show_date && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex justify-between text-gray-600",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Date" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "27 Jul 2026" })]
							}),
							draft.show_payment_status && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex justify-between",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Status" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-emerald-600 font-semibold",
									children: "Paid"
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "border-t border-dashed border-gray-300 my-1.5" }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex justify-between font-semibold",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Item" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Amount" })]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex justify-between text-gray-600",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Product 1" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "150" })]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex justify-between text-gray-600",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Product 2" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "250" })]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "border-t border-dashed border-gray-300 my-1.5" }),
							draft.show_subtotal && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex justify-between",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Subtotal" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "400" })]
							}),
							draft.show_discount && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex justify-between text-red-600",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Discount" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "-0" })]
							}),
							draft.show_grand_total && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex justify-between font-bold",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Total" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "400" })]
							}),
							draft.show_paid && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex justify-between",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Paid" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "400" })]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "border-t border-dashed border-gray-300 my-1.5" }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "text-center text-gray-500",
								children: draft.header_text || "Thank you!"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "text-center text-gray-400 text-[8px] mt-1",
								children: draft.footer_text || ""
							}),
							draft.terms_conditions && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "text-center text-gray-400 text-[8px] mt-1",
								children: draft.terms_conditions
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex justify-between mt-3 text-gray-500 text-[8px]",
								children: [draft.show_customer_signature && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { children: "Customer: _________" }), draft.show_authorized_signature && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { children: "Authorized: _________" })]
							}),
							draft.show_received_by && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "text-gray-500 text-[8px] mt-1",
								children: "Received By: _________"
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-[10px] text-muted-foreground text-center mt-2",
						children: "Preview uses placeholder data. Actual invoices use real transaction data."
					})
				] })]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SettingsSaveBar, {
				onSave: save,
				hasChanges
			})
		]
	}) });
}
//#endregion
export { ReceiptSettingsPage as default };
