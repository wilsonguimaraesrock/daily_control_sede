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
  console.log('🧹 CLEANUP ORGANIZATIONS API CALLED');

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const authResult = authenticateToken(req);
  if (authResult.error) {
    return res.status(authResult.status).json({ error: authResult.error });
  }

  const user = authResult.user;
  const prisma = new PrismaClient();

  try {
    // Only super admin can cleanup organizations
    if (user.role !== 'super_admin') {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    // IDs of duplicate organizations to deactivate (older ones)
    const duplicateIds = [
      'com001-1755440318113', // Older Comercial
      'mkt001-1755440320988', // Older Marketing  
      'ped001-1755440315124'  // Older PED
    ];

    // Deactivate duplicates
    await prisma.organization.updateMany({
      where: {
        id: { in: duplicateIds }
      },
      data: {
        isActive: false
      }
    });

    console.log(`🧹 Deactivated ${duplicateIds.length} duplicate organizations`);
    
    return res.status(200).json({ 
      message: 'Duplicate organizations cleaned up successfully',
      deactivated: duplicateIds.length 
    });

  } catch (error) {
    console.error('💥 Cleanup organizations API error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message
    });
  } finally {
    await prisma.$disconnect();
  }
}