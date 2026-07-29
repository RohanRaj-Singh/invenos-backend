import { i as __toESM, t as require_react } from "./react-DCO0ASPG.js";
import { t as createLucideIcon } from "./createLucideIcon--nD-f_FR.js";
import { t as Eye } from "./eye-C9acyGZL.js";
import { t as LoaderCircle } from "./loader-circle-CdtlPMRw.js";
import { t as cn } from "./utils-Bim8RyS4.js";
import { t as require_jsx_runtime } from "./jsx-runtime-BjJQA5sn.js";
import { t as Button } from "./button-phKcTdak.js";
import { Dt as usePage, Et as router3 } from "./app-BLMvu7I3.js";
import { i as CardTitle, n as CardContent, r as CardHeader, t as Card } from "./card-DQfOgTjC.js";
/**
* @license lucide-react v1.26.0 - ISC
*
* This source code is licensed under the ISC license.
* See the LICENSE file in the root directory of this source tree.
*/
var EyeOff = createLucideIcon("eye-off", [
	["path", {
		d: "M10.733 5.076a10.744 10.744 0 0 1 11.205 6.575 1 1 0 0 1 0 .696 10.747 10.747 0 0 1-1.444 2.49",
		key: "ct8e1f"
	}],
	["path", {
		d: "M14.084 14.158a3 3 0 0 1-4.242-4.242",
		key: "151rxh"
	}],
	["path", {
		d: "M17.479 17.499a10.75 10.75 0 0 1-15.417-5.151 1 1 0 0 1 0-.696 10.75 10.75 0 0 1 4.446-5.143",
		key: "13bj9a"
	}],
	["path", {
		d: "m2 2 20 20",
		key: "1ooewy"
	}]
]);
//#endregion
//#region resources/js/Pages/Auth/Login.tsx
var import_react = /* @__PURE__ */ __toESM(require_react(), 1);
var import_jsx_runtime = require_jsx_runtime();
function LoginPage() {
	const { props } = usePage();
	const biz = (props.settings || {})?.business || {};
	const { errors, status } = props;
	const [login, setLogin] = (0, import_react.useState)("");
	const [password, setPassword] = (0, import_react.useState)("");
	const [remember, setRemember] = (0, import_react.useState)(false);
	const [showPassword, setShowPassword] = (0, import_react.useState)(false);
	const [loggingIn, setLoggingIn] = (0, import_react.useState)(false);
	const handleSubmit = (e) => {
		e.preventDefault();
		setLoggingIn(true);
		router3.post("/login", {
			login,
			password,
			remember
		}, {
			onError: () => setLoggingIn(false),
			onFinish: () => setLoggingIn(false)
		});
	};
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "min-h-screen flex items-center justify-center bg-gray-50 px-4",
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Card, {
			className: "w-full max-w-sm shadow-lg",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardHeader, {
				className: "text-center pb-2",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						className: "flex justify-center mb-3",
						children: biz.business_logo ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("img", {
							src: biz.business_logo,
							alt: "",
							className: "h-12 w-auto"
						}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "size-12 rounded-xl bg-primary/10 flex items-center justify-center",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
								className: "text-xl font-bold text-primary",
								children: biz.business_name?.[0] || "I"
							})
						})
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(CardTitle, {
						className: "text-xl",
						children: biz.business_name || "Invenos POS"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-sm text-muted-foreground mt-1",
						children: "Sign in to your account"
					})
				]
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(CardContent, {
				className: "pt-4",
				children: [status && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					className: "mb-4 p-3 rounded-lg bg-emerald-50 text-emerald-700 text-sm border border-emerald-200",
					children: status
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("form", {
					onSubmit: handleSubmit,
					className: "space-y-4",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
								className: "block text-sm font-medium mb-1.5",
								children: "Email or Username"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
								type: "text",
								value: login,
								onChange: (e) => setLogin(e.target.value),
								placeholder: "admin@invenos.com",
								autoFocus: true,
								autoComplete: "username",
								className: cn("w-full h-10 px-3 rounded-lg border bg-background text-sm outline-none transition-colors", "focus:border-ring focus:ring-1 focus:ring-ring/30", errors?.login ? "border-red-400" : "border-input")
							}),
							errors?.login && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-xs text-red-500 mt-1",
								children: errors.login
							})
						] }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [
							/* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
								className: "block text-sm font-medium mb-1.5",
								children: "Password"
							}),
							/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
								className: "relative",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
									type: showPassword ? "text" : "password",
									value: password,
									onChange: (e) => setPassword(e.target.value),
									placeholder: "••••••••",
									autoComplete: "current-password",
									className: cn("w-full h-10 px-3 pr-10 rounded-lg border bg-background text-sm outline-none transition-colors", "focus:border-ring focus:ring-1 focus:ring-ring/30", errors?.password ? "border-red-400" : "border-input")
								}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("button", {
									type: "button",
									onClick: () => setShowPassword(!showPassword),
									className: "absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground",
									children: showPassword ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(EyeOff, { className: "size-4" }) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Eye, { className: "size-4" })
								})]
							}),
							errors?.password && /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
								className: "text-xs text-red-500 mt-1",
								children: errors.password
							})
						] }),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: "flex items-center justify-between",
							children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
								className: "flex items-center gap-2 text-sm cursor-pointer",
								children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
									type: "checkbox",
									checked: remember,
									onChange: (e) => setRemember(e.target.checked),
									className: "rounded border-gray-300"
								}), "Remember me"]
							})
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
							type: "submit",
							className: "w-full h-10 gap-2",
							disabled: loggingIn,
							children: [loggingIn ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(LoaderCircle, { className: "size-4 animate-spin" }) : null, loggingIn ? "Signing in..." : "Sign in"]
						})
					]
				})]
			})]
		})
	});
}
LoginPage.layout = (page) => page;
//#endregion
export { LoginPage as default };
