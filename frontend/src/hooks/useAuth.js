export const useAuth = () => {
  // We already exported it from context, but keeping this file per spec
  // re-exporting to be consistent with the requested structure
  const { useAuth: useAuthHook } = require('../context/AuthContext');
  return useAuthHook();
}
