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
      // 🔄 EXTRACT QUERY FILTERS
      const { status, priority, assignedTo, accessLevel } = req.query;
      console.log('🔍 TASK-OPERATIONS Filters:', { status, priority, assignedTo, accessLevel });
      
      // 🔧 BUILD WHERE CLAUSE WITH FILTERS
      const whereClause = {
        organizationId: user.organization_id
      };
      
      // 🎯 STATUS FILTER - Include 'em_andamento' when filtering by 'pendente'
      if (status && status !== 'all') {
        if (status === 'pendente') {
          // When filtering by 'pendente', include both 'pendente' and 'em_andamento'
          whereClause.status = { in: ['PENDENTE', 'EM_ANDAMENTO'] };
          console.log('📋 TASK-OPERATIONS Including em_andamento in pendente filter');
        } else {
          // For other statuses, filter exactly
          const statusMap = {
            'em_andamento': 'EM_ANDAMENTO',
            'concluida': 'CONCLUIDA',
            'cancelada': 'CANCELADA'
          };
          whereClause.status = statusMap[status] || status.toUpperCase();
        }
      }
      
      // 🎯 PRIORITY FILTER
      if (priority && priority !== 'all') {
        const priorityMap = {
          'baixa': 'BAIXA',
          'media': 'MEDIA', 
          'urgente': 'URGENTE',
          'alta': 'URGENTE'
        };
        whereClause.priority = priorityMap[priority] || priority.toUpperCase();
      }
      
      // 🔧 ADDITIONAL FILTERS WILL BE APPLIED AFTER INITIAL QUERY DUE TO COMPLEX RELATIONSHIPS
      let additionalFilters = {};
      if (assignedTo && assignedTo !== 'all') {
        additionalFilters.assignedTo = assignedTo;
      }
      if (accessLevel && accessLevel !== 'all') {
        additionalFilters.accessLevel = accessLevel;
      }
      
      console.log('🔍 TASK-OPERATIONS Final where clause:', whereClause);
      console.log('🔍 TASK-OPERATIONS Additional filters:', additionalFilters);
      
      // Get tasks
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

      // 🔧 APPLY ADDITIONAL FILTERS ON RETRIEVED TASKS
      let filteredTasks = tasks;
      
      // Filter by assigned user
      if (additionalFilters.assignedTo) {
        filteredTasks = filteredTasks.filter(task => 
          task.assignments?.some(assignment => 
            assignment.user?.id === additionalFilters.assignedTo
          )
        );
        console.log(`🎯 TASK-OPERATIONS Filtered by assignedTo: ${filteredTasks.length} tasks`);
      }
      
      // Filter by access level (role)
      if (additionalFilters.accessLevel) {
        filteredTasks = filteredTasks.filter(task => {
          // Check if creator has the access level
          const creatorMatch = task.creator?.role === additionalFilters.accessLevel;
          
          // Check if any assigned user has the access level
          const assignedMatch = task.assignments?.some(assignment => 
            assignment.user?.role === additionalFilters.accessLevel
          );
          
          return creatorMatch || assignedMatch;
        });
        console.log(`🎯 TASK-OPERATIONS Filtered by accessLevel: ${filteredTasks.length} tasks`);
      }

      console.log(`📋 TASK-OPERATIONS Retrieved ${filteredTasks.length} tasks for ${user.email}`);
      return res.json(filteredTasks);

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
        console.log('🕒 DEBUG - dueDate type:', typeof dueDate);
        console.log('🕒 DEBUG - dueDate length:', dueDate.length);
        console.log('🕒 DEBUG - dueDate includes ":":', dueDate.includes(':'));
        console.log('🕒 DEBUG - dueDate regex match:', dueDate.match(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/));
        
        // If dueDate comes as "YYYY-MM-DD HH:MM:SS", treat as local time
        if (typeof dueDate === 'string' && dueDate.match(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/)) {
          processedDueDate = new Date(dueDate.replace(' ', 'T'));
          console.log('🕒 DEBUG - Processed as local:', processedDueDate.toISOString());
          console.log('🕒 DEBUG - Local hours/minutes:', processedDueDate.getUTCHours(), processedDueDate.getUTCMinutes());
        } else {
          processedDueDate = new Date(dueDate);
          console.log('🕒 DEBUG - Processed as default:', processedDueDate.toISOString());
          console.log('🕒 DEBUG - Default hours/minutes:', processedDueDate.getUTCHours(), processedDueDate.getUTCMinutes());
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