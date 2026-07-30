import { i as __toESM, t as require_react } from "./react-DCO0ASPG.js";
import { t as ArrowDownRight } from "./arrow-down-right-BcfBYVKI.js";
import { t as ArrowUpRight } from "./arrow-up-right-DJsXKh96.js";
import { t as Banknote } from "./banknote-B76zKt2w.js";
import { t as Building2 } from "./building-2-DGTQudO_.js";
import { t as Funnel } from "./funnel-BPZKcu8f.js";
import { t as Printer } from "./printer-SCaoHvv-.js";
import { t as Share2 } from "./share-2-BDkinF3u.js";
import { t as cn } from "./utils-Bim8RyS4.js";
import { t as require_jsx_runtime } from "./jsx-runtime-BjJQA5sn.js";
import { t as Button } from "./button-phKcTdak.js";
import { n as DialogContent, t as Dialog } from "./dialog-EmwkokJQ.js";
import { Dt as router3, Ot as usePage, Tt as toast, bt as CreditCard, gt as Plus, it as formatDate, lt as Trash2, mt as Search, rt as formatCurrency, st as Wallet } from "./app-DQEL3DJY.js";
import { n as CardContent, t as Card } from "./card-D1ktOUWx.js";
import { t as DateFilter } from "./DateFilter-DimoDpHg.js";
import RecordPaymentDialog, { t as Smartphone } from "./RecordPaymentDialog-CqhqjjAP.js";
//#region resources/js/Pages/payments/PaymentsList.tsx
var import_react = /* @__PURE__ */ __toESM(require_react(), 1);
var import_jsx_runtime = require_jsx_runtime();
var methodCfg = {
	cash: {
		label: "Cash",
		icon: Banknote,
		color: "text-emerald-600",
		bg: "bg-emerald-50 dark:bg-emerald-500/10"
	},
	easypaisa: {
		label: "Easypaisa",
		icon: Smartphone,
		color: "text-orange-600",
		bg: "bg-orange-50 dark:bg-orange-500/10"
	},
	jazzcash: {
		label: "JazzCash",
		icon: Wallet,
		color: "text-red-600",
		bg: "bg-red-50 dark:bg-red-500/10"
	},
	card: {
		label: "Card",
		icon: CreditCard,
		color: "text-blue-600",
		bg: "bg-blue-50 dark:bg-blue-500/10"
	},
	transfer: {
		label: "Bank Transfer",
		icon: Building2,
		color: "text-purple-600",
		bg: "bg-purple-50 dark:bg-purple-500/10"
	}
};
var METHODS = [
	"all",
	"cash",
	"card",
	"transfer",
	"easypaisa",
	"jazzcash"
];
function PaymentsListPage() {
	const { props } = usePage();
	const { payments, meta } = props;
	const txns = payments || [];
	const contactOptions = props.contacts || [];
	const [search, setSearch] = (0, import_react.useState)("");
	const [methodFilter, setMethodFilter] = (0, import_react.useState)("all");
	const [selectedFT, setSelectedFT] = (0, import_react.useState)(null);
	const [showRecordPayment, setShowRecordPayment] = (0, import_react.useState)(false);
	const [showMobileFilters, setShowMobileFilters] = (0, import_react.useState)(false);
	const [dateFilter, setDateFilter] = (0, import_react.useState)({
		dateFrom: "",
		dateTo: "",
		quick: ""
	});
	const handleDateChange = (val) => {
		setDateFilter(val);
		router3.get("/payments", {
			date_from: val.dateFrom,
			date_to: val.dateTo,
			quick: val.quick,
			search,
			method: methodFilter
		}, {
			preserveState: true,
			replace: true
		});
	};
	const totalIn = (0, import_react.useMemo)(() => txns.reduce((s, t) => s + (t.direction === "in" ? t.amount || 0 : 0), 0), [txns]);
	const totalOut = (0, import_react.useMemo)(() => txns.reduce((s, t) => s + (t.direction === "out" ? t.amount || 0 : 0), 0), [txns]);
	const filtered = (0, import_react.useMemo)(() => {
		return txns.filter((t) => {
			if (methodFilter !== "all" && t.method !== methodFilter) return false;
			if (search) {
				const q = search.toLowerCase();
				if (t.contact?.name?.toLowerCase().includes(q)) return true;
				if (t.reference?.toLowerCase().includes(q)) return true;
				if (t.description?.toLowerCase().includes(q)) return true;
				return false;
			}
			return true;
		});
	}, [
		txns,
		search,
		methodFilter
	]);
	const hasFilters = search !== "" || methodFilter !== "all";
	const doDelete = (id) => {
		router3.delete(`/payments/${id}`, {
			onSuccess: () => {
				toast.success("Payment deleted.");
				router3.reload({ only: ["payments"] });
			},
			onError: () => toast.error("Failed to delete payment")
		});
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "min-h-screen bg-muted/30 pb-28 sm:pb-8",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "sticky top-0 z-10 bg-background/90 backdrop-blur-md border-b border-border",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center justify-between px-4 sm:px-6 lg:px-8 h-14 sm:h-16 max-w-7xl mx-auto",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "min-w-0",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center gap-2 text-primary mb-0.5",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CreditCard, { className: "size-4 sm:size-5" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-xs font-semibold uppercase tracking-wider text-primary",
								children: "Payments"
							})]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
							className: "text-lg sm:text-xl font-semibold tracking-tight",
							children: "Recorded Payments"
						})]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							variant: "outline",
							size: "sm",
							onClick: () => setShowMobileFilters(!showMobileFilters),
							className: cn("sm:hidden gap-1.5", showMobileFilters && "bg-muted"),
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Funnel, { className: "size-3.5" })
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
							size: "sm",
							className: "gap-1.5 shadow-sm",
							onClick: () => setShowRecordPayment(true),
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, { className: "size-3.5" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "hidden sm:inline",
								children: "Record Payment"
							})]
						})]
					})]
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "hidden sm:flex sm:items-center sm:justify-between sm:mt-4 sm:mb-4",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center gap-4 flex-1",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "relative flex-1 max-w-sm",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Search, { className: "absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
									type: "text",
									placeholder: "Search by contact, reference, or note...",
									value: search,
									onChange: (e) => setSearch(e.target.value),
									className: "w-full h-10 pl-9 pr-3 rounded-xl border border-input bg-background text-sm outline-none focus:border-ring transition-colors"
								})]
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "flex items-center gap-1.5 overflow-x-auto no-scrollbar",
								children: METHODS.map((m) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									onClick: () => setMethodFilter(m),
									className: cn("text-xs font-medium px-3 py-1.5 rounded-lg border transition-colors shrink-0 whitespace-nowrap", methodFilter === m ? "bg-foreground text-background border-foreground" : "bg-background text-muted-foreground border-border hover:text-foreground"),
									children: m === "all" ? "All" : methodCfg[m]?.label || m
								}, m))
							})]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center gap-4 text-sm ml-6",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
									className: "text-muted-foreground",
									children: [meta?.total ?? txns.length, " payments"]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
									className: "text-emerald-600 font-semibold tabular-nums",
									children: ["+", formatCurrency(totalIn)]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
									className: "text-red-600 font-semibold tabular-nums",
									children: ["-", formatCurrency(totalOut)]
								})
							]
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "sm:hidden mt-3 space-y-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "relative",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Search, { className: "absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								type: "text",
								placeholder: "Search...",
								value: search,
								onChange: (e) => setSearch(e.target.value),
								className: "w-full h-10 pl-9 pr-3 rounded-xl border border-input bg-background text-sm outline-none focus:border-ring transition-colors"
							})]
						}), showMobileFilters && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar",
							children: METHODS.map((m) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								onClick: () => setMethodFilter(m),
								className: cn("text-xs font-medium px-3 py-1.5 rounded-lg border transition-colors shrink-0 whitespace-nowrap", methodFilter === m ? "bg-foreground text-background border-foreground" : "bg-background text-muted-foreground border-border hover:text-foreground"),
								children: m === "all" ? "All" : methodCfg[m]?.label || m
							}, m))
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "border-t border-border pt-3 mt-3 flex items-center gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DateFilter, {
							value: dateFilter,
							onChange: handleDateChange
						}), (dateFilter.dateFrom || dateFilter.dateTo) && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							onClick: () => handleDateChange({
								dateFrom: "",
								dateTo: "",
								quick: ""
							}),
							className: "text-xs text-muted-foreground hover:text-foreground underline transition-colors",
							children: "Clear"
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "hidden sm:block mt-4 rounded-xl border border-border bg-card overflow-hidden",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
							className: "w-full",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
								className: "border-b border-border bg-muted/30",
								children: [
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Th, { children: "Date" }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Th, { children: "Ref / Note" }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Th, { children: "Contact" }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Th, { children: "Method" }),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Th, {
										className: "text-right",
										children: "Amount"
									}),
									/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Th, { className: "w-12" })
								]
							}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tbody", { children: filtered.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tr", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
								colSpan: 6,
								className: "text-center py-16",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex flex-col items-center gap-2 text-sm text-muted-foreground",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CreditCard, { className: "size-10 text-muted-foreground/30" }),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
											className: "font-medium text-foreground",
											children: "No payments recorded"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: hasFilters ? "Try adjusting your filters." : "Click \"Record Payment\" to add one." })
									]
								})
							}) }) : filtered.map((ft) => {
								const cfg = methodCfg[ft.method] || methodCfg.cash;
								const Icon = cfg.icon;
								return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
									className: "border-b border-border last:border-b-0 hover:bg-muted/30 transition-colors group cursor-pointer",
									onClick: () => setSelectedFT(ft),
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
											className: "px-4 sm:px-5 py-3.5 text-sm text-muted-foreground",
											children: formatDate(ft.date)
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("td", {
											className: "px-4 sm:px-5 py-3.5",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("code", {
												className: "text-xs font-mono bg-muted px-1.5 py-0.5 rounded",
												children: ft.reference
											}), ft.description && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
												className: "text-xs text-muted-foreground/70 mt-0.5 line-clamp-1",
												children: ft.description
											})]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
											className: "px-4 sm:px-5 py-3.5",
											children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "text-sm font-medium",
												children: ft.contact?.name || "—"
											})
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
											className: "px-4 sm:px-5 py-3.5",
											children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
												className: cn("inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full", cfg.bg, cfg.color),
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, { className: "size-3.5" }), cfg.label]
											})
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("td", {
											className: cn("px-4 sm:px-5 py-3.5 text-base font-bold text-right tabular-nums", ft.direction === "in" ? "text-emerald-600" : "text-red-600"),
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "text-xs font-medium opacity-60",
												children: ft.direction === "in" ? "+" : "-"
											}), formatCurrency(ft.amount)]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
											className: "px-4 sm:px-5 py-3.5 text-center",
											children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
												onClick: (e) => {
													e.stopPropagation();
													doDelete(ft.id);
												},
												className: "opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-muted-foreground/40 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-all",
												title: "Delete",
												children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash2, { className: "size-3.5" })
											})
										})
									]
								}, ft.id);
							}) })]
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "sm:hidden mt-3 space-y-2",
						children: filtered.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex flex-col items-center justify-center py-20 text-center",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CreditCard, { className: "size-12 text-muted-foreground/20 mb-3" }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-sm font-medium text-foreground mb-1",
									children: "No payments recorded"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-xs text-muted-foreground max-w-xs",
									children: hasFilters ? "Try adjusting your search or filters." : "Record your first payment to get started."
								})
							]
						}) : filtered.map((ft) => {
							const cfg = methodCfg[ft.method] || methodCfg.cash;
							const Icon = cfg.icon;
							return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								onClick: () => setSelectedFT(ft),
								className: "w-full text-left group",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Card, {
									className: "transition-all hover:shadow-sm active:scale-[0.99]",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardContent, {
										className: "p-0",
										children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "p-4",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "flex items-center justify-between gap-3",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
													className: "flex items-center gap-3 min-w-0 flex-1",
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
														className: cn("size-10 rounded-xl flex items-center justify-center shrink-0", cfg.bg),
														children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, { className: cn("size-5", cfg.color) })
													}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
														className: "min-w-0 flex-1",
														children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
															className: "flex items-center gap-2",
															children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
																className: "text-sm font-semibold truncate",
																children: ft.contact?.name || "—"
															}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
																className: cn("inline-flex items-center gap-0.5 text-[11px] font-medium", ft.direction === "in" ? "text-emerald-600" : "text-red-600"),
																children: [ft.direction === "in" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowDownRight, { className: "size-3" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowUpRight, { className: "size-3" }), ft.direction === "in" ? "In" : "Out"]
															})]
														}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
															className: "flex items-center gap-2 text-xs text-muted-foreground mt-0.5",
															children: [
																/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
																	className: "font-mono bg-muted px-1 py-0.5 rounded text-[11px]",
																	children: ft.reference
																}),
																/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "·" }),
																/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: formatDate(ft.date) })
															]
														})]
													})]
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
													className: "flex items-center gap-2 shrink-0",
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
														className: "text-right",
														children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
															className: cn("text-base font-bold tabular-nums", ft.direction === "in" ? "text-emerald-600" : "text-red-600"),
															children: [ft.direction === "in" ? "+" : "-", formatCurrency(ft.amount)]
														}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
															className: "text-[11px] text-muted-foreground",
															children: cfg.label
														})]
													}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
														onClick: (e) => {
															e.stopPropagation();
															doDelete(ft.id);
														},
														className: "flex items-center justify-center size-8 rounded-lg text-muted-foreground/30 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors -mr-1",
														title: "Delete",
														children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash2, { className: "size-3.5" })
													})]
												})]
											}), ft.description && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
												className: "text-xs text-muted-foreground mt-2 ml-[52px] line-clamp-2",
												children: ft.description
											})]
										})
									})
								})
							}, ft.id);
						})
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				onClick: () => setShowRecordPayment(true),
				className: "fixed bottom-6 right-4 sm:hidden flex items-center justify-center size-14 rounded-full bg-primary text-primary-foreground shadow-lg hover:bg-primary/90 active:scale-95 transition-all z-20",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, { className: "size-6" })
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(RecordPaymentDialog, {
				contacts: contactOptions,
				open: showRecordPayment,
				onClose: () => setShowRecordPayment(false),
				onSuccess: () => router3.reload({ only: ["payments"] })
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PaymentDetailModal, {
				ft: selectedFT,
				onClose: () => setSelectedFT(null)
			})
		]
	});
}
function PaymentDetailModal({ ft, onClose }) {
	const [deleting, setDeleting] = (0, import_react.useState)(false);
	if (!ft) return null;
	const cfg = methodCfg[ft.method] || methodCfg.cash;
	const handlePrint = () => {
		router3.visit(`/payments/${ft.id}/print`);
	};
	const handleShare = async () => {
		const text = [
			`Payment ${ft.direction === "in" ? "Received" : "Sent"}`,
			`Amount: ${formatCurrency(ft.amount)}`,
			`Reference: ${ft.reference}`,
			`Date: ${formatDate(ft.date)}`,
			`Contact: ${ft.contact?.name || "—"}`,
			`Method: ${cfg.label}`,
			ft.description ? `Note: ${ft.description}` : ""
		].filter(Boolean).join("\n");
		try {
			await navigator.clipboard.writeText(text);
			toast.success("Payment details copied");
		} catch {
			toast.error("Could not copy");
		}
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Dialog, {
		open: !!ft,
		onOpenChange: (v) => {
			if (!v) onClose();
		},
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogContent, {
			className: "sm:max-w-md gap-0 p-0 rounded-2xl sm:rounded-xl",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "px-5 sm:px-6 pt-8 sm:pt-10 pb-6 text-center border-b border-border bg-gradient-to-b from-primary/[0.03] to-transparent",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "inline-flex items-center justify-center size-14 rounded-2xl bg-primary/5 mb-4",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CreditCard, { className: "size-7 text-primary" })
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "text-2xl sm:text-3xl font-bold text-foreground tabular-nums",
						children: formatCurrency(ft.amount)
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: cn("text-sm font-medium mt-1.5", ft.direction === "in" ? "text-emerald-600" : "text-red-600"),
						children: ft.direction === "in" ? "Payment Received" : "Payment Sent"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "text-xs text-muted-foreground mt-1 font-mono",
						children: ft.reference
					})
				]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "px-5 sm:px-6 py-5 space-y-5",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "grid grid-cols-2 sm:grid-cols-4 gap-4",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "text-[11px] font-semibold text-muted-foreground uppercase tracking-wider",
								children: "Date"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "text-sm font-semibold mt-1",
								children: formatDate(ft.date)
							})] }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "text-[11px] font-semibold text-muted-foreground uppercase tracking-wider",
								children: "Contact"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "text-sm font-semibold mt-1 truncate",
								children: ft.contact?.name || "—"
							})] }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "text-[11px] font-semibold text-muted-foreground uppercase tracking-wider",
								children: "Method"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "text-sm font-semibold mt-1",
								children: cfg.label
							})] }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "text-[11px] font-semibold text-muted-foreground uppercase tracking-wider",
								children: "Recorded by"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "text-sm font-semibold mt-1",
								children: ft.created_by || "—"
							})] })
						]
					}),
					ft.description && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "border-t border-border pt-4",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-1",
							children: "Note"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-sm text-foreground",
							children: ft.description
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
							variant: "outline",
							size: "sm",
							onClick: handlePrint,
							className: "flex-1 gap-1.5 h-10",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Printer, { className: "size-3.5" }), " Print"]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
							variant: "outline",
							size: "sm",
							onClick: handleShare,
							className: "flex-1 gap-1.5 h-10",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Share2, { className: "size-3.5" }), " Share"]
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "border-t border-border pt-4",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
							variant: "outline",
							size: "sm",
							onClick: () => {
								if (!confirm("Delete this payment?")) return;
								router3.delete(`/payments/${ft.id}`, {
									onSuccess: () => {
										toast.success("Payment deleted.");
										onClose();
										router3.reload({ only: ["payments"] });
									},
									onError: () => toast.error("Failed to delete")
								});
							},
							disabled: deleting,
							className: "w-full gap-1.5 text-red-600 border-red-200 hover:bg-red-50 hover:text-red-700 dark:border-red-800 dark:hover:bg-red-950/20 h-10",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash2, { className: "size-3.5" }), " Delete Payment"]
						})
					})
				]
			})]
		})
	});
}
function Th({ children, className }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
		className: cn("px-4 sm:px-5 py-3 text-left text-xs font-semibold text-muted-foreground uppercase tracking-wider", className),
		children
	});
}
//#endregion
export { PaymentsListPage as default };
