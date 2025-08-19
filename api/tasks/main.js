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
  console.log('🚀 NEW MAIN TASKS API - Method:', req.method);
  console.log('🚀 NEW MAIN TASKS API - Body:', req.body);

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

      console.log(`📋 NEW Retrieved ${tasks.length} tasks for ${user.email}`);
      return res.json(tasks);

    } else if (req.method === 'POST') {
      // Create task
      const { title, description, priority, dueDate, assignedUserIds, isPrivate } = req.body;

      console.log('📝 NEW Task creation body:', req.body);
      console.log('👥 NEW Assigned user IDs:', assignedUserIds);

      if (!title) {
        return res.status(400).json({ error: 'Title is required' });
      }

      // DIRECT ENUM MAPPING - NO CACHE ISSUES
      let finalPriority = 'MEDIA';
      if (priority) {
        if (priority.toLowerCase() === 'baixa' || priority === 'BAIXA') finalPriority = 'BAIXA';
        if (priority.toLowerCase() === 'media' || priority === 'MEDIA') finalPriority = 'MEDIA';
        if (priority.toLowerCase() === 'urgente' || priority === 'URGENTE') finalPriority = 'URGENTE';
      }

      console.log('🔄 NEW Priority mapping:', priority, '->', finalPriority);

      const newTask = await prisma.task.create({
        data: {
          title,
          description: description || '',
          priority: finalPriority,
          status: 'PENDENTE',
          dueDate: dueDate ? (() => {
            console.log('🕒 DEBUG TASKS/MAIN - Original dueDate:', dueDate);
            // 🐛 FIX: Timezone issue - preserve local datetime without UTC conversion
            if (typeof dueDate === 'string' && dueDate.match(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/)) {
              const processedDate = new Date(dueDate.replace(' ', 'T'));
              console.log('🕒 DEBUG TASKS/MAIN - Processed as local:', processedDate.toISOString());
              return processedDate;
            } else {
              const processedDate = new Date(dueDate);
              console.log('🕒 DEBUG TASKS/MAIN - Processed as default:', processedDate.toISOString());
              return processedDate;
            }
          })() : null,
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
        console.log('💼 NEW Creating assignments for users:', assignedUserIds);
        
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

        console.log('✅ NEW Task created with assignments');
        console.log('👥 NEW Final assignments count:', taskWithAssignments.assignments.length);
        return res.status(201).json(taskWithAssignments);
      }

      console.log('✅ NEW Task created without assignments');
      return res.status(201).json(newTask);

    } else {
      return res.status(405).json({ error: 'Method not allowed' });
    }

  } catch (error) {
    console.error('💥 NEW MAIN Tasks API error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message
    });
  } finally {
    await prisma.$disconnect();
  }
}