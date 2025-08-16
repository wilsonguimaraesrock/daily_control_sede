/**
 * VERCEL API ROUTE - Organization Statistics
 * GET /api/stats/organizations - Global statistics for franchise admin
 */

import { PrismaClient } from '@prisma/client';
import { authenticateToken } from '../_middleware.js';

const prisma = new PrismaClient();

export default async function handler(req, res) {
  // Apenas GET permitido
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Authenticate user
  const authResult = authenticateToken(req);
  if (authResult.error) {
    return res.status(authResult.status).json({ error: authResult.error });
  }
  const { user } = authResult;

  // Only super admin and franchise admin can access global stats
  if (user.role !== 'super_admin' && user.role !== 'franchise_admin') {
    return res.status(403).json({ error: 'Insufficient permissions' });
  }

  try {
    console.log('📊 Starting stats query...');

    // Get all organizations
    const organizations = await prisma.organization.findMany({
      include: {
        users: true,
        tasks: true
      }
    });

    // Calculate stats for each organization
    const orgStats = await Promise.all(
      organizations.map(async (org) => {
        const totalTasks = await prisma.task.count({
          where: { organizationId: org.id }
        });

        const activeTasks = await prisma.task.count({
          where: { 
            organizationId: org.id,
            status: { in: ['PENDING', 'IN_PROGRESS'] }
          }
        });

        const completedTasks = await prisma.task.count({
          where: { 
            organizationId: org.id,
            status: 'COMPLETED' 
          }
        });

        const overdueTasks = 0; // Simplified for now

        const completionRate = totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

        return {
          id: org.id,
          name: org.name,
          code: org.code,
          type: org.type,
          userCount: org.users.length,
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
      totalOrganizations: organizations.length,
      totalUsers: orgStats.reduce((sum, org) => sum + org.userCount, 0),
      totalTasks: orgStats.reduce((sum, org) => sum + org.taskStats.total, 0),
      activeTasks: orgStats.reduce((sum, org) => sum + org.taskStats.active, 0),
      completedTasks: orgStats.reduce((sum, org) => sum + org.taskStats.completed, 0),
      overdueTasks: orgStats.reduce((sum, org) => sum + org.taskStats.overdue, 0)
    };

    globalStats.completionRate = globalStats.totalTasks > 0
      ? Math.round((globalStats.completedTasks / globalStats.totalTasks) * 100)
      : 0;

    const response = {
      global: globalStats,
      organizations: orgStats
    };

    console.log(`🌍 Global stats retrieved for ${user.email}`);
    res.status(200).json(response);

  } catch (error) {
    console.error('Get organization stats error:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  } finally {
    await prisma.$disconnect();
  }
}