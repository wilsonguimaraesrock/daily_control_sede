import { PrismaClient } from '@prisma/client';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

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
  console.log('🔧 USER PROFILE API - Method:', req.method);

  const authResult = authenticateToken(req);
  if (authResult.error) {
    return res.status(authResult.status).json({ error: authResult.error });
  }

  const { user } = authResult;

  try {
    if (req.method === 'GET') {
      // Get user profile
      const userProfile = await prisma.userProfile.findUnique({
        where: { id: user.id },
        select: {
          id: true,
          userId: true,
          name: true,
          email: true,
          role: true,
          phone: true,
          bio: true,
          avatarUrl: true,
          organizationId: true,
          isActive: true,
          createdAt: true,
          lastLogin: true,
          organization: {
            select: {
              id: true,
              name: true,
              code: true,
              type: true
            }
          }
        }
      });

      if (!userProfile) {
        return res.status(404).json({ error: 'User profile not found' });
      }

      console.log('✅ USER PROFILE Retrieved successfully');
      return res.json(userProfile);

    } else if (req.method === 'PUT') {
      // Update user profile
      const { name, phone, bio, avatarUrl } = req.body;

      console.log('📝 Updating user profile with data:', { name, phone, bio, avatarUrl: !!avatarUrl });

      // Validate input
      if (!name || name.trim().length < 2) {
        return res.status(400).json({ error: 'Nome deve ter pelo menos 2 caracteres' });
      }

      // Validate phone format if provided
      if (phone && !/^[\d\s\(\)\-\+]+$/.test(phone)) {
        return res.status(400).json({ error: 'Formato de telefone inválido' });
      }

      // Update user profile
      const updatedProfile = await prisma.userProfile.update({
        where: { id: user.id },
        data: {
          name: name.trim(),
          phone: phone?.trim() || null,
          bio: bio?.trim() || null,
          avatarUrl: avatarUrl || null,
        },
        select: {
          id: true,
          userId: true,
          name: true,
          email: true,
          role: true,
          phone: true,
          bio: true,
          avatarUrl: true,
          organizationId: true,
          isActive: true,
          createdAt: true,
          lastLogin: true,
          organization: {
            select: {
              id: true,
              name: true,
              code: true,
              type: true
            }
          }
        }
      });

      console.log('✅ USER PROFILE Updated successfully');
      return res.json(updatedProfile);

    } else if (req.method === 'POST' && req.body.action === 'change-password') {
      // Change password
      const { currentPassword, newPassword } = req.body;

      console.log('🔑 USER PROFILE Change password request');

      // Validate input
      if (!currentPassword || !newPassword) {
        return res.status(400).json({ error: 'Senha atual e nova senha são obrigatórias' });
      }

      if (newPassword.length < 6) {
        return res.status(400).json({ error: 'Nova senha deve ter pelo menos 6 caracteres' });
      }

      // Get current user with password hash
      const currentUser = await prisma.userProfile.findUnique({
        where: { id: user.id },
        select: {
          passwordHash: true
        }
      });

      if (!currentUser || !currentUser.passwordHash) {
        return res.status(400).json({ error: 'Usuário não encontrado ou senha não definida' });
      }

      // Verify current password
      const isCurrentPasswordValid = await bcrypt.compare(currentPassword, currentUser.passwordHash);
      if (!isCurrentPasswordValid) {
        return res.status(400).json({ error: 'Senha atual incorreta' });
      }

      // Hash new password
      const newPasswordHash = await bcrypt.hash(newPassword, 10);

      // Update password
      await prisma.userProfile.update({
        where: { id: user.id },
        data: {
          passwordHash: newPasswordHash,
          firstLoginCompleted: true
        }
      });

      console.log('✅ USER PROFILE Password changed successfully');
      return res.json({ message: 'Senha alterada com sucesso' });

    } else {
      return res.status(405).json({ error: 'Method not allowed' });
    }

  } catch (error) {
    console.error('💥 USER PROFILE API error:', error);
    return res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  } finally {
    await prisma.$disconnect();
  }
}