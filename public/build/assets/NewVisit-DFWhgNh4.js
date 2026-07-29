import { i as __toESM, t as require_react } from "./react-DCO0ASPG.js";
import { t as ArrowLeft } from "./arrow-left-CE4TWQlw.js";
import { t as CalendarDays } from "./calendar-days-CE0jslca.js";
import { t as Clock } from "./clock-zPxdzOK3.js";
import { t as FileText } from "./file-text-CkmQ0M6N.js";
import { t as Pill } from "./pill-BnEdyPyP.js";
import { t as Save } from "./save-D4S_dtxM.js";
import { t as Upload } from "./upload-C9Un4eAn.js";
import { t as cn } from "./utils-Bim8RyS4.js";
import { t as require_jsx_runtime } from "./jsx-runtime-BjJQA5sn.js";
import { t as Button } from "./button-phKcTdak.js";
import { Dt as usePage, Et as router3, _t as Plus, ct as X, st as formatCurrency, vt as Package, wt as toast } from "./app-DCc201bC.js";
import { i as CardTitle, n as CardContent, r as CardHeader, t as Card } from "./card-DQfOgTjC.js";
import AddMedicineDialog from "./AddMedicineDialog-C83mY4Yx.js";
//#region resources/js/Pages/clinic/NewVisit.tsx
var import_react = /* @__PURE__ */ __toESM(require_react(), 1);
var import_jsx_runtime = require_jsx_runtime();
var paymentOptions = [
	{
		id: "full",
		label: "Full Payment",
		desc: "Pay entire amount now"
	},
	{
		id: "partial",
		label: "Partial Payment",
		desc: "Pay part now, rest later"
	},
	{
		id: "balance",
		label: "Add To Balance",
		desc: "No payment now"
	}
];
var paymentMethods = [
	{
		id: "cash",
		label: "Cash"
	},
	{
		id: "card",
		label: "Card"
	},
	{
		id: "easypaisa",
		label: "Easypaisa"
	},
	{
		id: "jazzcash",
		label: "JazzCash"
	},
	{
		id: "transfer",
		label: "Bank Transfer"
	}
];
function NewVisitPage() {
	const { props, url } = usePage();
	const patient = props.patient;
	const serverProducts = props.products || [];
	const [diagnosis, setDiagnosis] = (0, import_react.useState)("");
	const [notes, setNotes] = (0, import_react.useState)("");
	const [consultationFee, setConsultationFee] = (0, import_react.useState)("2000");
	const [paymentOption, setPaymentOption] = (0, import_react.useState)("full");
	const [paymentMethod, setPaymentMethod] = (0, import_react.useState)("cash");
	const [selectedMeds, setSelectedMeds] = (0, import_react.useState)([]);
	const [showMedDialog, setShowMedDialog] = (0, import_react.useState)(false);
	const [editingIdx, setEditingIdx] = (0, import_react.useState)(null);
	const [saving, setSaving] = (0, import_react.useState)(false);
	const [prescriptionImages, setPrescriptionImages] = (0, import_react.useState)([]);
	const [imagePreviews, setImagePreviews] = (0, import_react.useState)([]);
	const [uploadingImages, setUploadingImages] = (0, import_react.useState)(false);
	const fileInputRef = (0, import_react.useRef)(null);
	if (!patient) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto text-center py-24 text-sm text-muted-foreground",
		children: "Patient not found."
	});
	const handleAddMedicine = (entry) => {
		if (editingIdx !== null) {
			setSelectedMeds((prev) => prev.map((m, i) => i === editingIdx ? {
				...entry,
				id: m.id
			} : m));
			setEditingIdx(null);
		} else setSelectedMeds((prev) => [...prev, entry]);
	};
	const handleEditMedicine = (idx) => {
		setEditingIdx(idx);
		setShowMedDialog(true);
	};
	const handleRemoveMedicine = (idx) => {
		setSelectedMeds((prev) => prev.filter((_, i) => i !== idx));
	};
	const consultationAmount = parseInt(consultationFee) || 0;
	const medTotal = selectedMeds.reduce((sum, m) => sum + m.total, 0);
	const grandTotal = consultationAmount + medTotal;
	const handleSave = () => {
		if (!diagnosis.trim()) {
			toast.error("Please enter a diagnosis");
			return;
		}
		setSaving(true);
		const amountPaid = paymentOption === "full" ? grandTotal : paymentOption === "partial" ? Math.round(grandTotal * .4) : 0;
		grandTotal - amountPaid;
		const medicineAmountPaid = Math.min(amountPaid, medTotal);
		const medicinePaymentStatus = medicineAmountPaid === 0 ? "unpaid" : medicineAmountPaid >= medTotal ? "paid" : "partial";
		router3.post("/clinic/visits", {
			patient_id: patient.id,
			diagnosis: diagnosis.trim(),
			notes: notes.trim(),
			consultation_fee: consultationAmount,
			medications: selectedMeds.map((m) => ({
				product_id: m.productId,
				selling_unit_id: m.sellingUnitId,
				packaging_quantity: m.packagingQuantity,
				base_unit_quantity: m.baseUnitQuantity,
				unit_price: m.unitPrice,
				total: m.total,
				packaging_name: m.packagingName,
				dosage: m.dosage,
				frequency: m.frequency,
				duration: m.duration,
				instructions: m.notes || ""
			})),
			payment_method: paymentMethod,
			amount_paid: medicineAmountPaid,
			payment_status: medicinePaymentStatus
		}, {
			onSuccess: (page) => {
				toast.success(`Visit saved — ${grandTotal > 0 ? "Rs. " + grandTotal.toLocaleString() : "no charge"}`);
				setSaving(false);
				const consultations = page?.props?.consultations || [];
				const prescriptionId = consultations.length > 0 ? consultations[0]?.prescriptions?.[0]?.id : null;
				if (prescriptionId && prescriptionImages.length > 0) prescriptionImages.forEach((file) => {
					const formData = new FormData();
					formData.append("image", file);
					window.axios.post(`/api/prescriptions/${prescriptionId}/images`, formData).catch(() => {});
				});
			},
			onError: (errs) => {
				const msg = Object.values(errs).join(", ") || "Failed to save visit";
				toast.error(msg);
				setSaving(false);
			}
		});
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(import_jsx_runtime.Fragment, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto space-y-5 pb-24",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "flex items-center justify-between",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
					onClick: () => router3.visit(`/clinic/patient/${patient.id}`),
					className: "inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowLeft, { className: "size-4" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: ["Back to ", patient.name] })]
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Card, {
				size: "sm",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardContent, {
					className: "p-4 flex items-center gap-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "size-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-bold",
						children: patient.name.split(" ").map((n) => n[0]).join("").slice(0, 2)
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
						className: "text-sm font-semibold",
						children: patient.name
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-xs text-muted-foreground",
						children: patient.phone
					})] })]
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "grid grid-cols-1 lg:grid-cols-5 gap-6",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "lg:col-span-3 space-y-4",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardHeader, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardTitle, { children: "Visit Details" }) }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardContent, {
						className: "space-y-4",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "space-y-1.5",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
									className: "text-xs font-medium text-foreground",
									children: ["Diagnosis ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "text-red-500",
										children: "*"
									})]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
									type: "text",
									placeholder: "e.g. Seasonal allergies — mild rhinitis",
									value: diagnosis,
									onChange: (e) => setDiagnosis(e.target.value),
									className: "w-full h-10 px-3 rounded-lg border border-input bg-background text-sm outline-none focus:border-ring focus:ring-1 focus:ring-ring/30"
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "space-y-1.5",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
									className: "text-xs font-medium text-foreground",
									children: "Clinical Notes"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("textarea", {
									placeholder: "Detailed observations, recommendations...",
									value: notes,
									onChange: (e) => setNotes(e.target.value),
									rows: 3,
									className: "w-full px-3 py-2 rounded-lg border border-input bg-background text-sm outline-none focus:border-ring focus:ring-1 focus:ring-ring/30 resize-none"
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "space-y-1.5",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
									className: "text-xs font-medium text-foreground",
									children: "Consultation Fee (Rs.)"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
									type: "number",
									value: consultationFee,
									onChange: (e) => setConsultationFee(e.target.value),
									className: "w-full h-10 px-3 rounded-lg border border-input bg-background text-sm outline-none focus:border-ring focus:ring-1 focus:ring-ring/30",
									min: "0"
								})]
							})
						]
					})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardHeader, {
						className: "flex-row items-center justify-between",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardTitle, { children: "Prescription Items" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
							size: "sm",
							variant: "outline",
							className: "gap-1.5",
							onClick: () => {
								setEditingIdx(null);
								setShowMedDialog(true);
							},
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, { className: "size-3.5" }), " Add Medicine"]
						})]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardContent, { children: selectedMeds.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "text-center py-8 text-sm text-muted-foreground",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Package, { className: "size-8 mx-auto mb-2 text-muted-foreground/30" }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: "No medicines added yet." }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-xs mt-1",
								children: "Click \"Add Medicine\" to prescribe."
							})
						]
					}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "space-y-2",
						children: selectedMeds.map((med, idx) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-start gap-3 rounded-lg border border-border p-3 group hover:border-muted-foreground/30 transition-colors",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex-1 min-w-0",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex items-center gap-2",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: "text-sm font-semibold text-foreground",
										children: med.name
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
										className: "text-xs text-muted-foreground",
										children: [
											"×",
											med.packagingQuantity,
											" ",
											med.packagingName
										]
									})]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
											className: "text-[11px] inline-flex items-center gap-1 text-muted-foreground",
											children: [
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pill, { className: "size-3" }),
												" ",
												med.dosage
											]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
											className: "text-[11px] inline-flex items-center gap-1 text-muted-foreground",
											children: [
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Clock, { className: "size-3" }),
												" ",
												med.frequency
											]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
											className: "text-[11px] inline-flex items-center gap-1 text-muted-foreground",
											children: [
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CalendarDays, { className: "size-3" }),
												" ",
												med.duration
											]
										}),
										med.notes && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
											className: "text-[11px] inline-flex items-center gap-1 text-muted-foreground",
											children: [
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FileText, { className: "size-3" }),
												" ",
												med.notes
											]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "text-xs font-medium text-foreground ml-auto",
											children: formatCurrency(med.total)
										})
									]
								})]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									onClick: () => handleEditMedicine(idx),
									className: "flex items-center justify-center size-7 rounded-md bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("svg", {
										className: "size-3",
										fill: "none",
										viewBox: "0 0 24 24",
										stroke: "currentColor",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
											strokeLinecap: "round",
											strokeLinejoin: "round",
											strokeWidth: 2,
											d: "M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
										})
									})
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									onClick: () => handleRemoveMedicine(idx),
									className: "flex items-center justify-center size-7 rounded-md bg-muted hover:bg-red-50 dark:hover:bg-red-950/30 text-muted-foreground hover:text-red-600",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("svg", {
										className: "size-3",
										fill: "none",
										viewBox: "0 0 24 24",
										stroke: "currentColor",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("path", {
											strokeLinecap: "round",
											strokeLinejoin: "round",
											strokeWidth: 2,
											d: "M6 18L18 6M6 6l12 12"
										})
									})
								})]
							})]
						}, med.id || idx))
					}) })] })]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "lg:col-span-2 space-y-4",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "sticky top-20 space-y-4",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardHeader, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardTitle, { children: "Bill Summary" }) }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardContent, {
								className: "space-y-3",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex justify-between text-sm",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "text-muted-foreground",
											children: "Consultation Fee"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "font-medium",
											children: formatCurrency(consultationAmount)
										})]
									}),
									selectedMeds.map((m) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex justify-between text-sm",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
											className: "text-muted-foreground truncate max-w-[60%]",
											children: [
												m.name,
												" ×",
												m.packagingQuantity
											]
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "font-medium",
											children: formatCurrency(m.total)
										})]
									}, m.productId)),
									selectedMeds.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "pt-2 border-t border-border flex justify-between text-sm",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "text-muted-foreground",
											children: "Prescription Items"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "font-medium",
											children: selectedMeds.length
										})]
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "border-t border-border pt-2 flex justify-between",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "text-sm font-semibold",
											children: "Grand Total"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "text-lg font-bold",
											children: formatCurrency(grandTotal)
										})]
									})
								]
							})] }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardHeader, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardTitle, { children: "Prescription Images" }) }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardContent, { children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
									ref: fileInputRef,
									type: "file",
									accept: "image/jpeg,image/png,image/webp",
									multiple: true,
									capture: "environment",
									className: "hidden",
									onChange: (e) => {
										const files = Array.from(e.target.files || []);
										if (files.length === 0) return;
										setPrescriptionImages((prev) => [...prev, ...files]);
										files.forEach((file) => {
											const reader = new FileReader();
											reader.onload = (ev) => {
												if (ev.target?.result) setImagePreviews((prev) => [...prev, ev.target.result]);
											};
											reader.readAsDataURL(file);
										});
										e.target.value = "";
									}
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex flex-wrap gap-2",
									children: [imagePreviews.map((preview, idx) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "relative size-16 rounded-lg overflow-hidden border border-border group",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
											src: preview,
											alt: "",
											className: "size-full object-cover"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
											onClick: () => {
												setPrescriptionImages((prev) => prev.filter((_, i) => i !== idx));
												setImagePreviews((prev) => prev.filter((_, i) => i !== idx));
											},
											className: "absolute top-0.5 right-0.5 size-5 rounded-full bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity",
											children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { className: "size-3" })
										})]
									}, idx)), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
										onClick: () => fileInputRef.current?.click(),
										className: "size-16 rounded-lg border-2 border-dashed border-border hover:border-primary/50 flex flex-col items-center justify-center gap-0.5 text-muted-foreground hover:text-primary transition-colors",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Upload, { className: "size-4" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "text-[9px] font-medium",
											children: "Upload"
										})]
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-[10px] text-muted-foreground mt-1",
									children: prescriptionImages.length > 0 ? `${prescriptionImages.length} file${prescriptionImages.length > 1 ? "s" : ""} selected` : "JPEG, PNG, or WebP — max 10MB each"
								})
							] })] }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardHeader, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardTitle, { children: "Payment Method" }) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardContent, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "grid grid-cols-3 gap-2",
								children: paymentMethods.map((m) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									onClick: () => setPaymentMethod(m.id),
									className: cn("px-2 py-2 rounded-lg border-2 text-xs font-medium transition-all text-center", paymentMethod === m.id ? "border-primary bg-primary/5 text-foreground" : "border-border text-muted-foreground hover:text-foreground"),
									children: m.label
								}, m.id))
							}) })] }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardHeader, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardTitle, { children: "Payment" }) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardContent, {
								className: "space-y-2",
								children: paymentOptions.map((opt) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
									onClick: () => setPaymentOption(opt.id),
									className: cn("w-full text-left p-3 rounded-xl border-2 transition-all", paymentOption === opt.id ? "border-primary bg-primary/5" : "border-border hover:border-muted-foreground/30"),
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
											className: "text-sm font-medium text-foreground",
											children: opt.label
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
											className: "text-xs text-muted-foreground mt-0.5",
											children: opt.desc
										}),
										paymentOption === opt.id && opt.id === "full" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "text-xs font-semibold text-emerald-600 mt-1",
											children: [
												"Pay ",
												formatCurrency(grandTotal),
												" now"
											]
										}),
										paymentOption === opt.id && opt.id === "partial" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "text-xs font-semibold text-amber-600 mt-1",
											children: [
												"Pay ",
												formatCurrency(Math.round(grandTotal * .4)),
												" now, balance later"
											]
										}),
										paymentOption === opt.id && opt.id === "balance" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "text-xs font-semibold text-red-600 mt-1",
											children: [
												"No payment today — ",
												formatCurrency(grandTotal),
												" to balance"
											]
										})
									]
								}, opt.id))
							})] }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
								onClick: handleSave,
								disabled: saving,
								size: "lg",
								className: "w-full h-11 gap-1.5 shadow-sm",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Save, { className: "size-4" }), saving ? "Saving..." : "Save Visit"]
							})
						]
					})
				})]
			})
		]
	}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(AddMedicineDialog, {
		open: showMedDialog,
		onClose: () => {
			setShowMedDialog(false);
			setEditingIdx(null);
		},
		onAdd: handleAddMedicine,
		selectedIds: selectedMeds.map((m) => m.productId),
		editEntry: editingIdx !== null ? selectedMeds[editingIdx] : null,
		products: serverProducts
	})] });
}
//#endregion
export { NewVisitPage as default };
