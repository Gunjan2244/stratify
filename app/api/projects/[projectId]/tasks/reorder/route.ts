// app/api/projects/[projectId]/tasks/reorder/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import Task from '@/models/Task'

interface Params {
  params: Promise<{ projectId: string }>
}

// PATCH — reorder tasks within a project
export async function PATCH(req: NextRequest, { params }: Params) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const user = session.user as { id: string; role: string }
  if (user.role !== 'MANAGER' && user.role !== 'ADMIN') {
    return NextResponse.json({ error: 'Only managers can reorder tasks' }, { status: 403 })
  }

  const { projectId } = await params
  const body = await req.json()
  const { taskIds } = body

  if (!Array.isArray(taskIds) || taskIds.length === 0) {
    return NextResponse.json({ error: 'taskIds array is required' }, { status: 400 })
  }

  await connectDB()

  // Update each task's order based on its position in the array
  const bulkOps = taskIds.map((id: string, index: number) => ({
    updateOne: {
      filter: { _id: id, projectId },
      update: { $set: { order: index } },
    },
  }))

  await Task.bulkWrite(bulkOps)

  return NextResponse.json({ success: true })
}
