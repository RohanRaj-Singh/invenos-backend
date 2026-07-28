import { i as __toESM, t as require_react } from "./react-DCO0ASPG.js";
import { t as require_jsx_runtime } from "./jsx-runtime-BjJQA5sn.js";
//#region resources/js/Pages/pos/salebill/components/EditableQuantity.tsx
var import_react = /* @__PURE__ */ __toESM(require_react(), 1);
var import_jsx_runtime = require_jsx_runtime();
function EditableQuantity({ value, onChange, step }) {
	const [editing, setEditing] = (0, import_react.useState)(false);
	const [input, setInput] = (0, import_react.useState)(String(value));
	const inputRef = (0, import_react.useRef)(null);
	(0, import_react.useEffect)(() => {
		if (editing) inputRef.current?.focus();
	}, [editing]);
	(0, import_react.useEffect)(() => {
		if (!editing) setInput(String(value));
	}, [value, editing]);
	const handleSave = () => {
		const val = parseFloat(input);
		if (!isNaN(val) && val > 0) {
			const diff = val - value;
			if (diff !== 0) onChange(diff);
		}
		setEditing(false);
	};
	if (editing) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
		ref: inputRef,
		type: "number",
		value: input,
		onChange: (e) => setInput(e.target.value),
		onBlur: handleSave,
		onKeyDown: (e) => {
			if (e.key === "Enter") handleSave();
			if (e.key === "Escape") setEditing(false);
		},
		className: "w-16 h-7 text-center text-sm font-bold rounded border border-primary bg-background outline-none tabular-nums",
		min: "0.001",
		step,
		autoFocus: true
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
		onClick: () => {
			setEditing(true);
			setInput(String(value));
		},
		className: "w-10 h-7 flex items-center justify-center text-center text-sm font-semibold tabular-nums hover:bg-muted/50 rounded transition-colors",
		children: value
	});
}
//#endregion
export { EditableQuantity as default };
