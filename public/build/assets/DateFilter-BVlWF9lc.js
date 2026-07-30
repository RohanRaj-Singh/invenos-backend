import { i as __toESM, t as require_react } from "./react-DCO0ASPG.js";
import { t as cn } from "./utils-Bim8RyS4.js";
import { t as require_jsx_runtime } from "./jsx-runtime-BjJQA5sn.js";
//#region resources/js/Pages/reports/components/DateFilter.tsx
var import_react = /* @__PURE__ */ __toESM(require_react(), 1);
var import_jsx_runtime = require_jsx_runtime();
function getDateRange(preset) {
	const now = /* @__PURE__ */ new Date();
	const today = now.toISOString().split("T")[0];
	const d = (days) => (/* @__PURE__ */ new Date(now.getTime() - days * 864e5)).toISOString().split("T")[0];
	switch (preset) {
		case "today": return {
			from: today,
			to: today
		};
		case "yesterday": return {
			from: d(1),
			to: d(1)
		};
		case "thisWeek": {
			const start = new Date(now);
			start.setDate(now.getDate() - now.getDay());
			return {
				from: start.toISOString().split("T")[0],
				to: today
			};
		}
		case "lastWeek": {
			const end = new Date(now);
			end.setDate(now.getDate() - now.getDay() - 1);
			const start = new Date(end);
			start.setDate(end.getDate() - 6);
			return {
				from: start.toISOString().split("T")[0],
				to: end.toISOString().split("T")[0]
			};
		}
		case "last7": return {
			from: d(6),
			to: today
		};
		case "last30": return {
			from: d(29),
			to: today
		};
		case "last90": return {
			from: d(89),
			to: today
		};
		case "last365": return {
			from: d(364),
			to: today
		};
		case "thisMonth": return {
			from: new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0],
			to: today
		};
		case "lastMonth": {
			const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
			const end = new Date(now.getFullYear(), now.getMonth(), 0);
			return {
				from: start.toISOString().split("T")[0],
				to: end.toISOString().split("T")[0]
			};
		}
		case "thisQuarter": {
			const q = Math.floor(now.getMonth() / 3);
			return {
				from: new Date(now.getFullYear(), q * 3, 1).toISOString().split("T")[0],
				to: today
			};
		}
		case "lastQuarter": {
			const q = Math.floor(now.getMonth() / 3) - 1;
			const start = new Date(now.getFullYear(), q * 3, 1);
			const end = new Date(now.getFullYear(), q * 3 + 3, 0);
			return {
				from: start.toISOString().split("T")[0],
				to: end.toISOString().split("T")[0]
			};
		}
		case "thisYear": return {
			from: new Date(now.getFullYear(), 0, 1).toISOString().split("T")[0],
			to: today
		};
		default: return {
			from: today,
			to: today
		};
	}
}
function getPreviousPeriod(preset) {
	const current = getDateRange(preset);
	const days = Math.round((new Date(current.to).getTime() - new Date(current.from).getTime()) / 864e5) + 1;
	if (days <= 0) return null;
	const to = /* @__PURE__ */ new Date(new Date(current.from).getTime() - 864e5);
	return {
		from: (/* @__PURE__ */ new Date(to.getTime() - (days - 1) * 864e5)).toISOString().split("T")[0],
		to: to.toISOString().split("T")[0]
	};
}
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
	},
	{
		value: "custom",
		label: "Custom"
	}
];
function computeTrend(current, previous) {
	const change = current - previous;
	return {
		current,
		previous,
		change,
		changePct: previous !== 0 ? Math.round(change / previous * 1e3) / 10 : current > 0 ? 100 : 0,
		direction: change > 0 ? "up" : change < 0 ? "down" : "flat"
	};
}
function DateFilter({ value, onChange, extended }) {
	const [customFrom, setCustomFrom] = (0, import_react.useState)("");
	const [customTo, setCustomTo] = (0, import_react.useState)("");
	const handlePreset = (preset) => {
		if (preset === "custom") {
			if (customFrom && customTo) onChange("custom", customFrom, customTo);
			return;
		}
		const range = getDateRange(preset);
		onChange(preset, range.from, range.to);
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "space-y-3",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "flex items-center gap-1.5 flex-wrap",
			children: (extended ? PRESETS : PRESETS.slice(0, 6)).map((p) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				onClick: () => handlePreset(p.value),
				className: cn("text-xs font-medium px-3 py-1.5 rounded-lg border transition-colors whitespace-nowrap", value === p.value ? "bg-foreground text-background border-foreground" : "bg-background text-muted-foreground border-border hover:text-foreground"),
				children: p.label
			}, p.value))
		}), value === "custom" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "flex items-center gap-2",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
					type: "date",
					value: customFrom,
					onChange: (e) => {
						setCustomFrom(e.target.value);
						onChange("custom", e.target.value, customTo || e.target.value);
					},
					className: "h-9 px-2.5 rounded-lg border border-input bg-background text-xs outline-none focus:border-ring"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "text-xs text-muted-foreground",
					children: "to"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
					type: "date",
					value: customTo,
					onChange: (e) => {
						setCustomTo(e.target.value);
						onChange("custom", customFrom || e.target.value, e.target.value);
					},
					className: "h-9 px-2.5 rounded-lg border border-input bg-background text-xs outline-none focus:border-ring"
				})
			]
		})]
	});
}
//#endregion
export { DateFilter, computeTrend, getDateRange, getPreviousPeriod };
