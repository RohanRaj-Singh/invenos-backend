import { i as __toESM, r as __exportAll, t as require_react } from "./react-DCO0ASPG.js";
import { t as cn } from "./utils-Bim8RyS4.js";
import { t as require_jsx_runtime } from "./jsx-runtime-BjJQA5sn.js";
//#region resources/js/Pages/reports/components/ReportFilters.tsx
var ReportFilters_exports = /* @__PURE__ */ __exportAll({
	ReportFilterBar: () => ReportFilterBar,
	getDateRange: () => getDateRange,
	useReportFilters: () => useReportFilters
});
var import_react = /* @__PURE__ */ __toESM(require_react(), 1);
var import_jsx_runtime = require_jsx_runtime();
function getDateRange(preset, customFrom, customTo) {
	const now = /* @__PURE__ */ new Date();
	const today = now.toISOString().split("T")[0];
	const yesterday = (/* @__PURE__ */ new Date(now.getTime() - 864e5)).toISOString().split("T")[0];
	switch (preset) {
		case "today": return {
			from: today,
			to: today
		};
		case "yesterday": return {
			from: yesterday,
			to: yesterday
		};
		case "last7": return {
			from: (/* @__PURE__ */ new Date(now.getTime() - 6 * 864e5)).toISOString().split("T")[0],
			to: today
		};
		case "last30": return {
			from: (/* @__PURE__ */ new Date(now.getTime() - 29 * 864e5)).toISOString().split("T")[0],
			to: today
		};
		case "thisMonth": return {
			from: new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split("T")[0],
			to: today
		};
		case "custom": return {
			from: customFrom || today,
			to: customTo || today
		};
	}
}
function useReportFilters() {
	const [filters, setFilters] = (0, import_react.useState)({
		datePreset: "thisMonth",
		dateFrom: getDateRange("thisMonth").from,
		dateTo: getDateRange("thisMonth").to,
		paymentMethod: ""
	});
	const setPreset = (preset) => {
		const range = getDateRange(preset);
		setFilters((f) => ({
			...f,
			datePreset: preset,
			dateFrom: range.from,
			dateTo: range.to
		}));
	};
	return {
		filters,
		setFilters,
		setPreset,
		dateRange: (0, import_react.useMemo)(() => ({
			from: filters.dateFrom,
			to: filters.dateTo
		}), [filters.dateFrom, filters.dateTo])
	};
}
var DATE_PRESETS = [
	{
		value: "today",
		label: "Today"
	},
	{
		value: "yesterday",
		label: "Yesterday"
	},
	{
		value: "last7",
		label: "Last 7 Days"
	},
	{
		value: "thisMonth",
		label: "This Month"
	},
	{
		value: "last30",
		label: "Last 30 Days"
	},
	{
		value: "custom",
		label: "Custom"
	}
];
function ReportFilterBar({ filters, setFilters, setPreset, showPaymentMethod }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "space-y-3",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "flex items-center gap-1.5 flex-wrap",
				children: DATE_PRESETS.map((p) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					onClick: () => setPreset(p.value),
					className: cn("text-xs font-medium px-3 py-1.5 rounded-lg border transition-colors", filters.datePreset === p.value ? "bg-foreground text-background border-foreground" : "bg-background text-muted-foreground border-border hover:text-foreground"),
					children: p.label
				}, p.value))
			}),
			filters.datePreset === "custom" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-center gap-2",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
						type: "date",
						value: filters.dateFrom,
						onChange: (e) => setFilters({
							...filters,
							dateFrom: e.target.value
						}),
						className: "h-9 px-2.5 rounded-lg border border-input bg-background text-xs outline-none focus:border-ring"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "text-xs text-muted-foreground",
						children: "to"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
						type: "date",
						value: filters.dateTo,
						onChange: (e) => setFilters({
							...filters,
							dateTo: e.target.value
						}),
						className: "h-9 px-2.5 rounded-lg border border-input bg-background text-xs outline-none focus:border-ring"
					})
				]
			}),
			showPaymentMethod && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
				value: filters.paymentMethod,
				onChange: (e) => setFilters({
					...filters,
					paymentMethod: e.target.value
				}),
				className: "h-9 px-3 rounded-lg border border-input bg-background text-xs outline-none focus:border-ring",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
						value: "",
						children: "All Methods"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
						value: "cash",
						children: "Cash"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
						value: "card",
						children: "Card"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
						value: "transfer",
						children: "Bank Transfer"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
						value: "easypaisa",
						children: "Easypaisa"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
						value: "jazzcash",
						children: "JazzCash"
					})
				]
			})
		]
	});
}
//#endregion
export { ReportFilters_exports as n, useReportFilters as r, ReportFilterBar as t };
