# IssueFlow – Setup, Build & Run Instructions

## Prerequisites

Make sure you have the following installed:
- **Node.js** v18 or higher
- **npm** v9 or higher
- **Docker Desktop** (for running PostgreSQL)

---

## 1. Clone the Repository

```bash
git clone <your-repo-url>
cd issueflow-typescript
```

---

## 2. Install Dependencies

```bash
npm install
```

---

## 3. Start the Database

Make sure Docker Desktop is running, then:

```bash
docker compose up -d
```

This starts a PostgreSQL instance with:
- **Host:** localhost
- **Port:** 5432
- **User:** issueflow
- **Password:** issueflow
- **Database:** issueflow

---

## 4. Environment Variables (optional)

The app works out of the box with default values. Optionally create a `.env` file:

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

## 5. Create Uploads Folder

```bash
mkdir uploads
```

This folder stores file attachments uploaded to tickets.

---

## 6. Build the Project

```bash
npm run build
```

---

## 7. Run the Application

### Development mode (auto-reload on file changes):
```bash
npm run start:dev
```

### Production mode:
```bash
npm run start:prod
```

The app will be running at: **http://localhost:3000**

---

## 8. Run the Tests

### Unit tests:
```bash
npm test
```

### Unit tests with coverage:
```bash
npm run test:cov
```

### E2E tests:
```bash
npm run test:e2e
```

Expected output:
```
Test Suites: 10 passed, 10 total
Tests:       60 passed, 60 total
```

---

## 9. API Overview

### Auth
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | /auth/login | Public | Login, returns JWT |
| POST | /auth/logout | JWT | Logout, invalidates token |
| GET | /auth/me | JWT | Get current user profile |

### Users
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | /users | Public | Register new user |
| GET | /users | JWT | List all users |
| GET | /users/:id | JWT | Get user by id |
| PATCH | /users/:id | JWT | Update user |
| DELETE | /users/:id | JWT | Delete user |
| GET | /users/:id/mentions | JWT | Get comments mentioning user |

### Projects
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | /projects | JWT | Create project |
| GET | /projects | JWT | List all projects |
| GET | /projects/:id | JWT | Get project by id |
| PATCH | /projects/:id | JWT | Update project |
| DELETE | /projects/:id | JWT | Soft delete project |
| GET | /projects/deleted | ADMIN | List deleted projects |
| POST | /projects/:id/restore | ADMIN | Restore deleted project |
| GET | /projects/:id/workload | JWT | Get developer workload |

### Tickets
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | /tickets | JWT | Create ticket |
| GET | /tickets | JWT | List tickets by projectId |
| GET | /tickets/:id | JWT | Get ticket by id |
| PATCH | /tickets/:id | JWT | Update ticket |
| DELETE | /tickets/:id | JWT | Soft delete ticket |
| GET | /tickets/deleted | ADMIN | List deleted tickets |
| POST | /tickets/:id/restore | ADMIN | Restore deleted ticket |
| GET | /tickets/export | JWT | Export tickets as CSV |
| POST | /tickets/import | JWT | Import tickets from CSV |
| POST | /tickets/:id/dependencies | JWT | Add blocker |
| GET | /tickets/:id/dependencies | JWT | List blockers |
| DELETE | /tickets/:id/dependencies/:blockerId | JWT | Remove blocker |

### Comments
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | /tickets/:id/comments | JWT | Add comment |
| GET | /tickets/:id/comments | JWT | List comments |
| PATCH | /comments/:id | JWT | Update comment |
| DELETE | /comments/:id | JWT | Delete comment |

### Attachments
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | /tickets/:id/attachments | JWT | Upload file |
| GET | /tickets/:id/attachments | JWT | List attachments |
| DELETE | /tickets/:id/attachments/:id | JWT | Delete attachment |

### Audit Log
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| GET | /audit-logs | JWT | Get all logs (filterable) |

### Scheduler
| Method | Endpoint | Auth | Description |
|--------|----------|------|-------------|
| POST | /scheduler/escalate | ADMIN | Manually trigger escalation |

---

## 10. Key Features

- **JWT Authentication** — all routes protected, login returns signed token
- **Role-based access** — ADMIN and DEVELOPER roles with different permissions
- **Ticket lifecycle** — status moves forward only: TODO → IN_PROGRESS → IN_REVIEW → DONE
- **Optimistic locking** — prevents simultaneous updates on tickets and comments
- **Auto-assignment** — tickets auto-assigned to least loaded DEVELOPER
- **Soft delete** — tickets and projects recoverable after deletion
- **@Mentions** — @username in comments notifies and persists mention
- **Audit log** — every state change recorded with actor and payload
- **Ticket dependencies** — tickets can block other tickets
- **File attachments** — max 10MB, png/jpeg/pdf/txt only
- **CSV export/import** — bulk ticket operations
- **Auto-escalation** — overdue tickets escalated hourly by priority
