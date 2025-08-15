const { Router } = require('express');
const prisma = require('../lib/prisma');
const { authenticateToken } = require('../middleware/auth');

const router = Router();

// Get all users (admin only)
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { role } = req.user;

    if (role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    const users = await prisma.userProfile.findMany({
      select: {
        id: true,
        userId: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
        lastLogin: true
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json(users);

  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get current user profile
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const { userProfileId } = req.user;

    const user = await prisma.userProfile.findUnique({
      where: { id: userProfileId },
      select: {
        id: true,
        userId: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
        lastLogin: true
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json(user);

  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update user (admin can update any, users can update own profile)
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { role: currentUserRole, userProfileId } = req.user;
    const { name, email, role, isActive } = req.body;

    // Check permissions
    if (currentUserRole !== 'admin' && id !== userProfileId) {
      return res.status(403).json({ error: 'Permission denied' });
    }

    // Non-admins can't change role or isActive
    const updateData: any = { name, email };
    if (currentUserRole === 'admin') {
      if (role) updateData.role = role;
      if (typeof isActive === 'boolean') updateData.isActive = isActive;
    }

    const user = await prisma.userProfile.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        userId: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
        lastLogin: true
      }
    });

    res.json(user);

  } catch (error) {
    console.error('Update user error:', error);
    if (error.code === 'P2002') {
      res.status(400).json({ error: 'Email already exists' });
    } else if (error.code === 'P2025') {
      res.status(404).json({ error: 'User not found' });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
});

// Delete user (admin only)
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.user;

    if (role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }

    await prisma.userProfile.delete({
      where: { id }
    });

    res.json({ message: 'User deleted successfully' });

  } catch (error) {
    console.error('Delete user error:', error);
    if (error.code === 'P2025') {
      res.status(404).json({ error: 'User not found' });
    } else {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
});

module.exports = router;