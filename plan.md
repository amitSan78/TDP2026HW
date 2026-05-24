# IssueFlow – Implementation Plan
**Assignment:** TDP 2026 Home Assignment  
**Stack:** TypeScript 5.x · NestJS 10 · TypeORM · PostgreSQL  
**Model used:** Claude Sonnet 4.6

---

## Project Structure

```
src/
├── app.module.ts              # Root module (TypeORM + Schedule)
├── main.ts                    # Bootstrap + global ValidationPipe
├── auth/
│   ├── auth.module.ts
│   ├── auth.controller.ts     # POST /auth/login, /auth/logout, GET /auth/me
│   ├── auth.service.ts
│   ├── jwt.strategy.ts        # Passport JWT strategy
│   ├── jwt-auth.guard.ts      # Guard applied globally
│   └── token-denylist.ts      # In-memory logout deny-list
├── users/
│   ├── users.module.ts
│   ├── users.controller.ts    # CRUD + GET /users/:id/mentions
│   ├── users.service.ts
│   ├── user.entity.ts         # id, username, email, full_name, role, password
│   └── dto/
│       ├── create-user.dto.ts
│       └── update-user.dto.ts
├── projects/
│   ├── projects.module.ts
│   ├── projects.controller.ts # CRUD + /deleted + /restore + /workload
│   ├── projects.service.ts
│   └── project.entity.ts      # id, name, description, owner, deletedAt
├── tickets/
│   ├── tickets.module.ts
│   ├── tickets.controller.ts  # CRUD + dependencies + export + import + restore
│   ├── tickets.service.ts
│   ├── ticket.entity.ts       # All fields + dueDate + isOverdue + deletedAt + version
│   ├── ticket-dependency.entity.ts
│   └── dto/
│       ├── create-ticket.dto.ts
│       └── update-ticket.dto.ts
├── comments/
│   ├── comments.module.ts
│   ├── comments.controller.ts # CRUD per ticket
│   ├── comments.service.ts
│   ├── comment.entity.ts      # content, authorId, ticketId, mentionedUsers
│   └── comment-mention.entity.ts
├── attachments/
│   ├── attachments.module.ts
│   ├── attachments.controller.ts
│   ├── attachments.service.ts
│   └── attachment.entity.ts
├── audit/
│   ├── audit.module.ts
│   ├── audit.controller.ts    # GET /audit-logs (with filters)
│   ├── audit.service.ts       # createLog() called from all services
│   └── audit-log.entity.ts    # actor, action, entity, entityId, payload, timestamp
└── scheduler/
    └── escalation.scheduler.ts  # @Cron job for auto-escalation
```

---

## Build Steps

### Step 1 – Foundation ✅ (done)
- `app.module.ts`: TypeORM connection to PostgreSQL, ScheduleModule
- `main.ts`: Global `ValidationPipe` with `whitelist: true`
- Docker: `docker compose up -d`

**Packages installed:**
```bash
npm install @nestjs/jwt @nestjs/passport passport passport-jwt bcrypt @nestjs/schedule
npm install -D @types/passport-jwt @types/bcrypt
```

---

### Step 2 – Users Module
**Files:** `user.entity.ts`, `users.service.ts`, `users.controller.ts`, DTOs

**Entity fields:** `id` (uuid), `username`, `email`, `fullName`, `role` (ADMIN | DEVELOPER), `password` (hashed), `createdAt`

**Endpoints:**
| Method | Path | Description |
|--------|------|-------------|
| POST | /users | Register new user |
| GET | /users | List all users |
| GET | /users/:id | Get user by id |
| PATCH | /users/:id | Update full_name or role |
| DELETE | /users/:id | Delete user |

**Key constraint:** `role` must be `ADMIN` or `DEVELOPER` — enforced via `@IsEnum` in DTO

---

### Step 3 – Auth Module
**Files:** `auth.service.ts`, `auth.controller.ts`, `jwt.strategy.ts`, `jwt-auth.guard.ts`

**Endpoints:**
| Method | Path | Description |
|--------|------|-------------|
| POST | /auth/login | Returns signed JWT |
| POST | /auth/logout | Adds token to deny-list |
| GET | /auth/me | Returns current user profile |

