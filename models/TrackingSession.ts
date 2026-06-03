// models/TrackingSession.ts
import mongoose, { Schema, Document, Model } from 'mongoose'

export type EventType = 'START' | 'PAUSE' | 'RESUME' | 'TERMINATE'

export interface ITrackingEvent {
    type: EventType
    timestamp: Date
    objective?: string     // on START
    pauseReason?: string   // on PAUSE
    workDecided?: string   // on TERMINATE
    workCompleted?: string // on TERMINATE
}

export interface ITrackingSessionDoc extends Document {
    userId: mongoose.Types.ObjectId
    date: string            // YYYY-MM-DD — one doc per user per day
    events: ITrackingEvent[]
    isActive: boolean       // session running right now
    isPaused: boolean
    archivedAt?: Date
    createdAt: Date
    updatedAt: Date
}

const TrackingEventSchema = new Schema<ITrackingEvent>(
    {
        type: { type: String, enum: ['START', 'PAUSE', 'RESUME', 'TERMINATE'], required: true },
        timestamp: { type: Date, required: true },
        objective: { type: String, default: '' },
        pauseReason: { type: String, default: '' },
        workDecided: { type: String, default: '' },
        workCompleted: { type: String, default: '' },
    },
    { _id: false }
)

const TrackingSessionSchema = new Schema<ITrackingSessionDoc>(
    {
        userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
        date: { type: String, required: true, index: true }, // e.g. "2025-06-03"
        events: { type: [TrackingEventSchema], default: [] },
        isActive: { type: Boolean, default: false },
        isPaused: { type: Boolean, default: false },
        archivedAt: { type: Date, default: null },
    },
    { timestamps: true }
)

TrackingSessionSchema.index({ userId: 1, date: 1 }, { unique: true })

const TrackingSession: Model<ITrackingSessionDoc> =
    mongoose.models.TrackingSession ??
    mongoose.model<ITrackingSessionDoc>('TrackingSession', TrackingSessionSchema)

export default TrackingSession