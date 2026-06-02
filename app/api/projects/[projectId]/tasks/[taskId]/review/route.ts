// app/api/projects/[projectId]/tasks/[taskId]/review/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import Task from '@/models/Task'

interface Params {
  params: Promise<{ projectId: string; taskId: string }>
}

// POST — manager accepts or rejects a task
export async function POST(req: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const user = session.user as { id: string; role: string }
  if (user.role !== 'MANAGER' && user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Only managers can review tasks' }, { status: 403 })
  }

  const { taskId } = await params
  const body = await req.json()
  const { accepted, comment } = body

  if (typeof accepted !== 'boolean') {
    return NextResponse.json({ error: 'accepted field is required (boolean)' }, { status: 400 })
  }

  await connectDB()

  const task = await Task.findById(taskId)
  if (!task) return NextResponse.json({ error: 'Task not found' }, { status: 404 })

  if (task.status !== 'DONE') {
    return NextResponse.json({ error: 'Can only review tasks marked as done' }, { status: 400 })
  }

  // Add the review to the reviews array
  task.reviews.push({
    reviewedBy: user.id as any,
    accepted,
    comment: comment || '',
    reviewedAt: new Date(),
  })

  if (accepted) {
    task.status = 'ACCEPTED'
  } else {
    task.status = 'REOPENED'
    task.completedAt = null
  }

  await task.save()

  // Re-fetch with populated fields
  const updated = await Task.findById(taskId)
    .populate('assignedTo', 'name email')
    .populate('reviews.reviewedBy', 'name')
    .lean()

  const serialized = {
    ...(updated as any),
    _id: (updated as any)._id.toString(),
    projectId: (updated as any).projectId.toString(),
    assignedTo: (updated as any).assignedTo?._id?.toString(),
    assigneeName: (updated as any).assignedTo?.name ?? '',
    reviews: ((updated as any).reviews || []).map((r: any) => ({
      ...r,
      reviewedBy: r.reviewedBy?._id?.toString() ?? r.reviewedBy?.toString(),
      reviewerName: r.reviewedBy?.name ?? '',
      reviewedAt: r.reviewedAt?.toISOString?.() ?? r.reviewedAt,
    })),
  }

  return NextResponse.json({ task: serialized })
}
