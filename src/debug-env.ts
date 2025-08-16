// ===================================================================
// DEBUG - VERIFICAÇÃO DE ENVIRONMENT VARIABLES
// ===================================================================

export const debugEnvironment = () => {
  console.log('🔍 DEBUG ENVIRONMENT VARIABLES:');
  console.log('VITE_API_BASE_URL:', import.meta.env.VITE_API_BASE_URL);
  console.log('NODE_ENV:', import.meta.env.NODE_ENV);
  console.log('MODE:', import.meta.env.MODE);
  console.log('All env vars:', import.meta.env);
  
  // Use same auto-detection logic as useAuth
  const getApiBaseUrl = () => {
    if (import.meta.env.VITE_API_BASE_URL) return import.meta.env.VITE_API_BASE_URL;
    if (typeof window !== 'undefined' && window.location.hostname.includes('vercel.app')) {
      return window.location.origin;
    }
    return 'http://localhost:3001';
  };
  
  const API_BASE_URL = getApiBaseUrl();
  console.log('📡 API_BASE_URL being used (corrected):', API_BASE_URL);
  
  return API_BASE_URL;
};