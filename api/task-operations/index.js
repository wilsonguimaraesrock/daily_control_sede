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
  console.log('🚀 TASK-OPERATIONS API v1.0 - Method:', req.method);
  console.log('🚀 TASK-OPERATIONS API v1.0 - Body:', req.body);

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

      console.log(`📋 TASK-OPERATIONS Retrieved ${tasks.length} tasks for ${user.email}`);
      return res.json(tasks);

    } else if (req.method === 'POST') {
      // Create task
      const { title, description, priority, dueDate, assignedUserIds, isPrivate } = req.body;

      console.log('📝 TASK-OPERATIONS Task creation body:', req.body);
      console.log('👥 TASK-OPERATIONS Assigned user IDs:', assignedUserIds);

      if (!title) {
        return res.status(400).json({ error: 'Title is required' });
      }

      // FINAL PRIORITY MAPPING
      let finalPriority = 'MEDIA';
      if (priority) {
        const p = priority.toString().toLowerCase();
        if (p === 'baixa') finalPriority = 'BAIXA';
        else if (p === 'media') finalPriority = 'MEDIA';
        else if (p === 'urgente') finalPriority = 'URGENTE';
        else if (p === 'alta') finalPriority = 'URGENTE'; // Map 'alta' to 'URGENTE'
      }

      console.log('🔄 TASK-OPERATIONS Priority mapping:', priority, '->', finalPriority);

      // 🔧 FIX: Use user.userId instead of user.id for createdBy field
      // This field must reference the userId field in UserProfile table
      const createdByUserId = user.userId || user.user_id;
      console.log('👤 TASK-OPERATIONS Creator mapping:', {
        userId: user.userId,
        user_id: user.user_id,
        id: user.id,
        using: createdByUserId
      });

      // 🐛 FIX: Timezone issue - preserve local datetime without UTC conversion
      let processedDueDate = null;
      if (dueDate) {
        console.log('🕒 DEBUG - Original dueDate:', dueDate);
        // If dueDate comes as "YYYY-MM-DD HH:MM:SS", treat as local time
        if (typeof dueDate === 'string' && dueDate.match(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/)) {
          processedDueDate = new Date(dueDate.replace(' ', 'T'));
          console.log('🕒 DEBUG - Processed as local:', processedDueDate.toISOString());
        } else {
          processedDueDate = new Date(dueDate);
          console.log('🕒 DEBUG - Processed as default:', processedDueDate.toISOString());
        }
      }

      const newTask = await prisma.task.create({
        data: {
          title,
          description: description || '',
          priority: finalPriority,
          status: 'PENDENTE',
          dueDate: processedDueDate,
          createdBy: createdByUserId, // 🔧 FIX: Use userId instead of id
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

      console.log('✅ TASK-OPERATIONS Task created successfully:', newTask.id);

      // Create assignments if provided
      if (assignedUserIds && assignedUserIds.length > 0) {
        console.log('💼 TASK-OPERATIONS Creating assignments for users:', assignedUserIds);
        console.log('💼 TASK-OPERATIONS Assignment count:', assignedUserIds.length);
        
        const assignmentData = assignedUserIds.map(userId => ({
          taskId: newTask.id,
          userId: userId
        }));
        
        console.log('💼 TASK-OPERATIONS Assignment data:', assignmentData);
        
        await prisma.taskAssignment.createMany({
          data: assignmentData
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

        console.log('✅ TASK-OPERATIONS Task created with assignments');
        console.log('👥 TASK-OPERATIONS Final assignments count:', taskWithAssignments.assignments.length);
        console.log('👥 TASK-OPERATIONS Assignment details:', taskWithAssignments.assignments.map(a => ({ userId: a.userId, userName: a.user.name })));
        return res.status(201).json(taskWithAssignments);
      }

      console.log('✅ TASK-OPERATIONS Task created without assignments');
      return res.status(201).json(newTask);

    } else {
      return res.status(405).json({ error: 'Method not allowed' });
    }

  } catch (error) {
    console.error('💥 TASK-OPERATIONS API error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message,
      details: error.toString()
    });
  } finally {
    await prisma.$disconnect();
  }
}