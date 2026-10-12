import { i as __toESM, t as require_react } from "./react-DCO0ASPG.js";
import { t as createLucideIcon } from "./createLucideIcon--nD-f_FR.js";
import { t as ExternalLink } from "./external-link-BeGckZzO.js";
import { t as Printer } from "./printer-SCaoHvv-.js";
import { t as Share2 } from "./share-2-BDkinF3u.js";
import { t as cn } from "./utils-Bim8RyS4.js";
import { t as require_jsx_runtime } from "./jsx-runtime-BjJQA5sn.js";
import { t as Button } from "./button-phKcTdak.js";
import { Ct as ChevronDown, Et as toast, st as X } from "./app-Us-FuJbD.js";
/**
* @license lucide-react v1.26.0 - ISC
*
* This source code is licensed under the ISC license.
* See the LICENSE file in the root directory of this source tree.
*/
var FileDown = createLucideIcon("file-down", [
	["path", {
		d: "M6 22a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.704.706l3.588 3.588A2.4 2.4 0 0 1 20 8v12a2 2 0 0 1-2 2z",
		key: "1oefj6"
	}],
	["path", {
		d: "M14 2v5a1 1 0 0 0 1 1h5",
		key: "wfsgrz"
	}],
	["path", {
		d: "M12 18v-6",
		key: "17g6i2"
	}],
	["path", {
		d: "m9 15 3 3 3-3",
		key: "1npd3o"
	}]
]);
/**
* @license lucide-react v1.26.0 - ISC
*
* This source code is licensed under the ISC license.
* See the LICENSE file in the root directory of this source tree.
*/
var MessageCircle = createLucideIcon("message-circle", [["path", {
	d: "M2.992 16.342a2 2 0 0 1 .094 1.167l-1.065 3.29a1 1 0 0 0 1.236 1.168l3.413-.998a2 2 0 0 1 1.099.092 10 10 0 1 0-4.777-4.719",
	key: "1sd12s"
}]]);
//#endregion
//#region resources/js/features/printing/components/InvoiceMeta.tsx
var import_jsx_runtime = require_jsx_runtime();
function InvoiceMeta({ label, value, highlight }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex items-center gap-2",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
			className: "text-xs text-gray-400 uppercase tracking-wide",
			children: [label, ":"]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: `text-sm ${highlight ? "font-bold text-gray-900" : "font-medium text-gray-700"}`,
			children: value
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
function PaymentBadge({ status }) {
	const c = {
		paid: {
			label: "Paid",
			cls: "text-emerald-700 bg-emerald-50 border-emerald-200"
		},
		partial: {
			label: "Partial",
			cls: "text-amber-700 bg-amber-50 border-amber-200"
		},
		unpaid: {
			label: "Unpaid",
			cls: "text-red-700 bg-red-50 border-red-200"
		},
		pending: {
			label: "Pending",
			cls: "text-gray-700 bg-gray-50 border-gray-200"
		},
		received: {
			label: "Received",
			cls: "text-blue-700 bg-blue-50 border-blue-200"
		}
	}[status] || {
		label: status,
		cls: "text-gray-700 bg-gray-50 border-gray-200"
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
		className: `inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${c.cls}`,
		children: c.label
	});
}
//#endregion
//#region resources/js/features/printing/components/InvoiceFooter.tsx
/** Footer — notes, thank-you message, terms, & signatures, all controlled by receipt toggles */
function InvoiceFooter({ notes, receipt }) {
	const r = receipt || {};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mt-8 pt-4 border-t border-gray-300 text-center",
		children: [
			notes && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-sm text-gray-600 mb-2 italic",
				children: notes
			}),
			r.header_text && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-sm text-gray-500 font-medium",
				children: r.header_text
			}),
			r.footer_text && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-xs text-gray-400 mt-1 whitespace-pre-line",
				children: r.footer_text
			}),
			r.terms_conditions && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-3 pt-3 border-t border-gray-200",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-[10px] text-gray-400 uppercase tracking-wide mb-1",
					children: "Terms & Conditions"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-xs text-gray-500 whitespace-pre-line",
					children: r.terms_conditions
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex justify-between mt-6 text-xs text-gray-500",
				children: [
					r.show_customer_signature && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "text-center",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "w-32 border-t border-gray-400 pt-1",
							children: "Customer Signature"
						})
					}),
					r.show_authorized_signature && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "text-center",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "w-32 border-t border-gray-400 pt-1",
							children: "Authorized Signature"
						})
					}),
					r.show_received_by && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "text-center",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "w-32 border-t border-gray-400 pt-1",
							children: "Received By"
						})
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-[10px] text-gray-400 mt-4",
				children: "Generated by Invenos POS"
			})
		]
	});
}
//#endregion
//#region resources/js/features/printing/components/DocumentActions.tsx
var import_react = /* @__PURE__ */ __toESM(require_react(), 1);
/** Toolbar above the invoice paper — Print button + Share dropdown */
function DocumentActions({ title, invoiceNumber, partyName, total, outstanding, currency = "Rs." }) {
	const [shareOpen, setShareOpen] = (0, import_react.useState)(false);
	const whatsappMessage = encodeURIComponent(`*${title}*\n\nInvoice: ${invoiceNumber}\nParty: ${partyName}\nTotal: ${currency} ${total.toLocaleString()}` + (outstanding > 0 ? `\nOutstanding: ${currency} ${outstanding.toLocaleString()}` : "") + `\n\nThank you for your business.`);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "no-print bg-white border-b border-gray-200 px-4 sm:px-6 py-3 flex items-center justify-between gap-3",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
			variant: "ghost",
			size: "sm",
			onClick: () => window.history.back(),
			className: "gap-1.5 text-gray-600 hover:text-gray-900",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { className: "size-4" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "hidden sm:inline",
				children: "Close"
			})]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex items-center gap-2",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
				onClick: () => window.print(),
				className: "gap-2 shadow-sm",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Printer, { className: "size-4" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "hidden sm:inline",
					children: "Print"
				})]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "relative",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
					variant: "outline",
					onClick: () => setShareOpen(!shareOpen),
					className: "gap-2",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Share2, { className: "size-4" }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "hidden sm:inline",
							children: "Share"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronDown, { className: "size-3.5 text-gray-400" })
					]
				}), shareOpen && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "fixed inset-0 z-40",
					onClick: () => setShareOpen(false)
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "absolute right-0 top-full mt-1 z-50 w-56 rounded-xl border border-gray-200 bg-white shadow-lg overflow-hidden",
					children: [
						{
							label: "WhatsApp",
							icon: MessageCircle,
							primary: true,
							onClick: () => {
								window.open(`https://wa.me/?text=${whatsappMessage}`, "_blank");
								setShareOpen(false);
							}
						},
						{
							label: "Copy Link",
							icon: ExternalLink,
							onClick: () => {
								navigator.clipboard.writeText(window.location.href);
								toast.success("Link copied to clipboard");
								setShareOpen(false);
							}
						},
						{
							label: "Download PDF (coming soon)",
							icon: FileDown,
							disabled: true,
							onClick: () => {
								toast.info("PDF export coming soon");
								setShareOpen(false);
							}
						}
					].map((action, i) => {
						const Icon = action.icon;
						return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							onClick: action.onClick,
							disabled: action.disabled,
							className: cn("w-full flex items-center gap-3 px-4 py-3 text-sm text-left transition-colors", action.disabled ? "text-gray-300 cursor-not-allowed" : action.primary ? "text-emerald-700 hover:bg-emerald-50 font-medium" : "text-gray-700 hover:bg-gray-50"),
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, { className: "size-4 shrink-0" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: action.label })]
						}, i);
					})
				})] })]
			})]
		})]
	});
}
//#endregion
export { formatDisplayDate as a, PaymentBadge as i, InvoiceFooter as n, InvoiceMeta as r, DocumentActions as t };
