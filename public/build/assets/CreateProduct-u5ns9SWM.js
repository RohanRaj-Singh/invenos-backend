import { t as require_jsx_runtime } from "./jsx-runtime-BjJQA5sn.js";
import { Dt as usePage } from "./app-DfjygdMU.js";
import { t as ProductForm } from "./ProductForm-0W-GxH7n.js";
//#region resources/js/Pages/inventory/CreateProduct.tsx
var import_jsx_runtime = require_jsx_runtime();
function CreateProductPage() {
	const { props } = usePage();
	const categories = props.categories || [];
	const generatedSku = props.generated_sku;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "p-4 sm:p-6 lg:p-8",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ProductForm, {
			mode: "create",
			categories,
			generatedSku
		})
	});
}
//#endregion
export { CreateProductPage as default };
