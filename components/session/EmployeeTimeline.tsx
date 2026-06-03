// components/session/EmployeeTimeline.tsx
'use client'

import { useState } from 'react'
import { useSessionStore } from '@/store/sessionStore'
import type { SessionEvent } from '@/store/sessionStore'

const EVENT_CONFIG = {
    START: {
        label: 'Signed In',
        color: '#22c55e',
        bg: 'rgba(34,197,94,0.12)',
        icon: (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                <path d="M15 3h4a2 2 0 012 2v14a2 2 0 01-2 2h-4" />
                <polyline points="10 17 15 12 10 7" />
                <line x1="15" y1="12" x2="3" y2="12" />
            </svg>
        ),
        detail: (e: SessionEvent) => e.objectives ? { label: 'Objectives', text: e.objectives } : null,
    },
    PAUSE: {
        label: 'Break',
        color: '#f59e0b',
        bg: 'rgba(245,158,11,0.12)',
        icon: (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                <rect x="6" y="4" width="4" height="16" rx="1" />
                <rect x="14" y="4" width="4" height="16" rx="1" />
            </svg>
        ),
        detail: (e: SessionEvent) => e.pauseReason ? { label: 'Reason', text: e.pauseReason } : null,
    },
    RESUME: {
        label: 'Resumed',
        color: '#3b82f6',
        bg: 'rgba(59,130,246,0.12)',
        icon: (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <polygon points="5 3 19 12 5 21 5 3" />
            </svg>
        ),
        detail: () => null,
    },
    TERMINATE: {
        label: 'Signed Out',
        color: '#ef4444',
        bg: 'rgba(239,68,68,0.12)',
        icon: (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
                <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" />
                <polyline points="16 17 21 12 16 7" />
                <line x1="21" y1="12" x2="9" y2="12" />
            </svg>
        ),
        detail: (e: SessionEvent) => {
            if (e.workDecided || e.workCompleted) {
                return {
                    label: 'Work Summary',
                    text: [e.workDecided && `Planned: ${e.workDecided}`, e.workCompleted && `Completed: ${e.workCompleted}`].filter(Boolean).join('\n'),
                }
            }
            return null
        },
    },
}

function formatTime(iso: string) {
    return new Date(iso).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })
}

function computeSegments(events: SessionEvent[]) {
    // Returns colored segments between events for the visual bar
    type Segment = { startPct: number; endPct: number; type: 'ACTIVE' | 'PAUSED' | 'IDLE' }
    if (events.length === 0) return []

    const dayStart = new Date()
    dayStart.setHours(8, 0, 0, 0) // visual day starts at 8am
    const dayEnd = new Date()
    dayEnd.setHours(20, 0, 0, 0) // ends at 8pm
    const totalMs = dayEnd.getTime() - dayStart.getTime()

    function toPct(ts: string) {
        const ms = new Date(ts).getTime() - dayStart.getTime()
        return Math.max(0, Math.min(100, (ms / totalMs) * 100))
    }

    const segments: Segment[] = []
    const now = new Date()
    const nowPct = toPct(now.toISOString())

    for (let i = 0; i < events.length; i++) {
        const cur = events[i]
        const next = events[i + 1]
        const startPct = toPct(cur.timestamp)
        const endPct = next ? toPct(next.timestamp) : (cur.type === 'TERMINATE' ? toPct(cur.timestamp) : nowPct)

        if (cur.type === 'START' || cur.type === 'RESUME') {
            segments.push({ startPct, endPct, type: 'ACTIVE' })
        } else if (cur.type === 'PAUSE') {
            segments.push({ startPct, endPct, type: 'PAUSED' })
        }
    }

    return segments
}

