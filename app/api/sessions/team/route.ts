// app/api/sessions/team/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import SessionEvent from '@/models/SessionEvent'
import Project from '@/models/Project'
import User from '@/models/User'

function todayStr() {
    return new Date().toISOString().slice(0, 10)
}

// GET /api/sessions/team?date=YYYY-MM-DD
// Returns all session events for all members of the manager's projects
export async function GET(req: NextRequest) {
    const session = await getServerSession(authOptions)
    if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const user = session.user as { id: string; role: string }
    if (user.role !== 'MANAGER' && user.role !== 'ADMIN') {
        return NextResponse.json({ error: 'Only managers can view team sessions' }, { status: 403 })
    }

    const { searchParams } = req.nextUrl
    const date = searchParams.get('date') || todayStr()

    await connectDB()

    // Get all employees under this manager
    const employees = await User.find({ managerId: user.id }).select('_id name email').lean()
    const employeeIds = employees.map((e: any) => e._id)

    // Also get members from projects
    const projects = await Project.find({ createdBy: user.id }).select('members').lean()
    const projectMemberIds = projects.flatMap((p: any) => p.members)

    // Union of all user IDs the manager cares about
    const allIds = [...new Set([...employeeIds.map((id: any) => id.toString()), ...projectMemberIds.map((id: any) => id.toString())])]

    // Fetch all session events for this date
    const events = await SessionEvent.find({ userId: { $in: allIds }, date })
        .sort({ timestamp: 1 })
        .lean()

    // Get user details for all involved users
    const usersData = await User.find({ _id: { $in: allIds } }).select('name email role').lean()
    const usersMap: Record<string, { name: string; email: string; role: string }> = {}
    for (const u of usersData as any[]) {
        usersMap[u._id.toString()] = { name: u.name, email: u.email, role: u.role }
    }

    // Group events by userId
    const byUser: Record<string, any> = {}
    for (const userId of allIds) {
        const userEvents = events
            .filter((e: any) => e.userId.toString() === userId)
            .map((e: any) => ({
                _id: e._id.toString(),
                type: e.type,
                timestamp: e.timestamp.toISOString(),
                objectives: e.objectives || '',
                pauseReason: e.pauseReason || '',
                workDecided: e.workDecided || '',
                workCompleted: e.workCompleted || '',
            }))

        if (usersMap[userId]) {
            byUser[userId] = {
                userId,
                ...usersMap[userId],
                events: userEvents,
            }
        }
    }

    return NextResponse.json({ team: Object.values(byUser), date })
}