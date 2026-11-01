import { t as require_jsx_runtime } from "./jsx-runtime-Do9val7F.js";
//#region resources/js/features/printing/components/PrintLayout.tsx
var import_jsx_runtime = require_jsx_runtime();
/** A4 document container. Pagination is handled by print.css. */
function PrintLayout({ children, businessName }) {
	const printedAt = (/* @__PURE__ */ new Date()).toLocaleString();
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "print-paper",
		children
	}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "print-only print-running-footer",
		children: [
			businessName ? `${businessName} · ` : "",
			"Printed ",
			printedAt
		]
	})] });
}
//#endregion
//#region resources/js/features/printing/components/BusinessHeader.tsx
/** Business info from settings — section visibility controlled by receipt toggles */
function BusinessHeader({ business, receipt, title }) {
	const r = receipt || {};
	const show = (key, def = true) => r[key] ?? def;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mb-5",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex items-start justify-between",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-start gap-4",
				children: [show("show_business_logo") && business.business_logo && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
					src: business.business_logo,
					alt: "",
					className: "h-14 w-auto mt-1 object-contain shrink-0"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
					show("show_business_name") && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
						className: "text-xl font-bold text-gray-900",
						children: business.business_name || ""
					}),
					show("show_business_address") && business.address && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-xs text-gray-500 mt-0.5",
						children: business.address
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "text-xs text-gray-500 mt-1 space-x-3",
						children: [
							show("show_phone") && business.phone && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: business.phone }),
							show("show_email") && business.email && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: business.email }),
							show("show_website") && business.website && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: business.website })
						]
					}),
					show("show_tax_number") && business.tax_number && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "text-xs text-gray-500 mt-1",
						children: ["NTN: ", business.tax_number]
					})
				] })]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
				className: "text-lg font-bold text-gray-800 uppercase tracking-wide shrink-0",
				children: title
			})]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("hr", { className: "border-t-2 border-gray-800 mt-4" })]
	});
}
//#endregion
export { PrintLayout as n, BusinessHeader as t };
