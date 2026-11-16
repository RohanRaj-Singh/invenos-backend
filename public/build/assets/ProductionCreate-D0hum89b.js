import { a as __toESM, n as require_react, t as require_jsx_runtime } from "./jsx-runtime-Do9val7F.js";
import { t as ArrowLeft } from "./arrow-left-Bd6q48cy.js";
import { t as Factory } from "./factory-J4bs4vZU.js";
import { t as cn } from "./utils-Bim8RyS4.js";
import { t as Button } from "./button-CTa7sOGP.js";
import { Mt as usePage, jt as router3 } from "./app-C7AUNtSc.js";
import { i as CardTitle, n as CardContent, r as CardHeader, t as Card } from "./card-1EYOepvR.js";
//#region resources/js/Pages/production/ProductionCreate.tsx
var import_react = /* @__PURE__ */ __toESM(require_react(), 1);
var import_jsx_runtime = require_jsx_runtime();
function ProductionCreate() {
	const { props } = usePage();
	const products = props.products || [];
	const locations = props.locations || [];
	const defaultDate = props.default_date || (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
	const [productId, setProductId] = (0, import_react.useState)(String(products[0]?.id || ""));
	const [compositionId, setCompositionId] = (0, import_react.useState)(String(products[0]?.compositions?.[0]?.id || ""));
	const [plannedQuantity, setPlannedQuantity] = (0, import_react.useState)("1");
	const [location, setLocation] = (0, import_react.useState)(products[0]?.location || "");
	const [plannedDate, setPlannedDate] = (0, import_react.useState)(defaultDate);
	const [reference, setReference] = (0, import_react.useState)("");
	const [notes, setNotes] = (0, import_react.useState)("");
	const [saving, setSaving] = (0, import_react.useState)(false);
	const selectedProduct = products.find((p) => String(p.id) === productId);
	const selectedComposition = selectedProduct?.compositions.find((c) => String(c.id) === compositionId) || selectedProduct?.compositions?.[0];
	const items = (0, import_react.useMemo)(() => selectedComposition?.items || [], [selectedComposition]);
	const plannedScale = (0, import_react.useMemo)(() => {
		const planned = Number(plannedQuantity);
		const output = Number(selectedComposition?.output_quantity ?? 1);
		if (!Number.isFinite(planned) || planned <= 0 || !Number.isFinite(output) || output <= 0) return 0;
		return planned / output;
	}, [plannedQuantity, selectedComposition]);
	function chooseProduct(id) {
		setProductId(id);
		const product = products.find((p) => String(p.id) === id);
		setCompositionId(String(product?.compositions?.[0]?.id || ""));
		setLocation(product?.location || "");
	}
	function submit() {
		if (!selectedProduct || !selectedComposition) return;
		setSaving(true);
		router3.post("/production", {
			product_id: selectedProduct.id,
			composition_id: selectedComposition.id,
			planned_quantity: Number(plannedQuantity),
			output_unit_id: selectedComposition.output_unit_id,
			location: location || null,
			planned_date: plannedDate || null,
			reference: reference || null,
			notes: notes || null
		}, {
			onError: () => setSaving(false),
			onFinish: () => setSaving(false)
		});
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto space-y-4",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "flex items-center gap-2",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
					variant: "ghost",
					size: "sm",
					onClick: () => router3.visit("/production"),
					className: "gap-1.5 -ml-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowLeft, { className: "size-4" }), " Back"]
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-center gap-2",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Factory, { className: "size-5 text-primary" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "text-xl font-bold tracking-tight",
					children: "New Production Order"
				})]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-sm text-muted-foreground mt-1",
				children: "Draft orders do not move inventory. Materials are consumed only when production is executed."
			})] }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "grid gap-4 lg:grid-cols-[1.3fr_1fr]",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardHeader, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardTitle, {
					className: "text-sm",
					children: "Production Details"
				}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardContent, {
					className: "space-y-3",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
							className: "block text-xs font-medium",
							children: ["Finished product", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("select", {
								value: productId,
								onChange: (e) => chooseProduct(e.target.value),
								className: "mt-1 w-full h-9 rounded-lg border border-input bg-background px-2 text-sm",
								children: products.map((product) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("option", {
									value: product.id,
									children: [
										product.name,
										" (",
										product.sku,
										")"
									]
								}, product.id))
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
							className: "block text-xs font-medium",
							children: ["Assembly formula", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("select", {
								value: compositionId,
								onChange: (e) => setCompositionId(e.target.value),
								className: "mt-1 w-full h-9 rounded-lg border border-input bg-background px-2 text-sm",
								children: (selectedProduct?.compositions || []).map((composition) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("option", {
									value: composition.id,
									children: [
										"v",
										composition.version,
										" · output ",
										composition.output_quantity,
										" ",
										composition.output_unit_id
									]
								}, composition.id))
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "grid grid-cols-2 gap-3",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
								className: "block text-xs font-medium",
								children: ["Planned quantity", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
									type: "number",
									min: "0.000001",
									step: "any",
									value: plannedQuantity,
									onChange: (e) => setPlannedQuantity(e.target.value),
									className: "mt-1 w-full h-9 rounded-lg border border-input bg-background px-2 text-sm"
								})]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
								className: "block text-xs font-medium",
								children: ["Output unit", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
									value: selectedComposition?.output_unit_id || "",
									readOnly: true,
									className: "mt-1 w-full h-9 rounded-lg border border-input bg-muted/40 px-2 text-sm"
								})]
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "grid grid-cols-2 gap-3",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
								className: "block text-xs font-medium",
								children: ["Planned date", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
									type: "date",
									value: plannedDate,
									onChange: (e) => setPlannedDate(e.target.value),
									className: "mt-1 w-full h-9 rounded-lg border border-input bg-background px-2 text-sm"
								})]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
								className: "block text-xs font-medium",
								children: [
									"Location",
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
										list: "production-locations",
										value: location,
										onChange: (e) => setLocation(e.target.value),
										className: "mt-1 w-full h-9 rounded-lg border border-input bg-background px-2 text-sm"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("datalist", {
										id: "production-locations",
										children: locations.map((l) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", { value: l }, l))
									})
								]
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
							className: "block text-xs font-medium",
							children: ["Reference", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								value: reference,
								onChange: (e) => setReference(e.target.value),
								className: "mt-1 w-full h-9 rounded-lg border border-input bg-background px-2 text-sm"
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
							className: "block text-xs font-medium",
							children: ["Notes", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("textarea", {
								value: notes,
								onChange: (e) => setNotes(e.target.value),
								rows: 3,
								className: "mt-1 w-full rounded-lg border border-input bg-background px-2 py-2 text-sm resize-none"
							})]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							onClick: submit,
							disabled: saving || !selectedComposition,
							className: "w-full",
							children: saving ? "Creating..." : "Create draft order"
						})
					]
				})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardHeader, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardTitle, {
					className: "text-sm",
					children: "Formula Preview"
				}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardContent, {
					className: "space-y-2",
					children: [items.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-sm text-muted-foreground",
						children: "No components in this formula."
					}) : items.map((item) => {
						const required = Number(item.quantity_base) * plannedScale * (1 + Number(item.wastage_pct || 0) / 100);
						const available = Number(item.component?.stock_quantity || 0);
						const unit = item.display_unit_id || item.component?.base_unit_id || "";
						const shortage = plannedScale > 0 && required > available;
						return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-start justify-between gap-3 rounded-lg border border-border/60 p-2.5",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "min-w-0",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "text-sm font-medium truncate",
									children: item.component?.name || "Component"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "text-[10px] text-muted-foreground",
									children: [
										item.component?.sku || "—",
										" · stock ",
										available.toLocaleString(),
										" ",
										item.component?.base_unit_id || ""
									]
								})]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "text-right shrink-0",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: cn("text-sm font-semibold tabular-nums", shortage && "text-red-600"),
										children: [
											Number(required.toFixed(6)).toLocaleString(),
											" ",
											unit
										]
									}),
									item.wastage_pct > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "text-[10px] text-amber-600",
										children: [
											"+",
											item.wastage_pct,
											"% wastage"
										]
									}),
									shortage && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "text-[10px] font-medium text-red-600",
										children: ["Short by ", Number((required - available).toFixed(6))]
									})
								]
							})]
						}, item.id);
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: cn("rounded-lg p-3 text-[11px] leading-relaxed", items.length ? "bg-muted/40 text-muted-foreground" : "bg-amber-50 text-amber-700"),
						children: "Quantities are estimated from the saved template, planned output and wastage. This is not a reservation; the server rechecks stock atomically at execution."
					})]
				})] })]
			})
		]
	});
}
//#endregion
export { ProductionCreate as default };
