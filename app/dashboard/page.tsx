
'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { useQuery } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { ProjectCard } from '@/components/projects/ProjectCard'
import { CreateProjectModal } from '@/components/projects/CreateProjectModal'
import { SessionControls } from '@/components/session/SessionControls'
import { EmployeeTimeline } from '@/components/session/EmployeeTimeline'
import { ManagerTeamTimeline } from '@/components/session/ManagerTeamTimeline'
import type { IProject } from '@/types'

export default function DashboardPage() {
  const { data: session } = useSession()
  const router = useRouter()
  const user = session?.user as { id?: string; name?: string; role?: string }
  const isManager = user?.role === 'MANAGER' || user?.role === 'ADMIN'
  const [showCreate, setShowCreate] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ['projects'],
    queryFn: () => fetch('/api/projects').then(r => r.json()),
    refetchInterval: 15_000,
  })

  const projects: IProject[] = (data?.projects ?? []).map((p: any) => ({
    ...p,
    memberDetails: p.members,
  }))

  const totalProjects = projects.length
  const totalTasks = projects.reduce((s, p) => s + (p.taskStats?.total ?? 0), 0)
  const pendingReview = projects.reduce((s, p) => s + (p.taskStats?.pendingReview ?? 0), 0)
  const completedTasks = projects.reduce((s, p) => s + (p.taskStats?.completed ?? 0), 0)

  return (
    <div className="space-y-6 max-w-5xl">
      {/* Welcome + Session Controls */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="h1-title">Welcome back, {user?.name?.split(' ')[0]} 👋</h1>
            <p className="text-[13px] mt-1" style={{ color: 'var(--text-secondary)' }}>
              {isManager ? 'Manage your projects and review tasks' : 'Your assigned projects and tasks'}
            </p>
          </div>
          {isManager && (
            <button onClick={() => setShowCreate(true)} className="btn-primary flex items-center gap-2">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              New Project
            </button>
          )}
        </div>

        {/* Session controls bar */}
        <SessionControls />
      </div>

      {/* Employee Timeline */}
      {!isManager && <EmployeeTimeline />}

      {/* KPI cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <KpiCard label="Projects" value={totalProjects} color="var(--text-primary)" icon={
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z" />
          </svg>
        } />
        <KpiCard label="Total Tasks" value={totalTasks} color="var(--info)" icon={
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 11l3 3L22 4" /><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
          </svg>
        } />
        <KpiCard label="Pending Review" value={pendingReview} color="var(--warning)" icon={
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
          </svg>
        } />
        <KpiCard label="Completed" value={completedTasks} color="var(--success)" icon={
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
            <path d="M22 11.08V12a10 10 0 11-5.93-9.14" /><polyline points="22 4 12 14.01 9 11.01" />
          </svg>
        } />
      </div>

      {/* Manager team timeline */}
      {isManager && <ManagerTeamTimeline />}

      {/* Projects grid */}
      <div>
        <h2 className="h2-title mb-4">Your Projects</h2>
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="base-card" style={{ height: '180px', animation: 'pulse 1.5s ease infinite' }}>
                <div className="h-4 rounded" style={{ width: '60%', background: 'var(--surface-hover)' }} />
              </div>
            ))}
          </div>
        ) : projects.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
                <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z" />
              </svg>
            </div>
            <p className="text-[14px] font-medium mb-1" style={{ color: 'var(--text-primary)' }}>No projects yet</p>
            <p className="text-[13px] mb-4" style={{ color: 'var(--text-muted)' }}>
              {isManager ? 'Create your first project to get started' : 'Your manager will add you to projects'}
            </p>
            {isManager && (
              <button onClick={() => setShowCreate(true)} className="btn-primary">Create Project</button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects.map((p, i) => (
              <div key={p._id} className="slide-up" style={{ animationDelay: `${i * 50}ms` }}>
                <ProjectCard project={p} onClick={() => router.push(`/dashboard/projects/${p._id}`)} />
              </div>
            ))}
          </div>
        )}
      </div>

      <CreateProjectModal open={showCreate} onClose={() => setShowCreate(false)} />
    </div>
  )
}

function KpiCard({ label, value, color, icon }: { label: string; value: number; color: string; icon: React.ReactNode }) {
  return (
    <div className="metric-card">
      <div className="flex items-center gap-2">
        <span style={{ color: 'var(--text-muted)' }}>{icon}</span>
        <span className="label-caption">{label}</span>
      </div>
      <p className="metric-value mt-3" style={{ color }}>{value}</p>
    </div>
  )
}