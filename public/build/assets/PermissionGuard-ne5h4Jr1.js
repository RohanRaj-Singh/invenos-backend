import { t as require_jsx_runtime } from "./jsx-runtime-BjJQA5sn.js";
import { t as useAuth } from "./app-DQEL3DJY.js";
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
