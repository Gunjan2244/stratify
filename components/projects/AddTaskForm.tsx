// components/projects/AddTaskForm.tsx
'use client'

import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'

interface Member { _id: string; name: string; email: string }

interface Props {
  projectId: string
  members: Member[]
  insertAtIndex?: number
  onClose: () => void
}

export function AddTaskForm({ projectId, members, insertAtIndex, onClose }: Props) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [assignedTo, setAssignedTo] = useState(members[0]?._id || '')
  const [error, setError] = useState('')
  const queryClient = useQueryClient()

  const addMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch(`/api/projects/${projectId}/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description, assignedTo, insertAtIndex: insertAtIndex ?? null }),
      })
      if (!res.ok) { const d = await res.json(); throw new Error(d.error || 'Failed') }
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project', projectId] })
      onClose()
    },
    onError: (err: Error) => setError(err.message),
  })

  return (
    <div className="slide-up" style={{ padding: '16px', background: 'var(--surface-inset)', borderRadius: 'var(--radius-md)', border: '1px solid var(--brand-border)', margin: '4px 0' }}>
      <form onSubmit={e => { e.preventDefault(); if (!title.trim()) { setError('Title required'); return; } addMutation.mutate() }} className="space-y-3">
        <input type="text" value={title} onChange={e => setTitle(e.target.value)} className="input-field w-full" placeholder="Task title…" autoFocus />
        <textarea value={description} onChange={e => setDescription(e.target.value)} className="input-field w-full" placeholder="Description for assignee…" rows={2} />
        <div>
          <label className="input-label">Assign To</label>
          <select value={assignedTo} onChange={e => setAssignedTo(e.target.value)} className="input-field w-full" style={{ appearance: 'none' }}>
            {members.map(m => <option key={m._id} value={m._id}>{m.name}</option>)}
          </select>
        </div>
        {error && <p className="text-[12px]" style={{ color: 'var(--danger)' }}>{error}</p>}
        <div className="flex gap-2 justify-end">
          <button type="button" onClick={onClose} className="btn-secondary" style={{ height: '30px', fontSize: '12px' }}>Cancel</button>
          <button type="submit" disabled={addMutation.isPending} className="btn-primary" style={{ height: '30px', fontSize: '12px' }}>
            {addMutation.isPending ? 'Adding…' : 'Add Task'}
          </button>
        </div>
      </form>
    </div>
  )
}
