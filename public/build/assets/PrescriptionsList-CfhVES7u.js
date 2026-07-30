import { i as __toESM, t as require_react } from "./react-DCO0ASPG.js";
import { t as CalendarDays } from "./calendar-days-CE0jslca.js";
import { t as Clock } from "./clock-zPxdzOK3.js";
import { t as FileText } from "./file-text-CkmQ0M6N.js";
import { t as Pill } from "./pill-BnEdyPyP.js";
import { t as RefreshCw } from "./refresh-cw-DGGw9qMI.js";
import { t as RotateCcw } from "./rotate-ccw-DB3zy8KA.js";
import { t as ImageViewer } from "./ImageViewer-CMophjqx.js";
import { t as cn } from "./utils-Bim8RyS4.js";
import { t as require_jsx_runtime } from "./jsx-runtime-BjJQA5sn.js";
import { t as Button } from "./button-phKcTdak.js";
import { a as DialogTitle, i as DialogHeader, n as DialogContent, r as DialogDescription, t as Dialog } from "./dialog-EmwkokJQ.js";
import { Dt as router3, Tt as toast, _t as Package, lt as Trash2 } from "./app-DQEL3DJY.js";
import { n as CardContent, t as Card } from "./card-D1ktOUWx.js";
import { t as Badge } from "./badge-BfSUOZdI.js";
//#region resources/js/Pages/clinic/components/PrescriptionsList.tsx
var import_react = /* @__PURE__ */ __toESM(require_react(), 1);
var import_jsx_runtime = require_jsx_runtime();
function PrescriptionsList({ prescriptions }) {
	const [viewerOpen, setViewerOpen] = (0, import_react.useState)(false);
	const [viewerImages, setViewerImages] = (0, import_react.useState)([]);
	const [viewerIndex, setViewerIndex] = (0, import_react.useState)(0);
	const openViewer = (images, startIndex) => {
		setViewerImages(images.map((img) => ({
			id: img.id,
			url: `/storage/prescriptions/${img.image_path}`,
			name: img.original_name || "Prescription image"
		})));
		setViewerIndex(startIndex);
		setViewerOpen(true);
	};
	const [deleteTarget, setDeleteTarget] = (0, import_react.useState)(null);
	const [deleteReason, setDeleteReason] = (0, import_react.useState)("");
	const [isDeleting, setIsDeleting] = (0, import_react.useState)(false);
	const handleDelete = () => {
		if (!deleteTarget) return;
		setIsDeleting(true);
		router3.delete(`/clinic/prescriptions/${deleteTarget.id}`, {
			data: { reason: deleteReason || "Manual deletion" },
			onSuccess: () => {
				toast.success("Prescription deleted.");
				setDeleteTarget(null);
				setDeleteReason("");
			},
			onError: (err) => toast.error(Object.values(err).join(", ")),
			onFinish: () => setIsDeleting(false)
		});
	};
	const handleRestore = (rx) => {
		router3.post(`/clinic/prescriptions/${rx.id}/restore`, {}, {
			onSuccess: () => {
				toast.success("Prescription restored.");
				setDeleteTarget(null);
			},
			onError: (err) => toast.error(Object.values(err).join(", "))
		});
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "space-y-3",
		children: [
			prescriptions.map((rx, idx) => {
				const colors = [
					"from-sky-500/20 to-blue-500/10 text-blue-600 dark:text-blue-400",
					"from-purple-500/20 to-violet-500/10 text-purple-600 dark:text-purple-400",
					"from-emerald-500/20 to-teal-500/10 text-emerald-600 dark:text-emerald-400",
					"from-amber-500/20 to-orange-500/10 text-amber-600 dark:text-amber-400",
					"from-rose-500/20 to-pink-500/10 text-rose-600 dark:text-rose-400"
				];
				const colorClass = colors[idx % colors.length];
				const items = rx.items || [];
				return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Card, {
					size: "sm",
					className: "overflow-hidden",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardContent, {
						className: "p-0",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "p-4",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex items-start justify-between gap-3 mb-3",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "flex items-center gap-3",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
												className: cn("flex items-center justify-center size-10 rounded-xl bg-gradient-to-br shrink-0", colorClass),
												children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pill, { className: "size-5" })
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h5", {
												className: "text-sm font-semibold text-foreground",
												children: ["Prescription #", rx.id]
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
												className: "text-xs text-muted-foreground",
												children: [
													rx.prescribed_by || "Dr. Ahmed",
													" · ",
													rx.date || "—"
												]
											})] })]
										}),
										rx.refillable && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Badge, {
											variant: "outline",
											className: "text-[10px] px-2 py-0 h-5 font-medium text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800 shrink-0",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(RefreshCw, { className: "size-2.5 mr-1" }), "Refillable"]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
											className: "flex items-center gap-1 shrink-0",
											children: rx.deleted_at ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
												onClick: () => handleRestore(rx),
												className: "p-1.5 rounded-lg text-primary hover:bg-primary/5 transition-colors",
												title: "Restore",
												children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(RotateCcw, { className: "size-3.5" })
											}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
												onClick: () => {
													setDeleteTarget(rx);
													setDeleteReason("");
												},
												className: "p-1.5 rounded-lg text-red-400 hover:text-red-500 hover:bg-red-50 transition-colors",
												title: "Delete",
												children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash2, { className: "size-3.5" })
											})
										})
									]
								}),
								items.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "space-y-2",
									children: items.map((item) => {
										const saleItem = item.sale_item || item.saleItem || {};
										return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "rounded-lg bg-muted/40 p-3 border border-border/50",
											children: [
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
													className: "text-sm font-semibold text-foreground mb-2",
													children: (saleItem.product || {}).name || saleItem.product_name || "Medicine"
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
													className: "grid grid-cols-3 gap-2",
													children: [
														/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
															className: "px-2 py-1.5 rounded bg-muted/50",
															children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
																className: "flex items-center gap-1 text-[10px] text-muted-foreground mb-0.5",
																children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pill, { className: "size-2.5" }), " Dosage"]
															}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
																className: "text-xs font-medium text-foreground",
																children: item.dosage || "1"
															})]
														}),
														/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
															className: "px-2 py-1.5 rounded bg-muted/50",
															children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
																className: "flex items-center gap-1 text-[10px] text-muted-foreground mb-0.5",
																children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Clock, { className: "size-2.5" }), " Frequency"]
															}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
																className: "text-xs font-medium text-foreground",
																children: item.frequency || "—"
															})]
														}),
														/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
															className: "px-2 py-1.5 rounded bg-muted/50",
															children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
																className: "flex items-center gap-1 text-[10px] text-muted-foreground mb-0.5",
																children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CalendarDays, { className: "size-2.5" }), " Duration"]
															}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
																className: "text-xs font-medium text-foreground",
																children: item.duration || "—"
															})]
														})
													]
												}),
												item.instructions && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
													className: "flex items-start gap-1.5 text-[11px] text-muted-foreground mt-2 pt-2 border-t border-border/40",
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FileText, { className: "size-3 mt-0.5 shrink-0" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: item.instructions })]
												}),
												rx.images && rx.images.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
													className: "flex flex-wrap gap-1.5 mt-2 pt-2 border-t border-border/40",
													children: rx.images.map((img, imgIdx) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
														onClick: () => openViewer(rx.images, imgIdx),
														className: "size-10 rounded-lg overflow-hidden border border-border hover:border-primary/50 transition-colors",
														children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
															src: `/storage/prescriptions/${img.image_path}`,
															alt: "",
															className: "size-full object-cover",
															onError: (e) => {
																e.target.style.display = "none";
															}
														})
													}, img.id))
												}),
												saleItem.packaging_quantity && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
													className: "text-[10px] text-muted-foreground mt-1.5",
													children: [
														"×",
														saleItem.packaging_quantity,
														" ",
														saleItem.packaging_name || "unit",
														" @ Rs.",
														saleItem.unit_price || 0
													]
												})
											]
										}, item.id);
									})
								}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "text-[11px] text-muted-foreground italic",
									children: "No medicine details"
								}),
								rx.notes && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex items-start gap-1.5 text-[11px] text-muted-foreground mt-3 pt-2 border-t border-border",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FileText, { className: "size-3 mt-0.5 shrink-0" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: rx.notes })]
								})
							]
						})
					})
				}, rx.id);
			}),
			prescriptions.length === 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "text-center py-12 text-sm text-muted-foreground",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Package, { className: "size-8 mx-auto mb-2 text-muted-foreground/30" }), "No prescriptions found."]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Dialog, {
				open: deleteTarget !== null,
				onOpenChange: (v) => {
					if (!v) setDeleteTarget(null);
				},
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogContent, {
					className: "sm:max-w-md gap-0 p-0",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogHeader, {
						className: "p-5 pb-0",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogTitle, {
							className: "text-base flex items-center gap-2 text-red-500",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash2, { className: "size-5" }), "Delete Prescription"]
						})
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "p-5 space-y-4",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogDescription, {
								className: "text-sm text-muted-foreground leading-relaxed",
								children: [
									"This will ",
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)("strong", { children: "soft-delete" }),
									" the prescription. No inventory or balance will be impacted — linked sale items remain unchanged. You can restore it from the Recycle Bin later."
								]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
								className: "text-xs font-medium text-muted-foreground block mb-1",
								children: "Reason for deletion"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								type: "text",
								value: deleteReason,
								onChange: (e) => setDeleteReason(e.target.value),
								placeholder: "Incorrect prescription, etc.",
								className: "w-full h-10 px-3 rounded-xl border border-input bg-background text-sm outline-none focus:border-ring transition-colors"
							})] }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex gap-2",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
									variant: "outline",
									onClick: () => {
										setDeleteTarget(null);
										setDeleteReason("");
									},
									className: "flex-1",
									children: "Cancel"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
									onClick: handleDelete,
									disabled: isDeleting,
									className: "flex-1 gap-1.5 bg-red-600 hover:bg-red-700",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash2, { className: "size-4" }),
										" ",
										isDeleting ? "Deleting..." : "Delete Prescription"
									]
								})]
							})
						]
					})]
				})
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
export { PrescriptionsList as default };
