import { a as __toESM, n as require_react, t as require_jsx_runtime } from "./jsx-runtime-Do9val7F.js";
import { t as LoaderCircle } from "./loader-circle-Bu7VuNI1.js";
import { t as cn } from "./utils-Bim8RyS4.js";
import { Et as router3 } from "./app-CTdF6IZE.js";
//#region resources/js/features/reporting/components/DateRangeFilter.tsx
var import_jsx_runtime = require_jsx_runtime();
var PRESETS = [
	{
		value: "today",
		label: "Today"
	},
	{
		value: "yesterday",
		label: "Yesterday"
	},
	{
		value: "thisWeek",
		label: "This Week"
	},
	{
		value: "lastWeek",
		label: "Last Week"
	},
	{
		value: "last7",
		label: "Last 7 Days"
	},
	{
		value: "last30",
		label: "Last 30 Days"
	},
	{
		value: "last90",
		label: "Last 90 Days"
	},
	{
		value: "thisMonth",
		label: "This Month"
	},
	{
		value: "lastMonth",
		label: "Last Month"
	},
	{
		value: "thisQuarter",
		label: "This Quarter"
	},
	{
		value: "lastQuarter",
		label: "Last Quarter"
	},
	{
		value: "thisYear",
		label: "This Year"
	}
];
function DateRangeFilter({ preset, from, to, onPreset, onFromChange, onToChange, onApplyCustom, pending }) {
	const pill = (active) => cn("inline-flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border transition-colors", active ? "bg-foreground text-background border-foreground" : "bg-background text-muted-foreground border-border hover:text-foreground", pending && "opacity-60 cursor-not-allowed");
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "space-y-2",
		"aria-busy": pending,
		"data-print": "hide",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex items-center gap-1.5 flex-wrap",
			children: [PRESETS.map((p) => {
				const active = preset === p.value;
				return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
					type: "button",
					onClick: () => onPreset(p.value),
					disabled: pending,
					"aria-pressed": active,
					className: pill(active),
					children: [active && pending && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "size-3 animate-spin" }), p.label]
				}, p.value);
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				onClick: () => onPreset("custom"),
				disabled: pending,
				"aria-pressed": preset === "custom",
				className: pill(preset === "custom"),
				children: "Custom"
			})]
		}), preset === "custom" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex items-center gap-2 flex-wrap",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
					type: "date",
					value: from,
					onChange: (e) => onFromChange(e.target.value),
					"aria-label": "From date",
					className: "h-9 px-2.5 rounded-lg border border-input bg-background text-xs outline-none focus:border-ring"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "text-xs text-muted-foreground",
					children: "to"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
					type: "date",
					value: to,
					onChange: (e) => onToChange(e.target.value),
					"aria-label": "To date",
					className: "h-9 px-2.5 rounded-lg border border-input bg-background text-xs outline-none focus:border-ring"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					type: "button",
					onClick: onApplyCustom,
					disabled: pending || !from || !to,
					className: "h-9 px-3 rounded-lg bg-primary text-primary-foreground text-xs font-medium disabled:opacity-50",
					children: pending ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "size-3.5 animate-spin" }) : "Apply"
				})
			]
		})]
	});
}
//#endregion
//#region resources/js/features/reporting/hooks/useReportDateRange.ts
var import_react = /* @__PURE__ */ __toESM(require_react(), 1);
function useReportDateRange(url, filters, { only, keep = {} } = {}) {
	const [pending, setPending] = (0, import_react.useState)(false);
	const preset = filters.preset ?? "thisMonth";
	const [from, setFrom] = (0, import_react.useState)(filters.date_from ?? "");
	const [to, setTo] = (0, import_react.useState)(filters.date_to ?? "");
	(0, import_react.useEffect)(() => {
		setFrom(filters.date_from ?? "");
	}, [filters.date_from]);
	(0, import_react.useEffect)(() => {
		setTo(filters.date_to ?? "");
	}, [filters.date_to]);
	return {
		preset,
		from,
		to,
		setFrom,
		setTo,
		apply: (0, import_react.useCallback)((next, nextFrom, nextTo) => {
			setPending(true);
			const rawFrom = nextFrom ?? from;
			const rawTo = nextTo ?? to;
			const start = rawFrom && rawTo && rawFrom > rawTo ? rawTo : rawFrom;
			const end = rawFrom && rawTo && rawFrom > rawTo ? rawFrom : rawTo;
			router3.get(url, {
				...keep,
				preset: next,
				...next === "custom" ? {
					date_from: start,
					date_to: end
				} : {}
			}, {
				preserveState: true,
				preserveScroll: true,
				replace: true,
				...only ? { only } : {},
				onFinish: () => setPending(false)
			});
		}, [
			url,
			from,
			to,
			only,
			keep
		]),
		pending
	};
}
//#endregion
export { DateRangeFilter as n, useReportDateRange as t };
