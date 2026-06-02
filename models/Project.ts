// models/Project.ts
import mongoose, { Schema, Document, Model } from 'mongoose'

export interface IProjectDoc extends Document {
  title: string
  description: string
  githubLink: string
  createdBy: mongoose.Types.ObjectId
  members: mongoose.Types.ObjectId[]
  createdAt: Date
  updatedAt: Date
}

const ProjectSchema = new Schema<IProjectDoc>(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String, required: true },
    githubLink: { type: String, required: true, trim: true },
    createdBy: { type: Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    members: [{ type: Schema.Types.ObjectId, ref: 'User' }],
  },
  { timestamps: true }
)

// Index for fast lookups by member
ProjectSchema.index({ members: 1 })

const Project: Model<IProjectDoc> =
  mongoose.models.Project ?? mongoose.model<IProjectDoc>('Project', ProjectSchema)

export default Project