**Key decisions:**
- Passwords hashed with `bcrypt` (salt rounds: 10)
- JWT signed with `JWT_SECRET` env var, expires in 24h
- Logout uses an in-memory `Set<string>` deny-list (token jti or full token)
- `JwtAuthGuard` applied **globally** in `app.module.ts` — use `@Public()` decorator to opt out on login/register

---

### Step 4 – Projects Module
**Files:** `project.entity.ts`, `projects.service.ts`, `projects.controller.ts`

**Entity fields:** `id`, `name`, `description`, `ownerId` (FK → User), `createdAt`, `deletedAt` (nullable, for soft delete)

**Endpoints:**
| Method | Path | Description |
|--------|------|-------------|
| POST | /projects | Create project |
| GET | /projects | List all (non-deleted) |
| GET | /projects/:id | Get by id |
| PATCH | /projects/:id | Update name/description |
| DELETE | /projects/:id | Soft delete |
| GET | /projects/deleted | List soft-deleted (ADMIN only) |
| POST | /projects/:id/restore | Restore soft-deleted (ADMIN only) |
| GET | /projects/:id/workload | Workload per developer |

---

### Step 5 – Tickets Module (core)
**Files:** `ticket.entity.ts`, `tickets.service.ts`, `tickets.controller.ts`, DTOs

**Entity fields:** `id`, `title`, `description`, `status`, `priority`, `type`, `projectId`, `assigneeId`, `dueDate`, `isOverdue`, `deletedAt`, `version` (for optimistic locking), `createdAt`

**Enums:**
- `status`: TODO | IN_PROGRESS | IN_REVIEW | DONE
- `priority`: LOW | MEDIUM | HIGH | CRITICAL
- `type`: BUG | FEATURE | TECHNICAL

**Endpoints:**
| Method | Path | Description |
|--------|------|-------------|
| POST | /tickets | Create ticket |
| GET | /tickets/:id | Get by id |
| PATCH | /tickets/:id | Update ticket |
| DELETE | /tickets/:id | Soft delete |
| GET | /projects/:id/tickets | All tickets for a project |
| GET | /tickets/deleted | Soft-deleted tickets (ADMIN only) |
| POST | /tickets/:id/restore | Restore (ADMIN only) |

**Key constraints enforced in service:**
- Status can only move forward: TODO → IN_PROGRESS → IN_REVIEW → DONE
- Cannot update a DONE ticket
- Optimistic locking via TypeORM `@VersionColumn()` — concurrent updates return 409
- Auto-assign on creation: query DEVELOPERs by lowest open ticket count, tie-break by `createdAt`

---

### Step 6 – Comments Module
**Files:** `comment.entity.ts`, `comment-mention.entity.ts`, `comments.service.ts`, `comments.controller.ts`

**Endpoints:**
| Method | Path | Description |
|--------|------|-------------|
| POST | /tickets/:id/comments | Add comment |
| GET | /tickets/:id/comments | List comments for ticket |
| PATCH | /comments/:id | Update comment content |
| DELETE | /comments/:id | Delete comment |
| GET | /users/:id/mentions | All comments mentioning user |

**@Mention logic:**
- On create/update: parse `@username` from content with a regex
- Look up matched usernames (case-insensitive) in the users table
- Upsert rows in `comment_mentions` join table
- On update: diff old vs new mentions → insert new, delete removed
- Optimistic locking on comment update (same pattern as tickets)

---

### Step 7 – Audit Log Module
**Files:** `audit-log.entity.ts`, `audit.service.ts`, `audit.controller.ts`

**Entity fields:** `id`, `actor` (userId or `"SYSTEM"`), `action` (e.g. `CREATE_TICKET`, `AUTO_ASSIGN`, `UPDATE_STATUS`), `entityType`, `entityId`, `payload` (jsonb), `createdAt`

**Endpoint:**
| Method | Path | Description |
|--------|------|-------------|
| GET | /audit-logs | All logs, filterable by `actor`, `action`, `entityType`, `entityId` |

**Integration:** `AuditService.log()` is called from every state-changing service method. `AUTO_ASSIGN` logs use `actor = 'SYSTEM'`.

---

### Step 8 – Ticket Dependencies (3.2)
**Files:** `ticket-dependency.entity.ts` (ticketId, blockedById)

