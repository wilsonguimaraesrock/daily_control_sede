/**
 * VERCEL API ROUTE - Reset User Password
 * POST /api/users/[id]/reset-password
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key';

function authenticateToken(req) {
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

function generateRandomPassword() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function canAccessOrganization(user, targetOrgId) {
  // Super admin pode acessar qualquer organização
  if (user.role === 'super_admin') return true;
  
  // Outros usuários só podem acessar sua própria organização
  return user.organization_id === targetOrgId;
}

export default async function handler(req, res) {
  // Apenas POST permitido
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  console.log('🔑 RESET PASSWORD API - User ID:', req.query.id);
  console.log('🔑 RESET PASSWORD API - Body:', req.body);

  const authResult = authenticateToken(req);
  if (authResult.error) {
    return res.status(authResult.status).json({ error: authResult.error });
  }

  const { user } = authResult;
  const { id: userId } = req.query;
  const { temporaryPassword } = req.body;

  if (!userId) {
    return res.status(400).json({ error: 'User ID is required' });
  }

  try {
    // Find the target user
    const targetUser = await prisma.userProfile.findUnique({
      where: { id: userId },
      include: {
        organization: true
      }
    });

    if (!targetUser) {
      console.log(`❌ User not found: ${userId}`);
      return res.status(404).json({ error: 'User not found' });
    }

    // Check organization access
    if (!canAccessOrganization(user, targetUser.organizationId)) {
      console.log(`❌ Access denied to organization: ${targetUser.organizationId}`);
      return res.status(403).json({ error: 'Access denied' });
    }

    // Generate password if not provided
    const newPassword = temporaryPassword || generateRandomPassword();
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    console.log(`🔑 Generating password for user: ${targetUser.email}`);

    // Update user password
    await prisma.userProfile.update({
      where: { id: userId },
      data: { 
        passwordHash: hashedPassword,
        firstLoginCompleted: false
      }
    });

    // Create password reset record
    const passwordReset = await prisma.passwordReset.create({
      data: {
        userId: targetUser.userId, // Use userId field, not id
        newPassword: newPassword, // Store the plain text password for reference
        createdBy: user.userId || user.id, // Use userId for consistency
        organizationId: targetUser.organizationId
      }
    });

    console.log(`✅ Password reset successful for ${targetUser.email}: ${newPassword}`);

    res.json({
      id: passwordReset.id,
      userId: passwordReset.userId,
      newPassword: passwordReset.newPassword,
      createdBy: passwordReset.createdBy,
      createdAt: passwordReset.createdAt,
      isUsed: passwordReset.isUsed || false
    });

  } catch (error) {
    console.error('💥 Reset password error:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      meta: error.meta
    });
    
    res.status(500).json({ 
      error: 'Failed to reset password',
      message: error.message,
      details: error.code ? `Database error: ${error.code}` : 'Unknown error'
    });
  } finally {
    await prisma.$disconnect();
  }
}