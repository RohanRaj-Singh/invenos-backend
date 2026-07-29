import { i as __toESM, t as require_react } from "./react-DCO0ASPG.js";
import { t as ArrowDownRight } from "./arrow-down-right-BcfBYVKI.js";
import { t as ArrowUpRight } from "./arrow-up-right-DJsXKh96.js";
import { t as Banknote } from "./banknote-B76zKt2w.js";
import { t as Building2 } from "./building-2-DGTQudO_.js";
import { t as cn } from "./utils-Bim8RyS4.js";
import { t as require_jsx_runtime } from "./jsx-runtime-BjJQA5sn.js";
import { t as Button } from "./button-phKcTdak.js";
import { n as DialogContent, t as Dialog } from "./dialog-Dkfzz8n9.js";
import { Et as router3, _t as Plus, at as formatCurrency, bt as CreditCard, d as FT_TYPE_CONFIG, h as getContactById, ht as Search, lt as Wallet, m as getTransactionStats, p as financialTransactions, wt as toast } from "./app-fzdHvqQg.js";
import { n as CardContent, t as Card } from "./card-DQfOgTjC.js";
import RecordPaymentDialog, { t as Smartphone } from "./RecordPaymentDialog-BEGsYg3y.js";
//#region resources/js/Pages/payments/PaymentsList.tsx
var import_react = /* @__PURE__ */ __toESM(require_react(), 1);
var import_jsx_runtime = require_jsx_runtime();
var methodConfig = {
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
function PaymentsListPage() {
	const [search, setSearch] = (0, import_react.useState)("");
	const [tab, setTab] = (0, import_react.useState)("all");
	const [methodFilter, setMethodFilter] = (0, import_react.useState)("all");
	const [showRecordPayment, setShowRecordPayment] = (0, import_react.useState)(false);
	const [selectedFT, setSelectedFT] = (0, import_react.useState)(null);
	const stats = getTransactionStats();
	const filtered = (0, import_react.useMemo)(() => {
		return financialTransactions.filter((t) => {
			if (tab === "in" && t.direction !== "in") return false;
			if (tab === "out" && t.direction !== "out") return false;
			if (methodFilter !== "all" && t.method !== methodFilter) return false;
			if (search) {
				const q = search.toLowerCase();
				const nameMatch = getContactById(t.contactId)?.name.toLowerCase().includes(q);
				const refMatch = t.reference.toLowerCase().includes(q);
				if (!nameMatch && !refMatch) return false;
			}
			return true;
		});
	}, [
		search,
		tab,
		methodFilter
	]);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-5",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-start justify-between",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center gap-2 text-primary mb-1",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CreditCard, { className: "size-5" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-xs font-semibold uppercase tracking-wider text-primary",
							children: "Payments"
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
						className: "text-xl sm:text-2xl font-semibold tracking-tight",
						children: "Financial Transactions"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "text-sm text-muted-foreground mt-1",
						children: [
							stats.totalCount,
							" transactions · ",
							formatCurrency(stats.totalIn),
							" received · ",
							formatCurrency(stats.totalOut),
							" paid"
						]
					})
				] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
					size: "sm",
					className: "gap-1.5 shadow-sm",
					onClick: () => setShowRecordPayment(true),
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Plus, { className: "size-4" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
						className: "hidden sm:inline",
						children: "Record Payment"
					})]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "grid grid-cols-2 sm:grid-cols-5 gap-3",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Card, {
						size: "sm",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardContent, {
							className: "p-4",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "text-[11px] text-muted-foreground uppercase tracking-wider",
								children: "Received Today"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "text-lg font-bold text-emerald-600 mt-1",
								children: formatCurrency(stats.receivedToday)
							})]
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Card, {
						size: "sm",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardContent, {
							className: "p-4",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "text-[11px] text-muted-foreground uppercase tracking-wider",
								children: "Paid Today"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "text-lg font-bold text-red-600 mt-1",
								children: formatCurrency(stats.paidToday)
							})]
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Card, {
						size: "sm",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardContent, {
							className: "p-4",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "text-[11px] text-muted-foreground uppercase tracking-wider",
								children: "Net Cash Flow"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: cn("text-lg font-bold mt-1", stats.netCashFlow >= 0 ? "text-emerald-600" : "text-red-600"),
								children: formatCurrency(stats.netCashFlow)
							})]
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Card, {
						size: "sm",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardContent, {
							className: "p-4",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "text-[11px] text-muted-foreground uppercase tracking-wider",
								children: "Outstanding"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "text-lg font-bold text-amber-600 mt-1",
								children: formatCurrency(stats.outstanding)
							})]
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Card, {
						size: "sm",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardContent, {
							className: "p-4",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "text-[11px] text-muted-foreground uppercase tracking-wider",
								children: "Available Credit"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "text-lg font-bold text-purple-600 mt-1",
								children: formatCurrency(stats.availableCredit)
							})]
						})
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-center gap-3 flex-wrap",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "flex items-center gap-1 bg-muted rounded-lg p-0.5",
						children: [
							{
								id: "all",
								label: "All"
							},
							{
								id: "in",
								label: "Money In"
							},
							{
								id: "out",
								label: "Money Out"
							}
						].map((t) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							onClick: () => setTab(t.id),
							className: cn("px-3 py-1.5 rounded-md text-xs font-medium transition-colors", tab === t.id ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"),
							children: t.label
						}, t.id))
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "relative flex-1 max-w-xs",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Search, { className: "absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							type: "text",
							placeholder: "Search by contact or reference...",
							value: search,
							onChange: (e) => setSearch(e.target.value),
							className: "w-full h-10 pl-9 pr-3 rounded-xl border border-input bg-background text-sm outline-none focus:border-ring focus:ring-1 focus:ring-ring/30"
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center gap-1.5 overflow-x-auto scrollbar-none",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							onClick: () => setMethodFilter("all"),
							className: cn("text-xs font-medium px-3 py-1.5 rounded-lg border transition-colors whitespace-nowrap", methodFilter === "all" ? "bg-foreground text-background border-foreground" : "bg-background text-muted-foreground border-border hover:text-foreground"),
							children: "All"
						}), Object.entries(methodConfig).map(([key, cfg]) => {
							const Icon = cfg.icon;
							return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
								onClick: () => setMethodFilter(key),
								className: cn("flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 rounded-lg border transition-colors whitespace-nowrap", methodFilter === key ? `${cfg.bg} ${cfg.color} border-current` : "bg-background text-muted-foreground border-border hover:text-foreground"),
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, { className: "size-3.5" }), cfg.label]
							}, key);
						})]
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "hidden md:block rounded-xl border border-border overflow-hidden",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
					className: "w-full",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
						className: "border-b border-border bg-muted/30",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Th, { children: "Date" }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Th, { children: "Reference" }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Th, { children: "Contact" }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Th, { children: "Direction" }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Th, { children: "Type" }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Th, { children: "Method" }),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Th, {
								className: "text-right",
								children: "Amount"
							})
						]
					}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tbody", { children: filtered.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tr", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("td", {
						colSpan: 7,
						className: "text-center py-16 text-sm text-muted-foreground",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CreditCard, { className: "size-8 mx-auto mb-2 text-muted-foreground/30" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "No transactions found." })]
					}) }) : filtered.map((ft) => {
						const contact = getContactById(ft.contactId);
						const cfg = methodConfig[ft.method];
						const Icon = cfg.icon;
						const typeCfg = FT_TYPE_CONFIG[ft.type];
						return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
							className: "border-b border-border last:border-b-0 hover:bg-muted/30 transition-colors group cursor-pointer",
							onClick: () => {
								setSelectedFT(ft);
							},
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									className: "px-4 py-3 text-xs text-muted-foreground",
									children: ft.date
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									className: "px-4 py-3",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("code", {
										className: "text-xs font-mono bg-muted px-1.5 py-0.5 rounded",
										children: ft.reference
									})
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									className: "px-4 py-3 text-sm font-medium text-foreground",
									children: contact?.name || "—"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									className: "px-4 py-3",
									children: ft.direction === "in" ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
										className: "inline-flex items-center gap-1 text-xs font-medium text-emerald-600",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowDownRight, { className: "size-3" }), " IN"]
									}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
										className: "inline-flex items-center gap-1 text-xs font-medium text-red-600",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowUpRight, { className: "size-3" }), " OUT"]
									})
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									className: "px-4 py-3",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: cn("text-xs font-medium", typeCfg?.color || ""),
										children: typeCfg?.label || ft.type
									})
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
									className: "px-4 py-3",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
										className: cn("inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full", cfg.bg, cfg.color),
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, { className: "size-3" }), cfg.label]
									})
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("td", {
									className: cn("px-4 py-3 text-sm font-semibold text-right", ft.direction === "in" ? "text-emerald-600" : "text-red-600"),
									children: [ft.direction === "in" ? "+" : "-", formatCurrency(ft.amount)]
								})
							]
						}, ft.id);
					}) })]
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "md:hidden space-y-3",
				children: filtered.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "text-center py-16 text-sm text-muted-foreground",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CreditCard, { className: "size-10 mx-auto mb-2 text-muted-foreground/30" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: "No transactions found." })]
				}) : filtered.map((ft) => {
					const contact = getContactById(ft.contactId);
					const cfg = methodConfig[ft.method];
					const Icon = cfg.icon;
					const typeCfg = FT_TYPE_CONFIG[ft.type];
					return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						onClick: () => ft.linkedSaleId ? router3.visit(`/sales/${ft.linkedSaleId}`) : router3.visit(`/contacts/${ft.contactId}`),
						className: "w-full text-left group",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Card, {
							size: "sm",
							className: "transition-all hover:shadow-sm active:scale-[0.99]",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardContent, {
								className: "p-4",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex items-center justify-between mb-2",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex items-center gap-2",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
											className: cn("flex items-center justify-center size-8 rounded-lg", cfg.bg),
											children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, { className: cn("size-4", cfg.color) })
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
											className: "text-sm font-medium text-foreground",
											children: contact?.name || "—"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "text-xs text-muted-foreground",
											children: [
												ft.reference,
												" ",
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
													className: cn("text-[10px]", typeCfg?.color || ""),
													children: typeCfg?.label || ft.type
												})
											]
										})] })]
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
										className: cn("text-sm font-semibold", ft.direction === "in" ? "text-emerald-600" : "text-red-600"),
										children: [ft.direction === "in" ? "+" : "-", formatCurrency(ft.amount)]
									})]
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex items-center justify-between text-xs text-muted-foreground",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
										className: "flex items-center gap-1",
										children: [
											ft.direction === "in" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowDownRight, { className: "size-3 text-emerald-500" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ArrowUpRight, { className: "size-3 text-red-500" }),
											ft.direction === "in" ? "In" : "Out",
											" · ",
											ft.method
										]
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: ft.date })]
								})]
							})
						})
					}, ft.id);
				})
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(RecordPaymentDialog, {
				open: showRecordPayment,
				onClose: () => setShowRecordPayment(false),
				onSuccess: () => {
					setSelectedFT(null);
					setShowRecordPayment(false);
				}
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PaymentDetailModal, {
				ft: selectedFT,
				onClose: () => setSelectedFT(null)
			})
		]
	});
}
function PaymentDetailModal({ ft, onClose }) {
	if (!ft) return null;
	const contact = getContactById(ft.contactId);
	const typeCfg = FT_TYPE_CONFIG[ft.type];
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Dialog, {
		open: !!ft,
		onOpenChange: (v) => {
			if (!v) onClose();
		},
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogContent, {
			className: "sm:max-w-sm gap-0 p-0",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "bg-gradient-to-r from-primary/10 to-primary/5 p-6 text-center border-b border-border",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "inline-flex items-center justify-center size-12 rounded-full bg-primary/10 mb-3",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CreditCard, { className: "size-6 text-primary" })
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "text-lg font-bold text-foreground",
						children: formatCurrency(ft.amount)
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: cn("text-xs font-medium mt-1", ft.direction === "in" ? "text-emerald-600" : "text-red-600"),
						children: ft.direction === "in" ? "Payment Received" : "Payment Sent"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "text-[10px] text-muted-foreground mt-1",
						children: ft.reference
					})
				]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "p-5 space-y-3",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DetailRow, {
						label: "Date",
						value: ft.date
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DetailRow, {
						label: "Party",
						value: contact?.name || "—"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DetailRow, {
						label: "Type",
						value: typeCfg?.label || ft.type
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DetailRow, {
						label: "Method",
						value: ft.method
					}),
					ft.description && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DetailRow, {
						label: "Note",
						value: ft.description
					}),
					ft.linkedSaleId && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center justify-between py-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "text-xs text-muted-foreground",
							children: "Related Sale"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
							onClick: () => {
								onClose();
								router3.visit(`/sales/${ft.linkedSaleId}`);
							},
							className: "text-xs text-primary hover:underline",
							children: ft.linkedSaleId
						})]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DetailRow, {
						label: "Created By",
						value: ft.createdBy
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "pt-3 border-t border-border flex gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							variant: "outline",
							size: "sm",
							className: "flex-1 gap-1.5",
							onClick: () => toast.success("Receipt preview (prototype)"),
							children: "Print Receipt"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
							variant: "outline",
							size: "sm",
							className: "flex-1 gap-1.5",
							onClick: () => toast.success("Share link copied (prototype)"),
							children: "Share"
						})]
					})
				]
			})]
		})
	});
}
function DetailRow({ label, value }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex items-center justify-between py-1",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: "text-xs text-muted-foreground",
			children: label
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: "text-xs font-medium text-foreground",
			children: value
		})]
	});
}
function Th({ children, className }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
		className: cn("px-4 py-3 text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wider", className),
		children
	});
}
//#endregion
export { PaymentsListPage as default };
