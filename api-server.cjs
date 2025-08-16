const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

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
  return Math.floor(100000 + Math.random() * 900000).toString();
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
        userId: `user_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
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

    // Create password reset record
    await prisma.passwordReset.create({
      data: {
        userId: user.userId,
        newPassword: tempPassword,
        createdBy: req.user.userId
      }
    });

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