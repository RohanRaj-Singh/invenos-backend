import { i as __toESM, t as require_react } from "./react-DCO0ASPG.js";
import { t as Calendar } from "./calendar-Bnm5D-Dd.js";
import { t as cn } from "./utils-Bim8RyS4.js";
import { t as require_jsx_runtime } from "./jsx-runtime-BjJQA5sn.js";
//#region resources/js/features/shared/DateFilter.tsx
var import_react = /* @__PURE__ */ __toESM(require_react(), 1);
var import_jsx_runtime = require_jsx_runtime();
var QUICK_OPTIONS = [
	{
		value: "",
		label: "All"
	},
	{
		value: "today",
		label: "Today"
	},
	{
		value: "yesterday",
		label: "Yesterday"
	},
	{
		value: "7days",
		label: "7 days"
	},
	{
		value: "30days",
		label: "30 days"
	},
	{
		value: "month",
		label: "This month"
	},
	{
		value: "custom",
		label: "Custom"
	}
];
function getDateRange(key) {
	const now = /* @__PURE__ */ new Date();
	const y = now.getFullYear();
	const m = now.getMonth();
	const d = now.getDate();
	const fmt = (dt) => dt.toISOString().split("T")[0];
	switch (key) {
		case "today": return {
			dateFrom: fmt(now),
			dateTo: fmt(now)
		};
		case "yesterday": {
			const yest = new Date(now);
			yest.setDate(d - 1);
			return {
				dateFrom: fmt(yest),
				dateTo: fmt(yest)
			};
		}
		case "7days": {
			const start = new Date(now);
			start.setDate(d - 6);
			return {
				dateFrom: fmt(start),
				dateTo: fmt(now)
			};
		}
		case "30days": {
			const start = new Date(now);
			start.setDate(d - 29);
			return {
				dateFrom: fmt(start),
				dateTo: fmt(now)
			};
		}
		case "month": return {
			dateFrom: fmt(new Date(y, m, 1)),
			dateTo: fmt(now)
		};
		default: return {
			dateFrom: "",
			dateTo: ""
		};
	}
}
function DateFilter({ value, onChange }) {
	const [showCustom, setShowCustom] = (0, import_react.useState)(value.quick === "custom");
	const select = (key) => {
		if (key === "custom") {
			setShowCustom(!showCustom);
			if (showCustom) {
				if (!value.dateFrom && !value.dateTo) onChange({
					dateFrom: "",
					dateTo: "",
					quick: ""
				});
			} else onChange({
				...value,
				quick: "custom"
			});
			return;
		}
		setShowCustom(false);
		onChange({
			...getDateRange(key),
			quick: key
		});
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "w-full",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex items-center gap-1.5 overflow-x-auto no-scrollbar",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Calendar, { className: "size-3.5 text-muted-foreground shrink-0" }), QUICK_OPTIONS.map((opt) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				onClick: () => select(opt.value),
				className: cn("text-xs font-medium px-3 py-1.5 rounded-lg border transition-colors shrink-0 whitespace-nowrap", value.quick === opt.value && opt.value !== "" ? "bg-foreground text-background border-foreground" : !value.quick && opt.value === "" ? "bg-foreground text-background border-foreground" : "bg-background text-muted-foreground border-border hover:text-foreground"),
				children: opt.label
			}, opt.value))]
		}), showCustom && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex items-center gap-2 mt-2 pl-5",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
					type: "date",
					value: value.dateFrom,
					onChange: (e) => onChange({
						...value,
						dateFrom: e.target.value,
						quick: "custom"
					}),
					className: "flex-1 h-9 px-3 rounded-lg border border-input bg-background text-xs outline-none focus:border-ring transition-colors",
					placeholder: "From"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "text-xs text-muted-foreground",
					children: "→"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
					type: "date",
					value: value.dateTo,
					onChange: (e) => onChange({
						...value,
						dateTo: e.target.value,
						quick: "custom"
					}),
					className: "flex-1 h-9 px-3 rounded-lg border border-input bg-background text-xs outline-none focus:border-ring transition-colors",
					placeholder: "To"
				})
			]
		})]
	});
}
//#endregion
export { DateFilter as t };
