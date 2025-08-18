/**
 * VERCEL API ROUTE - Organizations
 * GET /api/organizations - List organizations
 * POST /api/organizations - Create organization
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
    // Exception: admins in PD&I Tech organization can see all organizations
    if (user.role !== 'super_admin' && 
        user.role !== 'franchise_admin' && 
        !(user.role === 'admin' && user.organization_id === 'pdi-tech-001')) {
      whereClause.id = user.organization_id;
    }

    const organizations = await prisma.organization.findMany({
      where: {
        ...whereClause,
        isActive: true // Only show active organizations
      },
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
    console.log('🏫 Attempting to create organization:', { name, code, adminName, adminEmail });

    if (!name || !code || !adminName || !adminEmail) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    // Support both SCHOOL and DEPARTMENT types
    const { type = 'SCHOOL' } = req.body; // Default to SCHOOL if not specified
    
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
      const orgId = `${code.toLowerCase()}-${Date.now()}`;
      console.log('🔧 Creating organization with ID:', orgId, 'Type:', type);
      
      // Create organization
      const organization = await tx.organization.create({
        data: {
          id: orgId,
          name,
          code,
          type,
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
      const temporaryPassword = Math.floor(Math.random() * 900000 + 100000).toString();
      const bcrypt = await import('bcryptjs');
      const hashedPassword = await bcrypt.default.hash(temporaryPassword, 10);

      // Create admin user - role based on organization type
      const adminRole = type === 'DEPARTMENT' ? 'franqueado' : 'admin';
      
      const userId = `user-${Date.now()}-${Math.random().toString(36).substring(2)}`;
      
      const admin = await tx.userProfile.create({
        data: {
          id: userId,
          userId: userId, // Add this required field
          email: adminEmail,
          name: adminName,
          role: adminRole,
          organizationId: organization.id,
          passwordHash: hashedPassword,
          firstLoginCompleted: false
        }
      });

      // Skip password reset for now - focus on department creation
      console.log(`🔑 Admin password for ${adminEmail}: ${temporaryPassword}`);

      return { organization, admin, temporaryPassword };
    });

    console.log(`✅ ${type} created: ${name} (${code}) with admin ${adminEmail}`);

    res.status(201).json({
      organization: result.organization,
      admin: {
        id: result.admin.id,
        name: result.admin.name,
        email: result.admin.email,
        role: result.admin.role,
        temporaryPassword: result.temporaryPassword
      },
      message: `${type === 'DEPARTMENT' ? 'Departamento' : 'Escola'} criado com sucesso!`
    });

  } catch (error) {
    console.error('💥 Create organization error:', error);
    res.status(500).json({ 
      error: 'Failed to create organization',
      message: error.message,
      details: error.toString()
    });
  } finally {
    await prisma.$disconnect();
  }
}