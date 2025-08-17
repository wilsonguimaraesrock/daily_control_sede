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
  console.log('🚀 USERS API CALLED - Method:', req.method);

  const authResult = authenticateToken(req);
  if (authResult.error) {
    return res.status(authResult.status).json({ error: authResult.error });
  }

  const user = authResult.user;
  const prisma = new PrismaClient();

  try {
    if (req.method === 'GET') {
      // Get users - filtered by organization for non-super-admin
      let whereClause = {};

      if (user.role !== 'super_admin') {
        whereClause.organizationId = user.organization_id;
      }

      const users = await prisma.userProfile.findMany({
        where: whereClause,
        include: {
          organization: true
        },
        orderBy: { name: 'asc' }
      });

      console.log(`👥 Retrieved ${users.length} users for ${user.email}`);
      return res.json(users);

    } else if (req.method === 'POST') {
      // Create user
      const { name, email, role, organizationId } = req.body;

      if (!name || !email || !role) {
        return res.status(400).json({ error: 'Name, email and role are required' });
      }

      // If not super admin, can only create users in their own organization
      const targetOrgId = user.role === 'super_admin' ? (organizationId || user.organization_id) : user.organization_id;

      // Check if email already exists
      const existingUser = await prisma.userProfile.findUnique({
        where: { email }
      });

      if (existingUser) {
        return res.status(400).json({ error: 'Email already exists' });
      }

      // Generate temporary password
      const temporaryPassword = Math.floor(Math.random() * 900000 + 100000).toString();
      const bcrypt = await import('bcryptjs');
      const hashedPassword = await bcrypt.default.hash(temporaryPassword, 10);

      const newUser = await prisma.userProfile.create({
        data: {
          id: `user-${Date.now()}-${Math.random().toString(36).substring(2)}`,
          email,
          name,
          role,
          organizationId: targetOrgId,
          passwordHash: hashedPassword,
          firstLoginCompleted: false
        },
        include: {
          organization: true
        }
      });

      // Create password reset record
      await prisma.passwordReset.create({
        data: {
          id: `reset-${Date.now()}-${Math.random().toString(36).substring(2)}`,
          organizationId: targetOrgId,
          userId: newUser.id,
          temporaryPassword: hashedPassword,
          expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days
        }
      });

      console.log('✅ User created:', newUser.name, 'in org:', targetOrgId);
      
      return res.status(201).json({
        user: newUser,
        temporaryPassword,
        message: 'User created successfully'
      });

    } else {
      return res.status(405).json({ error: 'Method not allowed' });
    }

  } catch (error) {
    console.error('💥 Users API error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message
    });
  } finally {
    await prisma.$disconnect();
  }
}