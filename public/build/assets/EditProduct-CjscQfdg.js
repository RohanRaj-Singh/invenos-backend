import { t as ProductForm } from "./ProductForm-DRRrbPWb.js";
import { t as require_jsx_runtime } from "./jsx-runtime-BjJQA5sn.js";
import { t as Button } from "./button-phKcTdak.js";
import { Dt as usePage, vt as Package } from "./app-DCc201bC.js";
//#region resources/js/Pages/inventory/EditProduct.tsx
var import_jsx_runtime = require_jsx_runtime();
function EditProductPage() {
	const { props } = usePage();
	const product = props.product;
	const categories = props.categories || [];
	if (!product) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "p-4 sm:p-6 lg:p-8 max-w-2xl mx-auto",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex flex-col items-center justify-center py-24 text-sm text-muted-foreground",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Package, { className: "size-12 text-muted-foreground/30 mb-4" }),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "text-lg font-semibold text-foreground mb-1",
					children: "Product not found"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					variant: "outline",
					onClick: () => window.history.back(),
					children: "Go Back"
				})
			]
		})
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "p-4 sm:p-6 lg:p-8",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ProductForm, {
			mode: "edit",
			categories,
			product
		})
	});
}
//#endregion
export { EditProductPage as default };
