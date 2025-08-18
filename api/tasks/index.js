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
  // CACHE BUSTER - v2024.01.29.003 - FIXED VERSION
  console.log('🚀 FIXED TASKS API - Method:', req.method);
  console.log('🚀 FIXED TASKS API - Body:', req.body);

  const authResult = authenticateToken(req);
  if (authResult.error) {
    return res.status(authResult.status).json({ error: authResult.error });
  }

  const { user } = authResult;

  try {
    if (req.method === 'GET') {
      // Get tasks
      const tasks = await prisma.task.findMany({
        where: {
          organizationId: user.organization_id
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
        },
        orderBy: { createdAt: 'desc' }
      });

      console.log(`📋 FIXED Retrieved ${tasks.length} tasks for ${user.email}`);
      return res.json(tasks);

    } else if (req.method === 'POST') {
      // Create task
      const { title, description, priority, dueDate, assignedUserIds, isPrivate } = req.body;

      console.log('📝 FIXED Task creation body:', req.body);
      console.log('👥 FIXED Assigned user IDs:', assignedUserIds);

      if (!title) {
        return res.status(400).json({ error: 'Title is required' });
      }

      // DIRECT ENUM MAPPING - NO CACHE ISSUES
      let finalPriority = 'MEDIA';
      if (priority) {
        const p = priority.toString().toLowerCase();
        if (p === 'baixa') finalPriority = 'BAIXA';
        if (p === 'media') finalPriority = 'MEDIA';
        if (p === 'urgente') finalPriority = 'URGENTE';
      }

      console.log('🔄 FIXED Priority mapping:', priority, '->', finalPriority);

      const newTask = await prisma.task.create({
        data: {
          title,
          description: description || '',
          priority: finalPriority,
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
        console.log('💼 FIXED Creating assignments for users:', assignedUserIds);
        console.log('💼 FIXED Assignment count:', assignedUserIds.length);
        
        await prisma.taskAssignment.createMany({
          data: assignedUserIds.map(userId => ({
            taskId: newTask.id,
            userId: userId
          }))
        });

        // Refetch task with assignments
        const taskWithAssignments = await prisma.task.findUnique({
          where: { id: newTask.id },
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

        console.log('✅ FIXED Task created with assignments');
        console.log('👥 FIXED Final assignments count:', taskWithAssignments.assignments.length);
        console.log('👥 FIXED Assignment details:', taskWithAssignments.assignments);
        return res.status(201).json(taskWithAssignments);
      }

      console.log('✅ FIXED Task created without assignments');
      return res.status(201).json(newTask);

    } else {
      return res.status(405).json({ error: 'Method not allowed' });
    }

  } catch (error) {
    console.error('💥 FIXED Tasks API error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message
    });
  } finally {
    await prisma.$disconnect();
  }
}