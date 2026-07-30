import { i as __toESM, r as __exportAll, t as require_react } from "./react-DCO0ASPG.js";
import { t as createLucideIcon } from "./createLucideIcon--nD-f_FR.js";
import { t as Download } from "./download-CTeSL13_.js";
import { t as FileText } from "./file-text-CkmQ0M6N.js";
import { t as LoaderCircle } from "./loader-circle-CdtlPMRw.js";
import { t as Printer } from "./printer-SCaoHvv-.js";
import { t as RefreshCw } from "./refresh-cw-DGGw9qMI.js";
import { t as Share2 } from "./share-2-BDkinF3u.js";
import { t as require_jsx_runtime } from "./jsx-runtime-BjJQA5sn.js";
import { St as ChevronDown, Tt as toast } from "./app-DRCb4nuk.js";
/**
* @license lucide-react v1.26.0 - ISC
*
* This source code is licensed under the ISC license.
* See the LICENSE file in the root directory of this source tree.
*/
var FileSpreadsheet = createLucideIcon("file-spreadsheet", [
	["path", {
		d: "M6 22a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h8a2.4 2.4 0 0 1 1.704.706l3.588 3.588A2.4 2.4 0 0 1 20 8v12a2 2 0 0 1-2 2z",
		key: "1oefj6"
	}],
	["path", {
		d: "M14 2v5a1 1 0 0 0 1 1h5",
		key: "wfsgrz"
	}],
	["path", {
		d: "M8 13h2",
		key: "yr2amv"
	}],
	["path", {
		d: "M14 13h2",
		key: "un5t4a"
	}],
	["path", {
		d: "M8 17h2",
		key: "2yhykz"
	}],
	["path", {
		d: "M14 17h2",
		key: "10kma7"
	}]
]);
//#endregion
//#region resources/js/Pages/reports/components/ReportToolbar.tsx
var ReportToolbar_exports = /* @__PURE__ */ __exportAll({ ReportToolbar: () => ReportToolbar });
var import_react = /* @__PURE__ */ __toESM(require_react(), 1);
var import_jsx_runtime = require_jsx_runtime();
function ReportToolbar({ onPrint, onRefresh, csvExportUrl, excelExportUrl, pdfExportUrl, shareUrl, reportTitle, currentFilters }) {
	const [exportOpen, setExportOpen] = (0, import_react.useState)(false);
	const [shareOpen, setShareOpen] = (0, import_react.useState)(false);
	const [sharing, setSharing] = (0, import_react.useState)(false);
	const exportRef = (0, import_react.useRef)(null);
	const shareRef = (0, import_react.useRef)(null);
	(0, import_react.useEffect)(() => {
		const close = (e) => {
			if (exportRef.current && !exportRef.current.contains(e.target)) setExportOpen(false);
			if (shareRef.current && !shareRef.current.contains(e.target)) setShareOpen(false);
		};
		document.addEventListener("mousedown", close);
		return () => document.removeEventListener("mousedown", close);
	}, []);
	const buildShareUrl = (format) => {
		if (!shareUrl) return "#";
		const params = new URLSearchParams(currentFilters || {});
		params.set("format", format);
		return `${shareUrl}?${params.toString()}`;
	};
	const handleShare = async () => {
		if (!shareUrl) {
			toast.info("Share not available for this report");
			return;
		}
		if (!navigator.share || !navigator.canShare) {
			window.open(buildShareUrl("pdf"), "_blank");
			toast.success("PDF downloaded");
			return;
		}
		setSharing(true);
		try {
			const data = await (await fetch(buildShareUrl("share"))).json();
			const blob = await (await fetch(data.url)).blob();
			const file = new File([blob], data.filename, { type: "application/pdf" });
			if (navigator.canShare({ files: [file] })) await navigator.share({
				title: reportTitle || "Report",
				text: reportTitle || "Report from Invenos",
				files: [file]
			});
			else await navigator.share({
				title: reportTitle || "Report",
				text: `${reportTitle || "Report"} — ${buildShareUrl("pdf")}`,
				url: buildShareUrl("pdf")
			});
		} catch (err) {
			if (err.name !== "AbortError") {
				toast.error("Share failed. Try downloading instead.");
				window.open(buildShareUrl("pdf"), "_blank");
			}
		} finally {
			setSharing(false);
			setShareOpen(false);
		}
	};
	const handlePrint = onPrint || (() => window.print());
	const handleRefresh = onRefresh || (() => window.location.reload());
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "flex items-center gap-1",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
				onClick: handlePrint,
				className: "inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-border text-xs font-medium hover:bg-muted transition-colors cursor-pointer",
				title: "Print",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Printer, { className: "size-3.5" }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
					className: "hidden sm:inline",
					children: "Print"
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "relative",
				ref: exportRef,
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
					onClick: () => setExportOpen(!exportOpen),
					className: "inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-border text-xs font-medium hover:bg-muted transition-colors cursor-pointer",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Download, { className: "size-3.5" }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "hidden sm:inline",
							children: "Export"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronDown, { className: "size-3" })
					]
				}), exportOpen && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "absolute right-0 top-full mt-1 w-40 rounded-xl border border-border bg-card shadow-lg z-50 py-1",
					children: [
						csvExportUrl && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("a", {
							href: csvExportUrl,
							className: "flex items-center gap-2 px-3 py-2 text-xs text-foreground hover:bg-muted transition-colors",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FileSpreadsheet, { className: "size-3.5 text-emerald-600" }), "CSV"]
						}),
						excelExportUrl && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("a", {
							href: excelExportUrl,
							className: "flex items-center gap-2 px-3 py-2 text-xs text-foreground hover:bg-muted transition-colors",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FileSpreadsheet, { className: "size-3.5 text-blue-600" }), "Excel"]
						}),
						pdfExportUrl && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("a", {
							href: pdfExportUrl,
							target: "_blank",
							rel: "noopener",
							className: "flex items-center gap-2 px-3 py-2 text-xs text-foreground hover:bg-muted transition-colors",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(FileText, { className: "size-3.5 text-red-500" }), "PDF"]
						}),
						!csvExportUrl && !excelExportUrl && !pdfExportUrl && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "px-3 py-2 text-xs text-muted-foreground",
							children: "No export options"
						})
					]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "relative",
				ref: shareRef,
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
					onClick: () => setShareOpen(!shareOpen),
					disabled: sharing,
					className: "inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-border text-xs font-medium hover:bg-muted transition-colors cursor-pointer disabled:opacity-50",
					children: [
						sharing ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "size-3.5 animate-spin" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Share2, { className: "size-3.5" }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
							className: "hidden sm:inline",
							children: "Share"
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronDown, { className: "size-3" })
					]
				}), shareOpen && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "absolute right-0 top-full mt-1 w-48 rounded-xl border border-border bg-card shadow-lg z-50 py-1",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
							onClick: handleShare,
							className: "w-full flex items-center gap-2 px-3 py-2 text-xs text-foreground hover:bg-muted transition-colors text-left",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Share2, { className: "size-3.5 text-primary" }),
								"Share via...",
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
									className: "text-[9px] text-muted-foreground ml-auto",
									children: "PDF"
								})
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("a", {
							href: buildShareUrl("pdf"),
							target: "_blank",
							rel: "noopener",
							className: "flex items-center gap-2 px-3 py-2 text-xs text-foreground hover:bg-muted transition-colors",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Download, { className: "size-3.5" }), "Download PDF"]
						}),
						shareUrl && /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("a", {
							href: buildShareUrl("pdf"),
							target: "_blank",
							rel: "noopener",
							className: "flex items-center gap-2 px-3 py-2 text-xs text-foreground hover:bg-muted transition-colors",
							children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Printer, { className: "size-3.5" }), "Print PDF"]
						})
					]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
				onClick: handleRefresh,
				className: "inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-border text-xs font-medium hover:bg-muted transition-colors cursor-pointer",
				title: "Refresh",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(RefreshCw, { className: "size-3.5" })
			})
		]
	});
}
//#endregion
export { ReportToolbar_exports as n, ReportToolbar as t };
