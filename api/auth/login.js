/**
 * VERCEL API ROUTE - Login
 * POST /api/auth/login
 */

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const prisma = new PrismaClient();
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key';

export default async function handler(req, res) {
  // Apenas POST permitido
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    // Find user with organization
    const user = await prisma.userProfile.findUnique({
      where: { email },
      include: {
        organization: true
      }
    });

    if (!user || !user.isActive) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.passwordHash || '');
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Update last login
    await prisma.userProfile.update({
      where: { id: user.id },
      data: { updatedAt: new Date() }
    });

    // Generate JWT token
    const token = jwt.sign(
      {
        id: user.id,
        userId: user.id,
        email: user.email,
        role: user.role,
        organization_id: user.organizationId
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Prepare user response
    const userResponse = {
      id: user.id,
      user_id: user.id,
      organization_id: user.organizationId,
      name: user.name,
      email: user.email,
      role: user.role,
      is_active: user.isActive,
      created_at: user.createdAt,
      last_login: new Date(),
      first_login_completed: user.firstLoginCompleted
    };

    // Prepare organization response
    const organizationResponse = {
      id: user.organization.id,
      name: user.organization.name,
      code: user.organization.code,
      type: user.organization.type,
      settings: user.organization.settings || {
        branding: {
          logo: '/assets/rockfeller-logo.png',
          title: `Daily Control - ${user.organization.name}`
        },
        canEditDueDates: true,
        allowPrivateTasks: true
      },
      isActive: user.organization.isActive,
      createdAt: user.organization.createdAt,
      updatedAt: user.organization.updatedAt
    };

    console.log(`✅ Login successful: ${email} (${user.role})`);

    res.status(200).json({
      user: userResponse,
      organization: organizationResponse,
      token
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    await prisma.$disconnect();
  }
}