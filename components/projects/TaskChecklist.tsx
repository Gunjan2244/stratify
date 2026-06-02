// components/projects/TaskChecklist.tsx
'use client'

import { useState } from 'react'
import { TaskItem } from './TaskItem'
import { AddTaskForm } from './AddTaskForm'
import type { ITask } from '@/types'

interface Member { _id: string; name: string; email: string }

interface Props {
  tasks: ITask[]
  projectId: string
  members: Member[]
  isManager: boolean
  currentUserId: string
}

export function TaskChecklist({ tasks, projectId, members, isManager, currentUserId }: Props) {
  const [addingAt, setAddingAt] = useState<number | null>(null)
  const [showInsertIdx, setShowInsertIdx] = useState<number | null>(null)

  return (
    <div className="base-card !p-0 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: '1px solid var(--border-subtle)' }}>
        <div className="flex items-center gap-3">
          <h2 className="h2-title">Tasks</h2>
          <span className="mono-id">{tasks.filter(t => t.status === 'ACCEPTED').length}/{tasks.length} done</span>
        </div>
        {isManager && (
          <button
            onClick={() => setAddingAt(tasks.length)}
            className="btn-primary"
            style={{ height: '30px', fontSize: '12px' }}
          >
            <span className="flex items-center gap-1.5">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              Add Task
            </span>
          </button>
        )}
      </div>

      {/* Task list */}
      {tasks.length === 0 && addingAt === null ? (
        <div className="empty-state" style={{ padding: '40px 20px' }}>
          <div className="empty-state-icon">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
              <path d="M9 11l3 3L22 4" /><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" />
            </svg>
          </div>
          <p className="text-[13px]" style={{ color: 'var(--text-muted)' }}>No tasks yet</p>
          {isManager && (
            <button onClick={() => setAddingAt(0)} className="btn-primary mt-3" style={{ height: '30px', fontSize: '12px' }}>
              Add First Task
            </button>
          )}
        </div>
      ) : (
        <div>
          {tasks.map((task, idx) => (
            <div key={task._id}>
              {/* Insert marker above this task */}
              {isManager && showInsertIdx === idx && addingAt === null && (
                <div
                  className="insert-marker visible"
                  onClick={() => setAddingAt(idx)}
                >
                  + Insert task here
                </div>
              )}

              {/* Add task form at this position */}
              {addingAt === idx && (
                <div style={{ padding: '4px 16px' }}>
                  <AddTaskForm
                    projectId={projectId}
                    members={members}
                    insertAtIndex={idx}
                    onClose={() => setAddingAt(null)}
                  />
                </div>
              )}

              {/* Task item */}
              <div
                onMouseEnter={() => isManager && setShowInsertIdx(idx)}
                onMouseLeave={() => setShowInsertIdx(null)}
              >
                <TaskItem
                  task={task}
                  projectId={projectId}
                  isManager={isManager}
                  currentUserId={currentUserId}
                />
              </div>
            </div>
          ))}

          {/* Add at end */}
          {addingAt === tasks.length && (
            <div style={{ padding: '4px 16px 16px' }}>
              <AddTaskForm
                projectId={projectId}
                members={members}
                insertAtIndex={tasks.length}
                onClose={() => setAddingAt(null)}
              />
            </div>
          )}
        </div>
      )}
    </div>
  )
}
