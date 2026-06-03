// store/sessionStore.ts
import { create } from 'zustand'

export type SessionStatus = 'IDLE' | 'ACTIVE' | 'PAUSED' | 'TERMINATED'

export interface SessionEvent {
    _id: string
    type: 'START' | 'PAUSE' | 'RESUME' | 'TERMINATE'
    timestamp: string
    objectives?: string
    pauseReason?: string
    workDecided?: string
    workCompleted?: string
}

interface SessionState {
    status: SessionStatus
    events: SessionEvent[]
    isLoading: boolean
    // Dialog visibility
    startDialogOpen: boolean
    pauseDialogOpen: boolean
    terminateDialogOpen: boolean

    // Actions
    setStatus: (s: SessionStatus) => void
    setEvents: (events: SessionEvent[]) => void
    appendEvent: (event: SessionEvent) => void
    setLoading: (b: boolean) => void
    openStartDialog: () => void
    closeStartDialog: () => void
    openPauseDialog: () => void
    closePauseDialog: () => void
    openTerminateDialog: () => void
    closeTerminateDialog: () => void
}

export const useSessionStore = create<SessionState>((set) => ({
    status: 'IDLE',
    events: [],
    isLoading: false,
    startDialogOpen: false,
    pauseDialogOpen: false,
    terminateDialogOpen: false,

    setStatus: (status) => set({ status }),
    setEvents: (events) => set({ events }),
    appendEvent: (event) => set((s) => ({ events: [...s.events, event] })),
    setLoading: (isLoading) => set({ isLoading }),
    openStartDialog: () => set({ startDialogOpen: true }),
    closeStartDialog: () => set({ startDialogOpen: false }),
    openPauseDialog: () => set({ pauseDialogOpen: true }),
    closePauseDialog: () => set({ pauseDialogOpen: false }),
    openTerminateDialog: () => set({ terminateDialogOpen: true }),
    closeTerminateDialog: () => set({ terminateDialogOpen: false }),
}))

// Derive session status from events
export function deriveStatus(events: SessionEvent[]): SessionStatus {
    if (events.length === 0) return 'IDLE'
    const last = events[events.length - 1]
    switch (last.type) {
        case 'START': return 'ACTIVE'
        case 'RESUME': return 'ACTIVE'
        case 'PAUSE': return 'PAUSED'
        case 'TERMINATE': return 'TERMINATED'
        default: return 'IDLE'
    }
}