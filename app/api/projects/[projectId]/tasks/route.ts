// app/api/projects/[projectId]/tasks/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import Project from '@/models/Project'
import Task from '@/models/Task'

interface Params {
  params: Promise<{ projectId: string }>
}

// GET /api/projects/[projectId]/tasks — list tasks for a project
export async function GET(_req: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { projectId } = await params
  await connectDB()

  const tasks = await Task.find({ projectId })
    .populate('assignedTo', 'name email')
    .populate('reviews.reviewedBy', 'name')
    .sort({ order: 1 })
    .lean()

  const serialized = tasks.map((t: any) => ({
    ...t,
    _id: t._id.toString(),
    projectId: t.projectId.toString(),
    assignedTo: t.assignedTo?._id?.toString() ?? t.assignedTo?.toString(),
    assigneeName: t.assignedTo?.name ?? '',
    reviews: (t.reviews || []).map((r: any) => ({
      ...r,
      reviewedBy: r.reviewedBy?._id?.toString() ?? r.reviewedBy?.toString(),
      reviewerName: r.reviewedBy?.name ?? '',
      reviewedAt: r.reviewedAt?.toISOString?.() ?? r.reviewedAt,
    })),
    completedAt: t.completedAt?.toISOString?.() ?? null,
    createdAt: t.createdAt?.toISOString?.() ?? '',
    updatedAt: t.updatedAt?.toISOString?.() ?? '',
  }))

  return NextResponse.json({ tasks: serialized })
}

// POST /api/projects/[projectId]/tasks — create a task (manager only)
export async function POST(req: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const user = session.user as { id: string; role: string }
  if (user.role !== 'MANAGER' && user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Only managers can create tasks' }, { status: 403 })
  }

  const { projectId } = await params
  const body = await req.json()
  const { title, description, assignedTo, insertAtIndex } = body

  if (!title?.trim()) {
    return NextResponse.json({ error: 'Task title is required' }, { status: 400 })
  }
  if (!assignedTo) {
    return NextResponse.json({ error: 'Task must be assigned to someone' }, { status: 400 })
  }

  await connectDB()

  const project = await Project.findById(projectId)
  if (!project) return NextResponse.json({ error: 'Project not found' }, { status: 404 })

  // Get existing tasks to compute order
  const existingTasks = await Task.find({ projectId }).sort({ order: 1 }).lean()

  let order: number
  if (insertAtIndex !== undefined && insertAtIndex !== null && insertAtIndex >= 0) {
    // Insert at specific position — shift tasks at and after this position
    if (insertAtIndex >= existingTasks.length) {
      // Insert at end
      order = existingTasks.length > 0
        ? (existingTasks[existingTasks.length - 1] as any).order + 1
        : 0
    } else {
      // Insert at position, shift subsequent tasks
      const targetOrder = (existingTasks[insertAtIndex] as any).order
      await Task.updateMany(
        { projectId, order: { $gte: targetOrder } },
        { $inc: { order: 1 } }
      )
      order = targetOrder
    }
  } else {
    // Default: append at end
    order = existingTasks.length > 0
      ? (existingTasks[existingTasks.length - 1] as any).order + 1
      : 0
  }

  // Ensure assignee is a project member
  if (!project.members.map(m => m.toString()).includes(assignedTo)) {
    // Auto-add them as a member
    project.members.push(assignedTo)
    await project.save()
  }

  const task = await Task.create({
    projectId,
    title: title.trim(),
    description: description?.trim() || '',
    assignedTo,
    order,
    status: 'TODO',
  })

  return NextResponse.json({ task }, { status: 201 })
}
