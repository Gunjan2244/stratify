// models/SessionEvent.ts
import mongoose, { Schema, Document, Model } from 'mongoose'

export type SessionEventType = 'START' | 'PAUSE' | 'RESUME' | 'TERMINATE'

export interface ISessionEventDoc extends Document {
  userId: mongoose.Types.ObjectId
  date: string // YYYY-MM-DD — reset key
  type: SessionEventType
  timestamp: Date
  objectives?: string      // on START
  pauseReason?: string     // on PAUSE
  workDecided?: string     // on TERMINATE
  workCompleted?: string   // on TERMINATE
  createdAt: Date
}

const SessionEventSchema = new Schema<ISessionEventDoc>(
  {
    userId: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    date: { type: String, required: true, index: true }, // 'YYYY-MM-DD'
    type: { type: String, enum: ['START', 'PAUSE', 'RESUME', 'TERMINATE'], required: true },
    timestamp: { type: Date, required: true },
    objectives: { type: String, default: '' },
    pauseReason: { type: String, default: '' },
    workDecided: { type: String, default: '' },
    workCompleted: { type: String, default: '' },
  },
  { timestamps: true }
)

SessionEventSchema.index({ userId: 1, date: 1 })

const SessionEvent: Model<ISessionEventDoc> =
  mongoose.models.SessionEvent ??
  mongoose.model<ISessionEventDoc>('SessionEvent', SessionEventSchema)

export default SessionEvent