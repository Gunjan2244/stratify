// app/api/users/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import connectDB from '@/lib/mongodb'
import User from '@/models/User'

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await connectDB()

    const role = req.nextUrl.searchParams.get('role')
    const managerId = req.nextUrl.searchParams.get('managerId')

    const filter: Record<string, any> = {}
    if (role) filter.role = role
    if (managerId) filter.managerId = managerId

    const users = await User.find(filter).select('name email role managerId').lean()

    const serialized = users.map((u: any) => ({
      _id: u._id.toString(),
      name: u.name,
      email: u.email,
      role: u.role,
    }))

    return NextResponse.json({ users: serialized })
  } catch (err) {
    console.error('[GET /api/users]', err)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
