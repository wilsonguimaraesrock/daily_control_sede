// ===================================================================
// DEBUG - VERIFICAÇÃO DE ENVIRONMENT VARIABLES
// ===================================================================

export const debugEnvironment = () => {
  console.log('🔍 DEBUG ENVIRONMENT VARIABLES:');
  console.log('VITE_API_BASE_URL:', import.meta.env.VITE_API_BASE_URL);
  console.log('NODE_ENV:', import.meta.env.NODE_ENV);
  console.log('MODE:', import.meta.env.MODE);
  console.log('All env vars:', import.meta.env);
  
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001';
  console.log('📡 API_BASE_URL being used:', API_BASE_URL);
  
  return API_BASE_URL;
};