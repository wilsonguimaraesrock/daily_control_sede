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

export default async function handler(req, res) {
  console.log('🚀 ORGANIZATION USERS API CALLED - Organization ID:', req.query.id);

  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const authResult = authenticateToken(req);
  if (authResult.error) {
    return res.status(authResult.status).json({ error: authResult.error });
  }

  const user = authResult.user;
  const organizationId = req.query.id;
  const prisma = new PrismaClient();

  try {
    // Check access permissions
    if (user.role !== 'super_admin' && user.role !== 'franchise_admin' && user.organization_id !== organizationId) {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    // Get users for the organization
    const users = await prisma.userProfile.findMany({
      where: { 
        organizationId: organizationId,
        isActive: true
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
        firstLoginCompleted: true
      },
      orderBy: { name: 'asc' }
    });

    console.log(`👥 Retrieved ${users.length} users for organization ${organizationId}`);
    res.status(200).json(users);

  } catch (error) {
    console.error('💥 Organization users API error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message
    });
  } finally {
    await prisma.$disconnect();
  }
}