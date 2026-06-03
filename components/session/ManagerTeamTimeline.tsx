// components/session/ManagerTeamTimeline.tsx
'use client'

import { useState, useEffect } from 'react'

interface TeamEvent {
    _id: string
    type: 'START' | 'PAUSE' | 'RESUME' | 'TERMINATE'
    timestamp: string
    objectives?: string
    pauseReason?: string
    workDecided?: string
    workCompleted?: string
}

interface TeamMember {
    userId: string
    name: string
    email: string
    events: TeamEvent[]
}

const EVENT_COLORS: Record<string, string> = {
    START: '#22c55e',
    RESUME: '#3b82f6',
    PAUSE: '#f59e0b',
    TERMINATE: '#ef4444',
}

const EVENT_LABELS: Record<string, string> = {
    START: 'Signed In',
    RESUME: 'Resumed',
    PAUSE: 'Break',
    TERMINATE: 'Signed Out',
}

function formatTime(iso: string) {
    return new Date(iso).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })
}

function deriveCurrentStatus(events: TeamEvent[]) {
    if (events.length === 0) return 'OFFLINE'
    const last = events[events.length - 1]
    if (last.type === 'START' || last.type === 'RESUME') return 'ACTIVE'
    if (last.type === 'PAUSE') return 'PAUSED'
    if (last.type === 'TERMINATE') return 'OFFLINE'
    return 'OFFLINE'
}

// 24hr timeline: 0 to 24 hours
function toPct(iso: string) {
    const d = new Date(iso)
    const mins = d.getHours() * 60 + d.getMinutes()
    return (mins / (24 * 60)) * 100
}

function computeSegments(events: TeamEvent[]) {
    const now = new Date()
    const nowPct = toPct(now.toISOString())
    const segments: Array<{ start: number; end: number; type: 'ACTIVE' | 'PAUSED' }> = []

    for (let i = 0; i < events.length; i++) {
        const cur = events[i]
        const next = events[i + 1]
        const startPct = toPct(cur.timestamp)
        const endPct = next
            ? toPct(next.timestamp)
            : cur.type === 'TERMINATE' ? toPct(cur.timestamp) : nowPct

        if (cur.type === 'START' || cur.type === 'RESUME') {
            segments.push({ start: startPct, end: endPct, type: 'ACTIVE' })
        } else if (cur.type === 'PAUSE') {
            segments.push({ start: startPct, end: endPct, type: 'PAUSED' })
        }
    }
    return segments
}

