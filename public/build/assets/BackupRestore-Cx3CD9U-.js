import { a as __toESM, n as require_react, t as require_jsx_runtime } from "./jsx-runtime-Do9val7F.js";
import { t as createLucideIcon } from "./createLucideIcon-CtLNniWl.js";
import { t as Check } from "./check-DoNZKe9-.js";
import { t as CircleCheck } from "./circle-check-DyG_hSe7.js";
import { n as CircleX, t as HardDrive } from "./hard-drive-ChUYkiqk.js";
import { t as Clock } from "./clock-BnauhRFM.js";
import { t as Database } from "./database-CuHz19sz.js";
import { t as Download } from "./download-BBeuRUdz.js";
import { t as EyeOff } from "./eye-off-CL3u2-Ww.js";
import { t as Eye } from "./eye-dE-1nt4Z.js";
import { t as Info } from "./info-BfxMa3Fw.js";
import { t as LoaderCircle } from "./loader-circle-Bu7VuNI1.js";
import { t as RotateCcw } from "./rotate-ccw-DIzmnjQ5.js";
import { t as Server } from "./server-DErOwYbo.js";
import { t as TriangleAlert } from "./triangle-alert-Djqi0JrF.js";
import { t as Upload } from "./upload-_jpj6uhX.js";
import { t as cn } from "./utils-Bim8RyS4.js";
import { n as buttonVariants, t as Button } from "./button-CTa7sOGP.js";
import { a as DialogHeader, i as DialogFooter, n as DialogContent, o as DialogTitle, r as DialogDescription, t as Dialog } from "./dialog-PRmHepXX.js";
import { Dt as usePage, Et as router3, ct as Trash2, wt as toast, xt as ChevronDown } from "./app-CO4ODFtf.js";
import { t as Badge } from "./badge-CFYtyx5n.js";
import { SettingsLayout } from "./SettingsComponents-1209uy5w.js";
/**
* @license lucide-react v1.26.0 - ISC
*
* This source code is licensed under the ISC license.
* See the LICENSE file in the root directory of this source tree.
*/
var CalendarClock = createLucideIcon("calendar-clock", [
	["path", {
		d: "M16 14v2.2l1.6 1",
		key: "fo4ql5"
	}],
	["path", {
		d: "M16 2v4",
		key: "4m81vk"
	}],
	["path", {
		d: "M21 7.5V6a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h3.5",
		key: "1osxxc"
	}],
	["path", {
		d: "M3 10h5",
		key: "r794hk"
	}],
	["path", {
		d: "M8 2v4",
		key: "1cmpym"
	}],
	["circle", {
		cx: "16",
		cy: "16",
		r: "6",
		key: "qoo3c4"
	}]
]);
/**
* @license lucide-react v1.26.0 - ISC
*
* This source code is licensed under the ISC license.
* See the LICENSE file in the root directory of this source tree.
*/
var FileArchive = createLucideIcon("file-archive", [
	["path", {
		d: "M13.659 22H18a2 2 0 0 0 2-2V8a2.4 2.4 0 0 0-.706-1.706l-3.588-3.588A2.4 2.4 0 0 0 14 2H6a2 2 0 0 0-2 2v11.5",
		key: "4pqfef"
	}],
	["path", {
		d: "M14 2v5a1 1 0 0 0 1 1h5",
		key: "wfsgrz"
	}],
	["path", {
		d: "M8 12v-1",
		key: "1ej8lb"
	}],
	["path", {
		d: "M8 18v-2",
		key: "qcmpov"
	}],
	["path", {
		d: "M8 7V6",
		key: "1nbb54"
	}],
	["circle", {
		cx: "8",
		cy: "20",
		r: "2",
		key: "ckkr5m"
	}]
]);
/**
* @license lucide-react v1.26.0 - ISC
*
* This source code is licensed under the ISC license.
* See the LICENSE file in the root directory of this source tree.
*/
var Lock = createLucideIcon("lock", [["rect", {
	width: "18",
	height: "11",
	x: "3",
	y: "11",
	rx: "2",
	ry: "2",
	key: "1w4ew1"
}], ["path", {
	d: "M7 11V7a5 5 0 0 1 10 0v4",
	key: "fwvmzm"
}]]);
/**
* @license lucide-react v1.26.0 - ISC
*
* This source code is licensed under the ISC license.
* See the LICENSE file in the root directory of this source tree.
*/
var ShieldCheck = createLucideIcon("shield-check", [["path", {
	d: "M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z",
	key: "oel41y"
}], ["path", {
	d: "m9 12 2 2 4-4",
	key: "dzmm74"
}]]);
//#endregion
//#region resources/js/Pages/settings/BackupRestore.tsx
var import_react = /* @__PURE__ */ __toESM(require_react(), 1);
var import_jsx_runtime = require_jsx_runtime();
var TABS = [
	{
		id: "backups",
		label: "Backups",
		icon: HardDrive
	},
	{
		id: "restore",
		label: "Restore",
		icon: RotateCcw
	},
	{
		id: "schedule",
		label: "Automatic backups",
		icon: CalendarClock
	}
];
var STATUS_META = {
	verified: {
		label: "Protected",
		className: "border-emerald-200 bg-emerald-50 text-emerald-700",
		icon: ShieldCheck
	},
	completed: {
		label: "Ready",
		className: "border-sky-200 bg-sky-50 text-sky-700",
		icon: CircleCheck
	},
	running: {
		label: "In progress",
		className: "border-amber-200 bg-amber-50 text-amber-700",
		icon: LoaderCircle
	},
	pending: {
		label: "Waiting",
		className: "border-border bg-muted text-muted-foreground",
		icon: Clock
	},
	failed: {
		label: "Failed",
		className: "border-red-200 bg-red-50 text-red-700",
		icon: CircleX
	},
	expired: {
		label: "Removed",
		className: "border-border bg-muted text-muted-foreground",
		icon: CircleX
	}
};
function formatBytes(bytes) {
	if (!bytes) return "—";
	const units = [
		"B",
		"KB",
		"MB",
		"GB"
	];
	let value = bytes;
	let index = 0;
	while (value >= 1024 && index < units.length - 1) {
		value /= 1024;
		index++;
	}
	return `${value.toFixed(value >= 10 ? 0 : 1)} ${units[index]}`;
}
function formatDateTime(value) {
	if (!value) return "—";
	return new Date(value).toLocaleString(void 0, {
		day: "numeric",
		month: "short",
		year: "numeric",
		hour: "numeric",
		minute: "2-digit"
	});
}
function formatRelative(value) {
	if (!value) return "never";
	const diff = new Date(value).getTime() - Date.now();
	const minutes = Math.round(diff / 6e4);
	const formatter = new Intl.RelativeTimeFormat(void 0, { numeric: "auto" });
	if (Math.abs(minutes) < 60) return formatter.format(minutes, "minute");
	const hours = Math.round(minutes / 60);
	if (Math.abs(hours) < 24) return formatter.format(hours, "hour");
	const days = Math.round(hours / 24);
	if (Math.abs(days) < 30) return formatter.format(days, "day");
	return formatter.format(Math.round(days / 30), "month");
}
function friendlyName(backup) {
	const date = new Date(backup.created_at);
	const label = date.toLocaleDateString(void 0, {
		day: "numeric",
		month: "short",
		year: "numeric"
	});
	const time = date.toLocaleTimeString(void 0, {
		hour: "numeric",
		minute: "2-digit"
	});
	if (backup.kind === "safety") return `Safety copy · ${label}, ${time}`;
	return `Backup · ${label}, ${time}`;
}
function StatusBadge({ status }) {
	const meta = STATUS_META[status] ?? STATUS_META.pending;
	const Icon = meta.icon;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Badge, {
		variant: "outline",
		className: cn("gap-1 h-6 px-2", meta.className),
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, {
			className: cn("size-3", status === "running" && "animate-spin"),
			"aria-hidden": "true"
		}), meta.label]
	});
}
function PasswordInput({ value, onChange, label, placeholder, autoComplete = "new-password", disabled, describedBy }) {
	const [visible, setVisible] = (0, import_react.useState)(false);
	const id = (0, import_react.useRef)(`password-${Math.random().toString(36).slice(2)}`).current;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "space-y-1.5",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
			htmlFor: id,
			className: "block text-sm font-medium text-foreground",
			children: label
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "relative",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
				id,
				type: visible ? "text" : "password",
				value,
				onChange: (event) => onChange(event.target.value),
				placeholder,
				autoComplete,
				disabled,
				"aria-describedby": describedBy,
				className: "h-11 w-full rounded-lg border border-input bg-background px-3 pr-11 text-base outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:opacity-50 md:text-sm"
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				type: "button",
				onClick: () => setVisible((current) => !current),
				className: "absolute inset-y-0 right-0 flex w-11 items-center justify-center rounded-r-lg text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
				"aria-label": visible ? "Hide password" : "Show password",
				tabIndex: 0,
				children: visible ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EyeOff, {
					className: "size-4",
					"aria-hidden": "true"
				}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Eye, {
					className: "size-4",
					"aria-hidden": "true"
				})
			})]
		})]
	});
}
function Switch({ checked, onChange, label, description }) {
	const id = (0, import_react.useRef)(`switch-${Math.random().toString(36).slice(2)}`).current;
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex items-start justify-between gap-4",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "min-w-0",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
				htmlFor: id,
				className: "text-sm font-medium text-foreground",
				children: label
			}), description && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-xs text-muted-foreground mt-0.5",
				children: description
			})]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
			id,
			type: "button",
			role: "switch",
			"aria-checked": checked,
			onClick: () => onChange(!checked),
			className: cn("relative inline-flex h-6 w-11 shrink-0 items-center rounded-full border-2 border-transparent transition-colors focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50", checked ? "bg-primary" : "bg-muted-foreground/30"),
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { className: cn("pointer-events-none inline-block size-5 rounded-full bg-white shadow transition-transform", checked ? "translate-x-5" : "translate-x-0") }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "sr-only",
				children: checked ? "On" : "Off"
			})]
		})]
	});
}
function BackupRestorePage() {
	const { props } = usePage();
	const backups = props.backups || {
		data: [],
		current_page: 1,
		last_page: 1,
		total: 0
	};
	const stats = props.stats || {
		total: 0,
		verified: 0,
		total_bytes: 0,
		last_verified_at: null,
		pending_jobs: 0
	};
	const initialSettings = props.backupSettings || {};
	const businessTimezone = props.businessTimezone || "Asia/Karachi";
	const preview = props.restorePreview || null;
	const restoreRunId = props.restoreRunId || null;
	const errors = props.errors || {};
	const [tab, setTab] = (0, import_react.useState)("backups");
	const [createOpen, setCreateOpen] = (0, import_react.useState)(false);
	const [password, setPassword] = (0, import_react.useState)("");
	const [confirmPassword, setConfirmPassword] = (0, import_react.useState)("");
	const [creating, setCreating] = (0, import_react.useState)(false);
	const [verifyingId, setVerifyingId] = (0, import_react.useState)(null);
	const [verifyPasswords, setVerifyPasswords] = (0, import_react.useState)({});
	const [deleteTarget, setDeleteTarget] = (0, import_react.useState)(null);
	const [deleteForce, setDeleteForce] = (0, import_react.useState)(false);
	const [deleting, setDeleting] = (0, import_react.useState)(false);
	const [inspecting, setInspecting] = (0, import_react.useState)(false);
	const [restorePassword, setRestorePassword] = (0, import_react.useState)("");
	const [confirmation, setConfirmation] = (0, import_react.useState)("");
	const [forceRestore, setForceRestore] = (0, import_react.useState)(false);
	const [restoring, setRestoring] = (0, import_react.useState)(false);
	const [selectedServerBackup, setSelectedServerBackup] = (0, import_react.useState)("");
	const [savingSettings, setSavingSettings] = (0, import_react.useState)(false);
	const [settings, setSettings] = (0, import_react.useState)({
		enabled: initialSettings.enabled ?? false,
		frequency: initialSettings.frequency ?? "daily",
		time: initialSettings.time ?? "02:00",
		timezone: initialSettings.timezone ?? businessTimezone,
		retain_daily: initialSettings.retain_daily ?? 7,
		retain_weekly: initialSettings.retain_weekly ?? 4,
		retain_monthly: initialSettings.retain_monthly ?? 12,
		retain_safety: initialSettings.retain_safety ?? 3
	});
	const fileInputRef = (0, import_react.useRef)(null);
	const previewRef = (0, import_react.useRef)(null);
	const panelRef = (0, import_react.useRef)(null);
	const lastVerified = stats.last_verified_at ? new Date(stats.last_verified_at) : null;
	const daysSinceBackup = lastVerified ? (Date.now() - lastVerified.getTime()) / 864e5 : null;
	const isProtected = daysSinceBackup !== null && daysSinceBackup <= 7;
	const restorable = props.restorableBackups || backups.data.filter((backup) => ["verified", "completed"].includes(backup.status));
	const hasChanges = JSON.stringify(settings) !== JSON.stringify({
		enabled: initialSettings.enabled ?? false,
		frequency: initialSettings.frequency ?? "daily",
		time: initialSettings.time ?? "02:00",
		timezone: initialSettings.timezone ?? businessTimezone,
		retain_daily: initialSettings.retain_daily ?? 7,
		retain_weekly: initialSettings.retain_weekly ?? 4,
		retain_monthly: initialSettings.retain_monthly ?? 12,
		retain_safety: initialSettings.retain_safety ?? 3
	});
	const settingsSummary = (0, import_react.useMemo)(() => {
		return `We'll create a backup ${settings.frequency === "daily" ? "every day" : settings.frequency === "weekly" ? "every week" : "every month"} at ${settings.time} (${settings.timezone}). We keep the last ${settings.retain_daily} daily, ${settings.retain_weekly} weekly and ${settings.retain_monthly} monthly copies.`;
	}, [settings]);
	(0, import_react.useEffect)(() => {
		if (preview && previewRef.current) previewRef.current.scrollIntoView({
			behavior: "smooth",
			block: "start"
		});
	}, [preview?.artifact]);
	const selectTab = (next) => {
		setTab(next);
		requestAnimationFrame(() => panelRef.current?.focus());
	};
	const handleCreate = () => {
		if (password && password !== confirmPassword) {
			toast.error("The two passwords do not match");
			return;
		}
		setCreating(true);
		router3.post("/settings/backup", { password: password || null }, {
			preserveScroll: true,
			onSuccess: () => {
				setCreating(false);
				setCreateOpen(false);
				setPassword("");
				setConfirmPassword("");
				toast.success("Backup created and checked");
			},
			onError: () => setCreating(false)
		});
	};
	const handleUpload = (event) => {
		const file = event.target.files?.[0];
		if (!file) return;
		const form = new FormData();
		form.append("file", file);
		if (restorePassword) form.append("password", restorePassword);
		setInspecting(true);
		router3.post("/settings/backup/inspect", form, {
			forceFormData: true,
			onSuccess: () => {
				setInspecting(false);
				toast.success("Backup checked. Review it below before restoring.");
			},
			onError: () => {
				setInspecting(false);
				toast.error("This file could not be used. Check the password or choose another backup.");
			}
		});
		event.target.value = "";
	};
	const handleInspectServer = () => {
		if (!selectedServerBackup) {
			toast.error("Choose a backup first");
			return;
		}
		setInspecting(true);
		router3.post(`/settings/backup/${selectedServerBackup}/inspect`, { password: restorePassword || null }, {
			preserveScroll: true,
			onSuccess: () => {
				setInspecting(false);
				toast.success("Backup checked. Review it below before restoring.");
			},
			onError: () => {
				setInspecting(false);
				toast.error("This backup could not be read. Check the password and try again.");
			}
		});
	};
	const handleRestore = () => {
		if (!restoreRunId) return;
		setRestoring(true);
		router3.post(`/settings/backup/restore/${restoreRunId}`, {
			confirmation,
			password: restorePassword || null,
			force: forceRestore
		}, {
			preserveScroll: true,
			onSuccess: () => {
				setRestoring(false);
				setConfirmation("");
				setTab("backups");
				toast.success("Restore complete. Your data has been replaced.");
			},
			onError: () => {
				setRestoring(false);
				toast.error("Restore failed. Your previous data should still be intact — check the message above.");
			}
		});
	};
	const handleVerify = (backup) => {
		setVerifyingId(backup.id);
		router3.post(`/settings/backup/${backup.id}/verify`, { password: verifyPasswords[backup.id] || null }, {
			preserveScroll: true,
			onSuccess: () => {
				setVerifyingId(null);
				toast.success("Backup checked successfully");
			},
			onError: () => {
				setVerifyingId(null);
				toast.error("This backup did not pass the check");
			}
		});
	};
	const handleDelete = () => {
		if (!deleteTarget) return;
		setDeleting(true);
		router3.delete(`/settings/backup/${deleteTarget.id}`, {
			data: { force: deleteForce },
			preserveScroll: true,
			onSuccess: () => {
				setDeleting(false);
				setDeleteTarget(null);
				setDeleteForce(false);
				toast.success("Backup deleted");
			},
			onError: () => {
				setDeleting(false);
				toast.error("That backup could not be deleted. It may be the newest copy.");
			}
		});
	};
	const saveSettings = () => {
		setSavingSettings(true);
		const payload = { ...settings };
		router3.put("/settings", { backup: payload }, {
			preserveScroll: true,
			onSuccess: () => {
				setSavingSettings(false);
				toast.success("Automatic backup settings saved");
			},
			onError: () => {
				setSavingSettings(false);
				toast.error("Could not save these settings");
			}
		});
	};
	const errorList = Object.values(errors).filter(Boolean);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(SettingsLayout, { children: [
		/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "mx-auto max-w-5xl space-y-6 p-4 sm:p-6 lg:p-8",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
					className: "flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-start gap-3",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "flex size-11 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-cyan-600/20 to-cyan-600/5",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Database, {
								className: "size-5 text-cyan-700",
								"aria-hidden": "true"
							})
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h1", {
							className: "text-xl font-semibold tracking-tight sm:text-2xl",
							children: "Backup & Restore"
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-1 max-w-2xl text-sm text-muted-foreground",
							children: "Keep a safe copy of your shop data and bring it back if something goes wrong."
						})] })]
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
						size: "lg",
						className: "h-11 gap-2 px-4",
						onClick: () => setCreateOpen(true),
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Database, {
							className: "size-4",
							"aria-hidden": "true"
						}), "Back up now"]
					})]
				}),
				errorList.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					role: "alert",
					className: "flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-3 text-sm text-red-800",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CircleX, {
						className: "mt-0.5 size-4 shrink-0",
						"aria-hidden": "true"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "space-y-1",
						children: errorList.map((message) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: message }, message))
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("section", {
					className: cn("rounded-2xl border p-4 sm:p-5", isProtected ? "border-emerald-200 bg-emerald-50/60" : "border-amber-200 bg-amber-50/60"),
					"aria-live": "polite",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex items-start gap-3",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								className: cn("flex size-10 shrink-0 items-center justify-center rounded-full", isProtected ? "bg-emerald-100 text-emerald-700" : "bg-amber-100 text-amber-700"),
								children: isProtected ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ShieldCheck, {
									className: "size-5",
									"aria-hidden": "true"
								}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(TriangleAlert, {
									className: "size-5",
									"aria-hidden": "true"
								})
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: cn("text-sm font-semibold", isProtected ? "text-emerald-900" : "text-amber-900"),
								children: isProtected ? "Your shop data is protected" : lastVerified ? "Your last backup is getting old" : "No backup yet"
							}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: cn("mt-0.5 text-xs", isProtected ? "text-emerald-800" : "text-amber-800"),
								children: lastVerified ? `Last backup ${formatRelative(stats.last_verified_at)} · ${formatDateTime(stats.last_verified_at)}` : "Create your first backup so your sales, stock and customers can be recovered."
							})] })]
						}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex flex-wrap items-center gap-2 text-xs text-muted-foreground",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
									className: "inline-flex items-center gap-1 rounded-full border border-border bg-background px-2.5 py-1",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(HardDrive, {
											className: "size-3",
											"aria-hidden": "true"
										}),
										" ",
										stats.total,
										" backup",
										stats.total === 1 ? "" : "s"
									]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
									className: "inline-flex items-center gap-1 rounded-full border border-border bg-background px-2.5 py-1",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FileArchive, {
											className: "size-3",
											"aria-hidden": "true"
										}),
										" ",
										formatBytes(stats.total_bytes),
										" used"
									]
								}),
								stats.pending_jobs > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
									className: "inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-100 px-2.5 py-1 text-amber-800",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Clock, {
											className: "size-3",
											"aria-hidden": "true"
										}),
										" ",
										stats.pending_jobs,
										" queued job",
										stats.pending_jobs === 1 ? "" : "s"
									]
								})
							]
						})]
					})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					role: "tablist",
					"aria-label": "Backup sections",
					className: "flex gap-1 overflow-x-auto rounded-xl border border-border bg-muted/40 p-1",
					children: TABS.map(({ id, label, icon: Icon }) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						role: "tab",
						"aria-selected": tab === id,
						"aria-controls": `panel-${id}`,
						id: `tab-${id}`,
						onClick: () => selectTab(id),
						className: cn("inline-flex h-10 flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-lg px-3 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50", tab === id ? "bg-background text-foreground shadow-sm ring-1 ring-border" : "text-muted-foreground hover:text-foreground"),
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icon, {
							className: "size-4",
							"aria-hidden": "true"
						}), label]
					}, id))
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					ref: panelRef,
					id: `panel-${tab}`,
					role: "tabpanel",
					"aria-labelledby": `tab-${tab}`,
					tabIndex: -1,
					className: "space-y-5 outline-none",
					children: [
						tab === "backups" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
							className: "space-y-3",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "flex items-end justify-between gap-3",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
										className: "text-base font-semibold",
										children: "Your backups"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										className: "text-xs text-muted-foreground",
										children: "Download a copy, check it, or restore it later."
									})] })
								}),
								backups.data.length === 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "rounded-xl border border-dashed border-border bg-card px-6 py-12 text-center",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(HardDrive, {
											className: "mx-auto size-10 text-muted-foreground/40",
											"aria-hidden": "true"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
											className: "mt-3 text-sm font-medium",
											children: "No backups yet"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "mx-auto mt-1 max-w-sm text-xs text-muted-foreground",
											children: "Create a backup to protect your products, sales, customers and uploaded files."
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
											className: "mt-4 h-11 gap-2",
											onClick: () => setCreateOpen(true),
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Database, {
												className: "size-4",
												"aria-hidden": "true"
											}), "Create your first backup"]
										})
									]
								}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
									className: "space-y-3",
									children: backups.data.map((backup) => {
										const restorableRow = ["verified", "completed"].includes(backup.status);
										return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
											className: "rounded-xl border border-border bg-card p-4",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
													className: "min-w-0 space-y-1.5",
													children: [
														/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
															className: "flex flex-wrap items-center gap-2",
															children: [
																/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
																	className: "flex size-8 items-center justify-center rounded-lg bg-muted",
																	children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(FileArchive, {
																		className: "size-4 text-muted-foreground",
																		"aria-hidden": "true"
																	})
																}),
																/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
																	className: "text-sm font-medium",
																	children: friendlyName(backup)
																}),
																/* @__PURE__ */ (0, import_jsx_runtime.jsx)(StatusBadge, { status: backup.status }),
																backup.encrypted && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Badge, {
																	variant: "outline",
																	className: "h-6 gap-1 px-2",
																	children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Lock, {
																		className: "size-3",
																		"aria-hidden": "true"
																	}), " Encrypted"]
																})
															]
														}),
														/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
															className: "pl-10 text-xs text-muted-foreground",
															children: [formatBytes(backup.size_bytes), backup.included_scope?.prescriptions ? ` · ${backup.included_scope.prescriptions} prescription file(s)` : ""]
														}),
														backup.failure_reason && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
															className: "pl-10 text-xs text-red-700",
															children: backup.failure_reason
														})
													]
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
													className: "flex flex-wrap items-center gap-2 sm:justify-end",
													children: [
														/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("a", {
															href: `/settings/backup/${backup.id}/download`,
															"aria-disabled": !restorableRow,
															tabIndex: restorableRow ? 0 : -1,
															onClick: (event) => {
																if (!restorableRow) event.preventDefault();
															},
															className: cn(buttonVariants({
																variant: "outline",
																size: "lg"
															}), "h-10 gap-1.5", !restorableRow && "pointer-events-none opacity-50"),
															children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Download, {
																className: "size-4",
																"aria-hidden": "true"
															}), "Download"]
														}),
														/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
															variant: "outline",
															size: "lg",
															className: "h-10 gap-1.5",
															disabled: !restorableRow,
															onClick: () => {
																setSelectedServerBackup(String(backup.id));
																setRestorePassword("");
																setTab("restore");
																requestAnimationFrame(() => panelRef.current?.focus());
															},
															children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(RotateCcw, {
																className: "size-4",
																"aria-hidden": "true"
															}), "Restore"]
														}),
														/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
															variant: "ghost",
															size: "icon-lg",
															className: "size-10 text-muted-foreground hover:text-red-600",
															"aria-label": `Delete backup from ${formatDateTime(backup.created_at)}`,
															title: "Delete backup",
															onClick: () => {
																setDeleteTarget(backup);
																setDeleteForce(false);
															},
															children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash2, {
																className: "size-4",
																"aria-hidden": "true"
															})
														})
													]
												})]
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("details", {
												className: "mt-3 border-t border-border pt-3",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("summary", {
													className: "flex cursor-pointer list-none items-center gap-1 text-xs font-medium text-muted-foreground hover:text-foreground",
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronDown, {
														className: "size-3",
														"aria-hidden": "true"
													}), " Details and checks"]
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
													className: "mt-3 space-y-3 text-xs text-muted-foreground",
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("dl", {
														className: "grid gap-2 sm:grid-cols-2",
														children: [
															/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", {
																className: "font-medium text-foreground",
																children: "File"
															}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", {
																className: "break-all font-mono text-[11px]",
																children: backup.filename
															})] }),
															/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", {
																className: "font-medium text-foreground",
																children: "Type"
															}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", { children: backup.kind === "safety" ? "Safety copy made before a restore" : backup.kind })] }),
															/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", {
																className: "font-medium text-foreground",
																children: "Verified"
															}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", { children: formatDateTime(backup.verified_at) })] }),
															backup.sha256 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", {
																className: "font-medium text-foreground",
																children: "Checksum"
															}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", {
																className: "break-all font-mono text-[11px]",
																children: backup.sha256
															})] })
														]
													}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
														className: "flex flex-col gap-2 sm:flex-row sm:items-center",
														children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
															className: "flex-1",
															children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(PasswordInput, {
																value: verifyPasswords[backup.id] ?? "",
																onChange: (value) => setVerifyPasswords((current) => ({
																	...current,
																	[backup.id]: value
																})),
																label: "Password for this backup (only if encrypted)",
																autoComplete: "off"
															})
														}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
															variant: "outline",
															size: "lg",
															className: "h-10 gap-1.5",
															disabled: verifyingId === backup.id,
															onClick: () => handleVerify(backup),
															children: [verifyingId === backup.id ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, {
																className: "size-4 animate-spin",
																"aria-hidden": "true"
															}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ShieldCheck, {
																className: "size-4",
																"aria-hidden": "true"
															}), "Check file"]
														})]
													})]
												})]
											})]
										}, backup.id);
									})
								}),
								backups.last_page > 1 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "flex items-center justify-between text-xs text-muted-foreground",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [
										"Page ",
										backups.current_page,
										" of ",
										backups.last_page
									] }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex gap-2",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
											variant: "outline",
											size: "lg",
											className: "h-10",
											disabled: backups.current_page <= 1,
											onClick: () => router3.get("/settings/backup", { page: backups.current_page - 1 }, { preserveScroll: true }),
											children: "Previous"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
											variant: "outline",
											size: "lg",
											className: "h-10",
											disabled: backups.current_page >= backups.last_page,
											onClick: () => router3.get("/settings/backup", { page: backups.current_page + 1 }, { preserveScroll: true }),
											children: "Next"
										})]
									})]
								})
							]
						}),
						tab === "restore" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
							className: "space-y-4",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "rounded-xl border border-red-200 bg-red-50 p-4",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "flex items-start gap-3",
										children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TriangleAlert, {
											className: "mt-0.5 size-5 shrink-0 text-red-600",
											"aria-hidden": "true"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
											className: "text-sm font-semibold text-red-900",
											children: "Restoring replaces your current data"
										}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "mt-1 text-xs text-red-800",
											children: "Your products, sales, customers and uploaded files will be replaced with the backup. A safety copy is made automatically first."
										})] })]
									})
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "grid gap-3 sm:grid-cols-2",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "rounded-xl border border-border bg-card p-4",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "flex items-center gap-2",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Upload, {
													className: "size-4 text-muted-foreground",
													"aria-hidden": "true"
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
													className: "text-sm font-medium",
													children: "Upload a backup file"
												})]
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
												className: "mt-1 text-xs text-muted-foreground",
												children: "Choose an .invbak file saved on this device."
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
												ref: fileInputRef,
												type: "file",
												accept: ".invbak,.zip",
												className: "sr-only",
												"aria-label": "Choose a backup file",
												onChange: handleUpload
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
												variant: "outline",
												size: "lg",
												className: "mt-3 h-11 w-full gap-1.5",
												disabled: inspecting,
												onClick: () => fileInputRef.current?.click(),
												children: [inspecting ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, {
													className: "size-4 animate-spin",
													"aria-hidden": "true"
												}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Upload, {
													className: "size-4",
													"aria-hidden": "true"
												}), "Choose file"]
											})
										]
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
										className: "rounded-xl border border-border bg-card p-4",
										children: [
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "flex items-center gap-2",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Server, {
													className: "size-4 text-muted-foreground",
													"aria-hidden": "true"
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
													className: "text-sm font-medium",
													children: "Use a backup from this shop"
												})]
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
												className: "mt-1 text-xs text-muted-foreground",
												children: "Pick one of the backups stored in the app."
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
												htmlFor: "server-backup",
												className: "sr-only",
												children: "Backup stored in the app"
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("select", {
												id: "server-backup",
												value: selectedServerBackup,
												onChange: (event) => setSelectedServerBackup(event.target.value),
												className: "mt-3 h-11 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("option", {
													value: "",
													children: "Choose a backup…"
												}), restorable.map((backup) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("option", {
													value: backup.id,
													children: [
														friendlyName(backup),
														" · ",
														formatBytes(backup.size_bytes)
													]
												}, backup.id))]
											}),
											/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
												size: "lg",
												className: "mt-2 h-11 w-full gap-1.5",
												disabled: inspecting || !selectedServerBackup,
												onClick: handleInspectServer,
												children: [inspecting ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, {
													className: "size-4 animate-spin",
													"aria-hidden": "true"
												}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(RotateCcw, {
													className: "size-4",
													"aria-hidden": "true"
												}), "Review this backup"]
											}),
											selectedServerBackup && !preview && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
												className: "mt-2 text-xs text-muted-foreground",
												"aria-live": "polite",
												children: "Selected. Review it to see what will be restored."
											})
										]
									})]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "rounded-xl border border-border bg-card p-4",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PasswordInput, {
										value: restorePassword,
										onChange: setRestorePassword,
										label: "Backup password (only if the backup is encrypted)",
										placeholder: "Leave empty if you did not set a password",
										autoComplete: "off",
										describedBy: "restore-password-help"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
										id: "restore-password-help",
										className: "mt-1 text-xs text-muted-foreground",
										children: "The password was chosen when the backup was created. It is never stored by the app."
									})]
								}),
								(errors.restore || errors.file) && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									role: "alert",
									className: "flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200",
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CircleX, {
										className: "mt-0.5 size-4 shrink-0",
										"aria-hidden": "true"
									}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", { children: errors.restore || errors.file })]
								}),
								preview && restoreRunId ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									ref: previewRef,
									className: "space-y-4 rounded-xl border border-amber-200 bg-amber-50/60 p-4",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "flex flex-wrap items-center justify-between gap-2",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
												className: "flex items-center gap-2",
												children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
													className: "flex size-8 items-center justify-center rounded-full bg-amber-100 text-amber-700",
													children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Check, {
														className: "size-4",
														"aria-hidden": "true"
													})
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
													className: "text-sm font-semibold text-amber-900",
													children: "Backup checked and ready"
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
													className: "text-xs text-amber-800",
													children: "Nothing has been changed yet."
												})] })]
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
												variant: "ghost",
												size: "lg",
												className: "h-9 text-amber-900 hover:bg-amber-100",
												onClick: () => router3.get("/settings/backup", {}, { preserveScroll: true }),
												children: "Choose a different backup"
											})]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("ol", {
											className: "flex flex-wrap items-center gap-2 text-xs font-medium text-amber-900",
											"aria-label": "Restore steps",
											children: [
												/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
													className: "inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-1",
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CircleCheck, {
														className: "size-3",
														"aria-hidden": "true"
													}), " 1. Checked"]
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", {
													className: "inline-flex items-center gap-1 rounded-full bg-white px-2.5 py-1 ring-1 ring-amber-200",
													children: "2. Review"
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", {
													className: "text-amber-700",
													children: "3. Restore"
												})
											]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("dl", {
											className: "grid gap-2 text-xs text-amber-900 sm:grid-cols-2",
											children: [
												/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", {
													className: "font-medium",
													children: "Made on"
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", { children: formatDateTime(preview.created_at) })] }),
												/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", {
													className: "font-medium",
													children: "Source"
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", { children: preview.source === "upload" ? "Uploaded file" : "Stored backup" })] }),
												/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", {
													className: "font-medium",
													children: "Data"
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("dd", { children: [
													preview.table_count,
													" tables · ",
													preview.row_count,
													" records"
												] })] }),
												/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", {
													className: "font-medium",
													children: "Files"
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("dd", { children: [preview.file_count, " uploaded file(s)"] })] }),
												/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", {
													className: "font-medium",
													children: "Password"
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", { children: preview.encrypted ? "Protected" : "Not protected" })] }),
												/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("dt", {
													className: "font-medium",
													children: "File"
												}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", {
													className: "break-all font-mono text-[11px]",
													children: preview.artifact
												})] })
											]
										}),
										preview.warnings.length > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "rounded-lg bg-amber-100 p-3 text-xs text-amber-900",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
												className: "font-medium",
												children: "Please note"
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ul", {
												className: "mt-1 list-disc space-y-0.5 pl-4",
												children: preview.warnings.map((warning) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: warning }, warning))
											})]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "space-y-2",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
												htmlFor: "restore-confirmation",
												className: "block text-xs font-medium text-amber-900",
												children: [
													"Type ",
													/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
														className: "rounded bg-white px-1.5 py-0.5 font-mono",
														children: preview.confirmation_phrase
													}),
													" to confirm"
												]
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
												id: "restore-confirmation",
												value: confirmation,
												onChange: (event) => setConfirmation(event.target.value),
												autoComplete: "off",
												className: "h-11 w-full rounded-lg border border-amber-300 bg-white px-3 text-base text-gray-900 outline-none focus-visible:border-amber-500 focus-visible:ring-3 focus-visible:ring-amber-500/30 md:text-sm"
											})]
										}),
										stats.pending_jobs > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
											className: "flex items-start gap-2 text-xs text-amber-900",
											children: [
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
													type: "checkbox",
													checked: forceRestore,
													onChange: (event) => setForceRestore(event.target.checked),
													className: "mt-0.5 size-4"
												}),
												"I understand that ",
												stats.pending_jobs,
												" queued job",
												stats.pending_jobs === 1 ? "" : "s",
												" will be discarded."
											]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
											variant: "destructive",
											size: "lg",
											className: "h-11 w-full gap-1.5 sm:w-auto",
											disabled: restoring || confirmation.trim() !== preview.confirmation_phrase,
											onClick: handleRestore,
											children: [restoring ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, {
												className: "size-4 animate-spin",
												"aria-hidden": "true"
											}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(RotateCcw, {
												className: "size-4",
												"aria-hidden": "true"
											}), restoring ? "Restoring — keep this page open…" : "Restore this backup"]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "text-[11px] text-amber-800",
											"aria-live": "polite",
											children: "Restoring can take a minute. Do not close this page."
										})
									]
								}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: "rounded-xl border border-dashed border-border bg-card px-6 py-8 text-center",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Info, {
											className: "mx-auto size-8 text-muted-foreground/50",
											"aria-hidden": "true"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "mt-2 text-sm font-medium",
											children: "Choose a backup to review it"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "mx-auto mt-1 max-w-sm text-xs text-muted-foreground",
											children: "Upload a file or pick a stored backup. You will see what it contains before anything is replaced."
										})
									]
								})
							]
						}),
						tab === "schedule" && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
							className: "space-y-4",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: "rounded-xl border border-border bg-card p-4 sm:p-5",
									children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Switch, {
										checked: settings.enabled,
										onChange: (enabled) => setSettings({
											...settings,
											enabled
										}),
										label: "Automatic backups",
										description: "Let the app make a backup for you on a schedule."
									})
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: cn("space-y-4 rounded-xl border border-border bg-card p-4 sm:p-5", !settings.enabled && "opacity-60"),
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("fieldset", {
											disabled: !settings.enabled,
											className: "space-y-4",
											children: [
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("legend", {
													className: "text-sm font-medium",
													children: "When should it run?"
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
													className: "grid grid-cols-3 gap-1 rounded-lg border border-border bg-muted/40 p-1",
													role: "group",
													"aria-label": "Backup frequency",
													children: [
														{
															value: "daily",
															label: "Daily"
														},
														{
															value: "weekly",
															label: "Weekly"
														},
														{
															value: "monthly",
															label: "Monthly"
														}
													].map((option) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
														type: "button",
														"aria-pressed": settings.frequency === option.value,
														onClick: () => setSettings({
															...settings,
															frequency: option.value
														}),
														className: cn("h-10 rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50", settings.frequency === option.value ? "bg-background text-foreground shadow-sm ring-1 ring-border" : "text-muted-foreground hover:text-foreground"),
														children: option.label
													}, option.value))
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
													className: "grid gap-3 sm:grid-cols-2",
													children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
														className: "space-y-1.5",
														children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
															htmlFor: "backup-time",
															className: "block text-sm font-medium",
															children: "Time of day"
														}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
															id: "backup-time",
															type: "time",
															value: settings.time,
															onChange: (event) => setSettings({
																...settings,
																time: event.target.value
															}),
															className: "h-11 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
														})]
													}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
														className: "space-y-1.5",
														children: [
															/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
																htmlFor: "backup-timezone",
																className: "block text-sm font-medium",
																children: "Timezone"
															}),
															/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
																id: "backup-timezone",
																value: settings.timezone,
																onChange: (event) => setSettings({
																	...settings,
																	timezone: event.target.value
																}),
																className: "h-11 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
															}),
															/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
																className: "text-xs text-muted-foreground",
																children: [
																	"Usually your business timezone: ",
																	businessTimezone,
																	"."
																]
															})
														]
													})]
												}),
												/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("fieldset", {
													className: "space-y-2",
													children: [
														/* @__PURE__ */ (0, import_jsx_runtime.jsx)("legend", {
															className: "text-sm font-medium",
															children: "How many copies should we keep?"
														}),
														/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
															className: "grid grid-cols-2 gap-3 sm:grid-cols-4",
															children: [
																{
																	key: "retain_daily",
																	label: "Daily copies"
																},
																{
																	key: "retain_weekly",
																	label: "Weekly copies"
																},
																{
																	key: "retain_monthly",
																	label: "Monthly copies"
																},
																{
																	key: "retain_safety",
																	label: "Safety copies"
																}
															].map(({ key, label }) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
																className: "space-y-1.5",
																children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
																	htmlFor: `retain-${key}`,
																	className: "block text-xs font-medium text-muted-foreground",
																	children: label
																}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
																	id: `retain-${key}`,
																	type: "number",
																	min: 1,
																	value: settings[key],
																	onChange: (event) => setSettings({
																		...settings,
																		[key]: Number(event.target.value)
																	}),
																	className: "h-11 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
																})]
															}, key))
														}),
														/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
															className: "text-xs text-muted-foreground",
															children: "Manual backups are never deleted automatically."
														})
													]
												})
											]
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
											className: "rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground",
											children: settingsSummary
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
											className: "flex flex-col gap-2 sm:flex-row sm:items-center",
											children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
												size: "lg",
												className: "h-11 gap-1.5",
												disabled: !hasChanges || savingSettings,
												onClick: saveSettings,
												children: [savingSettings ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, {
													className: "size-4 animate-spin",
													"aria-hidden": "true"
												}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Check, {
													className: "size-4",
													"aria-hidden": "true"
												}), "Save schedule"]
											}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
												className: "text-xs text-muted-foreground",
												"aria-live": "polite",
												children: hasChanges ? "You have unsaved changes." : "Schedule is up to date."
											})]
										})
									]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("details", {
									className: "rounded-xl border border-border bg-card p-4",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("summary", {
											className: "cursor-pointer text-xs font-medium text-muted-foreground hover:text-foreground",
											children: "For your hosting provider"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
											className: "mt-2 text-xs text-muted-foreground",
											children: "Automatic backups need the scheduler to run every minute. On cPanel or a VPS, add:"
										}),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("code", {
											className: "mt-2 block overflow-x-auto rounded-lg bg-muted px-3 py-2 text-[11px]",
											children: "* * * * * cd /path/to/app && php artisan schedule:run >> /dev/null 2>&1"
										})
									]
								})
							]
						})
					]
				})
			]
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Dialog, {
			open: createOpen,
			onOpenChange: setCreateOpen,
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogContent, {
				className: "sm:max-w-md",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogHeader, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTitle, { children: "Create a backup" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogDescription, { children: "We save your database, prescription images and branding files into one checked file." })] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "space-y-3",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
									className: "font-medium text-foreground",
									children: "What is included"
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("ul", {
									className: "mt-1 list-disc space-y-0.5 pl-4",
									children: [
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "Products, stock, sales, purchases, customers and payments" }),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "Prescription images and your branding logo" }),
										/* @__PURE__ */ (0, import_jsx_runtime.jsx)("li", { children: "Settings, users and permissions" })
									]
								})]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PasswordInput, {
								value: password,
								onChange: setPassword,
								label: "Password (recommended)",
								placeholder: "At least 8 characters",
								describedBy: "create-password-help"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)(PasswordInput, {
								value: confirmPassword,
								onChange: setConfirmPassword,
								label: "Repeat password",
								autoComplete: "new-password",
								describedBy: "create-password-help"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								id: "create-password-help",
								className: "text-xs text-muted-foreground",
								children: "Keep this password safe. Without it, an encrypted backup cannot be restored. Leave both fields empty to create an unencrypted backup."
							})
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogFooter, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						variant: "outline",
						size: "lg",
						className: "h-11",
						onClick: () => setCreateOpen(false),
						disabled: creating,
						children: "Cancel"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
						size: "lg",
						className: "h-11 gap-2",
						onClick: handleCreate,
						disabled: creating,
						children: [creating ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, {
							className: "size-4 animate-spin",
							"aria-hidden": "true"
						}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Database, {
							className: "size-4",
							"aria-hidden": "true"
						}), creating ? "Creating and checking…" : "Create backup"]
					})] })
				]
			})
		}),
		/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Dialog, {
			open: deleteTarget !== null,
			onOpenChange: (open) => !open && setDeleteTarget(null),
			children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogContent, {
				className: "sm:max-w-md",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogHeader, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogTitle, { children: "Delete this backup?" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(DialogDescription, { children: deleteTarget ? `${friendlyName(deleteTarget)} will be removed from this server. This cannot be undone.` : "" })] }),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
						className: "flex items-start gap-2 text-xs text-muted-foreground",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
							type: "checkbox",
							checked: deleteForce,
							onChange: (event) => setDeleteForce(event.target.checked),
							className: "mt-0.5 size-4"
						}), "Delete it even if it is the newest working backup."]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(DialogFooter, { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
						variant: "outline",
						size: "lg",
						className: "h-11",
						onClick: () => setDeleteTarget(null),
						disabled: deleting,
						children: "Keep it"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
						variant: "destructive",
						size: "lg",
						className: "h-11 gap-2",
						onClick: handleDelete,
						disabled: deleting,
						children: [deleting ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, {
							className: "size-4 animate-spin",
							"aria-hidden": "true"
						}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Trash2, {
							className: "size-4",
							"aria-hidden": "true"
						}), "Delete backup"]
					})] })
				]
			})
		})
	] });
}
//#endregion
export { BackupRestorePage as default };