function EventBadge({ event }: { event: SessionEvent }) {
    const [infoOpen, setInfoOpen] = useState(false)
    const config = EVENT_CONFIG[event.type]
    const detail = config.detail(event)

    return (
        <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}>
            <div
                className="event-badge"
                style={{ background: config.bg, color: config.color, borderColor: `${config.color}33` }}
            >
                <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                    {config.icon}
                    <span style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.03em' }}>{config.label}</span>
                    <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{formatTime(event.timestamp)}</span>
                </span>
                {detail && (
                    <button
                        onClick={(e) => { e.stopPropagation(); setInfoOpen(!infoOpen) }}
                        style={{
                            marginLeft: '6px',
                            width: '16px',
                            height: '16px',
                            borderRadius: '50%',
                            background: `${config.color}22`,
                            border: `1px solid ${config.color}44`,
                            color: config.color,
                            fontSize: '10px',
                            fontWeight: 700,
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            cursor: 'pointer',
                            lineHeight: 1,
                        }}
                        title="View details"
                    >
                        i
                    </button>
                )}
            </div>

            {/* Info popover */}
            {infoOpen && detail && (
                <div
                    style={{
                        position: 'absolute',
                        top: 'calc(100% + 8px)',
                        left: 0,
                        zIndex: 50,
                        background: 'var(--surface-overlay)',
                        border: `1px solid ${config.color}33`,
                        borderRadius: 'var(--radius-md)',
                        padding: '12px 14px',
                        minWidth: '220px',
                        maxWidth: '300px',
                        boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
                        animation: 'scale-in 150ms ease',
                    }}
                    onClick={e => e.stopPropagation()}
                >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                        <span style={{ fontSize: '10px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: config.color }}>
                            {detail.label}
                        </span>
                        <button onClick={() => setInfoOpen(false)} style={{ color: 'var(--text-muted)', fontSize: '14px', lineHeight: 1 }}>×</button>
                    </div>
                    <p style={{ fontSize: '12px', color: 'var(--text-secondary)', lineHeight: '1.6', whiteSpace: 'pre-line' }}>{detail.text}</p>
                </div>
            )}
        </div>
    )
}

export function EmployeeTimeline() {
    const { events, status } = useSessionStore()

    const today = new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
    const segments = computeSegments(events)

    // Compute total active time
    let activeMs = 0
    for (const seg of segments) {
        if (seg.type === 'ACTIVE') {
            const dayStart = new Date(); dayStart.setHours(8, 0, 0, 0)
            const dayEnd = new Date(); dayEnd.setHours(20, 0, 0, 0)
            const totalMs = dayEnd.getTime() - dayStart.getTime()
            activeMs += ((seg.endPct - seg.startPct) / 100) * totalMs
        }
    }
    const activeHrs = Math.floor(activeMs / 3_600_000)
    const activeMins = Math.floor((activeMs % 3_600_000) / 60_000)

    if (events.length === 0) {
        return (
            <div className="base-card" style={{ marginTop: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                    <h2 className="h2-title">Today's Timeline</h2>
                    <span className="mono-id">{today}</span>
                </div>
                <div style={{ textAlign: 'center', padding: '32px 20px', color: 'var(--text-muted)', fontSize: '13px' }}>
                    <div style={{ width: '48px', height: '48px', margin: '0 auto 12px', borderRadius: '50%', background: 'var(--surface-overlay)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round">
                            <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
                        </svg>
                    </div>
                    Start your session to begin tracking
                </div>
            </div>
        )
    }

    // Hour markers for visual bar (8am - 8pm)
    const hourMarkers = Array.from({ length: 13 }, (_, i) => {
        const h = 8 + i
        const pct = (i / 12) * 100
        const label = h <= 12 ? `${h}am` : h === 12 ? '12pm' : `${h - 12}pm`
        return { pct, label }
    })

    return (
        <div className="base-card" style={{ marginTop: '20px' }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <h2 className="h2-title">Today's Timeline</h2>
                    {status === 'ACTIVE' && (
                        <span className="status-badge status-in-progress" style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#93c5fd', animation: 'session-pulse 2s infinite', display: 'inline-block' }} />
                            Live
                        </span>
                    )}
                </div>
                <div style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                    {activeMs > 0 && (
                        <span style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                            <span style={{ color: '#22c55e', fontWeight: 600 }}>{activeHrs}h {activeMins}m</span> active
                        </span>
                    )}
                    <span className="mono-id">{today}</span>
                </div>
            </div>

            {/* Visual timeline bar */}
            <div style={{ marginBottom: '20px' }}>
                <div style={{ position: 'relative', height: '36px', marginBottom: '6px' }}>
                    {/* Background track */}
                    <div style={{
                        position: 'absolute', inset: 0,
                        background: 'var(--surface-inset)',
                        borderRadius: '8px',
                        overflow: 'hidden',
                        border: '1px solid var(--border-subtle)',
                    }}>
                        {/* Colored segments */}
                        {segments.map((seg, i) => (
                            <div
                                key={i}
                                style={{
                                    position: 'absolute',
                                    left: `${seg.startPct}%`,
                                    width: `${seg.endPct - seg.startPct}%`,
                                    top: 0, bottom: 0,
                                    background: seg.type === 'ACTIVE'
                                        ? 'linear-gradient(90deg, rgba(34,197,94,0.4), rgba(34,197,94,0.25))'
                                        : 'linear-gradient(90deg, rgba(245,158,11,0.35), rgba(245,158,11,0.2))',
                                    borderLeft: `2px solid ${seg.type === 'ACTIVE' ? '#22c55e' : '#f59e0b'}`,
                                    transition: 'width 0.5s ease',
                                }}
                            />
                        ))}

                        {/* Event markers */}
                        {events.map((ev, i) => {
                            const dayStart = new Date(); dayStart.setHours(8, 0, 0, 0)
                            const dayEnd = new Date(); dayEnd.setHours(20, 0, 0, 0)
                            const totalMs = dayEnd.getTime() - dayStart.getTime()
                            const ms = new Date(ev.timestamp).getTime() - dayStart.getTime()
                            const pct = Math.max(0, Math.min(100, (ms / totalMs) * 100))
                            const markerColor = EVENT_CONFIG[ev.type]?.color ?? '#52525b'

                            return (
                                <div
                                    key={i}
                                    style={{
                                        position: 'absolute',
                                        left: `${pct}%`,
                                        top: 0,
                                        bottom: 0,
                                        width: '2px',
                                        background: markerColor,
                                        zIndex: 2,
                                    }}
                                    title={`${EVENT_CONFIG[ev.type]?.label} at ${formatTime(ev.timestamp)}`}
                                />
                            )
                        })}
                    </div>
                </div>

                {/* Hour labels */}
                <div style={{ position: 'relative', height: '16px' }}>
                    {hourMarkers.filter((_, i) => i % 2 === 0).map((m) => (
                        <span
                            key={m.pct}
                            style={{
                                position: 'absolute',
                                left: `${m.pct}%`,
                                transform: 'translateX(-50%)',
                                fontSize: '9px',
                                color: 'var(--text-muted)',
                                whiteSpace: 'nowrap',
                            }}
                        >
                            {m.label}
                        </span>
                    ))}
                </div>
            </div>

            {/* Event badges */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', alignItems: 'flex-start' }}>
                {events.map((event, i) => (
                    <EventBadge key={i} event={event} />
                ))}
            </div>

            {/* Legend */}
            <div style={{ marginTop: '16px', paddingTop: '12px', borderTop: '1px solid var(--border-subtle)', display: 'flex', gap: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <div style={{ width: '12px', height: '4px', borderRadius: '2px', background: 'rgba(34,197,94,0.5)' }} />
                    <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Active</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <div style={{ width: '12px', height: '4px', borderRadius: '2px', background: 'rgba(245,158,11,0.5)' }} />
                    <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>On break</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginLeft: 'auto' }}>
                    <span style={{ fontSize: '10px', color: 'var(--text-muted)', fontStyle: 'italic' }}>Tap <strong style={{ color: 'var(--text-secondary)' }}>i</strong> on a badge to see details</span>
                </div>
            </div>
        </div>
    )
}