import { a as __toESM, n as require_react, t as require_jsx_runtime } from "./jsx-runtime-Do9val7F.js";
import { t as ArrowLeft } from "./arrow-left-Bd6q48cy.js";
import { t as Pill } from "./pill-iaTbLzbV.js";
import { t as cn } from "./utils-Bim8RyS4.js";
import { t as Button } from "./button-Av_5dPGQ.js";
import { a as DialogTitle, i as DialogHeader, n as DialogContent, r as DialogDescription, t as Dialog } from "./dialog-1KF5mlsQ.js";
import { Ot as router3, _t as Plus, dt as Stethoscope, kt as usePage, ut as Trash2, xt as CreditCard } from "./app-D-B5Ydis.js";
import PatientHeader from "./PatientHeader-BMDmliTd.js";
import VisitsTimeline from "./VisitsTimeline-BxpwBtoF.js";
import PrescriptionsList from "./PrescriptionsList-BoyHJmYz.js";
import PaymentsOverview from "./PaymentsOverview-vfnE2-eX.js";
import { t as useLifecycleAction } from "./use-lifecycle-action-Dr2NJj9o.js";
//#region resources/js/Pages/clinic/PatientProfile.tsx
var import_react = /* @__PURE__ */ __toESM(require_react(), 1);
var import_jsx_runtime = require_jsx_runtime();
var tabs = [
	{
		id: "visits",
		label: "Visits",
		icon: Stethoscope
	},
	{
		id: "prescriptions",
		label: "Prescriptions",
		icon: Pill
	},
	{
		id: "payments",
		label: "Payments",
		icon: CreditCard
	}
];
function PatientProfilePage() {
	const { props } = usePage();
	const patient = props.patient;
	const consultations = props.consultations || [];
	const prescriptions = props.prescriptions || [];
	const [activeTab, setActiveTab] = (0, import_react.useState)("visits");
	const [showDeleteDialog, setShowDeleteDialog] = (0, import_react.useState)(false);
	const [deleteReason, setDeleteReason] = (0, import_react.useState)("");
	const { run, processing: isDeleting } = useLifecycleAction();
	const handleDelete = () => {
		run({
			url: `/contacts/${patient.id}`,
			method: "delete",
			data: { reason: deleteReason || "Deleted from clinic module" },
			onDone: () => router3.visit("/clinic", { preserveState: false })
		});
	};
	if (!patient) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto text-center py-24 text-sm text-muted-foreground",
		children: "Patient not found."
	});
	const totalPaid = consultations.reduce((sum, c) => sum + (c.sale?.amount_paid ?? 0), 0);
	const totalOutstanding = consultations.reduce((sum, c) => sum + (c.sale?.outstanding_balance ?? 0), 0);
	const allPayments = consultations.flatMap((c) => {
		const sale = c.sale;
		if (!sale || !sale.amount_paid) return [];
		return [{
			date: sale.date,
			amount: sale.amount_paid,
			method: sale.payment_method || "cash",
			reference: sale.invoice_number,
			description: c.diagnosis
		}];
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto space-y-5",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-center justify-between",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						onClick: () => router3.visit("/clinic"),
						className: "inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowLeft, { className: "size-4" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Back to patients" })]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
						onClick: () => router3.visit(`/clinic/patient/${patient.id}/visit`),
						className: "gap-1.5 h-9 shadow-sm",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, { className: "size-4" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "New Visit" })]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
						variant: "outline",
						onClick: () => setShowDeleteDialog(true),
						className: "gap-1.5 h-9 text-red-500 border-red-200 hover:bg-red-50 shrink-0",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash2, { className: "size-4" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Delete Patient" })]
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PatientHeader, {
				patient,
				visitCount: consultations.length
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "border-b border-border",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "flex -mb-px overflow-x-auto scrollbar-none",
					children: tabs.map((tab) => {
						const Icon = tab.icon;
						return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							onClick: () => setActiveTab(tab.id),
							className: cn("flex items-center gap-2 px-3 sm:px-4 py-3 text-sm font-medium border-b-2 transition-colors shrink-0 whitespace-nowrap", activeTab === tab.id ? "border-primary text-foreground" : "border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground/30"),
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, { className: "size-4" }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: tab.label }),
								tab.id === "visits" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "inline-flex items-center justify-center size-5 rounded-full bg-muted text-[10px] font-semibold text-muted-foreground",
									children: consultations.length
								}),
								tab.id === "prescriptions" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "inline-flex items-center justify-center size-5 rounded-full bg-muted text-[10px] font-semibold text-muted-foreground",
									children: prescriptions.length
								})
							]
						}, tab.id);
					})
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
				activeTab === "visits" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(VisitsTimeline, { consultations }),
				activeTab === "prescriptions" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PrescriptionsList, { prescriptions }),
				activeTab === "payments" && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PaymentsOverview, {
					payments: allPayments,
					totalPaid,
					totalOutstanding
				})
			] }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Dialog, {
				open: showDeleteDialog,
				onOpenChange: setShowDeleteDialog,
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogContent, {
					className: "sm:max-w-md gap-0 p-0",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogHeader, {
						className: "p-5 pb-0",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogTitle, {
							className: "text-base flex items-center gap-2 text-red-500",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash2, { className: "size-5" }), "Delete Patient"]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogDescription, {
							className: "text-sm text-muted-foreground pt-1",
							children: "This will delete the patient contact. Any remaining visits, sales, or purchases must be removed first."
						})]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "p-5 space-y-4",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
							className: "text-xs font-medium text-muted-foreground mb-1.5 block",
							children: "Reason for deletion"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							type: "text",
							value: deleteReason,
							onChange: (e) => setDeleteReason(e.target.value),
							placeholder: "e.g. Duplicate record, no longer a patient...",
							className: "w-full h-10 px-3 rounded-lg border border-input bg-background text-sm outline-none focus:border-ring"
						})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex gap-2",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
								variant: "outline",
								onClick: () => {
									setShowDeleteDialog(false);
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
									isDeleting ? "Deleting..." : "Delete Patient"
								]
							})]
						})]
					})]
				})
			})
		]
	});
}
//#endregion
export { PatientProfilePage as default };
