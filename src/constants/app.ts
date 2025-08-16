// Constantes da aplicação
export const APP_NAME = "Daily Control - PD&I Tech";
export const APP_SHORT_NAME = "Daily Control PD&I Tech";
export const APP_DESCRIPTION = "Sistema de gerenciamento de tarefas - PD&I Tech";

// Informações de email
export const EMAIL_SENDER = "pdi@seudominio.com.br";
export const EMAIL_SENDER_NAME = "Daily Control - PD&I Tech";

// URLs da aplicação
export const APP_URL = window.location.origin;
export const LOGIN_URL = `${APP_URL}/login`;
export const CHANGE_PASSWORD_URL = `${APP_URL}/change-password`;

// Configurações de email
export const EMAIL_TEMPLATES = {
  WELCOME: {
    subject: `Bem-vindo ao ${APP_NAME}`,
    from: `${EMAIL_SENDER_NAME} <${EMAIL_SENDER}>`,
  }
};

// Configurações de senha
export const PASSWORD_CONFIG = {
  MIN_LENGTH: 8,
  REQUIRE_UPPERCASE: true,
  REQUIRE_LOWERCASE: true,
  REQUIRE_NUMBER: true,
  REQUIRE_SPECIAL: true,
  TEMP_PASSWORD_LENGTH: 16,
}; 

// Configurações do EmailJS
export const EMAILJS_CONFIG = {
  SERVICE_ID: 'service_hmmn1zm',
  TEMPLATE_ID: 'template_2qhsrkf',
  PUBLIC_KEY: 'I6gkd8EbGFtQiA1y7'
}; 