// app/api/projects/[projectId]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import Project from '@/models/Project'
import Task from '@/models/Task'

interface Params {
  params: Promise<{ projectId: string }>
}

// GET /api/projects/[projectId] — single project with tasks
export async function GET(_req: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { projectId } = await params
  await connectDB()

  const project = await Project.findById(projectId)
    .populate('members', 'name email')
    .populate('createdBy', 'name')
    .lean()

  if (!project) return NextResponse.json({ error: 'Project not found' }, { status: 404 })

  const tasks = await Task.find({ projectId })
    .populate('assignedTo', 'name email')
    .populate('reviews.reviewedBy', 'name')
    .sort({ order: 1 })
    .lean()

  const serializedTasks = tasks.map((t: any) => ({
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

  const serializedProject = {
    ...(project as any),
    _id: (project as any)._id.toString(),
    createdBy: typeof (project as any).createdBy === 'object'
      ? { _id: (project as any).createdBy._id?.toString(), name: (project as any).createdBy.name }
      : (project as any).createdBy.toString(),
    members: ((project as any).members || []).map((m: any) => ({
      _id: m._id?.toString() ?? m.toString(),
      name: m.name ?? '',
      email: m.email ?? '',
    })),
    tasks: serializedTasks,
    createdAt: (project as any).createdAt?.toISOString?.() ?? '',
    updatedAt: (project as any).updatedAt?.toISOString?.() ?? '',
  }

  return NextResponse.json({ project: serializedProject })
}

// PATCH /api/projects/[projectId] — update description/githubLink (manager only)
export async function PATCH(req: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const user = session.user as { id: string; role: string }
  const { projectId } = await params
  await connectDB()

  const project = await Project.findById(projectId)
  if (!project) return NextResponse.json({ error: 'Project not found' }, { status: 404 })

  if (project.createdBy.toString() !== user.id && user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Only the project creator can edit' }, { status: 403 })
  }

  const body = await req.json()
  const updates: Record<string, any> = {}

  if (body.description !== undefined) updates.description = body.description.trim()
  if (body.githubLink !== undefined) updates.githubLink = body.githubLink.trim()
  if (body.title !== undefined) updates.title = body.title.trim()
  if (body.memberIds !== undefined) {
    updates.members = Array.from(new Set([user.id, ...body.memberIds]))
  }

  const updated = await Project.findByIdAndUpdate(projectId, updates, { new: true })
    .populate('members', 'name email')
    .lean()

  return NextResponse.json({ project: updated })
}

// DELETE /api/projects/[projectId] — delete project and its tasks
export async function DELETE(_req: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const user = session.user as { id: string; role: string }
  const { projectId } = await params
  await connectDB()

  const project = await Project.findById(projectId)
  if (!project) return NextResponse.json({ error: 'Project not found' }, { status: 404 })

  if (project.createdBy.toString() !== user.id && user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Only the project creator can delete' }, { status: 403 })
  }

  await Task.deleteMany({ projectId })
  await Project.findByIdAndDelete(projectId)

  return NextResponse.json({ success: true })
}
