import { i as __toESM, t as require_react } from "./react-DCO0ASPG.js";
import { t as TrendingUp } from "./trending-up-CRrMyRfV.js";
import { t as cn } from "./utils-Bim8RyS4.js";
import { t as require_jsx_runtime } from "./jsx-runtime-BjJQA5sn.js";
import { E as purchaseBills, N as allSales } from "./app-BLMvu7I3.js";
import { i as CardTitle, n as CardContent, r as CardHeader, t as Card } from "./card-DQfOgTjC.js";
//#region resources/js/Pages/dashboard/components/SalesTrendChart.tsx
var import_react = /* @__PURE__ */ __toESM(require_react(), 1);
var import_jsx_runtime = require_jsx_runtime();
function SalesTrendChart({ dateRange }) {
	const [mode, setMode] = (0, import_react.useState)("sales");
	const days = (0, import_react.useMemo)(() => {
		const from = new Date(dateRange.from);
		const to = new Date(dateRange.to);
		const daysArr = [];
		const d = new Date(from);
		while (d <= to) {
			const dateStr = d.toISOString().split("T")[0];
			const salesTotal = allSales.filter((s) => s.date === dateStr && !s.invoiceNumber.startsWith("RET-")).reduce((sum, s) => sum + s.grandTotal, 0);
			const purchasesTotal = purchaseBills.filter((b) => b.date === dateStr && !b.invoiceRef.startsWith("PRET-")).reduce((sum, b) => sum + b.totalAmount, 0);
			daysArr.push({
				label: d.toLocaleDateString("en-PK", {
					weekday: "short",
					day: "numeric"
				}),
				sales: salesTotal,
				purchases: purchasesTotal
			});
			d.setDate(d.getDate() + 1);
		}
		return daysArr;
	}, [dateRange]);
	const maxVal = Math.max(...days.map((d) => mode === "sales" ? d.sales : mode === "purchases" ? d.purchases : Math.max(d.sales, d.purchases)), 1);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardHeader, {
		className: "flex-row items-center justify-between",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardTitle, {
			className: "flex items-center gap-2",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TrendingUp, { className: "size-4 text-primary" }), "Revenue Trend"]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "flex items-center gap-1 bg-muted rounded-lg p-0.5",
			children: [
				"sales",
				"purchases",
				"combined"
			].map((m) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				onClick: () => setMode(m),
				className: cn("px-2.5 py-1 text-[10px] font-medium rounded-md transition-colors", mode === m ? "bg-background text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"),
				children: m.charAt(0).toUpperCase() + m.slice(1)
			}, m))
		})]
	}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardContent, { children: [days.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "text-center py-8 text-sm text-muted-foreground",
		children: "No data for this period."
	}) : days.length === 1 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "flex items-center justify-center h-32 text-sm text-muted-foreground",
		children: mode === "sales" ? `Revenue: Rs. ${days[0].sales.toLocaleString()}` : mode === "purchases" ? `Purchases: Rs. ${days[0].purchases.toLocaleString()}` : `Sales: Rs. ${days[0].sales.toLocaleString()} / Purchases: Rs. ${days[0].purchases.toLocaleString()}`
	}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "relative h-40 sm:h-48",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: "absolute inset-0 flex items-end gap-[2px] sm:gap-1",
			children: days.map((d, i) => {
				const value = mode === "sales" ? d.sales : mode === "purchases" ? d.purchases : d.sales;
				const height = value / maxVal * 100;
				return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex-1 flex flex-col items-center justify-end h-full group relative",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: cn("w-full rounded-t transition-all duration-200 min-h-[2px]", mode === "sales" ? "bg-blue-500 dark:bg-blue-400" : mode === "purchases" ? "bg-amber-500 dark:bg-amber-400" : "bg-emerald-500 dark:bg-emerald-400"),
						style: { height: `${Math.max(height, 1)}%` }
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "absolute -top-6 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 bg-foreground text-background text-[9px] px-1.5 py-0.5 rounded whitespace-nowrap transition-opacity pointer-events-none z-10",
						children: [
							"Rs.",
							" ",
							value.toLocaleString()
						]
					})]
				}, i);
			})
		})
	}), days.length > 1 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "flex justify-between mt-2 pt-2 border-t border-border",
		children: days.filter((_, i) => i % Math.max(1, Math.floor(days.length / 5)) === 0 || i === days.length - 1).map((d) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: "text-[9px] text-muted-foreground",
			children: d.label
		}, d.label))
	})] })] });
}
//#endregion
export { SalesTrendChart as default };
