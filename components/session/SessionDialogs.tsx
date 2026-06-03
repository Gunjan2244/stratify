// components/session/SessionDialogs.tsx
'use client'

import { useState } from 'react'
import { useSessionStore, deriveStatus } from '@/store/sessionStore'

async function postEvent(payload: Record<string, string>) {
    const res = await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    })
    if (!res.ok) throw new Error('Failed to log event')
    return res.json()
}

/* ─── START DIALOG ──────────────────────────────────── */
export function StartSessionDialog() {
    const { startDialogOpen, closeStartDialog, appendEvent, setStatus } = useSessionStore()
    const [objectives, setObjectives] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    if (!startDialogOpen) return null

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        if (!objectives.trim()) { setError('Please describe your objectives for today'); return }
        setLoading(true)
        try {
            const { event } = await postEvent({ type: 'START', objectives })
            appendEvent(event)
            setStatus('ACTIVE')
            setObjectives('')
            setError('')
            closeStartDialog()
        } catch {
            setError('Failed to start session. Please try again.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) closeStartDialog() }}>
            <div className="modal-card" style={{ maxWidth: '440px' }}>
                <div className="session-dialog-header">
                    <div className="session-dialog-icon" style={{ background: 'rgba(34,197,94,0.12)', color: '#22c55e' }}>
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="10" />
                            <polyline points="12 6 12 12 16 14" />
                        </svg>
                    </div>
                    <div>
                        <h2 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)' }}>Start Work Session</h2>
                        <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>Set your intentions for the day</p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} style={{ marginTop: '20px' }}>
                    <label className="input-label">Today's Objectives</label>
                    <textarea
                        value={objectives}
                        onChange={e => setObjectives(e.target.value)}
                        className="input-field w-full"
                        placeholder="What do you plan to accomplish today? List your key tasks and goals…"
                        rows={4}
                        autoFocus
                        style={{ resize: 'vertical' }}
                    />
                    <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '6px' }}>
                        This will be visible to your manager and logged in your daily record.
                    </p>

                    {error && (
                        <div style={{ marginTop: '12px', padding: '10px 12px', background: 'var(--danger-surface)', color: 'var(--danger)', borderRadius: 'var(--radius-md)', fontSize: '12px' }}>
                            {error}
                        </div>
                    )}

                    <div className="flex gap-3 mt-5">
                        <button type="button" onClick={closeStartDialog} className="btn-secondary flex-1">Cancel</button>
                        <button type="submit" disabled={loading} className="btn-primary flex-1" style={{ background: '#22c55e' }}>
                            {loading ? 'Starting…' : '▶ Start Session'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}

