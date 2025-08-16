const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

const app = express();
const prisma = new PrismaClient();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key';

// ================================
// MIDDLEWARE
// ================================

app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:4173', 'http://localhost:3000', 'http://localhost:8081', 'http://localhost:8080'],
  credentials: true
}));
app.use(express.json());

// Auth middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) {
      return res.status(403).json({ error: 'Invalid or expired token' });
    }
    req.user = user;
    next();
  });
};

// Organization context middleware
const addOrganizationContext = async (req, res, next) => {
  if (req.user && req.user.organization_id) {
    try {
      const organization = await prisma.organization.findUnique({
        where: { id: req.user.organization_id }
      });
      req.organization = organization;
    } catch (error) {
      console.error('Error loading organization context:', error);
    }
  }
  next();
};

// ================================
// UTILITY FUNCTIONS
// ================================

// Generate random 6-digit password
function generateRandomPassword() {
  // Generate secure 6-digit password using crypto
  const min = 100000;
  const max = 999999;
  const randomArray = new Uint32Array(1);
  crypto.getRandomValues(randomArray);
  return (min + (randomArray[0] % (max - min + 1))).toString();
}

// Check if user can access organization
function canAccessOrganization(user, organizationId) {
  // Super admin and franchise admin can access any organization
  if (user.role === 'super_admin' || user.role === 'franchise_admin') {
    return true;
  }
  // Other users can only access their own organization
  return user.organization_id === organizationId;
}

// ================================
// HEALTH CHECK
// ================================

app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    database: 'connected',
    timestamp: new Date().toISOString(),
    multiTenant: true
  });
});

// ================================
// AUTHENTICATION ROUTES
// ================================

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // Find user with organization
    const user = await prisma.userProfile.findUnique({
      where: { email },
      include: {
        organization: true
      }
    });

    if (!user || !user.isActive) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.passwordHash || '');
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    // Update last login
    await prisma.userProfile.update({
      where: { id: user.id },
      data: { lastLogin: new Date() }
    });

    // Generate JWT token
    const token = jwt.sign({
      id: user.id,
      userId: user.userId,
      email: user.email,
      role: user.role,
      organization_id: user.organizationId
    }, JWT_SECRET, { expiresIn: '24h' });

    console.log(`✅ Login successful: ${email} (${user.role})`);
    
    res.json({
      user: {
        id: user.id,
        user_id: user.userId,
        organization_id: user.organizationId,
        name: user.name,
        email: user.email,
        role: user.role,
        is_active: user.isActive,
        created_at: user.createdAt,
        last_login: user.lastLogin,
        first_login_completed: user.firstLoginCompleted
      },
      organization: user.organization,
      token
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/auth/change-password', authenticateToken, async (req, res) => {
  try {
    const { newPassword } = req.body;
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.userProfile.update({
      where: { userId: req.user.userId },
      data: { 
        passwordHash: hashedPassword,
        firstLoginCompleted: true
      }
    });

    res.json({ message: 'Password changed successfully' });
  } catch (error) {
    console.error('Password change error:', error);
    res.status(500).json({ error: 'Failed to change password' });
  }
});

// ================================
// USER ROUTES
// ================================

