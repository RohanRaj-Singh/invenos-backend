import { i as __toESM, t as require_react } from "./react-DCO0ASPG.js";
import { t as createLucideIcon } from "./createLucideIcon--nD-f_FR.js";
import { t as ArrowLeft } from "./arrow-left-CE4TWQlw.js";
import { t as CalendarDays } from "./calendar-days-CE0jslca.js";
import { t as Calendar } from "./calendar-Bnm5D-Dd.js";
import { t as Clock } from "./clock-zPxdzOK3.js";
import { t as FileText } from "./file-text-CkmQ0M6N.js";
import { t as Pill } from "./pill-BnEdyPyP.js";
import { t as ImageViewer } from "./ImageViewer-gmBoryUF.js";
import { t as cn } from "./utils-Bim8RyS4.js";
import { t as require_jsx_runtime } from "./jsx-runtime-BjJQA5sn.js";
import { t as Button } from "./button-phKcTdak.js";
import { At as usePage, kt as router3, pt as ShoppingCart, st as formatCurrency, yt as Package } from "./app-BJCY_l2M.js";
import { i as CardTitle, n as CardContent, r as CardHeader, t as Card } from "./card-DQfOgTjC.js";
import { t as Badge } from "./badge-BfSUOZdI.js";
/**
* @license lucide-react v1.26.0 - ISC
*
* This source code is licensed under the ISC license.
* See the LICENSE file in the root directory of this source tree.
*/
var Image = createLucideIcon("image", [
	["rect", {
		width: "18",
		height: "18",
		x: "3",
		y: "3",
		rx: "2",
		ry: "2",
		key: "1m3agn"
	}],
	["circle", {
		cx: "9",
		cy: "9",
		r: "2",
		key: "af1f0g"
	}],
	["path", {
		d: "m21 15-3.086-3.086a2 2 0 0 0-2.828 0L6 21",
		key: "1xmnt7"
	}]
]);
//#endregion
//#region resources/js/Pages/clinic/VisitDetail.tsx
var import_react = /* @__PURE__ */ __toESM(require_react(), 1);
var import_jsx_runtime = require_jsx_runtime();
var statusConfig = {
	completed: {
		label: "Completed",
		class: "text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-800"
	},
	"follow-up": {
		label: "Follow-up",
		class: "text-amber-600 bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-800"
	},
	scheduled: {
		label: "Scheduled",
		class: "text-blue-600 bg-blue-50 dark:bg-blue-500/10 border-blue-200 dark:border-blue-800"
	}
};
function VisitDetailPage() {
	const { props } = usePage();
	const c = props.consultation;
	const [viewerOpen, setViewerOpen] = (0, import_react.useState)(false);
	const [viewerImages, setViewerImages] = (0, import_react.useState)([]);
	const [viewerIndex, setViewerIndex] = (0, import_react.useState)(0);
	const openViewer = (images, startIndex) => {
		setViewerImages(images.map((img) => ({
			id: img.id,
			url: img.url || `/storage/prescriptions/${img.image_path}`,
			name: img.original_name || "Prescription image"
		})));
		setViewerIndex(startIndex);
		setViewerOpen(true);
	};
	if (!c) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "p-8 max-w-2xl mx-auto text-center py-24 text-sm text-muted-foreground",
		children: "Visit not found."
	});
	const statusCfg = statusConfig[c.status] || statusConfig.completed;
	const sale = c.sale || {};
	const saleItems = sale.items || [];
	const prescriptions = c.prescriptions || [];
	const allRxItems = prescriptions.flatMap((rx) => (rx.items || []).map((item) => {
		const saleItem = item.saleItem || item.sale_item || {};
		return {
			...item,
			sale_item: saleItem,
			product: saleItem.product || {},
			prescription: rx
		};
	}));
	const allImages = prescriptions.flatMap((rx) => (rx.images || []).map((img) => ({
		id: img.id,
		image_path: img.image_path,
		original_name: img.original_name,
		url: `/storage/prescriptions/${img.image_path}`
	})));
	const patientName = c.patient?.name || "Unknown Patient";
	const initials = patientName.split(" ").map((n) => n[0]).join("").slice(0, 2);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto space-y-6 pb-24",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-center justify-between",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
					onClick: () => router3.visit(`/clinic/patient/${c.patient_id}`),
					className: "inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowLeft, { className: "size-4" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: ["Back to ", patientName] })]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
					className: cn("text-[11px] px-2.5 py-1 font-medium border", statusCfg.class),
					children: statusCfg.label
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
				className: "overflow-hidden",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: "h-16 bg-gradient-to-r from-primary/70 to-primary/30" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardContent, {
					className: "p-0",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "px-5 pb-5 -mt-8",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-end gap-4 mb-4",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "size-14 rounded-xl bg-background ring-4 ring-background flex items-center justify-center text-lg font-bold text-primary shadow-sm",
								children: initials
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "pt-1",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
									className: "text-lg font-semibold tracking-tight",
									children: patientName
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex items-center gap-2 text-xs text-muted-foreground mt-0.5",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Calendar, { className: "size-3.5" }),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: c.visit_date || "—" }),
										c.doctor && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "·" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: c.doctor.name })] })
									]
								})]
							})]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "grid grid-cols-2 sm:grid-cols-4 gap-3",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "rounded-lg bg-muted/40 px-3 py-2.5",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "text-[10px] text-muted-foreground uppercase tracking-wider",
										children: "Fee"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "text-sm font-semibold mt-0.5",
										children: formatCurrency(c.consultation_fee || 0)
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "rounded-lg bg-muted/40 px-3 py-2.5",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "text-[10px] text-muted-foreground uppercase tracking-wider",
										children: "Total"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "text-sm font-semibold mt-0.5",
										children: formatCurrency(sale.grand_total || 0)
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "rounded-lg bg-muted/40 px-3 py-2.5",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "text-[10px] text-muted-foreground uppercase tracking-wider",
										children: "Paid"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: cn("text-sm font-semibold mt-0.5", (sale.amount_paid || 0) > 0 ? "text-emerald-600" : "text-muted-foreground"),
										children: formatCurrency(sale.amount_paid || 0)
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "rounded-lg bg-muted/40 px-3 py-2.5",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "text-[10px] text-muted-foreground uppercase tracking-wider",
										children: "Medicines"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
										className: "text-sm font-semibold mt-0.5",
										children: allRxItems.length
									})]
								})
							]
						})]
					})
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "grid grid-cols-1 lg:grid-cols-3 gap-6",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "lg:col-span-2 space-y-5",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardHeader, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardTitle, {
							className: "flex items-center gap-2 text-sm",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FileText, { className: "size-4 text-muted-foreground" }), "Visit Details"]
						}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardContent, {
							className: "space-y-3",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "text-[11px] text-muted-foreground uppercase tracking-wider mb-1",
								children: "Diagnosis"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-sm font-medium",
								children: c.diagnosis || "—"
							})] }), c.notes && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "text-[11px] text-muted-foreground uppercase tracking-wider mb-1",
								children: "Clinical Notes"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap",
								children: c.notes
							})] })]
						})] }),
						allRxItems.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardHeader, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardTitle, {
							className: "flex items-center gap-2 text-sm",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pill, { className: "size-4 text-muted-foreground" }), "Prescribed Medicines"]
						}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardContent, {
							className: "space-y-3",
							children: allRxItems.map((item, idx) => {
								const product = item.sale_item?.product || {};
								const si = item.sale_item || {};
								const colors = [
									"from-sky-500/20 to-blue-500/10",
									"from-purple-500/20 to-violet-500/10",
									"from-emerald-500/20 to-teal-500/10",
									"from-amber-500/20 to-orange-500/10",
									"from-rose-500/20 to-pink-500/10"
								];
								const colorClass = colors[idx % colors.length];
								return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "rounded-xl border border-border overflow-hidden",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: cn("h-1.5 bg-gradient-to-r", colorClass) }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "p-4 space-y-3",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "flex items-start justify-between gap-3",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h4", {
													className: "text-sm font-semibold text-foreground",
													children: product.name || si.product_name || "Medicine"
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
													className: "text-xs text-muted-foreground mt-0.5",
													children: [
														si.packaging_name || "Unit",
														" × ",
														si.packaging_quantity || 1
													]
												})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
													className: "text-sm font-semibold text-foreground whitespace-nowrap",
													children: formatCurrency(si.total || 0)
												})]
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "grid grid-cols-3 gap-2",
												children: [
													/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
														className: "rounded-lg bg-muted/40 px-2.5 py-2",
														children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
															className: "flex items-center gap-1 text-[10px] text-muted-foreground mb-0.5",
															children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pill, { className: "size-2.5" }), " Dosage"]
														}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
															className: "text-xs font-medium",
															children: item.dosage || "1"
														})]
													}),
													/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
														className: "rounded-lg bg-muted/40 px-2.5 py-2",
														children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
															className: "flex items-center gap-1 text-[10px] text-muted-foreground mb-0.5",
															children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Clock, { className: "size-2.5" }), " Frequency"]
														}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
															className: "text-xs font-medium",
															children: item.frequency || "—"
														})]
													}),
													/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
														className: "rounded-lg bg-muted/40 px-2.5 py-2",
														children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
															className: "flex items-center gap-1 text-[10px] text-muted-foreground mb-0.5",
															children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CalendarDays, { className: "size-2.5" }), " Duration"]
														}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
															className: "text-xs font-medium",
															children: item.duration || "—"
														})]
													})
												]
											}),
											item.instructions && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "flex items-start gap-1.5 text-[11px] text-muted-foreground pt-2 border-t border-border/40",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FileText, { className: "size-3 mt-0.5 shrink-0" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: item.instructions })]
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "text-[10px] text-muted-foreground pt-1 border-t border-border/40 flex items-center gap-2",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ShoppingCart, { className: "size-3" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [
													"Base qty: ",
													si.base_quantity || 0,
													" · Price/unit: ",
													formatCurrency(si.unit_price || 0)
												] })]
											})
										]
									})]
								}, item.id);
							})
						})] }),
						allRxItems.length === 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Card, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardContent, {
							className: "p-6 text-center text-sm text-muted-foreground",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Package, { className: "size-8 mx-auto mb-2 text-muted-foreground/30" }), "No medicines prescribed in this visit."]
						}) })
					]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "space-y-5",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardHeader, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardTitle, {
						className: "flex items-center gap-2 text-sm",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ShoppingCart, { className: "size-4 text-muted-foreground" }), "Sale"]
					}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardContent, {
						className: "space-y-3",
						children: sale.id ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex justify-between text-sm",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-muted-foreground",
									children: "Invoice"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "font-medium font-mono text-xs",
									children: sale.invoice_number || "—"
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex justify-between text-sm",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-muted-foreground",
									children: "Items"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "font-medium",
									children: saleItems.length
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "border-t border-border/60 pt-2 space-y-1.5",
								children: saleItems.map((si) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex justify-between text-xs",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "text-muted-foreground truncate max-w-[60%]",
										children: si.product_name || "Item"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "font-medium",
										children: formatCurrency(si.total || 0)
									})]
								}, si.id))
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "border-t border-border/60 pt-2 flex justify-between text-sm font-semibold",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Total" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: formatCurrency(sale.grand_total || 0) })]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex justify-between text-sm",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-muted-foreground",
									children: "Paid"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: cn("font-medium", (sale.amount_paid || 0) > 0 ? "text-emerald-600" : "text-muted-foreground"),
									children: formatCurrency(sale.amount_paid || 0)
								})]
							}),
							(sale.outstanding_balance || 0) > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex justify-between text-sm",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-muted-foreground",
									children: "Outstanding"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "font-medium text-amber-600",
									children: formatCurrency(sale.outstanding_balance || 0)
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
								variant: "outline",
								size: "sm",
								className: "w-full gap-1.5 mt-1",
								onClick: () => router3.visit(`/sales/${sale.id}`),
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ShoppingCart, { className: "size-3.5" }), " View Full Sale"]
							})
						] }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-sm text-muted-foreground",
							children: "No sale record"
						})
					})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardHeader, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardTitle, {
						className: "flex items-center gap-2 text-sm",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Image, { className: "size-4 text-muted-foreground" }),
							"Images",
							allImages.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
								variant: "outline",
								className: "ml-auto text-[10px] px-1.5 py-0 h-4 font-normal",
								children: allImages.length
							})
						]
					}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardContent, { children: allImages.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "flex flex-wrap gap-2",
						children: allImages.map((img, idx) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							onClick: () => openViewer(allImages, idx),
							className: "size-20 rounded-lg overflow-hidden border border-border hover:border-primary/50 transition-colors",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
								src: img.url,
								alt: "",
								className: "size-full object-cover",
								onError: (e) => {
									e.target.style.display = "none";
								}
							})
						}, img.id))
					}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "text-sm text-muted-foreground text-center py-4",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Image, { className: "size-6 mx-auto mb-1 text-muted-foreground/30" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-xs",
							children: "No images"
						})]
					}) })] })]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ImageViewer, {
				images: viewerImages,
				open: viewerOpen,
				onClose: () => setViewerOpen(false),
				initialIndex: viewerIndex
			})
		]
	});
}
//#endregion
export { VisitDetailPage as default };
