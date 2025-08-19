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
  console.log('🔧 TASK [ID] API - Method:', req.method);
  console.log('🔧 TASK [ID] API - Query:', req.query);
  console.log('🔧 TASK [ID] API - Body:', req.body);

  const authResult = authenticateToken(req);
  if (authResult.error) {
    return res.status(authResult.status).json({ error: authResult.error });
  }

  const { user } = authResult;
  const { id: taskId } = req.query;

  if (!taskId) {
    return res.status(400).json({ error: 'Task ID is required' });
  }

  try {
    if (req.method === 'GET') {
      // Get single task
      const task = await prisma.task.findFirst({
        where: {
          id: taskId,
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
        }
      });

      if (!task) {
        return res.status(404).json({ error: 'Task not found' });
      }

      return res.json(task);

    } else if (req.method === 'PUT') {
      // Update task
      console.log('📝 Updating task:', taskId, 'with data:', req.body);

      // First check if task exists and user has permission
      const existingTask = await prisma.task.findFirst({
        where: {
          id: taskId,
          organizationId: user.organization_id
        }
      });

      if (!existingTask) {
        return res.status(404).json({ error: 'Task not found' });
      }

      // Check if user can edit this task
      const canEdit = user.role === 'super_admin' || 
                     user.role === 'admin' || 
                     existingTask.createdBy === user.userId ||
                     existingTask.createdBy === user.user_id;

      if (!canEdit) {
        return res.status(403).json({ error: 'You do not have permission to edit this task' });
      }

      // Prepare update data
      const updateData = {};
      
      if (req.body.title !== undefined) updateData.title = req.body.title;
      if (req.body.description !== undefined) updateData.description = req.body.description;
      if (req.body.priority !== undefined) {
        // Normalize priority to uppercase enum values
        const p = req.body.priority.toString().toUpperCase();
        if (['BAIXA', 'MEDIA', 'URGENTE'].includes(p)) {
          updateData.priority = p;
        }
      }
      if (req.body.status !== undefined) {
        // Normalize status to uppercase enum values  
        const s = req.body.status.toString().toUpperCase();
        if (['PENDENTE', 'EM_ANDAMENTO', 'CONCLUIDA', 'CANCELADA'].includes(s)) {
          updateData.status = s;
          
          // If marking as completed, set completedAt
          if (s === 'CONCLUIDA') {
            updateData.completedAt = new Date();
          } else if (s === 'PENDENTE' || s === 'EM_ANDAMENTO') {
            // If changing back from completed, clear completedAt
            updateData.completedAt = null;
          }
        }
      }
      if (req.body.dueDate !== undefined) {
        if (req.body.dueDate) {
          console.log('🕒 DEBUG UPDATE - Original dueDate:', req.body.dueDate);
          // 🐛 FIX: Timezone issue - preserve local datetime without UTC conversion
          if (typeof req.body.dueDate === 'string' && req.body.dueDate.match(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/)) {
            updateData.dueDate = new Date(req.body.dueDate.replace(' ', 'T'));
            console.log('🕒 DEBUG UPDATE - Processed as local:', updateData.dueDate.toISOString());
          } else {
            updateData.dueDate = new Date(req.body.dueDate);
            console.log('🕒 DEBUG UPDATE - Processed as default:', updateData.dueDate.toISOString());
          }
        } else {
          updateData.dueDate = null;
        }
      }
      if (req.body.isPrivate !== undefined) updateData.isPrivate = req.body.isPrivate;

      console.log('📝 Final update data:', updateData);

      // Update the task
      const updatedTask = await prisma.task.update({
        where: { id: taskId },
        data: updateData,
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

      console.log('✅ Task updated successfully:', updatedTask.id);
      return res.json(updatedTask);

    } else if (req.method === 'DELETE') {
      // Delete task
      const existingTask = await prisma.task.findFirst({
        where: {
          id: taskId,
          organizationId: user.organization_id
        }
      });

      if (!existingTask) {
        return res.status(404).json({ error: 'Task not found' });
      }

      // Check if user can delete this task
      const canDelete = user.role === 'super_admin' || 
                       user.role === 'admin' || 
                       existingTask.createdBy === user.userId ||
                       existingTask.createdBy === user.user_id;

      if (!canDelete) {
        return res.status(403).json({ error: 'You do not have permission to delete this task' });
      }

      // Delete assignments first (foreign key constraint)
      await prisma.taskAssignment.deleteMany({
        where: { taskId: taskId }
      });

      // Delete the task
      await prisma.task.delete({
        where: { id: taskId }
      });

      console.log('🗑️ Task deleted successfully:', taskId);
      return res.json({ message: 'Task deleted successfully' });

    } else {
      return res.status(405).json({ error: 'Method not allowed' });
    }

  } catch (error) {
    console.error('💥 Task [ID] API error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message
    });
  } finally {
    await prisma.$disconnect();
  }
}