/**
 * VERCEL API ROUTE - Organizations
 * GET /api/organizations - List organizations
 * POST /api/organizations - Create organization
 */

import { PrismaClient } from '@prisma/client';
import { authenticateToken } from '../_middleware.js';

const prisma = new PrismaClient();

export default async function handler(req, res) {
  // Authenticate user
  const authResult = authenticateToken(req);
  if (authResult.error) {
    return res.status(authResult.status).json({ error: authResult.error });
  }
  const { user } = authResult;

  if (req.method === 'GET') {
    return handleGet(req, res, user);
  } else if (req.method === 'POST') {
    return handlePost(req, res, user);
  } else {
    return res.status(405).json({ error: 'Method not allowed' });
  }
}

async function handleGet(req, res, user) {
  try {
    let whereClause = {};

    // Non-super-admin users only see their organization
    if (user.role !== 'super_admin' && user.role !== 'franchise_admin') {
      whereClause.id = user.organization_id;
    }

    const organizations = await prisma.organization.findMany({
      where: whereClause,
      orderBy: { name: 'asc' }
    });

    console.log(`📋 Retrieved ${organizations.length} organizations for ${user.email}`);
    res.status(200).json(organizations);

  } catch (error) {
    console.error('Get organizations error:', error);
    res.status(500).json({ error: 'Internal server error' });
  } finally {
    await prisma.$disconnect();
  }
}

async function handlePost(req, res, user) {
  try {
    // Only super admin and franchise admin can create organizations
    if (user.role !== 'super_admin' && user.role !== 'franchise_admin') {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    const { name, code, adminName, adminEmail } = req.body;

    if (!name || !code || !adminName || !adminEmail) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    // Check if organization code or admin email already exists
    const existingOrg = await prisma.organization.findUnique({
      where: { code }
    });

    const existingUser = await prisma.userProfile.findUnique({
      where: { email: adminEmail }
    });

    if (existingOrg) {
      return res.status(400).json({ error: 'Organization code already exists' });
    }

    if (existingUser) {
      return res.status(400).json({ error: 'Admin email already exists' });
    }

    // Create organization and admin user in transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create organization
      const organization = await tx.organization.create({
        data: {
          id: `${code.toLowerCase()}-${Date.now()}`,
          name,
          code,
          type: 'SCHOOL',
          settings: {
            branding: {
              logo: '/assets/rockfeller-logo.png',
              title: `Daily Control - ${name}`
            },
            canEditDueDates: true,
            allowPrivateTasks: true
          }
        }
      });

      // Generate temporary password
      const crypto = await import('crypto');
      const temporaryPassword = crypto.randomInt(100000, 999999).toString();
      const bcrypt = await import('bcryptjs');
      const hashedPassword = await bcrypt.hash(temporaryPassword, 10);

      // Create admin user
      const admin = await tx.userProfile.create({
        data: {
          id: crypto.randomUUID(),
          email: adminEmail,
          name: adminName,
          role: 'franqueado',
          organizationId: organization.id,
          passwordHash: hashedPassword,
          firstLoginCompleted: false
        }
      });

      // Create password reset record
      await tx.passwordReset.create({
        data: {
          id: crypto.randomUUID(),
          organizationId: organization.id,
          userId: admin.id,
          temporaryPassword: hashedPassword,
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
        }
      });

      return { organization, admin, temporaryPassword };
    });

    console.log(`🏫 School created: ${name} (${code}) with admin ${adminEmail}`);

    res.status(201).json({
      organization: result.organization,
      admin: {
        ...result.admin,
        temporaryPassword: result.temporaryPassword
      }
    });

  } catch (error) {
    console.error('Create organization error:', error);
    res.status(500).json({ error: 'Failed to create organization' });
  } finally {
    await prisma.$disconnect();
  }
}