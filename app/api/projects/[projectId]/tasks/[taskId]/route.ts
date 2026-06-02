// app/api/projects/[projectId]/tasks/[taskId]/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import Task from '@/models/Task'

interface Params {
  params: Promise<{ projectId: string; taskId: string }>
}

// PATCH /api/projects/[projectId]/tasks/[taskId] — update task
export async function PATCH(req: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const user = session.user as { id: string; role: string }
  const { taskId } = await params
  await connectDB()

  const task = await Task.findById(taskId)
  if (!task) return NextResponse.json({ error: 'Task not found' }, { status: 404 })

  const body = await req.json()
  const updates: Record<string, any> = {}

  const isManager = user.role === 'MANAGER' || user.role === 'ADMIN'
  const isAssignee = task.assignedTo.toString() === user.id

  // Manager can edit title, description, assignedTo
  if (isManager) {
    if (body.title !== undefined) updates.title = body.title.trim()
    if (body.description !== undefined) updates.description = body.description.trim()
    if (body.assignedTo !== undefined) updates.assignedTo = body.assignedTo
  }

  // Employee can update status and statusDescription
  if (isAssignee || isManager) {
    if (body.status !== undefined) updates.status = body.status
    if (body.statusDescription !== undefined) updates.statusDescription = body.statusDescription
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'No valid fields to update' }, { status: 400 })
  }

  const updated = await Task.findByIdAndUpdate(taskId, updates, { new: true })
    .populate('assignedTo', 'name email')
    .lean()

  return NextResponse.json({ task: updated })
}

// DELETE /api/projects/[projectId]/tasks/[taskId] — delete task (manager only)
export async function DELETE(_req: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const user = session.user as { id: string; role: string }
  if (user.role !== 'MANAGER' && user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Only managers can delete tasks' }, { status: 403 })
  }

  const { taskId } = await params
  await connectDB()

  await Task.findByIdAndDelete(taskId)
  return NextResponse.json({ success: true })
}
