// app/api/seed/route.ts
import { NextResponse } from 'next/server'
import connectDB from '@/lib/mongodb'
import User from '@/models/User'
import Project from '@/models/Project'
import Task from '@/models/Task'
import bcrypt from 'bcryptjs'

export async function POST() {
  await connectDB()

  const emails = ['sarah@demo.com', 'arun@demo.com', 'admin@demo.com', 'priya@demo.com', 'raj@demo.com']

  // Wipe existing seed data
  const existingUsers = await User.find({ email: { $in: emails } })
  const userIds = existingUsers.map(u => u._id)

  const existingProjects = await Project.find({ createdBy: { $in: userIds } })
  const projectIds = existingProjects.map(p => p._id)

  await Promise.all([
    Task.deleteMany({ projectId: { $in: projectIds } }),
    Project.deleteMany({ createdBy: { $in: userIds } }),
    User.deleteMany({ email: { $in: emails } }),
  ])

  const hash = await bcrypt.hash('demo1234', 10)

  // Create Users
  const [arun, raj, admin] = await User.insertMany([
    { email: 'arun@demo.com', name: 'Arun Sharma', passwordHash: hash, role: 'MANAGER' },
    { email: 'raj@demo.com', name: 'Raj Patel', passwordHash: hash, role: 'MANAGER' },
    { email: 'admin@demo.com', name: 'Admin User', passwordHash: hash, role: 'ADMIN' },
  ])

  const [sarah, priya] = await User.insertMany([
    { email: 'sarah@demo.com', name: 'Sarah Chen', passwordHash: hash, role: 'EMPLOYEE', managerId: arun._id },
    { email: 'priya@demo.com', name: 'Priya Singh', passwordHash: hash, role: 'EMPLOYEE', managerId: raj._id },
  ])

  // Create Projects
  const project1 = await Project.create({
    title: 'Stratify Platform v2',
    description: 'Complete rebuild of the Stratify goal-tracking platform into a project-based task management system with real-time collaboration features.',
    githubLink: 'https://github.com/stratify/platform-v2',
    createdBy: arun._id,
    members: [arun._id, sarah._id],
  })

  const project2 = await Project.create({
    title: 'API Performance Optimization',
    description: 'Reduce API response times by 40% through database query optimization, Redis caching, and connection pooling across all microservices.',
    githubLink: 'https://github.com/stratify/api-perf',
    createdBy: raj._id,
    members: [raj._id, priya._id],
  })

  const project3 = await Project.create({
    title: 'Mobile App Launch',
    description: 'Design and develop a cross-platform mobile application for Stratify using React Native, with offline-first capabilities.',
    githubLink: 'https://github.com/stratify/mobile-app',
    createdBy: arun._id,
    members: [arun._id, sarah._id, priya._id],
  })

  // Create Tasks for Project 1
  await Task.insertMany([
    { projectId: project1._id, title: 'Design new database schema', description: 'Create MongoDB schema for projects and tasks with proper indexes', assignedTo: sarah._id, status: 'ACCEPTED', order: 0, statusDescription: 'Schema designed and reviewed with team', reviews: [{ reviewedBy: arun._id, accepted: true, comment: 'Clean schema design!', reviewedAt: new Date('2025-05-20') }], completedAt: new Date('2025-05-19') },
    { projectId: project1._id, title: 'Build REST API endpoints', description: 'Implement CRUD APIs for projects and tasks', assignedTo: sarah._id, status: 'DONE', order: 1, statusDescription: 'All endpoints implemented with validation and error handling' },
    { projectId: project1._id, title: 'Create dashboard UI', description: 'Build project tiles dashboard with KPI cards and responsive grid', assignedTo: sarah._id, status: 'IN_PROGRESS', order: 2 },
    { projectId: project1._id, title: 'Implement task checklist', description: 'Interactive checklist with drag-to-reorder and inline editing', assignedTo: arun._id, status: 'TODO', order: 3 },
    { projectId: project1._id, title: 'Add review workflow', description: 'Manager accept/reject flow with review history', assignedTo: sarah._id, status: 'TODO', order: 4 },
  ])

  // Create Tasks for Project 2
  await Task.insertMany([
    { projectId: project2._id, title: 'Profile slow database queries', description: 'Use MongoDB profiler to identify queries taking >100ms', assignedTo: priya._id, status: 'ACCEPTED', order: 0, statusDescription: 'Found 12 slow queries, documented in wiki', reviews: [{ reviewedBy: raj._id, accepted: true, comment: 'Thorough analysis', reviewedAt: new Date('2025-05-15') }], completedAt: new Date('2025-05-14') },
    { projectId: project2._id, title: 'Implement Redis caching layer', description: 'Add Redis cache for frequently accessed data with TTL strategy', assignedTo: priya._id, status: 'REOPENED', order: 1, statusDescription: 'Implemented caching for user and project endpoints', reviews: [{ reviewedBy: raj._id, accepted: false, comment: 'Cache invalidation strategy needs work — stale data observed in testing', reviewedAt: new Date('2025-05-22') }] },
    { projectId: project2._id, title: 'Add connection pooling', description: 'Configure connection pooling for MongoDB and Redis connections', assignedTo: priya._id, status: 'TODO', order: 2 },
    { projectId: project2._id, title: 'Load testing', description: 'Run load tests with k6 and document results', assignedTo: raj._id, status: 'TODO', order: 3 },
  ])

  // Create Tasks for Project 3
  await Task.insertMany([
    { projectId: project3._id, title: 'Setup React Native project', description: 'Initialize project with Expo and configure navigation', assignedTo: sarah._id, status: 'DONE', order: 0, statusDescription: 'Project initialized with Expo Router and all dependencies configured' },
    { projectId: project3._id, title: 'Design mobile UI mockups', description: 'Create Figma mockups for all screens', assignedTo: priya._id, status: 'IN_PROGRESS', order: 1 },
    { projectId: project3._id, title: 'Implement authentication flow', description: 'Build login/register screens with secure token storage', assignedTo: sarah._id, status: 'TODO', order: 2 },
  ])

  return NextResponse.json({
    message: 'Seed complete',
    accounts: [
      { email: 'sarah@demo.com', password: 'demo1234', role: 'EMPLOYEE' },
      { email: 'arun@demo.com', password: 'demo1234', role: 'MANAGER' },
      { email: 'admin@demo.com', password: 'demo1234', role: 'ADMIN' },
      { email: 'priya@demo.com', password: 'demo1234', role: 'EMPLOYEE' },
      { email: 'raj@demo.com', password: 'demo1234', role: 'MANAGER' },
    ],
    stats: { users: 5, projects: 3, tasks: 12 },
  })
}