import { i as __toESM, t as require_react } from "./react-DCO0ASPG.js";
import { t as createLucideIcon } from "./createLucideIcon--nD-f_FR.js";
import { t as ChevronLeft } from "./chevron-left-BWkIAWWi.js";
import { t as Download } from "./download-CTeSL13_.js";
import { t as cn } from "./utils-Bim8RyS4.js";
import { t as require_jsx_runtime } from "./jsx-runtime-BjJQA5sn.js";
import { ct as X, xt as ChevronRight } from "./app-DGjxHKeP.js";
/**
* @license lucide-react v1.26.0 - ISC
*
* This source code is licensed under the ISC license.
* See the LICENSE file in the root directory of this source tree.
*/
var ZoomIn = createLucideIcon("zoom-in", [
	["circle", {
		cx: "11",
		cy: "11",
		r: "8",
		key: "4ej97u"
	}],
	["line", {
		x1: "21",
		x2: "16.65",
		y1: "21",
		y2: "16.65",
		key: "13gj7c"
	}],
	["line", {
		x1: "11",
		x2: "11",
		y1: "8",
		y2: "14",
		key: "1vmskp"
	}],
	["line", {
		x1: "8",
		x2: "14",
		y1: "11",
		y2: "11",
		key: "durymu"
	}]
]);
/**
* @license lucide-react v1.26.0 - ISC
*
* This source code is licensed under the ISC license.
* See the LICENSE file in the root directory of this source tree.
*/
var ZoomOut = createLucideIcon("zoom-out", [
	["circle", {
		cx: "11",
		cy: "11",
		r: "8",
		key: "4ej97u"
	}],
	["line", {
		x1: "21",
		x2: "16.65",
		y1: "21",
		y2: "16.65",
		key: "13gj7c"
	}],
	["line", {
		x1: "8",
		x2: "14",
		y1: "11",
		y2: "11",
		key: "durymu"
	}]
]);
//#endregion
//#region resources/js/components/ui/ImageViewer.tsx
var import_react = /* @__PURE__ */ __toESM(require_react(), 1);
var import_jsx_runtime = require_jsx_runtime();
function ImageViewer({ images, initialIndex = 0, open, onClose }) {
	const [index, setIndex] = (0, import_react.useState)(initialIndex);
	const [zoom, setZoom] = (0, import_react.useState)(1);
	(0, import_react.useEffect)(() => {
		setIndex(initialIndex);
		setZoom(1);
	}, [initialIndex, open]);
	(0, import_react.useEffect)(() => {
		const handler = (e) => {
			if (!open) return;
			if (e.key === "Escape") onClose();
			if (e.key === "ArrowLeft") goBack();
			if (e.key === "ArrowRight") goNext();
			if (e.key === "+" || e.key === "=") setZoom((z) => Math.min(5, z + .25));
			if (e.key === "-") setZoom((z) => Math.max(.25, z - .25));
		};
		window.addEventListener("keydown", handler);
		return () => window.removeEventListener("keydown", handler);
	}, [
		open,
		index,
		images.length
	]);
	const goBack = (0, import_react.useCallback)(() => setIndex((i) => Math.max(0, i - 1)), []);
	const goNext = (0, import_react.useCallback)(() => setIndex((i) => Math.min(images.length - 1, i + 1)), [images.length]);
	if (!open || images.length === 0) return null;
	const current = images[index];
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "fixed inset-0 z-[100] bg-black/90 flex flex-col",
		onClick: onClose,
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-center justify-between px-4 py-3 text-white/80 shrink-0",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
						onClick: onClose,
						className: "flex items-center gap-1.5 text-sm hover:text-white transition-colors",
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(X, { className: "size-5" }), "Close"]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "text-sm",
						children: [
							index + 1,
							" / ",
							images.length
						]
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						className: "flex items-center gap-2",
						children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								onClick: (e) => {
									e.stopPropagation();
									setZoom((z) => Math.max(.25, z - .25));
								},
								className: "p-1.5 rounded hover:bg-white/10 transition-colors",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ZoomOut, { className: "size-4" })
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
								className: "text-xs w-8 text-center",
								children: [Math.round(zoom * 100), "%"]
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
								onClick: (e) => {
									e.stopPropagation();
									setZoom((z) => Math.min(5, z + .25));
								},
								className: "p-1.5 rounded hover:bg-white/10 transition-colors",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ZoomIn, { className: "size-4" })
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("a", {
								href: current.url,
								download: current.name || "image",
								target: "_blank",
								rel: "noreferrer",
								onClick: (e) => e.stopPropagation(),
								className: "p-1.5 rounded hover:bg-white/10 transition-colors",
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Download, { className: "size-4" })
							})
						]
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex-1 flex items-center justify-center min-h-0 p-4",
				onClick: (e) => e.stopPropagation(),
				children: [
					images.length > 1 && index > 0 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						onClick: (e) => {
							e.stopPropagation();
							goBack();
						},
						className: "absolute left-3 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronLeft, { className: "size-6" })
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
						src: current.url,
						alt: current.name || "Prescription image",
						className: "max-w-full max-h-full object-contain transition-transform duration-200",
						style: { transform: `scale(${zoom})` }
					}),
					images.length > 1 && index < images.length - 1 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
						onClick: (e) => {
							e.stopPropagation();
							goNext();
						},
						className: "absolute right-3 p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ChevronRight, { className: "size-6" })
					})
				]
			}),
			images.length > 1 && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "flex items-center justify-center gap-2 p-3 shrink-0 overflow-x-auto",
				children: images.map((img, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
					onClick: (e) => {
						e.stopPropagation();
						setIndex(i);
					},
					className: cn("size-12 rounded-lg overflow-hidden border-2 transition-all shrink-0", i === index ? "border-white opacity-100" : "border-transparent opacity-50 hover:opacity-80"),
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
						src: img.url,
						alt: "",
						className: "size-full object-cover"
					})
				}, img.id))
			})
		]
	});
}
//#endregion
export { ImageViewer as t };
