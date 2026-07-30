import { i as __toESM, t as require_react } from "./react-DCO0ASPG.js";
import { t as Database } from "./database-DaDd39fs.js";
import { t as Download } from "./download-CTeSL13_.js";
import { t as HardDrive } from "./hard-drive-C2e9MATt.js";
import { t as LoaderCircle } from "./loader-circle-CdtlPMRw.js";
import { t as Upload } from "./upload-C9Un4eAn.js";
import { t as require_jsx_runtime } from "./jsx-runtime-BjJQA5sn.js";
import { t as Button } from "./button-phKcTdak.js";
import { Dt as router3, Ot as usePage, Tt as toast, lt as Trash2 } from "./app-CwPUaRAl.js";
import { SettingsCard, SettingsLayout, SettingsSection } from "./SettingsComponents-CaMbgP0I.js";
//#region resources/js/Pages/settings/BackupRestore.tsx
var import_react = /* @__PURE__ */ __toESM(require_react(), 1);
var import_jsx_runtime = require_jsx_runtime();
function BackupRestorePage() {
	const { props } = usePage();
	const backups = props.backups || [];
	const fileInputRef = (0, import_react.useRef)(null);
	const [creating, setCreating] = (0, import_react.useState)(false);
	const [confirmDelete, setConfirmDelete] = (0, import_react.useState)(null);
	const handleCreateBackup = () => {
		setCreating(true);
		router3.post("/settings/backup", {}, {
			onSuccess: () => {
				setCreating(false);
				toast.success("Backup created");
			},
			onError: () => {
				setCreating(false);
				toast.error("Backup failed");
			}
		});
	};
	const handleRestoreUpload = (e) => {
		const file = e.target.files?.[0];
		if (!file) return;
		const form = new FormData();
		form.append("file", file);
		router3.post("/settings/backup/restore", form, {
			onSuccess: () => toast.success("Database restored"),
			onError: (errs) => toast.error(Object.values(errs).join(", ") || "Restore failed")
		});
		e.target.value = "";
	};
	const handleDelete = (name) => {
		router3.delete(`/settings/backup/${encodeURIComponent(name)}`, {
			onSuccess: () => toast.success("Backup deleted"),
			onError: () => toast.error("Delete failed")
		});
		setConfirmDelete(null);
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SettingsLayout, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "p-4 sm:p-6 lg:p-8 max-w-3xl mx-auto space-y-6",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-start gap-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "size-10 rounded-xl bg-gradient-to-br from-cyan-600/20 to-cyan-600/5 flex items-center justify-center shrink-0",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Database, { className: "size-5 text-cyan-600" })
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
					className: "text-xl font-semibold tracking-tight",
					children: "Backup & Restore"
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "text-sm text-muted-foreground mt-0.5",
					children: "Create and restore MySQL database backups."
				})] })]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SettingsSection, {
				title: "Backup Actions",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SettingsCard, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex flex-col sm:flex-row items-stretch sm:items-center gap-3",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
							size: "sm",
							className: "gap-1.5 min-h-[36px]",
							onClick: handleCreateBackup,
							disabled: creating,
							children: [creating ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "size-4 animate-spin" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Download, { className: "size-4" }), creating ? "Creating..." : "Create Backup"]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
							size: "sm",
							variant: "outline",
							className: "gap-1.5 min-h-[36px]",
							onClick: () => fileInputRef.current?.click(),
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Upload, { className: "size-4" }), " Restore from File"]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							ref: fileInputRef,
							type: "file",
							accept: ".sql,.txt",
							className: "hidden",
							onChange: handleRestoreUpload
						})
					]
				}) })
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SettingsSection, {
				title: "Backup History",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SettingsCard, { children: backups.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "text-center py-8 text-sm text-muted-foreground",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(HardDrive, { className: "size-8 mx-auto mb-2 text-muted-foreground/30" }), "No backups yet. Click \"Create Backup\" to generate one."]
				}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "space-y-1",
					children: backups.map((b) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex flex-col sm:flex-row sm:items-center justify-between py-3 px-3 rounded-lg hover:bg-muted/50 transition-colors gap-2",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center gap-3 min-w-0 flex-1",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: "size-8 rounded-lg bg-muted flex items-center justify-center shrink-0",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(HardDrive, { className: "size-4 text-muted-foreground" })
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "min-w-0 flex-1",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "text-sm font-medium truncate",
									children: b.name
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "text-xs text-muted-foreground",
									children: [
										b.size,
										" · ",
										b.date
									]
								})]
							})]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-center gap-1 shrink-0 self-end sm:self-auto",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
								href: `/settings/backup/download/${encodeURIComponent(b.name)}`,
								className: "inline-flex items-center justify-center size-9 sm:size-8 rounded-md hover:bg-muted text-muted-foreground hover:text-foreground transition-colors",
								title: "Download",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Download, { className: "size-3.5" })
							}), confirmDelete === b.name ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "flex items-center gap-1",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									onClick: () => handleDelete(b.name),
									className: "inline-flex items-center px-3 py-1.5 rounded-md bg-red-50 text-red-600 text-xs font-medium hover:bg-red-100 transition-colors min-h-[32px]",
									children: "Confirm"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									onClick: () => setConfirmDelete(null),
									className: "inline-flex items-center px-3 py-1.5 rounded-md text-xs text-muted-foreground hover:text-foreground transition-colors min-h-[32px]",
									children: "Cancel"
								})]
							}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								onClick: () => setConfirmDelete(b.name),
								className: "inline-flex items-center justify-center size-9 sm:size-8 rounded-md hover:bg-red-50 text-muted-foreground hover:text-red-500 transition-colors",
								title: "Delete",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash2, { className: "size-3.5" })
							})]
						})]
					}, b.name))
				}) })
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(SettingsSection, {
				title: "Scheduled Backups",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SettingsCard, { children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "text-sm text-muted-foreground",
					children: ["For automatic scheduled backups, configure a cron job running: ", /* @__PURE__ */ (0, import_jsx_runtime.jsx)("code", {
						className: "text-xs bg-muted px-1.5 py-0.5 rounded",
						children: "php artisan backup:create"
					})]
				}) })
			})
		]
	}) });
}
//#endregion
export { BackupRestorePage as default };
