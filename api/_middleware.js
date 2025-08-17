/**
 * MIDDLEWARE DE AUTENTICAÇÃO PARA VERCEL API ROUTES
 */

import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key';

export function authenticateToken(req) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return { error: 'Access token required', status: 401 };
  }

  try {
    const user = jwt.verify(token, JWT_SECRET);
    return { user };
  } catch (error) {
    return { error: 'Invalid or expired token', status: 403 };
  }
}

export function canAccessOrganization(user, organizationId) {
  // Super admin e franchise admin podem acessar qualquer organização
  if (user.role === 'super_admin' || user.role === 'franchise_admin') {
    return true;
  }
  // Outros usuários só podem acessar sua própria organização
  return user.organization_id === organizationId;
}