app.get('/api/users/me', authenticateToken, async (req, res) => {
  try {
    const user = await prisma.userProfile.findUnique({
      where: { userId: req.user.userId },
      include: {
        organization: true
      }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      id: user.id,
      user_id: user.userId,
      organization_id: user.organizationId,
      name: user.name,
      email: user.email,
      role: user.role,
      is_active: user.isActive,
      created_at: user.createdAt,
      last_login: user.lastLogin,
      first_login_completed: user.firstLoginCompleted,
      organization: user.organization
    });
  } catch (error) {
    console.error('Get current user error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/users', authenticateToken, async (req, res) => {
  try {
    let whereClause = {};

    // Super admin can see all users, others only from their organization
    if (req.user.role !== 'super_admin' && req.user.role !== 'franchise_admin') {
      whereClause.organizationId = req.user.organization_id;
    }

    const users = await prisma.userProfile.findMany({
      where: whereClause,
      include: {
        organization: true
      },
      orderBy: { name: 'asc' }
    });

    const formattedUsers = users.map(user => ({
      id: user.id,
      userId: user.userId,
      organizationId: user.organizationId,
      name: user.name,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
      createdAt: user.createdAt,
      lastLogin: user.lastLogin,
      firstLoginCompleted: user.firstLoginCompleted,
      organization: user.organization
    }));

    res.json(formattedUsers);
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/users', authenticateToken, async (req, res) => {
  try {
    const { name, email, role, organization_id } = req.body;

    // Validate organization access
    const targetOrgId = organization_id || req.user.organization_id;
    if (!canAccessOrganization(req.user, targetOrgId)) {
      return res.status(403).json({ error: 'Access denied to organization' });
    }

    // Generate temporary password
    const tempPassword = generateRandomPassword();
    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    const user = await prisma.userProfile.create({
      data: {
        userId: `user_${Date.now()}_${crypto.randomUUID().substring(0, 8)}`,
        organizationId: targetOrgId,
        name,
        email,
        role,
        passwordHash: hashedPassword,
        firstLoginCompleted: false
      },
      include: {
        organization: true
      }
    });

    // Create password reset record (simplified)
    try {
      await prisma.$executeRaw`
        INSERT INTO password_resets (id, user_id, new_password, created_by, created_at, is_used)
        VALUES (${crypto.randomUUID()}, ${user.userId}, ${tempPassword}, ${req.user.userId}, NOW(), false)
      `;
    } catch (resetError) {
      console.log('Warning: Could not create password reset record:', resetError.message);
      // Continue anyway, user creation is more important
    }

    console.log(`👤 User created: ${email} - Temp password: ${tempPassword}`);

    res.json({
      user: {
        id: user.id,
        userId: user.userId,
        organizationId: user.organizationId,
        name: user.name,
        email: user.email,
        role: user.role,
        isActive: user.isActive,
        createdAt: user.createdAt,
        organization: user.organization
      },
      temporaryPassword: tempPassword
    });
  } catch (error) {
    console.error('Create user error:', error);
    res.status(500).json({ error: 'Failed to create user' });
  }
});

app.post('/api/users/:userId/reset-password', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;
    const { temporaryPassword } = req.body;

    // Find the user
    const user = await prisma.userProfile.findUnique({
      where: { userId }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check organization access
    if (!canAccessOrganization(req.user, user.organizationId)) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Generate password if not provided
    const newPassword = temporaryPassword || generateRandomPassword();
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update user password
    await prisma.userProfile.update({
      where: { userId },
      data: { 
        passwordHash: hashedPassword,
        firstLoginCompleted: false
      }
    });

    // Create password reset record
    const passwordReset = await prisma.passwordReset.create({
      data: {
        userId,
        newPassword,
        createdBy: req.user.userId
      }
    });

    console.log(`🔑 Password reset for ${user.email}: ${newPassword}`);

    res.json({
      id: passwordReset.id,
      userId: passwordReset.userId,
      newPassword: passwordReset.newPassword,
      createdBy: passwordReset.createdBy,
      createdAt: passwordReset.createdAt,
      isUsed: passwordReset.isUsed
    });
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({ error: 'Failed to reset password' });
  }
});

// Delete user
app.delete('/api/users/:userId', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.params;

    // Find user first to check organization access and get info
    const existingUser = await prisma.userProfile.findUnique({
      where: { id: userId },
      include: { organization: true }
    });

    if (!existingUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Check permissions
    if (!canAccessOrganization(req.user, existingUser.organizationId)) {
      return res.status(403).json({ error: 'Access denied to user organization' });
    }

    // Prevent deleting yourself
    if (existingUser.id === req.user.id) {
      return res.status(400).json({ error: 'Cannot delete your own account' });
    }

    // Prevent deleting super admin (safety check)
    if (existingUser.role === 'super_admin') {
      return res.status(400).json({ error: 'Cannot delete super admin account' });
    }

    // Delete related password resets first
    try {
      await prisma.$executeRaw`
        DELETE FROM password_resets WHERE user_id = ${existingUser.userId}
      `;
    } catch (resetError) {
      console.log('Warning: Could not delete password resets:', resetError.message);
    }

    // Delete the user
    await prisma.userProfile.delete({
      where: { id: userId }
    });

    console.log(`🗑️ User deleted: ${existingUser.name} (${existingUser.email}) by ${req.user.email}`);

    res.json({ 
      message: 'User deleted successfully',
      deletedUser: {
        id: existingUser.id,
        name: existingUser.name,
        email: existingUser.email,
        organization: existingUser.organization?.name
      }
    });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

// ================================
// ORGANIZATION ROUTES
// ================================

app.get('/api/organizations', authenticateToken, async (req, res) => {
  try {
    let whereClause = {};

    // Non-super-admin users only see their organization
    if (req.user.role !== 'super_admin' && req.user.role !== 'franchise_admin') {
      whereClause.id = req.user.organization_id;
    }

    const organizations = await prisma.organization.findMany({
      where: whereClause,
      orderBy: { name: 'asc' }
    });

    res.json(organizations);
  } catch (error) {
    console.error('Get organizations error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/organizations/:orgId', authenticateToken, async (req, res) => {
  try {
    const { orgId } = req.params;

    if (!canAccessOrganization(req.user, orgId)) {
      return res.status(403).json({ error: 'Access denied to organization' });
    }

    const organization = await prisma.organization.findUnique({
      where: { id: orgId }
    });

    if (!organization) {
      return res.status(404).json({ error: 'Organization not found' });
    }

    res.json(organization);
  } catch (error) {
    console.error('Get organization error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.post('/api/organizations', authenticateToken, async (req, res) => {
  try {
    // Only super admin and franchise admin can create organizations
    if (req.user.role !== 'super_admin' && req.user.role !== 'franchise_admin') {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    const { name, code, type, settings } = req.body;

    const organization = await prisma.organization.create({
      data: {
        name,
        code: code || name.toUpperCase().replace(/\s+/g, ''),
        type: type || 'SCHOOL',
        settings: settings || {}
      }
    });

    console.log(`🏢 Organization created: ${name} (${organization.code})`);

    res.json(organization);
  } catch (error) {
    console.error('Create organization error:', error);
    res.status(500).json({ error: 'Failed to create organization' });
  }
});

app.get('/api/organizations/:orgId/users', authenticateToken, async (req, res) => {
  try {
    const { orgId } = req.params;

    if (!canAccessOrganization(req.user, orgId)) {
      return res.status(403).json({ error: 'Access denied to organization' });
    }

    const users = await prisma.userProfile.findMany({
      where: { organizationId: orgId },
      include: {
        organization: true
      },
      orderBy: { name: 'asc' }
    });

    res.json(users);
  } catch (error) {
    console.error('Get organization users error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get admin password for school (super admin only)
app.get('/api/organizations/:orgId/admin-password', authenticateToken, async (req, res) => {
  try {
    const { orgId } = req.params;

    // Only super admin and franchise admin can access passwords
    if (req.user.role !== 'super_admin' && req.user.role !== 'franchise_admin') {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    // Find admin user for this organization
    const admin = await prisma.userProfile.findFirst({
      where: { 
        organizationId: orgId,
        role: 'admin'
      }
    });

    if (!admin) {
      return res.status(404).json({ error: 'Admin not found for this organization' });
    }

    // Get latest password reset for this admin
    const passwordReset = await prisma.$queryRaw`
      SELECT new_password, created_at, is_used
      FROM password_resets
      WHERE user_id = ${admin.userId}
      ORDER BY created_at DESC
      LIMIT 1
    `;

    if (passwordReset.length > 0) {
      res.json({
        adminEmail: admin.email,
        adminName: admin.name,
        temporaryPassword: passwordReset[0].new_password,
        passwordCreated: passwordReset[0].created_at,
        isUsed: passwordReset[0].is_used
      });
    } else {
      res.status(404).json({ error: 'No password found for admin' });
    }

  } catch (error) {
    console.error('Get admin password error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// DELETE Organization
app.delete('/api/organizations/:orgId', authenticateToken, async (req, res) => {
  try {
    const { orgId } = req.params;

    // Only super admin and franchise admin can delete organizations
    if (req.user.role !== 'super_admin' && req.user.role !== 'franchise_admin') {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    // Check if organization exists
    const organization = await prisma.organization.findUnique({
      where: { id: orgId },
      include: {
        users: true,
        tasks: true
      }
    });

    if (!organization) {
      return res.status(404).json({ error: 'Organization not found' });
    }

    // Prevent deletion of PD&I Tech (main organization)
    if (organization.code === 'PDI001' || organization.id === 'pdi-tech-001') {
      return res.status(400).json({ error: 'Cannot delete main organization' });
    }

    // Delete all related data in transaction
    await prisma.$transaction(async (tx) => {
      // Delete user profiles (this will cascade to password resets if FK is set)
      await tx.userProfile.deleteMany({
        where: { organizationId: orgId }
      });

      // Delete tasks
      await tx.task.deleteMany({
        where: { organizationId: orgId }
      });

      // Delete organization
      await tx.organization.delete({
        where: { id: orgId }
      });
    });

    console.log(`🗑️ Organization deleted: ${organization.name} (${organization.code}) by ${req.user.email}`);

    res.json({ 
      message: 'Organization deleted successfully', 
      deletedOrganization: {
        id: organization.id,
        name: organization.name,
        code: organization.code,
        usersDeleted: organization.users.length,
        tasksDeleted: organization.tasks.length
      }
    });

  } catch (error) {
    console.error('Delete organization error:', error);
    console.error('Error details:', error.message, error.code);
    res.status(500).json({ 
      error: 'Failed to delete organization',
      details: error.message 
    });
  }
});

// ================================
// TASK ROUTES (Multi-tenant)
// ================================

app.get('/api/tasks', authenticateToken, async (req, res) => {
  try {
    let whereClause = {};

    // Super admin can filter by organization, others only see their org
    if (req.user.role === 'super_admin' || req.user.role === 'franchise_admin') {
      const { organization_id } = req.query;
      if (organization_id && organization_id !== 'all') {
        whereClause.organizationId = organization_id;
      }
    } else {
      whereClause.organizationId = req.user.organization_id;
    }

    const tasks = await prisma.task.findMany({
      where: whereClause,
      include: {
        organization: true,
        creator: true,
        assignments: {
          include: {
            user: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    console.log(`📋 Retrieved ${tasks.length} tasks for ${req.user.email}`);

    res.json(tasks);
  } catch (error) {
    console.error('Get tasks error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ================================
// TASK STATISTICS (Multi-tenant)
// ================================

app.get('/api/stats/tasks', authenticateToken, async (req, res) => {
  try {
    let whereClause = {};

    // Super admin can filter by organization, others only see their org
    if (req.user.role === 'super_admin' || req.user.role === 'franchise_admin') {
      const { organization_id } = req.query;
      if (organization_id && organization_id !== 'all') {
        whereClause.organizationId = organization_id;
      }
    } else {
      whereClause.organizationId = req.user.organization_id;
    }

    // Get task statistics
    const [
      totalTasks,
      activeTasks,
      completedTasks,
      overdueTasks
    ] = await Promise.all([
      prisma.task.count({ where: whereClause }),
      prisma.task.count({ 
        where: { 
          ...whereClause, 
          status: { in: ['pendente', 'em_andamento'] } 
        } 
      }),
      prisma.task.count({ 
        where: { 
          ...whereClause, 
          status: 'concluida' 
        } 
      }),
      prisma.task.count({ 
        where: { 
          ...whereClause, 
          dueDate: { lt: new Date() },
          status: { not: 'concluida' }
        } 
      })
    ]);

    const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

    const stats = {
      totalTasks,
      activeTasks,
      completedTasks,
      overdueTasks,
      completionRate
    };

    console.log(`📊 Task stats retrieved for ${req.user.email}: ${JSON.stringify(stats)}`);

    res.json(stats);
  } catch (error) {
    console.error('Get task stats error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

app.get('/api/stats/organizations', authenticateToken, async (req, res) => {
  try {
    // Only super admin and franchise admin can access global stats
    if (req.user.role !== 'super_admin' && req.user.role !== 'franchise_admin') {
      return res.status(403).json({ error: 'Insufficient permissions' });
    }

    console.log('📊 Starting stats query...');

    // Get basic organizations
    const organizations = await prisma.organization.findMany({
      where: { isActive: true }
    });

    console.log(`📊 Found ${organizations.length} organizations`);

    // Get user counts for each org
    const orgStats = await Promise.all(
      organizations.map(async (org) => {
        const userCount = await prisma.userProfile.count({
          where: { 
            organizationId: org.id,
            isActive: true
          }
        });

        const totalTasks = await prisma.task.count({
          where: { organizationId: org.id }
        });

        const activeTasks = await prisma.task.count({
          where: { 
            organizationId: org.id,
            status: { in: ['PENDENTE', 'EM_ANDAMENTO'] } 
          }
        });

        const completedTasks = await prisma.task.count({
          where: { 
            organizationId: org.id,
            status: 'CONCLUIDA' 
          }
        });

        const overdueTasks = 0; // Simplified for now

        const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

        return {
          organization: {
            id: org.id,
            name: org.name,
            code: org.code,
            type: org.type
          },
          userCount,
          taskStats: {
            total: totalTasks,
            active: activeTasks,
            completed: completedTasks,
            overdue: overdueTasks,
            completionRate
          }
        };
      })
    );

    // Calculate global statistics
    const globalStats = {
      totalSchools: organizations.filter(org => org.type === 'SCHOOL').length,
      totalDepartments: organizations.filter(org => org.type === 'DEPARTMENT').length,
      totalUsers: orgStats.reduce((sum, org) => sum + org.userCount, 0),
      totalTasks: orgStats.reduce((sum, org) => sum + org.taskStats.total, 0),
      activeTasks: orgStats.reduce((sum, org) => sum + org.taskStats.active, 0),
      completedTasks: orgStats.reduce((sum, org) => sum + org.taskStats.completed, 0),
      overdueTasks: orgStats.reduce((sum, org) => sum + org.taskStats.overdue, 0),
      schoolsWithIssues: 0 // Simplified for now
    };

    globalStats.completionRate = globalStats.totalTasks > 0 
      ? Math.round((globalStats.completedTasks / globalStats.totalTasks) * 100) 
      : 0;

    const response = {
      global: globalStats,
      organizations: orgStats
    };

    console.log(`🌍 Global stats retrieved for ${req.user.email}`);

    res.json(response);
  } catch (error) {
    console.error('Get organization stats error:', error);
    console.error('Stack trace:', error.stack);
    res.status(500).json({ error: 'Internal server error', details: error.message });
  }
});

// ================================
// SERVER STARTUP
// ================================

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('🛑 Shutting down gracefully...');
  await prisma.$disconnect();
    console.log('✅ Server closed');
    process.exit(0);
  });

app.listen(PORT, () => {
  console.log(`🚀 Daily Control Multi-Tenant API Server running on port ${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
  console.log(`💾 Database: Connected to PostgreSQL`);
  console.log(`🔐 JWT Secret: Configured`);
  console.log(`🏢 Multi-Tenant: Enabled`);
  console.log(`🔑 Password Management: Active`);
});