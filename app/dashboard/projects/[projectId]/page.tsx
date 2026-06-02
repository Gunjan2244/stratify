// app/dashboard/projects/[projectId]/page.tsx
'use client'

import { use } from 'react'
import { useSession } from 'next-auth/react'
import { useQuery } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { ProjectHeader } from '@/components/projects/ProjectHeader'
import { TaskChecklist } from '@/components/projects/TaskChecklist'

interface PageProps {
  params: Promise<{ projectId: string }>
}

export default function ProjectDetailPage({ params }: PageProps) {
  const { projectId } = use(params)
  const { data: session } = useSession()
  const router = useRouter()
  const user = session?.user as { id?: string; name?: string; role?: string }
  const isManager = user?.role === 'MANAGER' || user?.role === 'ADMIN'

  const { data, isLoading } = useQuery({
    queryKey: ['project', projectId],
    queryFn: () => fetch(`/api/projects/${projectId}`).then(r => r.json()),
    refetchInterval: 10_000,
  })

  const project = data?.project

  if (isLoading) {
    return (
      <div className="max-w-4xl space-y-6">
        <div className="h-8 rounded" style={{ width: '40%', background: 'var(--surface-hover)', animation: 'pulse 1.5s ease infinite' }} />
        <div className="h-4 rounded" style={{ width: '80%', background: 'var(--surface-hover)', animation: 'pulse 1.5s ease infinite' }} />
        <div className="base-card" style={{ height: '300px', animation: 'pulse 1.5s ease infinite' }} />
      </div>
    )
  }

  if (!project) {
    return (
      <div className="empty-state">
        <p className="text-[14px]" style={{ color: 'var(--text-muted)' }}>Project not found</p>
        <button onClick={() => router.push('/dashboard')} className="btn-secondary mt-3">Back to Dashboard</button>
      </div>
    )
  }

  // Build member details
  const members = (project.members || []).map((m: any) => ({
    _id: m._id || m,
    name: m.name || '',
    email: m.email || '',
  }))

  const creatorName = typeof project.createdBy === 'object' ? project.createdBy.name : ''

  return (
    <div className="max-w-4xl fade-in">
      {/* Back button */}
      <button
        onClick={() => router.push('/dashboard')}
        className="flex items-center gap-2 mb-6 text-[13px] transition-colors"
        style={{ color: 'var(--text-muted)' }}
        onMouseEnter={e => e.currentTarget.style.color = 'var(--text-primary)'}
        onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <polyline points="15 18 9 12 15 6" />
        </svg>
        Back to projects
      </button>

      {/* Project header */}
      <ProjectHeader
        projectId={projectId}
        title={project.title}
        description={project.description}
        githubLink={project.githubLink}
        creatorName={creatorName}
        isManager={isManager}
      />

      {/* Task checklist */}
      <TaskChecklist
        tasks={project.tasks || []}
        projectId={projectId}
        members={members}
        isManager={isManager}
        currentUserId={user?.id || ''}
      />
    </div>
  )
}
