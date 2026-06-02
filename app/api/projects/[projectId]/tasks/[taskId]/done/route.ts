// app/api/projects/[projectId]/tasks/[taskId]/done/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import Task from '@/models/Task'

interface Params {
  params: Promise<{ projectId: string; taskId: string }>
}

// POST — employee marks a task as done
export async function POST(req: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const user = session.user as { id: string }
  const { taskId } = await params
  await connectDB()

  const task = await Task.findById(taskId)
  if (!task) return NextResponse.json({ error: 'Task not found' }, { status: 404 })

  if (task.assignedTo.toString() !== user.id) {
    return NextResponse.json({ error: 'Only the assignee can mark as done' }, { status: 403 })
  }

  if (task.status === 'ACCEPTED') {
    return NextResponse.json({ error: 'Task is already accepted' }, { status: 400 })
  }

  const body = await req.json()
  const { statusDescription } = body

  task.status = 'DONE'
  task.statusDescription = statusDescription || ''
  task.completedAt = new Date()
  await task.save()

  return NextResponse.json({ task })
}
