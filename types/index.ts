// types/index.ts

export type UserRole = 'EMPLOYEE' | 'MANAGER' | 'ADMIN'
export type TaskStatus = 'TODO' | 'IN_PROGRESS' | 'DONE' | 'ACCEPTED' | 'REOPENED'

export interface IUser {
  _id: string
  email: string
  name: string
  role: UserRole
  departmentId?: string
  managerId?: string
  createdAt: Date
}

export interface IReview {
  reviewedBy: string
  reviewerName?: string
  accepted: boolean
  comment: string
  reviewedAt: string
}

export interface ITask {
  _id: string
  projectId: string
  title: string
  description: string
  assignedTo: string
  assigneeName?: string
  status: TaskStatus
  statusDescription: string
  order: number
  reviews: IReview[]
  completedAt: string | null
  createdAt: string
  updatedAt: string
}

export interface IProject {
  _id: string
  title: string
  description: string
  githubLink: string
  createdBy: string
  creatorName?: string
  members: string[]
  memberDetails?: { _id: string; name: string; email: string }[]
  tasks?: ITask[]
  taskStats?: {
    total: number
    completed: number
    inProgress: number
    pendingReview: number
  }
  createdAt: string
  updatedAt: string
}