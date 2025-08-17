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
    console.log('🏫 Attempting to create organization:', { name, code, adminName, adminEmail });

    if (!name || !code || !adminName || !adminEmail) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    // Support both SCHOOL and DEPARTMENT types
    const { type = 'SCHOOL' } = req.body; // Default to SCHOOL if not specified
    const orgId = `${code.toLowerCase()}-${Date.now()}`;
    console.log('🔧 Creating organization with ID:', orgId, 'Type:', type);
    
    const organization = await prisma.organization.create({
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
    
    console.log('✅ Organization created:', organization);

    console.log(`✅ Organization created successfully: ${name}`);

    res.status(201).json({
      organization,
      message: 'Organization created successfully - admin user creation skipped for testing'
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