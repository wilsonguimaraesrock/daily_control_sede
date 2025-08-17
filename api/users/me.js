/**
 * VERCEL API ROUTE - Current User
 * GET /api/users/me - Get current user info
 */

import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';

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

const prisma = new PrismaClient();

export default async function handler(req, res) {
  // Apenas GET permitido
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Authenticate user
  const authResult = authenticateToken(req);
  if (authResult.error) {
    return res.status(authResult.status).json({ error: authResult.error });
  }
  const { user } = authResult;

  try {
    // Get current user with organization
    const currentUser = await prisma.userProfile.findUnique({
      where: { id: user.id },
      include: {
        organization: true
      }
    });

    if (!currentUser || !currentUser.isActive) {
      return res.status(404).json({ error: 'User not found or inactive' });
    }

    // Prepare response
    const userResponse = {
      id: currentUser.id,
      user_id: currentUser.id,
      organization_id: currentUser.organizationId,
      name: currentUser.name,
      email: currentUser.email,
      role: currentUser.role,
      is_active: currentUser.isActive,
      created_at: currentUser.createdAt,
      updated_at: currentUser.updatedAt,
      first_login_completed: currentUser.firstLoginCompleted
    };

    const organizationResponse = {
      id: currentUser.organization.id,
      name: currentUser.organization.name,
      code: currentUser.organization.code,
      type: currentUser.organization.type,
      settings: currentUser.organization.settings || {
        branding: {
          logo: '/assets/rockfeller-logo.png',
          title: `Daily Control - ${currentUser.organization.name}`
        },
        canEditDueDates: true,
        allowPrivateTasks: true
      },
      isActive: currentUser.organization.isActive,
      createdAt: currentUser.organization.createdAt,
      updatedAt: currentUser.organization.updatedAt
    };

    res.status(200).json({
      user: userResponse,
      organization: organizationResponse
    });

  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    await prisma.$disconnect();
  }
}