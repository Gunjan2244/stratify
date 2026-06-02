// app/api/projects/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import Project from '@/models/Project'
import Task from '@/models/Task'

// GET /api/projects — list projects for the logged-in user
export async function GET() {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const user = session.user as { id: string; role: string }
  await connectDB()

  let projects
  if (user.role === 'MANAGER' || user.role === 'ADMIN') {
    // Manager sees projects they created
    projects = await Project.find({ createdBy: user.id })
      .populate('members', 'name email')
      .sort({ updatedAt: -1 })
      .lean()
  } else {
    // Employee sees projects they are a member of
    projects = await Project.find({ members: user.id })
      .populate('members', 'name email')
      .populate('createdBy', 'name')
      .sort({ updatedAt: -1 })
      .lean()
  }

  // Attach task stats for each project
  const projectIds = projects.map((p: any) => p._id)
  const tasks = await Task.find({ projectId: { $in: projectIds } }).lean()

  const projectsWithStats = projects.map((p: any) => {
    const projectTasks = tasks.filter((t: any) => t.projectId.toString() === p._id.toString())
    return {
      ...p,
      _id: p._id.toString(),
      createdBy: typeof p.createdBy === 'object' && p.createdBy?.name
        ? { _id: p.createdBy._id?.toString(), name: p.createdBy.name }
        : p.createdBy.toString(),
      members: (p.members || []).map((m: any) => ({
        _id: m._id?.toString() ?? m.toString(),
        name: m.name ?? '',
        email: m.email ?? '',
      })),
      taskStats: {
        total: projectTasks.length,
        completed: projectTasks.filter((t: any) => t.status === 'ACCEPTED').length,
        inProgress: projectTasks.filter((t: any) => ['IN_PROGRESS', 'REOPENED'].includes(t.status)).length,
        pendingReview: projectTasks.filter((t: any) => t.status === 'DONE').length,
      },
    }
  })

  return NextResponse.json({ projects: projectsWithStats })
}

// POST /api/projects — create a new project (manager/admin only)
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const user = session.user as { id: string; role: string }
  if (user.role !== 'MANAGER' && user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Only managers can create projects' }, { status: 403 })
  }

  const body = await req.json()
  const { title, description, githubLink, memberIds } = body

  if (!title?.trim() || !description?.trim() || !githubLink?.trim()) {
    return NextResponse.json(
      { error: 'Title, description, and GitHub link are required' },
      { status: 400 }
    )
  }

  await connectDB()

  // Always include the creator as a member
  const members = Array.from(new Set([user.id, ...(memberIds || [])]))

  const project = await Project.create({
    title: title.trim(),
    description: description.trim(),
    githubLink: githubLink.trim(),
    createdBy: user.id,
    members,
  })

  return NextResponse.json({ project }, { status: 201 })
}