function EventDot({ event }: { event: TeamEvent }) {
    const [show, setShow] = useState(false)
    const color = EVENT_COLORS[event.type]
    const label = EVENT_LABELS[event.type]

    const details: string[] = []
    if (event.objectives) details.push(`Objectives: ${event.objectives}`)
    if (event.pauseReason) details.push(`Break reason: ${event.pauseReason}`)
    if (event.workDecided) details.push(`Planned: ${event.workDecided}`)
    if (event.workCompleted) details.push(`Completed: ${event.workCompleted}`)

    return (
        <div
            style={{ position: 'absolute', left: `${toPct(event.timestamp)}%`, top: '50%', transform: 'translate(-50%, -50%)', zIndex: 5 }}
            onMouseEnter={() => setShow(true)}
            onMouseLeave={() => setShow(false)}
        >
            <div
                style={{
                    width: '10px',
                    height: '10px',
                    borderRadius: '50%',
                    background: color,
                    border: '2px solid var(--surface-base)',
                    cursor: 'pointer',
                    transition: 'transform 150ms',
                    transform: show ? 'scale(1.4)' : 'scale(1)',
                }}
            />

            {show && (
                <div style={{
                    position: 'absolute',
                    bottom: 'calc(100% + 10px)',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    background: 'var(--surface-overlay)',
                    border: `1px solid ${color}33`,
                    borderRadius: 'var(--radius-md)',
                    padding: '10px 12px',
                    minWidth: '180px',
                    maxWidth: '260px',
                    boxShadow: '0 8px 24px rgba(0,0,0,0.5)',
                    pointerEvents: 'none',
                    zIndex: 100,
                }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: details.length > 0 ? '8px' : 0 }}>
                        <span style={{ fontSize: '11px', fontWeight: 700, color, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</span>
                        <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{formatTime(event.timestamp)}</span>
                    </div>
                    {details.map((d, i) => (
                        <p key={i} style={{ fontSize: '11px', color: 'var(--text-secondary)', lineHeight: '1.5', marginTop: '2px', whiteSpace: 'pre-wrap' }}>{d}</p>
                    ))}
                </div>
            )}
        </div>
    )
}

function MemberRow({ member }: { member: TeamMember }) {
    const segments = computeSegments(member.events)
    const status = deriveCurrentStatus(member.events)

    const statusStyles: Record<string, { bg: string; color: string; label: string }> = {
        ACTIVE: { bg: 'rgba(34,197,94,0.12)', color: '#22c55e', label: 'Active' },
        PAUSED: { bg: 'rgba(245,158,11,0.12)', color: '#f59e0b', label: 'On break' },
        OFFLINE: { bg: 'rgba(82,82,91,0.12)', color: '#71717a', label: 'Offline' },
    }
    const sty = statusStyles[status]

    return (
        <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
            {/* Member info */}
            <td style={{ padding: '12px 16px', verticalAlign: 'middle', width: '180px', minWidth: '180px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <div style={{
                        width: '30px', height: '30px', borderRadius: '50%',
                        background: `${sty.color}22`, color: sty.color,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: '12px', fontWeight: 700, flexShrink: 0,
                    }}>
                        {member.name[0]?.toUpperCase()}
                    </div>
                    <div style={{ minWidth: 0 }}>
                        <p style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '2px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {member.name}
                        </p>
                        <span style={{ fontSize: '10px', padding: '1px 6px', borderRadius: '999px', background: sty.bg, color: sty.color, fontWeight: 500 }}>
                            {status === 'ACTIVE' && <span style={{ display: 'inline-block', width: '5px', height: '5px', borderRadius: '50%', background: '#22c55e', marginRight: '4px', animation: 'session-pulse 2s infinite' }} />}
                            {sty.label}
                        </span>
                    </div>
                </div>
            </td>

            {/* 24hr timeline bar */}
            <td style={{ padding: '8px 16px 8px 0', verticalAlign: 'middle' }}>
                <div style={{ position: 'relative', height: '28px', background: 'var(--surface-inset)', borderRadius: '6px', overflow: 'visible', border: '1px solid var(--border-subtle)' }}>
                    {/* Segments */}
                    {segments.map((seg, i) => (
                        <div
                            key={i}
                            style={{
                                position: 'absolute',
                                left: `${seg.start}%`,
                                width: `${seg.end - seg.start}%`,
                                top: 0, bottom: 0,
                                background: seg.type === 'ACTIVE'
                                    ? 'linear-gradient(90deg, rgba(34,197,94,0.45), rgba(34,197,94,0.25))'
                                    : 'linear-gradient(90deg, rgba(245,158,11,0.4), rgba(245,158,11,0.2))',
                                borderLeft: `2px solid ${seg.type === 'ACTIVE' ? '#22c55e' : '#f59e0b'}`,
                            }}
                        />
                    ))}

                    {/* Event dots */}
                    {member.events.map((ev, i) => (
                        <EventDot key={i} event={ev} />
                    ))}
                </div>
            </td>
        </tr>
    )
}

export function ManagerTeamTimeline() {
    const [team, setTeam] = useState<TeamMember[]>([])
    const [loading, setLoading] = useState(true)
    const [date, setDate] = useState(new Date().toISOString().slice(0, 10))

    useEffect(() => {
        let cancelled = false
        async function load() {
            setLoading(true)
            try {
                const res = await fetch(`/api/sessions/team?date=${date}`)
                const data = await res.json()
                if (!cancelled && data.team) setTeam(data.team)
            } catch { }
            if (!cancelled) setLoading(false)
        }
        load()
        const interval = setInterval(load, 30_000)
        return () => { cancelled = true; clearInterval(interval) }
    }, [date])

    const today = new Date().toISOString().slice(0, 10)
    const isToday = date === today

    // Hour markers for 24hr
    const hourMarkers = Array.from({ length: 25 }, (_, i) => {
        const pct = (i / 24) * 100
        const h = i
        const label = h === 0 ? '12am' : h < 12 ? `${h}am` : h === 12 ? '12pm' : `${h - 12}pm`
        return { pct, label, h }
    }).filter(m => m.h % 3 === 0)

    const activeCount = team.filter(m => deriveCurrentStatus(m.events) === 'ACTIVE').length
    const pausedCount = team.filter(m => deriveCurrentStatus(m.events) === 'PAUSED').length
    const offlineCount = team.filter(m => deriveCurrentStatus(m.events) === 'OFFLINE').length

    return (
        <div className="base-card !p-0 overflow-hidden" style={{ marginTop: '24px' }}>
            {/* Header */}
            <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <h2 className="h2-title">Team Activity</h2>
                    {isToday && (
                        <div style={{ display: 'flex', gap: '10px' }}>
                            {activeCount > 0 && (
                                <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '999px', background: 'rgba(34,197,94,0.12)', color: '#22c55e', fontWeight: 500 }}>
                                    {activeCount} active
                                </span>
                            )}
                            {pausedCount > 0 && (
                                <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '999px', background: 'rgba(245,158,11,0.12)', color: '#f59e0b', fontWeight: 500 }}>
                                    {pausedCount} on break
                                </span>
                            )}
                            {offlineCount > 0 && (
                                <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '999px', background: 'rgba(82,82,91,0.12)', color: '#71717a', fontWeight: 500 }}>
                                    {offlineCount} offline
                                </span>
                            )}
                        </div>
                    )}
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <input
                        type="date"
                        value={date}
                        onChange={e => setDate(e.target.value)}
                        className="input-field"
                        style={{ height: '30px', fontSize: '12px', padding: '0 10px' }}
                        max={today}
                    />
                    {isToday && (
                        <span style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '11px', color: 'var(--text-muted)' }}>
                            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#22c55e', animation: 'session-pulse 2s infinite', display: 'inline-block' }} />
                            Live · updates every 30s
                        </span>
                    )}
                </div>
            </div>

            {loading ? (
                <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
                    Loading team activity…
                </div>
            ) : team.length === 0 ? (
                <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
                    No team activity found for this date. Make sure employees are assigned to you as their manager.
                </div>
            ) : (
                <div style={{ overflowX: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '700px' }}>
                        {/* Hour header */}
                        <thead>
                            <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                                <th style={{ width: '180px', minWidth: '180px', padding: '8px 16px', textAlign: 'left' }}>
                                    <span className="label-caption">Member</span>
                                </th>
                                <th style={{ padding: '8px 16px 8px 0' }}>
                                    <div style={{ position: 'relative', height: '16px' }}>
                                        {hourMarkers.map(m => (
                                            <span
                                                key={m.h}
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
                                </th>
                            </tr>
                        </thead>
                        <tbody>
                            {team.map(member => (
                                <MemberRow key={member.userId} member={member} />
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* Legend */}
            <div style={{ padding: '10px 20px', borderTop: '1px solid var(--border-subtle)', display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <div style={{ width: '12px', height: '4px', borderRadius: '2px', background: 'rgba(34,197,94,0.45)' }} />
                    <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Active</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <div style={{ width: '12px', height: '4px', borderRadius: '2px', background: 'rgba(245,158,11,0.4)' }} />
                    <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>On break</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#22c55e' }} />
                    <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Sign in</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#f59e0b' }} />
                    <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Break start</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#3b82f6' }} />
                    <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Resumed</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#ef4444' }} />
                    <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Sign out</span>
                </div>
                <span style={{ fontSize: '10px', color: 'var(--text-muted)', marginLeft: 'auto', fontStyle: 'italic' }}>
                    Hover dots to see objectives & notes
                </span>
            </div>
        </div>
    )
}