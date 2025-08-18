import { PrismaClient } from '@prisma/client';
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

export default async function handler(req, res) {
  console.log('🔧 USER [ID] API - Method:', req.method);
  console.log('🔧 USER [ID] API - Query:', req.query);
  console.log('🔧 USER [ID] API - Body:', req.body);

  const authResult = authenticateToken(req);
  if (authResult.error) {
    return res.status(authResult.status).json({ error: authResult.error });
  }

  const { user } = authResult;
  const { id: userId } = req.query;

  if (!userId) {
    return res.status(400).json({ error: 'User ID is required' });
  }

  try {
    if (req.method === 'GET') {
      // Get single user
      let whereClause = { id: userId };

      // Non-super-admin users can only see users from their organization
      if (user.role !== 'super_admin') {
        whereClause.organizationId = user.organization_id;
      }

      const targetUser = await prisma.userProfile.findFirst({
        where: whereClause,
        include: {
          organization: true
        }
      });

      if (!targetUser) {
        return res.status(404).json({ error: 'User not found' });
      }

      return res.json(targetUser);

    } else if (req.method === 'PUT') {
      // Update user
      console.log('📝 Updating user:', userId, 'with data:', req.body);

      // First check if user exists and current user has permission
      let whereClause = { id: userId };

      if (user.role !== 'super_admin') {
        whereClause.organizationId = user.organization_id;
      }

      const existingUser = await prisma.userProfile.findFirst({
        where: whereClause
      });

      if (!existingUser) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Prevent users from editing their own role (except super admin)
      if (existingUser.id === user.id && user.role !== 'super_admin' && req.body.role) {
        return res.status(403).json({ error: 'You cannot change your own role' });
      }

      // Prepare update data
      const updateData = {};
      
      if (req.body.name !== undefined) updateData.name = req.body.name;
      if (req.body.email !== undefined) updateData.email = req.body.email;
      if (req.body.role !== undefined) updateData.role = req.body.role;
      if (req.body.isActive !== undefined) updateData.isActive = req.body.isActive;

      // Check if email is being changed and if it already exists
      if (req.body.email && req.body.email !== existingUser.email) {
        const emailExists = await prisma.userProfile.findUnique({
          where: { email: req.body.email }
        });

        if (emailExists) {
          return res.status(400).json({ error: 'Email already exists' });
        }
      }

      console.log('📝 Final update data:', updateData);

      // Update the user
      const updatedUser = await prisma.userProfile.update({
        where: { id: userId },
        data: updateData,
        include: {
          organization: true
        }
      });

      console.log('✅ User updated successfully:', updatedUser.id);
      return res.json(updatedUser);

    } else if (req.method === 'DELETE') {
      // Delete user
      console.log('🗑️ Attempting to delete user:', userId);

      // First check if user exists and current user has permission
      let whereClause = { id: userId };

      if (user.role !== 'super_admin') {
        whereClause.organizationId = user.organization_id;
      }

      const targetUser = await prisma.userProfile.findFirst({
        where: whereClause
      });

      if (!targetUser) {
        return res.status(404).json({ error: 'User not found' });
      }

      // Prevent users from deleting themselves
      if (targetUser.id === user.id) {
        return res.status(403).json({ error: 'You cannot delete your own account' });
      }

      // Special protection: Prevent deletion of super admins by non-super admins
      if (targetUser.role === 'super_admin' && user.role !== 'super_admin') {
        return res.status(403).json({ error: 'Only super admins can delete other super admins' });
      }

      // Check if this is the last super admin in the system
      if (targetUser.role === 'super_admin') {
        const superAdminCount = await prisma.userProfile.count({
          where: { role: 'super_admin', isActive: true }
        });

        if (superAdminCount <= 1) {
          return res.status(400).json({ 
            error: 'Cannot delete the last super admin in the system' 
          });
        }
      }

      console.log('🔍 User validation passed, proceeding with deletion...');

      // Delete related data first (foreign key constraints)
      const deletePromises = [
        // Delete password resets
        prisma.passwordReset.deleteMany({
          where: { userId: targetUser.id }
        }),
        // Delete task assignments  
        prisma.taskAssignment.deleteMany({
          where: { userId: targetUser.id }
        })
        // Note: Tasks created by this user will remain but with createdBy pointing to deleted user
        // This is intentional to preserve task history
      ];

      await Promise.all(deletePromises);

      // Delete the user
      await prisma.userProfile.delete({
        where: { id: userId }
      });

      console.log('🗑️ User deleted successfully:', userId);
      return res.json({ 
        message: 'User deleted successfully',
        deletedUser: {
          id: targetUser.id,
          name: targetUser.name,
          email: targetUser.email
        }
      });

    } else {
      return res.status(405).json({ error: 'Method not allowed' });
    }

  } catch (error) {
    console.error('💥 User [ID] API error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message
    });
  } finally {
    await prisma.$disconnect();
  }
}