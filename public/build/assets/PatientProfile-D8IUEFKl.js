import { i as __toESM, t as require_react } from "./react-DCO0ASPG.js";
import { t as ArrowLeft } from "./arrow-left-CE4TWQlw.js";
import { t as Pill } from "./pill-BnEdyPyP.js";
import { t as cn } from "./utils-Bim8RyS4.js";
import { t as require_jsx_runtime } from "./jsx-runtime-BjJQA5sn.js";
import { t as Button } from "./button-phKcTdak.js";
import { Dt as usePage, Et as router3, _t as Plus, bt as CreditCard, dt as Stethoscope } from "./app-DfjygdMU.js";
import PatientHeader from "./PatientHeader-Brr0gD3s.js";
import VisitsTimeline from "./VisitsTimeline-BEbmqCKX.js";
import PrescriptionsList from "./PrescriptionsList-Ce0qa6ea.js";
import PaymentsOverview from "./PaymentsOverview-DxN9IMqD.js";
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
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
					onClick: () => router3.visit("/clinic"),
					className: "inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowLeft, { className: "size-4" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "Back to patients" })]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
					onClick: () => router3.visit(`/clinic/patient/${patient.id}/visit`),
					className: "gap-1.5 h-9 shadow-sm",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, { className: "size-4" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "New Visit" })]
				})]
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
			] })
		]
	});
}
//#endregion
export { PatientProfilePage as default };
