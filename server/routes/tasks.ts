const { Router } = require('express');
const prisma = require('../lib/prisma');
const { authenticateToken } = require('../middleware/auth');

const router = Router();

// Get all tasks with filters
router.get('/', authenticateToken, async (req, res) => {
  try {
    const { role, userId } = req.user;
    const { status, priority, assignedTo, createdBy, page = 1, limit = 50 } = req.query;

    const where: any = {};

    // Role-based filtering
    if (role !== 'admin') {
      where.OR = [
        { createdBy: userId },
        { assignments: { some: { userId } } }
      ];
    }

    // Status filter
    if (status && status !== 'all') {
      where.status = status;
    }

    // Priority filter
    if (priority && priority !== 'all') {
      where.priority = priority;
    }

    // Assigned to filter
    if (assignedTo) {
      where.assignments = { some: { userId: assignedTo } };
    }

    // Created by filter
    if (createdBy) {
      where.createdBy = createdBy;
    }

    const skip = (Number(page) - 1) * Number(limit);

    const [tasks, total] = await Promise.all([
      prisma.task.findMany({
        where,
        include: {
          creator: {
            select: { id: true, name: true, email: true, role: true }
          },
          assignments: {
            include: {
              user: {
                select: { id: true, userId: true, name: true, email: true, role: true }
              }
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: Number(limit)
      }),
      prisma.task.count({ where })
    ]);

    res.json({
      tasks,
      pagination: {
        total,
        page: Number(page),
        limit: Number(limit),
        totalPages: Math.ceil(total / Number(limit))
      }
    });

  } catch (error) {
    console.error('Get tasks error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get single task
router.get('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { role, userId } = req.user;

    const task = await prisma.task.findUnique({
      where: { id },
      include: {
        creator: {
          select: { id: true, name: true, email: true, role: true }
        },
        assignments: {
          include: {
            user: {
              select: { id: true, userId: true, name: true, email: true, role: true }
            }
          }
        },
        editHistory: {
          orderBy: { editedAt: 'desc' },
          take: 10
        }
      }
    });

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    // Check permissions
    const isCreator = task.createdBy === userId;
    const isAssigned = task.assignments.some(a => a.userId === userId);
    
    if (role !== 'admin' && !isCreator && !isAssigned) {
      return res.status(403).json({ error: 'Permission denied' });
    }

    res.json(task);

  } catch (error) {
    console.error('Get task error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create task
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { userId } = req.user;
    const { title, description, priority, dueDate, assignedUsers, isPrivate } = req.body;

    if (!title) {
      return res.status(400).json({ error: 'Title is required' });
    }

    const task = await prisma.task.create({
      data: {
        title,
        description,
        priority: priority || 'MEDIA',
        dueDate: dueDate ? new Date(dueDate) : undefined,
        createdBy: userId,
        isPrivate: isPrivate || false,
        assignments: assignedUsers?.length ? {
          create: assignedUsers.map((userIdToAssign: string) => ({
            userId: userIdToAssign
          }))
        } : undefined
      },
      include: {
        creator: {
          select: { id: true, name: true, email: true, role: true }
        },
        assignments: {
          include: {
            user: {
              select: { id: true, userId: true, name: true, email: true, role: true }
            }
          }
        }
      }
    });

    res.status(201).json(task);

  } catch (error) {
    console.error('Create task error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update task
router.put('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { role, userId } = req.user;
    const { title, description, status, priority, dueDate, assignedUsers, isPrivate } = req.body;

    // Get current task
    const currentTask = await prisma.task.findUnique({
      where: { id },
      include: { assignments: true }
    });

    if (!currentTask) {
      return res.status(404).json({ error: 'Task not found' });
    }

    // Check permissions
    const isCreator = currentTask.createdBy === userId;
    const isAssigned = currentTask.assignments.some(a => a.userId === userId);
    
    if (role !== 'admin' && !isCreator && !isAssigned) {
      return res.status(403).json({ error: 'Permission denied' });
    }

    // Prepare update data
    const updateData: any = {};
    if (title !== undefined) updateData.title = title;
    if (description !== undefined) updateData.description = description;
    if (status !== undefined) updateData.status = status;
    if (priority !== undefined) updateData.priority = priority;
    if (dueDate !== undefined) updateData.dueDate = dueDate ? new Date(dueDate) : null;
    if (isPrivate !== undefined) updateData.isPrivate = isPrivate;

    // Handle completed status
    if (status === 'CONCLUIDA' && currentTask.status !== 'CONCLUIDA') {
      updateData.completedAt = new Date();
    } else if (status !== 'CONCLUIDA') {
      updateData.completedAt = null;
    }

    // Update task
    const task = await prisma.task.update({
      where: { id },
      data: updateData,
      include: {
        creator: {
          select: { id: true, name: true, email: true, role: true }
        },
        assignments: {
          include: {
            user: {
              select: { id: true, userId: true, name: true, email: true, role: true }
            }
          }
        }
      }
    });

    // Update assignments if provided
    if (assignedUsers !== undefined) {
      // Delete old assignments
      await prisma.taskAssignment.deleteMany({
        where: { taskId: id }
      });

      // Create new assignments
      if (assignedUsers.length > 0) {
        await prisma.taskAssignment.createMany({
          data: assignedUsers.map((userIdToAssign: string) => ({
            taskId: id,
            userId: userIdToAssign
          }))
        });
      }
    }

    // Log edit history
    await prisma.taskEditHistory.create({
      data: {
        taskId: id,
        editedBy: userId,
        changes: {
          before: currentTask,
          after: updateData,
          assignedUsers
        }
      }
    });

    res.json(task);

  } catch (error) {
    console.error('Update task error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete task
router.delete('/:id', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const { role, userId } = req.user;

    const task = await prisma.task.findUnique({
      where: { id }
    });

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    // Only creator or admin can delete
    if (role !== 'admin' && task.createdBy !== userId) {
      return res.status(403).json({ error: 'Permission denied' });
    }

    await prisma.task.delete({
      where: { id }
    });

    res.json({ message: 'Task deleted successfully' });

  } catch (error) {
    console.error('Delete task error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;