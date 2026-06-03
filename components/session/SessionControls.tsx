// components/session/SessionControls.tsx
'use client'

import { useEffect } from 'react'
import { useSessionStore, deriveStatus } from '@/store/sessionStore'
import { StartSessionDialog, PauseSessionDialog, TerminateSessionDialog } from './SessionDialogs'

export function SessionControls() {
    const {
        status, events, setEvents, setStatus, setLoading,
        openStartDialog, openPauseDialog, openTerminateDialog,
        appendEvent,
    } = useSessionStore()

    // Load today's events on mount
    useEffect(() => {
        async function load() {
            setLoading(true)
            try {
                const res = await fetch('/api/sessions')
                const data = await res.json()
                if (data.events) {
                    setEvents(data.events)
                    setStatus(deriveStatus(data.events))
                }
            } catch { }
            setLoading(false)
        }
        load()
    }, [])

    // Resume handler - no dialog needed, just logs RESUME event
    async function handleResume() {
        try {
            const res = await fetch('/api/sessions', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ type: 'RESUME' }),
            })
            const data = await res.json()
            if (data.event) {
                appendEvent(data.event)
                setStatus('ACTIVE')
            }
        } catch { }
    }

    const statusConfig = {
        IDLE: { dot: '#52525b', label: 'Not started', pulse: false },
        ACTIVE: { dot: '#22c55e', label: 'Active', pulse: true },
        PAUSED: { dot: '#f59e0b', label: 'On break', pulse: false },
        TERMINATED: { dot: '#ef4444', label: 'Session ended', pulse: false },
    }[status] ?? { dot: '#52525b', label: 'Idle', pulse: false }

    return (
        <>
            {/* Session status bar */}
            <div className="session-control-bar">
                {/* Status indicator */}
                <div className="flex items-center gap-2">
                    <span
                        className="session-status-dot"
                        style={{
                            background: statusConfig.dot,
                            boxShadow: statusConfig.pulse ? `0 0 0 0 ${statusConfig.dot}` : 'none',
                            animation: statusConfig.pulse ? 'session-pulse 2s infinite' : 'none',
                        }}
                    />
                    <span style={{ fontSize: '12px', fontWeight: 500, color: 'var(--text-secondary)' }}>
                        {statusConfig.label}
                    </span>
                </div>

                {/* Control buttons */}
                <div className="flex items-center gap-2">
                    {status === 'IDLE' && (
                        <button
                            onClick={openStartDialog}
                            className="session-btn session-btn-start"
                        >
                            <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
                                <polygon points="5 3 19 12 5 21 5 3" />
                            </svg>
                            Start Session
                        </button>
                    )}

                    {status === 'ACTIVE' && (
                        <>
                            <button onClick={openPauseDialog} className="session-btn session-btn-pause">
                                <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
                                    <rect x="6" y="4" width="4" height="16" rx="1" />
                                    <rect x="14" y="4" width="4" height="16" rx="1" />
                                </svg>
                                Pause
                            </button>
                            <button onClick={openTerminateDialog} className="session-btn session-btn-end">
                                <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
                                    <rect x="4" y="4" width="16" height="16" rx="2" />
                                </svg>
                                End Day
                            </button>
                        </>
                    )}

                    {status === 'PAUSED' && (
                        <>
                            <button onClick={handleResume} className="session-btn session-btn-start">
                                <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
                                    <polygon points="5 3 19 12 5 21 5 3" />
                                </svg>
                                Resume
                            </button>
                            <button onClick={openTerminateDialog} className="session-btn session-btn-end">
                                <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
                                    <rect x="4" y="4" width="16" height="16" rx="2" />
                                </svg>
                                End Day
                            </button>
                        </>
                    )}

                    {status === 'TERMINATED' && (
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                            Day completed — resets at midnight
                        </span>
                    )}
                </div>
            </div>

            {/* Dialogs */}
            <StartSessionDialog />
            <PauseSessionDialog />
            <TerminateSessionDialog />
        </>
    )
}