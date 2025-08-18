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
  console.log('🚀 NEW TASKS CREATE API CALLED - Method:', req.method);

  const authResult = authenticateToken(req);
  if (authResult.error) {
    return res.status(authResult.status).json({ error: authResult.error });
  }

  const { user } = authResult;

  try {
    if (req.method === 'POST') {
      // Create task
      const { title, description, priority, dueDate, assignedUserIds, isPrivate } = req.body;

      console.log('📝 NEW Task creation request body:', req.body);
      console.log('👥 NEW Assigned user IDs received:', assignedUserIds);
      console.log('🎯 NEW Priority received:', priority);

      if (!title) {
        return res.status(400).json({ error: 'Title is required' });
      }

      // Map priority to uppercase enum values
      const priorityMap = {
        'baixa': 'BAIXA',
        'media': 'MEDIA', 
        'urgente': 'URGENTE',
        'BAIXA': 'BAIXA',
        'MEDIA': 'MEDIA',
        'URGENTE': 'URGENTE'
      };

      const statusMap = {
        'pendente': 'PENDENTE',
        'em_andamento': 'EM_ANDAMENTO',
        'concluida': 'CONCLUIDA',
        'cancelada': 'CANCELADA'
      };

      const mappedPriority = priorityMap[priority] || 'MEDIA';
      const mappedStatus = statusMap['pendente'] || 'PENDENTE';
      console.log('🔄 NEW Priority mapping:', priority, '->', mappedPriority);
      console.log('🔄 NEW Status mapping: pendente ->', mappedStatus);

      const newTask = await prisma.task.create({
        data: {
          title,
          description: description || '',
          priority: mappedPriority,
          status: mappedStatus,
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

        console.log('✅ NEW Task created with assignments:', taskWithAssignments.title);
        return res.status(201).json(taskWithAssignments);
      }

      console.log('✅ NEW Task created:', newTask.title);
      return res.status(201).json(newTask);

    } else {
      return res.status(405).json({ error: 'Method not allowed' });
    }

  } catch (error) {
    console.error('💥 NEW Tasks CREATE API error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message
    });
  } finally {
    await prisma.$disconnect();
  }
}