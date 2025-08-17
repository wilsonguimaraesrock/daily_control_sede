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
  console.log('🚀 ORGANIZATION DELETE API CALLED - ID:', req.query.id);

  const authResult = authenticateToken(req);
  if (authResult.error) {
    return res.status(authResult.status).json({ error: authResult.error });
  }

  const user = authResult.user;
  const organizationId = req.query.id;
  const prisma = new PrismaClient();

  try {
    if (req.method === 'PATCH') {
      // Only super admin can deactivate organizations
      if (user.role !== 'super_admin') {
        return res.status(403).json({ error: 'Insufficient permissions' });
      }

      // Deactivate organization
      await prisma.organization.update({
        where: { id: organizationId },
        data: { isActive: false }
      });

      console.log(`📴 Organization deactivated: ${organizationId}`);
      return res.status(200).json({ message: 'Organization deactivated successfully' });

    } else {
      return res.status(405).json({ error: 'Method not allowed' });
    }

  } catch (error) {
    console.error('💥 Organization delete API error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message
    });
  } finally {
    await prisma.$disconnect();
  }
}