import { t as require_jsx_runtime } from "./jsx-runtime-Do9val7F.js";
import { n as useAuth } from "./app-DtyXTQGb.js";
require_jsx_runtime();
//#endregion
//#region resources/js/features/auth/PermissionGuard.tsx
/** Hook version — returns true/false without rendering */
function usePermission(module, action) {
	const auth = useAuth();
	if (action) return auth.can(module, action);
	return auth.canModule(module);
}
//#endregion
export { usePermission as t };
