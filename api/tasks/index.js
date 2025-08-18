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
  console.log('🚀 TASKS API CALLED - Method:', req.method);

  const authResult = authenticateToken(req);
  if (authResult.error) {
    return res.status(authResult.status).json({ error: authResult.error });
  }

  const user = authResult.user;
  const prisma = new PrismaClient();

  try {
    if (req.method === 'GET') {
      // Get tasks
      let whereClause = {};

      // Multi-tenant: filter by organization
      if (user.role === 'super_admin' || user.role === 'franchise_admin') {
        const { organization_id } = req.query;
        if (organization_id && organization_id !== 'all') {
          whereClause.organizationId = organization_id;
        }
      } else {
        whereClause.organizationId = user.organization_id;
      }

      const tasks = await prisma.task.findMany({
        where: whereClause,
        include: {
          organization: true,
          creator: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true
            }
          },
          assignments: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  role: true
                }
              }
            }
          }
        },
        orderBy: { createdAt: 'desc' }
      });

      console.log(`📋 Retrieved ${tasks.length} tasks for ${user.email}`);
      return res.json(tasks);

    } else if (req.method === 'POST') {
      // Create task
      const { title, description, priority, dueDate, assignedUserIds, isPrivate } = req.body;

      console.log('📝 Task creation request body:', req.body);
      console.log('👥 Assigned user IDs received:', assignedUserIds);

      if (!title) {
        return res.status(400).json({ error: 'Title is required' });
      }

      // Map priority to uppercase enum values
      const priorityMap = {
        'baixa': 'BAIXA',
        'media': 'MEDIA', 
        'urgente': 'URGENTE'
      };

      const newTask = await prisma.task.create({
        data: {
          title,
          description: description || '',
          priority: priorityMap[priority] || 'MEDIA',
          status: 'PENDENTE',
          dueDate: dueDate ? new Date(dueDate) : null,
          createdBy: user.id,
          organizationId: user.organization_id,
          isPrivate: isPrivate || false
        },
        include: {
          organization: true,
          creator: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true
            }
          },
          assignments: {
            include: {
              user: {
                select: {
                  id: true,
                  name: true,
                  email: true,
                  role: true
                }
              }
            }
          }
        }
      });

      // Create assignments if provided
      if (assignedUserIds && assignedUserIds.length > 0) {
        await prisma.taskAssignment.createMany({
          data: assignedUserIds.map(userId => ({
            taskId: newTask.id,
            userId: userId
          }))
        });
      }

      console.log('✅ Task created:', newTask.title);
      return res.status(201).json(newTask);

    } else {
      return res.status(405).json({ error: 'Method not allowed' });
    }

  } catch (error) {
    console.error('💥 Tasks API error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message
    });
  } finally {
    await prisma.$disconnect();
  }
}