// components/projects/ProjectHeader.tsx
'use client'

import { useState, useRef } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'

interface Props {
  projectId: string
  title: string
  description: string
  githubLink: string
  creatorName: string
  isManager: boolean
}

export function ProjectHeader({ projectId, title, description, githubLink, creatorName, isManager }: Props) {
  const [editingDesc, setEditingDesc] = useState(false)
  const [editingLink, setEditingLink] = useState(false)
  const [editingTitle, setEditingTitle] = useState(false)
  const [descValue, setDescValue] = useState(description)
  const [linkValue, setLinkValue] = useState(githubLink)
  const [titleValue, setTitleValue] = useState(title)

  const descRef = useRef<HTMLTextAreaElement>(null)
  const linkRef = useRef<HTMLInputElement>(null)
  const titleRef = useRef<HTMLInputElement>(null)
  const queryClient = useQueryClient()

  const updateMutation = useMutation({
    mutationFn: async (updates: Record<string, string>) => {
      const res = await fetch(`/api/projects/${projectId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      })
      if (!res.ok) throw new Error('Failed to update')
      return res.json()
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project', projectId] })
    },
  })

  function saveDesc() {
    if (descValue.trim() !== description) {
      updateMutation.mutate({ description: descValue })
    }
    setEditingDesc(false)
  }

  function saveLink() {
    if (linkValue.trim() !== githubLink) {
      updateMutation.mutate({ githubLink: linkValue })
    }
    setEditingLink(false)
  }

  function saveTitle() {
    if (titleValue.trim() !== title) {
      updateMutation.mutate({ title: titleValue })
    }
    setEditingTitle(false)
  }

  return (
    <div className="mb-8">
      {/* Title row */}
      <div className="flex items-start justify-between gap-4 mb-1">
        <div className="flex-1">
          {isManager && editingTitle ? (
            <input
              ref={titleRef}
              value={titleValue}
              onChange={e => setTitleValue(e.target.value)}
              onBlur={saveTitle}
              onKeyDown={e => e.key === 'Enter' && saveTitle()}
              className="inline-edit h1-title w-full"
              autoFocus
            />
          ) : (
            <h1
              className="h1-title"
              style={{ cursor: isManager ? 'pointer' : 'default' }}
              onClick={() => isManager && setEditingTitle(true)}
              title={isManager ? 'Click to edit' : undefined}
            >
              {title}
              {isManager && (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline-block', marginLeft: '8px', verticalAlign: 'middle', opacity: 0.5 }}>
                  <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                  <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                </svg>
              )}
            </h1>
          )}
          <p className="text-[12px] mt-1" style={{ color: 'var(--text-muted)' }}>
            Created by {creatorName}
          </p>
        </div>

        {/* GitHub link */}
        <div>
          {isManager && editingLink ? (
            <input
              ref={linkRef}
              type="url"
              value={linkValue}
              onChange={e => setLinkValue(e.target.value)}
              onBlur={saveLink}
              onKeyDown={e => e.key === 'Enter' && saveLink()}
              className="input-field"
              style={{ width: '280px' }}
              autoFocus
              placeholder="https://github.com/..."
            />
          ) : (
            <div className="flex items-center gap-2">
              <a
                href={githubLink}
                target="_blank"
                rel="noopener noreferrer"
                className="github-badge"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                </svg>
                Repository
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                  <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6" />
                  <polyline points="15 3 21 3 21 9" />
                  <line x1="10" y1="14" x2="21" y2="3" />
                </svg>
              </a>
              {isManager && (
                <button
                  onClick={() => setEditingLink(true)}
                  className="btn-icon"
                  title="Edit GitHub link"
                  style={{ width: '26px', height: '26px' }}
                >
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                    <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                    <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
                  </svg>
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Description */}
      <div className="mt-4">
        {isManager && editingDesc ? (
          <textarea
            ref={descRef}
            value={descValue}
            onChange={e => setDescValue(e.target.value)}
            onBlur={saveDesc}
            className="inline-edit w-full"
            rows={3}
            autoFocus
            style={{ fontSize: '13px', lineHeight: '1.6' }}
          />
        ) : (
          <p
            className="text-[13px]"
            style={{
              color: 'var(--text-secondary)',
              lineHeight: '1.6',
              cursor: isManager ? 'pointer' : 'default',
              padding: '4px 8px',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid transparent',
              transition: 'border-color 150ms',
            }}
            onClick={() => isManager && setEditingDesc(true)}
            onMouseEnter={e => { if (isManager) e.currentTarget.style.borderColor = 'var(--border-default)' }}
            onMouseLeave={e => e.currentTarget.style.borderColor = 'transparent'}
            title={isManager ? 'Click to edit description' : undefined}
          >
            {description}
            {isManager && (
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline-block', marginLeft: '6px', verticalAlign: 'middle', opacity: 0.4 }}>
                <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" />
                <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" />
              </svg>
            )}
          </p>
        )}
      </div>
    </div>
  )
}
