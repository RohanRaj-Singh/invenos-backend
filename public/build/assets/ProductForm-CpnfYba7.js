import { t as ProductForm } from "./ProductForm-DRRrbPWb.js";
import { t as require_jsx_runtime } from "./jsx-runtime-BjJQA5sn.js";
import { Dt as usePage } from "./app-DCc201bC.js";
//#region resources/js/Pages/inventory/ProductForm.tsx
var import_jsx_runtime = require_jsx_runtime();
/**
* Legacy page wrapper — kept for backward compatibility.
* Use AddProduct for creating and EditProduct for editing instead.
*/
function ProductFormPage() {
	const { props } = usePage();
	const categories = props.categories || [];
	const product = props.product;
	const generatedSku = props.generated_sku;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ProductForm, {
		mode: product ? "edit" : "create",
		categories,
		product,
		generatedSku
	});
}
//#endregion
export { ProductFormPage as default };
