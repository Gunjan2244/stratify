// app/api/sessions/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import SessionEvent from '@/models/SessionEvent'

function todayStr() {
  return new Date().toISOString().slice(0, 10) // YYYY-MM-DD UTC
}

// GET /api/sessions?date=YYYY-MM-DD&userId=xxx
export async function GET(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const user = session.user as { id: string; role: string }
  const { searchParams } = req.nextUrl
  const date = searchParams.get('date') || todayStr()
  const requestedUserId = searchParams.get('userId')

  await connectDB()

  // Manager/Admin can request any user; employee can only request self
  const targetUserId =
    (user.role === 'MANAGER' || user.role === 'ADMIN') && requestedUserId
      ? requestedUserId
      : user.id

  const events = await SessionEvent.find({ userId: targetUserId, date })
    .sort({ timestamp: 1 })
    .lean()

  const serialized = events.map((e: any) => ({
    _id: e._id.toString(),
    userId: e.userId.toString(),
    date: e.date,
    type: e.type,
    timestamp: e.timestamp.toISOString(),
    objectives: e.objectives || '',
    pauseReason: e.pauseReason || '',
    workDecided: e.workDecided || '',
    workCompleted: e.workCompleted || '',
  }))

  return NextResponse.json({ events: serialized })
}

// POST /api/sessions — log a new event
export async function POST(req: NextRequest) {
  const session = await getServerSession(authOptions)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const user = session.user as { id: string }
  const body = await req.json()
  const { type, objectives, pauseReason, workDecided, workCompleted } = body

  const validTypes = ['START', 'PAUSE', 'RESUME', 'TERMINATE']
  if (!validTypes.includes(type)) {
    return NextResponse.json({ error: 'Invalid event type' }, { status: 400 })
  }

  await connectDB()

  const now = new Date()
  const date = now.toISOString().slice(0, 10)

  const event = await SessionEvent.create({
    userId: user.id,
    date,
    type,
    timestamp: now,
    objectives: objectives || '',
    pauseReason: pauseReason || '',
    workDecided: workDecided || '',
    workCompleted: workCompleted || '',
  })

  return NextResponse.json({
    event: {
      _id: event._id.toString(),
      userId: event.userId.toString(),
      date: event.date,
      type: event.type,
      timestamp: event.timestamp.toISOString(),
      objectives: event.objectives,
      pauseReason: event.pauseReason,
      workDecided: event.workDecided,
      workCompleted: event.workCompleted,
    },
  }, { status: 201 })
}