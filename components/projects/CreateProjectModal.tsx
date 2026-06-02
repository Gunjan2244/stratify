// components/projects/CreateProjectModal.tsx
'use client'

import { useState, useEffect } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'

interface TeamMember {
  _id: string
  name: string
  email: string
}

interface Props {
  open: boolean
  onClose: () => void
}

export function CreateProjectModal({ open, onClose }: Props) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [githubLink, setGithubLink] = useState('')
  const [selectedMembers, setSelectedMembers] = useState<string[]>([])
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
  const [error, setError] = useState('')

  const queryClient = useQueryClient()

  useEffect(() => {
    if (open) {
      fetch('/api/users/managers')
        .then(r => r.json())
        .then(data => {
          // We actually need all employees under this manager
          // The managers endpoint returns managers, let's also get team
        })
        .catch(() => {})

      // Fetch all users for member selection
      fetch('/api/users?role=EMPLOYEE')
        .then(r => r.json())
        .then(data => {
          if (data.users) setTeamMembers(data.users)
        })
        .catch(() => {})
    }
  }, [open])

  const createMutation = useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description, githubLink, memberIds: selectedMembers }),
      })
      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || 'Failed to create project')
      }
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] })
      setTitle('')
      setDescription('')
      setGithubLink('')
      setSelectedMembers([])
      setError('')
      onClose()
    },
    onError: (err: Error) => {
      setError(err.message)
    },
  })

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    if (!title.trim() || !description.trim() || !githubLink.trim()) {
      setError('All fields are required')
      return
    }

    createMutation.mutate()
  }

  function toggleMember(id: string) {
    setSelectedMembers(prev =>
      prev.includes(id) ? prev.filter(m => m !== id) : [...prev, id]
    )
  }

  if (!open) return null

  return (
    <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) onClose() }}>
      <div className="modal-card" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="h1-title">New Project</h2>
          <button onClick={onClose} className="btn-icon" aria-label="Close">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="input-label">Project Title</label>
            <input
              type="text"
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="input-field w-full"
              placeholder="e.g. Stratify Platform v2"
              required
              autoFocus
            />
          </div>

          <div>
            <label className="input-label">Description</label>
            <textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              className="input-field w-full"
              placeholder="Describe the project objectives and scope..."
              rows={3}
              required
            />
          </div>

          <div>
            <label className="input-label">GitHub Repository Link</label>
            <input
              type="url"
              value={githubLink}
              onChange={e => setGithubLink(e.target.value)}
              className="input-field w-full"
              placeholder="https://github.com/org/repo"
              required
            />
          </div>

          {teamMembers.length > 0 && (
            <div>
              <label className="input-label">Add Team Members (Optional)</label>
              <div className="space-y-1.5 max-h-[140px] overflow-y-auto rounded-md" style={{ background: 'var(--surface-inset)', padding: '8px', border: '1px solid var(--border-default)', borderRadius: 'var(--radius-md)' }}>
                {teamMembers.map(m => (
                  <label
                    key={m._id}
                    className="flex items-center gap-3 px-2 py-1.5 rounded-md cursor-pointer transition-colors"
                    style={{ fontSize: '13px' }}
                    onMouseEnter={(e) => e.currentTarget.style.background = 'var(--surface-hover)'}
                    onMouseLeave={(e) => e.currentTarget.style.background = 'transparent'}
                  >
                    <input
                      type="checkbox"
                      checked={selectedMembers.includes(m._id)}
                      onChange={() => toggleMember(m._id)}
                      style={{ accentColor: 'var(--brand)' }}
                    />
                    <span style={{ color: 'var(--text-primary)' }}>{m.name}</span>
                    <span className="mono-id ml-auto">{m.email}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {error && (
            <div className="p-3 rounded-md" style={{ backgroundColor: 'var(--danger-surface)', color: 'var(--danger)', fontSize: '13px' }}>
              {error}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1">
              Cancel
            </button>
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="btn-primary flex-1"
            >
              {createMutation.isPending ? 'Creating…' : 'Create Project'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
