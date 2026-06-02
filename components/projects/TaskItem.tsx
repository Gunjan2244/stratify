// components/projects/TaskItem.tsx
'use client'

import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { TaskReviewPanel } from './TaskReviewPanel'
import type { ITask } from '@/types'

const STATUS_MAP: Record<string, string> = {
  TODO: 'status-todo',
  IN_PROGRESS: 'status-in-progress',
  DONE: 'status-done',
  ACCEPTED: 'status-accepted',
  REOPENED: 'status-reopened',
}

const COLORS = [
  'rgba(34,197,94,0.7)', 'rgba(59,130,246,0.7)', 'rgba(139,92,246,0.7)',
  'rgba(245,158,11,0.7)', 'rgba(236,72,153,0.7)', 'rgba(14,165,233,0.7)',
]
function getColor(str: string) {
  let h = 0; for (let i = 0; i < str.length; i++) h = str.charCodeAt(i) + ((h << 5) - h)
  return COLORS[Math.abs(h) % COLORS.length]
}

interface Props {
  task: ITask
  projectId: string
  isManager: boolean
  currentUserId: string
}

export function TaskItem({ task, projectId, isManager, currentUserId }: Props) {
  const [expanded, setExpanded] = useState(false)
  const [statusDesc, setStatusDesc] = useState(task.statusDescription || '')
  const queryClient = useQueryClient()
  const isAssignee = task.assignedTo === currentUserId
  const isDone = task.status === 'ACCEPTED'
  const canMarkDone = isAssignee && ['TODO', 'IN_PROGRESS', 'REOPENED'].includes(task.status)

  const doneMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/projects/${projectId}/tasks/${task._id}/done`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ statusDescription: statusDesc }),
      })
      if (!res.ok) { const d = await res.json(); throw new Error(d.error || 'Failed') }
      return res.json()
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['project', projectId] }),
  })

  const deleteMutation = useMutation({
    mutationFn: async () => {
      await fetch(`/api/projects/${projectId}/tasks/${task._id}`, { method: 'DELETE' })
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['project', projectId] }),
  })

  return (
    <div className={`task-row ${isDone ? 'task-row-done' : ''}`} style={{ flexDirection: 'column', cursor: 'pointer' }}>
      {/* Main row */}
      <div className="flex items-start gap-3 w-full" onClick={() => setExpanded(!expanded)}>
        {/* Checkbox */}
        <div
          className={`checklist-checkbox ${isDone ? 'checked' : ''}`}
          onClick={e => {
            e.stopPropagation()
            if (canMarkDone && statusDesc.trim()) doneMutation.mutate()
            else if (canMarkDone) setExpanded(true)
          }}
        >
          {isDone && (
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={3} strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="task-title">{task.title}</span>
            <span className={`status-badge ${STATUS_MAP[task.status] || 'status-todo'}`}>
              {task.status.replace('_', ' ')}
            </span>
          </div>
          {task.assigneeName && (
            <div className="flex items-center gap-1.5 mt-1">
              <div className="avatar avatar-sm" style={{ background: getColor(task.assigneeName), color: '#fff', width: '18px', height: '18px', fontSize: '8px' }}>
                {task.assigneeName[0]?.toUpperCase()}
              </div>
              <span className="mono-id">{task.assigneeName}</span>
            </div>
          )}
        </div>

        {/* Expand arrow */}
        <svg
          width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth={2}
          strokeLinecap="round" strokeLinejoin="round"
          style={{ transition: 'transform 200ms', transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)', flexShrink: 0, marginTop: '2px' }}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </div>

      {/* Expanded section */}
      {expanded && (
        <div className="w-full mt-3 pl-[30px] slide-up">
          {/* Task description from manager */}
          {task.description && (
            <div className="mb-3">
              <p className="label-caption mb-1">Description</p>
              <p className="task-description">{task.description}</p>
            </div>
          )}

          {/* Status description (employee writes) */}
          {(canMarkDone || task.statusDescription) && (
            <div className="mb-3">
              <p className="label-caption mb-1">Status Update</p>
              {canMarkDone ? (
                <div className="space-y-2">
                  <textarea
                    value={statusDesc}
                    onChange={e => setStatusDesc(e.target.value)}
                    className="input-field w-full"
                    placeholder="Describe what you did…"
                    rows={2}
                  />
                  <button
                    onClick={() => doneMutation.mutate()}
                    disabled={doneMutation.isPending || !statusDesc.trim()}
                    className="btn-primary"
                    style={{ height: '30px', fontSize: '12px' }}
                  >
                    {doneMutation.isPending ? 'Marking…' : '✓ Mark as Done'}
                  </button>
                </div>
              ) : (
                <p className="task-description">{task.statusDescription}</p>
              )}
            </div>
          )}

          {/* Review panel */}
          <TaskReviewPanel
            projectId={projectId}
            taskId={task._id}
            reviews={task.reviews}
            isManager={isManager}
            taskStatus={task.status}
          />

          {/* Delete (manager only) */}
          {isManager && (
            <div className="mt-3 pt-3" style={{ borderTop: '1px solid var(--border-subtle)' }}>
              <button
                onClick={() => { if (confirm('Delete this task?')) deleteMutation.mutate() }}
                className="btn-destructive"
                style={{ height: '28px', fontSize: '11px' }}
              >
                Delete Task
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
