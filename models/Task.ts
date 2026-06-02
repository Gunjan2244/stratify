// models/Task.ts
import mongoose, { Schema, Document, Model } from 'mongoose'

export interface IReview {
  reviewedBy: mongoose.Types.ObjectId
  accepted: boolean
  comment: string
  reviewedAt: Date
}

export interface ITaskDoc extends Document {
  projectId: mongoose.Types.ObjectId
  title: string
  description: string
  assignedTo: mongoose.Types.ObjectId
  status: 'TODO' | 'IN_PROGRESS' | 'DONE' | 'ACCEPTED' | 'REOPENED'
  statusDescription: string
  order: number
  reviews: IReview[]
  completedAt: Date | null
  createdAt: Date
  updatedAt: Date
}

const ReviewSchema = new Schema<IReview>(
  {
    reviewedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    accepted: { type: Boolean, required: true },
    comment: { type: String, default: '' },
    reviewedAt: { type: Date, default: Date.now },
  },
  { _id: false }
)

const TaskSchema = new Schema<ITaskDoc>(
  {
    projectId: { type: Schema.Types.ObjectId, ref: 'Project', required: true, index: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    assignedTo: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    status: {
      type: String,
      enum: ['TODO', 'IN_PROGRESS', 'DONE', 'ACCEPTED', 'REOPENED'],
      default: 'TODO',
      index: true,
    },
    statusDescription: { type: String, default: '' },
    order: { type: Number, required: true, default: 0 },
    reviews: { type: [ReviewSchema], default: [] },
    completedAt: { type: Date, default: null },
  },
  { timestamps: true }
)

// Compound index for ordering tasks within a project
TaskSchema.index({ projectId: 1, order: 1 })

const Task: Model<ITaskDoc> =
  mongoose.models.Task ?? mongoose.model<ITaskDoc>('Task', TaskSchema)

export default Task