**Endpoints:**
| Method | Path | Description |
|--------|------|-------------|
| POST | /tickets/:id/dependencies | Add blocker |
| GET | /tickets/:id/dependencies | List blockers |
| DELETE | /tickets/:id/dependencies/:blockerId | Remove blocker |

**Constraint:** Both tickets must exist and belong to the same project. Transition to DONE blocked if any dependency is not DONE.

---

### Step 9 – Attachments (3.3)
**Files:** `attachment.entity.ts`, `attachments.controller.ts`

**Endpoints:**
| Method | Path | Description |
|--------|------|-------------|
| POST | /tickets/:id/attachments | Upload file |
| GET | /tickets/:id/attachments | List attachments |
| DELETE | /attachments/:id | Delete attachment |

**Constraints enforced with Multer:**
- Max size: 10 MB (`limits: { fileSize: 10 * 1024 * 1024 }`)
- Allowed MIME types: `image/png`, `image/jpeg`, `application/pdf`, `text/plain`
- Files stored in `/uploads` directory (local disk for dev)

---

### Step 10 – Export / Import CSV (3.4)

**Endpoints:**
| Method | Path | Description |
|--------|------|-------------|
| GET | /tickets/export?projectId=X | Download CSV |
| POST | /tickets/import | Upload CSV, bulk create |

**CSV fields:** `id`, `title`, `description`, `status`, `priority`, `type`, `assigneeId`

**Libraries:** `csv-stringify` for export, `csv-parse` for import  
**Import response:** `{ created: N, failed: N, errors: [...] }`

---

### Step 11 – Auto-Escalation Scheduler (3.7)
**File:** `scheduler/escalation.scheduler.ts`

- `@Cron(CronExpression.EVERY_HOUR)` decorator
- Queries all non-DONE tickets where `dueDate < NOW()` and `priority != CRITICAL`
- Promotes priority one level: LOW → MEDIUM → HIGH → CRITICAL
- Sets `isOverdue = true` when reaching CRITICAL
- Logs each escalation to Audit Log with `actor = 'SYSTEM'`, `action = 'AUTO_ESCALATE'`
- Manual priority update via PATCH resets `isOverdue = false`

---

### Step 12 – Tests
**Unit tests** (co-located `*.spec.ts`):
- `users.service.spec.ts` — create, update role validation, delete
- `tickets.service.spec.ts` — status transitions, DONE lock, auto-assign logic
- `comments.service.spec.ts` — mention parsing, mention diff on update
- `auth.service.spec.ts` — login success/fail, token deny-list

**E2E tests** (`test/*.e2e-spec.ts`):
- Full auth flow (register → login → access protected route → logout)
- Ticket lifecycle (create → assign → transition statuses → block on DONE)
- Dependency constraint (cannot DONE a ticket with unresolved blockers)

---

## Key Technical Decisions

| Concern | Decision | Reason |
|---------|----------|--------|
| Concurrent ticket updates | TypeORM `@VersionColumn()` optimistic locking | Lightweight, no extra infra |
| Concurrent comment edits | Same optimistic locking pattern | Consistent approach |
| JWT logout | In-memory deny-list (Set) | Simple for assignment scope |
| Password hashing | bcrypt, 10 rounds | Industry standard |
| Soft delete | `deletedAt` nullable timestamp + TypeORM `@DeleteDateColumn` | Clean, recoverable |
| Auto-assign tie-break | Order by `createdAt ASC` | Deterministic, fair |
| File storage | Local disk `/uploads` | Simple for dev; swap to S3 in prod |
| DB schema sync | `synchronize: true` in dev | Fast iteration; use migrations in prod |

---

## Environment Variables

Create a `.env` file in the project root:

```env
DB_HOST=localhost
DB_PORT=5432
DB_USER=issueflow
DB_PASS=issueflow
DB_NAME=issueflow
JWT_SECRET=supersecretkey
JWT_EXPIRES_IN=24h
```

---

## Running the Project

```bash
# 1. Start the database
docker compose up -d

# 2. Install dependencies
npm install

# 3. Run in dev mode (auto-reload)
npm run start:dev

# 4. Run unit tests
npm test

# 5. Run e2e tests
npm run test:e2e
```

---

## Prompts Reference (prompts.md)

A separate `prompts.md` file documents key AI interactions used during development, including the model (`claude-sonnet-4-6`) and the prompts for each module.
