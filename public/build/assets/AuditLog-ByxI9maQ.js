import { i as __toESM, t as require_react } from "./react-DCO0ASPG.js";
import { t as ChevronLeft } from "./chevron-left-BWkIAWWi.js";
import { t as Funnel } from "./funnel-BPZKcu8f.js";
import { t as cn } from "./utils-Bim8RyS4.js";
import { t as require_jsx_runtime } from "./jsx-runtime-BjJQA5sn.js";
import { t as Button } from "./button-phKcTdak.js";
import { Dt as router3, Ot as usePage, xt as ChevronRight, yt as ListOrdered } from "./app-CwPUaRAl.js";
import { n as CardContent, t as Card } from "./card-D1ktOUWx.js";
//#region resources/js/Pages/utilities/AuditLog.tsx
var import_react = /* @__PURE__ */ __toESM(require_react(), 1);
var import_jsx_runtime = require_jsx_runtime();
var eventColors = {
	"Sale.deleted": "bg-red-100 text-red-700 dark:bg-red-500/10 dark:text-red-400",
	"Sale.restored": "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400",
	"Product.archived": "bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400",
	"Contact.archived": "bg-amber-100 text-amber-700 dark:bg-amber-500/10 dark:text-amber-400"
};
function eventBadge(event) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
		className: cn("inline-block text-[10px] font-medium px-1.5 py-0.5 rounded", eventColors[event] || "bg-slate-100 text-slate-700 dark:bg-slate-500/10 dark:text-slate-400"),
		children: event
	});
}
function AuditLogPage() {
	const { props } = usePage();
	const logs = props.logs;
	const meta = props.meta;
	const filters = props.filters || {};
	const events = props.events || [];
	const users = props.users || [];
	const [search, setSearch] = (0, import_react.useState)(filters.search || "");
	const [eventFilter, setEventFilter] = (0, import_react.useState)(filters.event || "");
	const [userId, setUserId] = (0, import_react.useState)(filters.user_id || "");
	const [auditableType, setAuditableType] = (0, import_react.useState)(filters.auditable_type || "");
	const [dateFrom, setDateFrom] = (0, import_react.useState)(filters.date_from || "");
	const [dateTo, setDateTo] = (0, import_react.useState)(filters.date_to || "");
	const [showFilters, setShowFilters] = (0, import_react.useState)(false);
	function applyFilters() {
		router3.get("/utilities/audit-log", {
			search,
			event: eventFilter,
			user_id: userId,
			auditable_type: auditableType,
			date_from: dateFrom,
			date_to: dateTo
		}, {
			preserveState: true,
			replace: true
		});
	}
	function goToPage(page) {
		router3.get("/utilities/audit-log", {
			search,
			event: eventFilter,
			user_id: userId,
			auditable_type: auditableType,
			date_from: dateFrom,
			date_to: dateTo,
			page
		}, {
			preserveState: true,
			replace: true
		});
	}
	function resetFilters() {
		setSearch("");
		setEventFilter("");
		setUserId("");
		setAuditableType("");
		setDateFrom("");
		setDateTo("");
		router3.get("/utilities/audit-log", {}, {
			preserveState: true,
			replace: true
		});
	}
	const hasActiveFilters = search || eventFilter || userId || auditableType || dateFrom || dateTo;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto space-y-5 pb-24",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-center gap-2 text-muted-foreground mb-1",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ListOrdered, { className: "size-5" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "text-xs font-semibold uppercase tracking-wider",
					children: "Utilities"
				})]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-center justify-between",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "text-xl sm:text-2xl font-semibold tracking-tight",
					children: "Audit Log"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "text-sm text-muted-foreground mt-1",
					children: [
						meta.total,
						" ",
						meta.total === 1 ? "event" : "events",
						" recorded"
					]
				})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
					variant: "outline",
					size: "sm",
					onClick: () => setShowFilters(!showFilters),
					className: cn("gap-1.5", showFilters && "bg-muted"),
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Funnel, { className: "size-3.5" }),
						"Filters",
						hasActiveFilters && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: "size-1.5 rounded-full bg-primary" })
					]
				})]
			})] }),
			showFilters && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Card, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardContent, {
				className: "p-4",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
							className: "text-[11px] font-medium text-muted-foreground mb-1 block",
							children: "Search"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							type: "text",
							placeholder: "Description, reason, IP...",
							value: search,
							onChange: (e) => setSearch(e.target.value),
							className: "w-full h-9 px-3 rounded-lg border border-input bg-background text-sm outline-none focus:border-ring"
						})] }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
							className: "text-[11px] font-medium text-muted-foreground mb-1 block",
							children: "Event Type"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
							value: eventFilter,
							onChange: (e) => setEventFilter(e.target.value),
							className: "w-full h-9 px-3 rounded-lg border border-input bg-background text-sm outline-none focus:border-ring",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
								value: "",
								children: "All events"
							}), events.map((evt) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
								value: evt,
								children: evt
							}, evt))]
						})] }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
							className: "text-[11px] font-medium text-muted-foreground mb-1 block",
							children: "User"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
							value: userId,
							onChange: (e) => setUserId(e.target.value),
							className: "w-full h-9 px-3 rounded-lg border border-input bg-background text-sm outline-none focus:border-ring",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
								value: "",
								children: "All users"
							}), users.map((u) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
								value: u.id,
								children: u.name
							}, u.id))]
						})] }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
							className: "text-[11px] font-medium text-muted-foreground mb-1 block",
							children: "Date From"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							type: "date",
							value: dateFrom,
							onChange: (e) => setDateFrom(e.target.value),
							className: "w-full h-9 px-3 rounded-lg border border-input bg-background text-sm outline-none focus:border-ring"
						})] }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
							className: "text-[11px] font-medium text-muted-foreground mb-1 block",
							children: "Date To"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							type: "date",
							value: dateTo,
							onChange: (e) => setDateTo(e.target.value),
							className: "w-full h-9 px-3 rounded-lg border border-input bg-background text-sm outline-none focus:border-ring"
						})] })
					]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex gap-2 mt-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						size: "sm",
						onClick: applyFilters,
						children: "Apply Filters"
					}), hasActiveFilters && /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						variant: "outline",
						size: "sm",
						onClick: resetFilters,
						children: "Reset"
					})]
				})]
			}) }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Card, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardContent, {
				className: "p-0",
				children: logs.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "text-center py-16 text-sm text-muted-foreground",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ListOrdered, { className: "size-10 mx-auto mb-3 text-muted-foreground/30" }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "font-medium text-foreground mb-1",
							children: "No audit events found"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "text-xs",
							children: "Lifecycle actions will appear here as they occur."
						})
					]
				}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "overflow-x-auto",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("table", {
						className: "w-full",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("thead", { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
							className: "border-b border-border bg-muted/40",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Th, { children: "Timestamp" }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Th, { children: "User" }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Th, { children: "Event" }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Th, { children: "Entity" }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Th, {
									className: "w-[30%]",
									children: "Description"
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Th, { children: "Reason" }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Th, { children: "IP" })
							]
						}) }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("tbody", { children: logs.map((log) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("tr", {
							className: "border-b border-border hover:bg-muted/20 transition-colors",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Td, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-xs text-muted-foreground font-mono tabular-nums",
									children: log.created_at
								}) }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Td, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-sm font-medium",
									children: log.user
								}) }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Td, { children: eventBadge(log.event) }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Td, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
									className: "text-xs text-muted-foreground",
									children: [
										log.auditable_type,
										" #",
										log.auditable_id
									]
								}) }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Td, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "text-sm",
									children: log.description
								}) }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Td, { children: log.reason ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
									className: "text-xs text-muted-foreground italic",
									children: [
										"“",
										log.reason,
										"”"
									]
								}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-xs text-muted-foreground/40",
									children: "—"
								}) }),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Td, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-xs text-muted-foreground font-mono",
									children: log.ip_address || "—"
								}) })
							]
						}, log.id)) })]
					})
				})
			}) }),
			meta.last_page > 1 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-center justify-between text-sm",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
					className: "text-muted-foreground",
					children: [
						"Page ",
						meta.current_page,
						" of ",
						meta.last_page
					]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center gap-1",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						disabled: meta.current_page <= 1,
						onClick: () => goToPage(meta.current_page - 1),
						className: "flex items-center gap-1 px-3 py-1.5 rounded-lg border border-input bg-background text-sm disabled:opacity-30 hover:bg-muted transition-colors",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronLeft, { className: "size-3.5" }), " Previous"]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						disabled: meta.current_page >= meta.last_page,
						onClick: () => goToPage(meta.current_page + 1),
						className: "flex items-center gap-1 px-3 py-1.5 rounded-lg border border-input bg-background text-sm disabled:opacity-30 hover:bg-muted transition-colors",
						children: ["Next ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronRight, { className: "size-3.5" })]
					})]
				})]
			})
		]
	});
}
function Th({ children, className }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("th", {
		className: cn("px-4 py-3 text-left text-[11px] font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap", className),
		children
	});
}
function Td({ children, className }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("td", {
		className: cn("px-4 py-3", className),
		children
	});
}
//#endregion
export { AuditLogPage as default };
