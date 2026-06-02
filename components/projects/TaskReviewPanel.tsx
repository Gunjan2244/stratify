// components/projects/TaskReviewPanel.tsx
'use client'

import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import type { IReview } from '@/types'

interface Props {
  projectId: string
  taskId: string
  reviews: IReview[]
  isManager: boolean
  taskStatus: string
}

export function TaskReviewPanel({ projectId, taskId, reviews, isManager, taskStatus }: Props) {
  const [comment, setComment] = useState('')
  const queryClient = useQueryClient()

  const reviewMutation = useMutation({
    mutationFn: async (accepted: boolean) => {
      const res = await fetch(`/api/projects/${projectId}/tasks/${taskId}/review`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accepted, comment }),
      })
      if (!res.ok) { const d = await res.json(); throw new Error(d.error || 'Failed') }
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project', projectId] })
      setComment('')
    },
  })

  return (
    <div className="mt-4">
      {/* Review history */}
      {reviews.length > 0 && (
        <div className="mb-4">
          <p className="label-caption mb-2">Review History</p>
          <div className="review-timeline">
            {reviews.map((r, i) => (
              <div key={i} className={`review-item ${r.accepted ? 'accepted' : 'rejected'}`}>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-[12px] font-medium" style={{ color: r.accepted ? 'var(--success)' : 'var(--danger)' }}>
                    {r.accepted ? '✓ Accepted' : '✗ Rejected'}
                  </span>
                  <span className="mono-id">by {r.reviewerName || 'Manager'}</span>
                  <span className="mono-id">
                    {r.reviewedAt ? new Date(r.reviewedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : ''}
                  </span>
                </div>
                {r.comment && (
                  <p className="text-[12px]" style={{ color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                    &ldquo;{r.comment}&rdquo;
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Review action (manager only, task is DONE) */}
      {isManager && taskStatus === 'DONE' && (
        <div className="p-3 rounded-lg" style={{ background: 'var(--surface-inset)', border: '1px solid var(--border-default)' }}>
          <p className="label-caption mb-2">Review This Task</p>
          <textarea
            value={comment}
            onChange={e => setComment(e.target.value)}
            className="input-field w-full mb-3"
            placeholder="Add review comment…"
            rows={2}
          />
          <div className="flex gap-2">
            <button
              onClick={() => reviewMutation.mutate(true)}
              disabled={reviewMutation.isPending}
              className="btn-success flex-1"
            >
              ✓ Accept
            </button>
            <button
              onClick={() => reviewMutation.mutate(false)}
              disabled={reviewMutation.isPending}
              className="btn-warning flex-1"
            >
              ✗ Reject & Reopen
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