/* ─── PAUSE DIALOG ──────────────────────────────────── */
export function PauseSessionDialog() {
    const { pauseDialogOpen, closePauseDialog, appendEvent, setStatus } = useSessionStore()
    const [reason, setReason] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    if (!pauseDialogOpen) return null

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        if (!reason.trim()) { setError('Please provide a reason for pausing'); return }
        setLoading(true)
        try {
            const { event } = await postEvent({ type: 'PAUSE', pauseReason: reason })
            appendEvent(event)
            setStatus('PAUSED')
            setReason('')
            setError('')
            closePauseDialog()
        } catch {
            setError('Failed to pause session. Please try again.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) closePauseDialog() }}>
            <div className="modal-card" style={{ maxWidth: '440px' }}>
                <div className="session-dialog-header">
                    <div className="session-dialog-icon" style={{ background: 'rgba(245,158,11,0.12)', color: '#f59e0b' }}>
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                            <rect x="6" y="4" width="4" height="16" rx="1" />
                            <rect x="14" y="4" width="4" height="16" rx="1" />
                        </svg>
                    </div>
                    <div>
                        <h2 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)' }}>Pause Session</h2>
                        <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>Taking a break? Let your team know</p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} style={{ marginTop: '20px' }}>
                    <label className="input-label">Reason for Pause</label>
                    <textarea
                        value={reason}
                        onChange={e => setReason(e.target.value)}
                        className="input-field w-full"
                        placeholder="e.g. Lunch break, team meeting, personal errand…"
                        rows={3}
                        autoFocus
                    />

                    {error && (
                        <div style={{ marginTop: '12px', padding: '10px 12px', background: 'var(--danger-surface)', color: 'var(--danger)', borderRadius: 'var(--radius-md)', fontSize: '12px' }}>
                            {error}
                        </div>
                    )}

                    <div className="flex gap-3 mt-5">
                        <button type="button" onClick={closePauseDialog} className="btn-secondary flex-1">Cancel</button>
                        <button type="submit" disabled={loading} className="btn-primary flex-1" style={{ background: '#f59e0b', color: '#000' }}>
                            {loading ? 'Pausing…' : '⏸ Pause Session'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}

/* ─── TERMINATE DIALOG ──────────────────────────────── */
export function TerminateSessionDialog() {
    const { terminateDialogOpen, closeTerminateDialog, appendEvent, setStatus } = useSessionStore()
    const [workDecided, setWorkDecided] = useState('')
    const [workCompleted, setWorkCompleted] = useState('')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

    if (!terminateDialogOpen) return null

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        if (!workDecided.trim() || !workCompleted.trim()) {
            setError('Please fill in both fields before ending your session')
            return
        }
        setLoading(true)
        try {
            const { event } = await postEvent({ type: 'TERMINATE', workDecided, workCompleted })
            appendEvent(event)
            setStatus('TERMINATED')
            setWorkDecided('')
            setWorkCompleted('')
            setError('')
            closeTerminateDialog()
        } catch {
            setError('Failed to end session. Please try again.')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="modal-overlay" onClick={(e) => { if (e.target === e.currentTarget) closeTerminateDialog() }}>
            <div className="modal-card" style={{ maxWidth: '460px' }}>
                <div className="session-dialog-header">
                    <div className="session-dialog-icon" style={{ background: 'rgba(239,68,68,0.12)', color: '#ef4444' }}>
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
                            <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
                            <polyline points="16 17 21 12 16 7" />
                            <line x1="21" y1="12" x2="9" y2="12" />
                        </svg>
                    </div>
                    <div>
                        <h2 style={{ fontSize: '16px', fontWeight: 600, color: 'var(--text-primary)' }}>End Today's Session</h2>
                        <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>Wrap up and log your day's work</p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} style={{ marginTop: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                    <div>
                        <label className="input-label">Work Decided (Planned Tasks)</label>
                        <textarea
                            value={workDecided}
                            onChange={e => setWorkDecided(e.target.value)}
                            className="input-field w-full"
                            placeholder="What tasks did you plan to complete today?"
                            rows={3}
                            autoFocus
                        />
                    </div>
                    <div>
                        <label className="input-label">Work Completed</label>
                        <textarea
                            value={workCompleted}
                            onChange={e => setWorkCompleted(e.target.value)}
                            className="input-field w-full"
                            placeholder="What did you actually accomplish? Note any blockers or carry-overs…"
                            rows={3}
                        />
                    </div>

                    {error && (
                        <div style={{ padding: '10px 12px', background: 'var(--danger-surface)', color: 'var(--danger)', borderRadius: 'var(--radius-md)', fontSize: '12px' }}>
                            {error}
                        </div>
                    )}

                    <div className="flex gap-3">
                        <button type="button" onClick={closeTerminateDialog} className="btn-secondary flex-1">Cancel</button>
                        <button type="submit" disabled={loading} className="btn-destructive flex-1" style={{ background: 'var(--danger-surface)', border: '1px solid rgba(239,68,68,0.4)', color: 'var(--danger)' }}>
                            {loading ? 'Ending…' : '■ End Session'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    )
}