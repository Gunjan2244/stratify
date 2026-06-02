# Stratify

**Enterprise OKR & Goal Tracking Platform**

Stratify is a full-stack, offline-first goal management system built for engineering, sales, and operations teams. It provides structured OKR workflows with role-based access, real-time risk scoring, AI-assisted goal creation, and a robust offline sync engine that ensures continuity regardless of network state.

---

## Table of Contents

- [Overview](#overview)
- [Use Cases](#use-cases)
- [Feature Summary](#feature-summary)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Data Model](#data-model)
- [Offline-First Engine](#offline-first-engine)
- [Role-Based Access Control](#role-based-access-control)
- [Goal Lifecycle](#goal-lifecycle)
- [Risk Scoring](#risk-scoring)
- [AI Goal Suggestions](#ai-goal-suggestions)
- [API Reference](#api-reference)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Seeding Demo Data](#seeding-demo-data)
- [Project Structure](#project-structure)

---

## Overview

Stratify solves a common enterprise pain point: OKR tools that only work when everyone is at a desk, on a fast connection, with clean data. Field sales reps, remote engineers, and managers on the move need a system that works *offline* and syncs *transparently* when connectivity returns.

The platform implements a full goal lifecycle — creation, submission, approval, check-ins, completion — with audit trails, conflict resolution, and weighted achievement scoring baked in.

---

## Use Cases

### For Individual Contributors (Employees)
- Create and manage personal OKRs for the active quarter
- Log progress check-ins with notes, even when offline — they sync automatically on reconnect
- Submit goals for manager approval and track their status through the full workflow
- Request goal completion when targets are met

### For Team Leads and Managers
- Review, approve, or reject submitted goals with written feedback
- Assign goals directly to direct reports from the dashboard
- Monitor team progress in real time with per-employee achievement and risk breakdowns
- Add comments to individual check-ins for coaching context
- Share a goal across multiple team members, each with their own weighted copy

### For Admins and Operations
- View aggregated analytics across all active quarter goals
- Export a structured HTML report of the current quarter — goals, progress, risk scores — for stakeholder distribution
- Manage the full user roster and seed demo environments
- Scheduled risk score computation via cron endpoint

---

## Feature Summary

| Feature | Description |
|---|---|
| Offline-first writes | All mutations queue to IndexedDB and drain on reconnect |
| Conflict detection | 409 responses trigger a UI conflict alert with manual resolution |
| Role-based access | Employee / Manager / Admin with enforced server-side route guards |
| Goal lifecycle | DRAFT → PENDING_APPROVAL → APPROVED → PENDING_COMPLETION → COMPLETED |
| Weighted achievement | `achievement_score = (currentValue / targetValue) × weightage` |
| Risk scoring | Time-decay formula comparing elapsed quarter progress to goal progress |
| AI suggestions | Claude-powered OKR generation based on role and focus area |
| Check-in history | Timeline of progress updates with manager comment threading |
| Goal sharing | Clone a goal to a team member with independent weightage |
| Notifications | In-app bell with unread count; per-event alerts for approvals, rejections, risk flags |
| Audit log | Immutable record of every create, update, and sync event |
| Export | Single-click HTML report download for the active quarter |
| PWA support | Service worker with Workbox precaching and network-first API routing |

---

## Architecture

```
┌─────────────────────────────────────────────────────┐
│                    Next.js 15 App                    │
│                                                      │
│  ┌──────────────┐   ┌──────────────┐                │
│  │  App Router   │   │  API Routes   │                │
│  │  (RSC + CC)   │   │  (/api/*)     │                │
│  └──────┬───────┘   └──────┬───────┘                │
│         │                  │                         │
│  ┌──────▼──────────────────▼───────┐                │
│  │         React Query Layer        │                │
│  │  (optimistic updates, caching)   │                │
│  └──────────────────┬──────────────┘                │
│                     │                                │
│  ┌──────────────────▼──────────────┐                │
│  │       Offline Mutation Layer     │                │
│  │   mutateOfflineAware()           │                │
│  │   ┌───────────┐  ┌───────────┐  │                │
│  │   │  Online   │  │  Offline  │  │                │
│  │   │  → fetch  │  │  → Dexie  │  │                │
│  │   │           │  │  outbox   │  │                │
│  │   └───────────┘  └─────┬─────┘  │                │
│  └────────────────────────│────────┘                │
│                           │ drain on reconnect       │
└───────────────────────────│─────────────────────────┘
                            │
                    ┌───────▼───────┐
                    │   MongoDB      │
                    │  (Mongoose)    │
                    └───────────────┘
```

Reads are served by React Query with configurable `refetchInterval`. Writes go through `mutateOfflineAware()`, which checks `navigator.onLine`, attempts the request directly if online, and falls back to enqueueing in IndexedDB if offline or if the request fails. The sync engine drains the outbox on the `online` browser event and on a periodic interval.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript 5 |
| Database | MongoDB via Mongoose 9 |
| Auth | NextAuth.js 4 (JWT strategy, credentials provider) |
| Client state | TanStack React Query 5 |
| Forms | React Hook Form 7 + Zod 4 |
| Offline storage | Dexie.js 4 (IndexedDB wrapper) |
| Styling | Tailwind CSS 4 (utility-first, CSS variable design tokens) |
| Charts | Recharts 3 |
| AI | Anthropic Claude API (claude-sonnet-4) |
| PWA | next-pwa + Workbox 6 |
| Password hashing | bcryptjs |

---

## Data Model

### User
```
email        String (unique, lowercase)
name         String
passwordHash String (select: false)
role         EMPLOYEE | MANAGER | ADMIN
departmentId ObjectId → Department
managerId    ObjectId → User (self-referential)
isActive     Boolean
```

### Goal
```
userId          ObjectId → User
title           String
description     String
weightage       Number (1–100, sum across quarter ≤ 100)
status          DRAFT | PENDING_APPROVAL | APPROVED | LOCKED
                REJECTED | PENDING_COMPLETION | COMPLETED
targetValue     Number
currentValue    Number
achievementScore Number  (computed: progress% × weightage)
riskScore       Number   (computed: time-vs-progress decay)
quarterId       String   (e.g. "Q2-2025")
approvedBy      ObjectId → User
sharedGoalId    ObjectId → Goal
```

### CheckIn
```
goalId          ObjectId → Goal
progressValue   Number
progressPercent Number
notes           String (max 500)
managerComment  String (max 500)
submittedBy     ObjectId → User
submittedAt     Date (client-provided for offline replay)
serverReceivedAt Date
_syncMeta       { isOfflineWrite, clientTimestamp, deviceId, syncedAt }
```

### AuditLog
```
userId    ObjectId → User
action    CREATE | UPDATE | DELETE | SYNC
entity    String (e.g. "Goal", "CheckIn")
entityId  ObjectId
payload   Mixed
```

### Quarter
```
name      String (unique, e.g. "Q2-2025")
startDate Date
endDate   Date
status    PLANNED | ACTIVE | CLOSED
```

---

## Offline-First Engine

The offline system is a two-layer architecture: an IndexedDB outbox managed by Dexie, and a drain service that replays queued mutations against the server.

### Write Path

```typescript
// Every write goes through this function
await mutateOfflineAware({
  endpoint: '/api/goals/:id/checkins',
  method: 'POST',
  payload: { progressValue, progressPercent, notes },
  onOptimisticUpdate: () => { /* update React Query cache immediately */ },
  onSuccess: () => { /* invalidate queries after server confirms */ }
})
```

Internally:
1. Calls `onOptimisticUpdate()` immediately — the UI reflects the change with no latency.
2. If `navigator.onLine === false`, calls `enqueueMutation()` to write to `outbox` table in Dexie.
3. If online, attempts `fetch()`. On network failure or non-2xx response, falls back to the outbox.
4. Returns `{ online: boolean, outboxId?: number }` so the caller can render queued vs synced states.

### Drain Path

Triggered by the `online` browser event and at app mount via `initSyncEngine()`.

```
for each pending outbox item (sorted by createdAt):
  → send with headers: X-Offline-Sync, X-Client-Timestamp, X-Device-Id
  → 200 OK       → mark synced, remove from outbox
  → 409 Conflict → mark conflict, dispatch stratify:sync:conflict event
  → 5xx          → increment retryCount; fail permanently after 3 attempts
  → network error → leave pending, abort drain (still offline)
```

### Conflict Handling

When the server returns `409`, the item is marked `conflict` in the outbox and a `CustomEvent` is dispatched on `window`. The `ConflictAlert` component listens for this event and surfaces a dismissible toast with options to view the goal or discard the offline change.

The server performs conflict detection for:
- Check-ins against goals with status `REJECTED`, `COMPLETED`, or `LOCKED`
- Check-ins submitted more than 5 minutes after quarter close (with leniency window for genuine offline scenarios)

### Offline Headers

All offline-replayed requests include:

| Header | Purpose |
|---|---|
| `X-Offline-Sync: true` | Signals the server this is a replayed mutation |
| `X-Client-Timestamp` | Original timestamp of the action for audit accuracy |
| `X-Device-Id` | Stable device identifier generated on first use |

---

## Role-Based Access Control

Access control is enforced at the API route level using `getServerSession()` on every request. Client-side nav items are filtered by role but this is presentational only — the server is the authority.

| Operation | EMPLOYEE | MANAGER | ADMIN |
|---|---|---|---|
| Create own goals | ✓ | ✓ | ✓ |
| Submit goal for approval | ✓ (own) | ✓ (own) | ✓ |
| Approve / reject goals | ✗ | ✓ (direct reports only) | ✓ |
| Assign goals to employee | ✗ | ✓ (direct reports only) | ✓ |
| View team goals | ✗ | ✓ | ✓ |
| Add manager comments | ✗ | ✓ | ✓ |
| Share goals | ✗ | ✓ | ✓ |
| Analytics / export | ✗ | ✓ | ✓ |
| Admin panel | ✗ | ✗ | ✓ |

Manager scope is enforced via the `managerId` field on User: a manager can only approve/assign goals for users where `user.managerId === session.user.id`.

---

## Goal Lifecycle

```
DRAFT
  │
  ├─ submit ──────────────► PENDING_APPROVAL
  │                              │
  │                    ┌─────────┴─────────┐
  │                 approve             reject
  │                    │                   │
  │                 APPROVED ◄─────── REJECTED
  │                    │              (can resubmit)
  │                    │
  │              (employee marks done)
  │                    │
  │            PENDING_COMPLETION
  │                    │
  │               (manager approves)
  │                    │
  │                COMPLETED
  │
  └─ (manager locks directly) ──► LOCKED
```

Only `APPROVED` and `LOCKED` goals accept check-ins. Only `APPROVED` goals can be submitted for completion by the employee who owns them. `REJECTED` goals can be edited and resubmitted.

---

## Risk Scoring

Risk is computed by a cron job at `/api/cron/compute-risk` and updated on every check-in submission.

```typescript
function computeRiskScore(goal, quarterStart, quarterEnd): number {
  const totalDays = (quarterEnd - quarterStart) / MS_PER_DAY
  const daysRemaining = Math.max(0, (quarterEnd - now) / MS_PER_DAY)
  const progressPercent = Math.min(goal.currentValue / goal.targetValue, 1) * 100

  const raw = ((daysRemaining / totalDays) - (progressPercent / 100)) * 100 + 50
  return Math.round(Math.max(0, Math.min(100, raw)))
}
```

A score above 50 is considered high risk and is surfaced with a red badge on goal cards and in team overview tables. The formula penalises goals where the fraction of time remaining exceeds the fraction of progress achieved.

---

## AI Goal Suggestions

The `POST /api/ai/suggest-goals` endpoint accepts `{ role, focusArea }` and returns three structured OKR suggestions from the Claude API.

The model is prompted to return strict JSON (`{ suggestions: [{ title, description }] }`), and the response is parsed and returned to the client. If no API key is configured, a mock response is returned gracefully — the feature degrades without breaking the form.

Suggestions are presented in a side panel of the goal creation form. Clicking a suggestion populates the title and description fields.

---

## API Reference

### Goals
| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/api/goals` | Any | List goals (own, team, or pending approval) |
| `POST` | `/api/goals` | Any | Create goal (managers can assign to employee) |
| `GET` | `/api/goals/:id` | Any | Goal detail with check-in history |
| `POST` | `/api/goals/:id/submit` | Owner | Submit for approval |
| `POST` | `/api/goals/:id/approve` | Manager/Admin | Approve or complete |
| `POST` | `/api/goals/:id/reject` | Manager/Admin | Reject with reason |
| `POST` | `/api/goals/:id/request-completion` | Owner | Request completion review |
| `POST` | `/api/goals/:id/share` | Manager/Admin | Clone goal to another user |
| `GET` | `/api/goals/weightage-remaining` | Any | Remaining weightage budget for quarter |

### Check-ins
| Method | Path | Auth | Description |
|---|---|---|---|
| `POST` | `/api/goals/:id/checkins` | Any | Submit check-in (supports offline replay) |
| `PATCH` | `/api/goals/:id/checkins/:cid/comment` | Manager/Admin | Add manager comment |

### Dashboard & Analytics
| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/api/dashboard/overview` | Any | KPIs, days remaining, team stats |
| `GET` | `/api/analytics/export` | Manager/Admin | Download HTML report |

### System
| Method | Path | Auth | Description |
|---|---|---|---|
| `GET` | `/api/health` | None | Heartbeat — returns `{ ok: true }` |
| `GET` | `/api/cron/compute-risk` | Bearer token | Recompute risk scores for active quarter |
| `POST` | `/api/seed` | None | Reset and seed demo data |

---

## Getting Started

### Prerequisites

- Node.js 20+
- MongoDB 6+ (local or Atlas)
- An Anthropic API key (optional — AI suggestions degrade gracefully without it)

### Installation

```bash
git clone https://github.com/your-org/stratify.git
cd stratify
npm install
```

### Development

```bash
cp .env.example .env.local
# fill in MONGODB_URI and NEXTAUTH_SECRET at minimum
npm run dev
```

The app starts at `http://localhost:3000`.

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `MONGODB_URI` | ✓ | MongoDB connection string |
| `NEXTAUTH_SECRET` | ✓ | JWT signing secret (min 32 chars recommended) |
| `NEXTAUTH_URL` | Production | Full URL of the deployment (e.g. `https://app.stratify.co`) |
| `ANTHROPIC_API_KEY` | Optional | Enables AI goal suggestions. Feature mocks gracefully if absent |
| `CRON_SECRET` | Optional | Bearer token for the `/api/cron/compute-risk` endpoint |

---

## Seeding Demo Data

```bash
curl -X POST http://localhost:3000/api/seed
```

This creates five users, an active Q2-2025 quarter, 13+ goals across all statuses, 10+ check-ins, notifications, and audit log entries.

| Email | Password | Role |
|---|---|---|
| `sarah@demo.com` | `demo1234` | Employee |
| `priya@demo.com` | `demo1234` | Employee |
| `arun@demo.com` | `demo1234` | Manager |
| `raj@demo.com` | `demo1234` | Manager |
| `admin@demo.com` | `demo1234` | Admin |

The seed operation is idempotent — safe to run multiple times.

---

## Project Structure

```
stratify/
├── app/
│   ├── api/                    # Next.js API routes
│   │   ├── ai/                 # AI goal suggestions
│   │   ├── analytics/          # Export endpoint
│   │   ├── auth/               # NextAuth + registration
│   │   ├── checkins/           # Legacy check-in route
│   │   ├── cron/               # Scheduled risk computation
│   │   ├── dashboard/          # Overview KPIs
│   │   ├── goals/              # Core goal CRUD and lifecycle
│   │   ├── health/             # Heartbeat
│   │   ├── notifications/      # Bell notifications
│   │   └── users/              # User roster
│   └── dashboard/              # Authenticated page routes
│
├── components/
│   ├── approvals/              # Approval queue UI
│   ├── goals/                  # Goal cards, detail, check-in form, create form
│   ├── layout/                 # Notification bell
│   ├── offline/                # Offline banner, sync badge, conflict alert
│   └── team/                   # Team goals page
│
├── hooks/
│   ├── useCheckIn.ts           # Check-in mutation hook
│   ├── useOnlineStatus.ts      # navigator.onLine + HTTP heartbeat
│   └── useSyncStatus.ts        # Outbox count, sync state, conflict list
│
├── lib/
│   ├── auth.ts                 # NextAuth configuration
│   ├── db/localDb.ts           # Dexie schema (IndexedDB)
│   ├── mongodb.ts              # Mongoose connection singleton
│   ├── offline/
│   │   ├── mutateOfflineAware.ts  # Core offline write abstraction
│   │   ├── outbox.ts              # Enqueue, drain, conflict handling
│   │   └── syncEngine.ts          # App-level sync initialisation
│   ├── risk.ts                 # Risk score formula
│   └── validators/             # Zod schemas for goals and check-ins
│
├── models/                     # Mongoose models
│   ├── AuditLog.ts
│   ├── CheckIn.ts
│   ├── Department.ts
│   ├── Goal.ts
│   ├── Notification.ts
│   ├── Quarter.ts
│   └── User.ts
│
├── public/
│   ├── manifest.json           # PWA manifest
│   ├── sw.js                   # Compiled service worker (Workbox)
│   └── workbox-*.js            # Workbox runtime
│
└── types/index.ts              # Shared TypeScript interfaces
```

---

## License

Private. All rights reserved.# stratify
