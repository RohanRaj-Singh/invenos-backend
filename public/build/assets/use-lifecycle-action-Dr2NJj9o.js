import { a as __toESM, n as require_react } from "./jsx-runtime-Do9val7F.js";
import { Et as toast, Ot as router3 } from "./app-D-B5Ydis.js";
//#region resources/js/features/shared/use-lifecycle-action.ts
var import_react = /* @__PURE__ */ __toESM(require_react(), 1);
/**
* Shared runner for lifecycle actions (delete / archive / restore).
*
* Deliberately raises no success toast. The server flash owns the outcome, and
* `useFlashToasts` is the only thing that turns it into a toast. A local success
* toast here would fire even when the server refused the action, because Inertia
* runs `onSuccess` for the redirect a refusal is returned as.
*
* Only real validation errors (a 422 with `props.errors`) are surfaced here.
*/
function useLifecycleAction() {
	const [processing, setProcessing] = (0, import_react.useState)(false);
	const run = ({ url, method, data, onDone }) => {
		setProcessing(true);
		const payload = data ?? {};
		const callbacks = {
			onError: (errors) => {
				const first = Object.values(errors)[0];
				if (first) toast.error(String(first));
			},
			onSuccess: () => onDone?.(),
			onFinish: () => setProcessing(false)
		};
		if (method === "delete") router3.delete(url, {
			data: payload,
			...callbacks
		});
		else if (method === "post") router3.post(url, payload, callbacks);
		else if (method === "put") router3.put(url, payload, callbacks);
		else router3.patch(url, payload, callbacks);
	};
	return {
		run,
		processing
	};
}
//#endregion
export { useLifecycleAction as t };
