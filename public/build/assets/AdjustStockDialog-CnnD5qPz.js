import { i as __toESM, t as require_react } from "./react-DCO0ASPG.js";
import { t as FlaskConical } from "./flask-conical-CsbPzWAT.js";
import { t as TriangleAlert } from "./triangle-alert-D5zO2woV.js";
import { t as cn } from "./utils-Bim8RyS4.js";
import { t as require_jsx_runtime } from "./jsx-runtime-BjJQA5sn.js";
import { t as Button } from "./button-phKcTdak.js";
import { a as DialogTitle, i as DialogHeader, n as DialogContent, t as Dialog } from "./dialog-C4uC61EG.js";
import { Dt as router3, Tt as toast, _t as Package, gt as Plus } from "./app-DxiW8KTt.js";
//#region resources/js/Pages/inventory/components/AdjustStockDialog.tsx
var import_react = /* @__PURE__ */ __toESM(require_react(), 1);
var import_jsx_runtime = require_jsx_runtime();
var ADJUSTMENT_TYPES = [
	{
		value: "adjustment",
		label: "Adjustment",
		icon: Package,
		desc: "Stock count correction (±)"
	},
	{
		value: "damage",
		label: "Damage",
		icon: TriangleAlert,
		desc: "Damaged or spoilt goods (−)"
	},
	{
		value: "consumption",
		label: "Consumption",
		icon: FlaskConical,
		desc: "Internal usage (−)"
	}
];
function AdjustStockDialog({ productId, productName, currentStock = 0, open, onOpenChange, stockUnit = "units" }) {
	const [type, setType] = (0, import_react.useState)("adjustment");
	const [quantity, setQuantity] = (0, import_react.useState)("");
	const [direction, setDirection] = (0, import_react.useState)("add");
	const [notes, setNotes] = (0, import_react.useState)("");
	const [saving, setSaving] = (0, import_react.useState)(false);
	const handleSave = () => {
		const qty = parseInt(quantity);
		if (!qty || qty <= 0) {
			toast.error("Enter a valid quantity");
			return;
		}
		setSaving(true);
		const signedQty = direction === "remove" ? -qty : qty;
		const finalQty = type === "damage" || type === "consumption" ? -Math.abs(signedQty) : signedQty;
		router3.post("/inventory/adjust", {
			product_id: productId,
			type,
			quantity: finalQty,
			notes
		}, {
			onSuccess: () => {
				toast.success("Stock adjusted successfully");
				onOpenChange(false);
			},
			onError: (errs) => {
				const first = Object.values(errs)[0];
				toast.error(String(first || "Failed to adjust stock"));
			},
			onFinish: () => setSaving(false)
		});
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Dialog, {
		open,
		onOpenChange,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogContent, {
			className: "sm:max-w-md gap-0 p-0",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogHeader, {
					className: "p-5 pb-3",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogTitle, {
						className: "text-base",
						children: ["Adjust Stock — ", productName || `Product #${productId}`]
					})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "px-5 pb-4 space-y-4",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center justify-between p-3 rounded-lg bg-muted/30 text-sm",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-muted-foreground",
								children: "Current Stock"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "font-bold text-lg",
								children: [
									currentStock.toLocaleString(),
									" ",
									stockUnit
								]
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
							className: "block text-xs font-medium mb-2",
							children: "Type"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "grid grid-cols-3 gap-2",
							children: ADJUSTMENT_TYPES.map((at) => {
								const Icon = at.icon;
								const isActive = type === at.value;
								return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
									onClick: () => {
										setType(at.value);
										setDirection(at.value === "adjustment" ? "add" : "remove");
									},
									className: cn("flex flex-col items-center gap-1 p-3 rounded-xl border text-center transition-all", isActive ? "border-primary bg-primary/5 ring-1 ring-primary/30" : "border-border hover:border-muted-foreground/30"),
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, { className: cn("size-4", isActive ? "text-primary" : "text-muted-foreground") }),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: cn("text-xs font-medium", isActive ? "text-foreground" : "text-muted-foreground"),
											children: at.label
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "text-[9px] text-muted-foreground",
											children: at.desc
										})
									]
								}, at.value);
							})
						})] }),
						type === "adjustment" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
							className: "block text-xs font-medium mb-2",
							children: "Direction"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center gap-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
								onClick: () => setDirection("add"),
								className: cn("flex-1 h-9 rounded-lg text-xs font-medium border transition-colors", direction === "add" ? "bg-emerald-500 text-white border-emerald-500" : "border-border text-muted-foreground hover:text-foreground"),
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, { className: "size-3.5 inline mr-1" }), " Add Stock"]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								onClick: () => setDirection("remove"),
								className: cn("flex-1 h-9 rounded-lg text-xs font-medium border transition-colors", direction === "remove" ? "bg-red-500 text-white border-red-500" : "border-border text-muted-foreground hover:text-foreground"),
								children: "− Remove Stock"
							})]
						})] }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
							className: "block text-xs font-medium mb-1.5",
							children: "Quantity"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							type: "number",
							min: "1",
							value: quantity,
							onChange: (e) => setQuantity(e.target.value),
							placeholder: "Enter quantity...",
							autoFocus: true,
							className: "w-full h-10 px-3 rounded-xl border border-input bg-background text-sm outline-none focus:border-ring transition-colors"
						})] }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
							className: "block text-xs font-medium mb-1.5",
							children: "Reason / Notes"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							type: "text",
							value: notes,
							onChange: (e) => setNotes(e.target.value),
							placeholder: "e.g. Physical count correction, expired stock...",
							className: "w-full h-10 px-3 rounded-xl border border-input bg-background text-sm outline-none focus:border-ring transition-colors"
						})] }),
						quantity && parseInt(quantity) > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center justify-between p-3 rounded-lg bg-muted/50 text-sm",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-muted-foreground",
								children: "New Stock"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "font-bold text-base",
								children: [
									(currentStock + (type === "damage" || type === "consumption" ? -Math.abs(parseInt(quantity)) : direction === "remove" ? -Math.abs(parseInt(quantity)) : parseInt(quantity))).toLocaleString(),
									" ",
									stockUnit
								]
							})]
						})
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "border-t border-border px-5 py-3 flex items-center justify-end gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						variant: "outline",
						size: "sm",
						onClick: () => onOpenChange(false),
						children: "Cancel"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						size: "sm",
						disabled: saving || !quantity || parseInt(quantity) <= 0,
						onClick: handleSave,
						children: saving ? "Saving..." : "Save Adjustment"
					})]
				})
			]
		})
	});
}
//#endregion
export { AdjustStockDialog as default };
