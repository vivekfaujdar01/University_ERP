# University ERP — Project Tracker

> Update this file as you complete tasks. Mark status, add notes, log blockers.

---

## Progress Overview

| Task | Title                                   | Status         | Started    | Completed  |
| ---- | --------------------------------------- | -------------- | ---------- | ---------- |
| T1   | Project Scaffolding & DevOps Foundation | ✅ Complete    | 2026-07-27 | 2026-07-27 |
| T2   | Authentication System                   | ✅ Complete    | 2026-07-27 | 2026-07-27 |
| T3   | University Structure Management         | ✅ Complete    | 2026-07-27 | 2026-07-27 |
| T4   | DSA Scheduling Engine (Backend)         | ✅ Complete    | 2026-07-27 | 2026-07-27 |
| T5   | Timetable UI & Manual Override          | ✅ Complete    | 2026-07-27 | 2026-07-27 |
| T6   | Attendance Module                       | ⬜ Not Started |            |            |
| T7   | Fees Module                             | ⬜ Not Started |            |            |
| T8   | Exams Module                            | ⬜ Not Started |            |            |
| T9   | Notifications & UI Polish               | ⬜ Not Started |            |            |
| T10  | CI/CD Pipeline & EC2 Deployment         | ⬜ Not Started |            |            |

**Status Key:**

- ⬜ Not Started
- 🔵 In Progress
- ✅ Complete
- 🔴 Blocked
- ⏸ Paused

---

## Task Detail Log

---

### T1 — Project Scaffolding & DevOps Foundation

**Status:** ✅ Complete
**Branch:** `feature/t1-scaffolding`
**Completed:** 2026-07-27

**Checklist:**

- [x] Initialize Git repo
- [x] `client/` — Vite + React + TypeScript
- [x] `server/` — Express + TypeScript + ts-node-dev
- [x] ESLint + Prettier configured (both)
- [x] Tailwind CSS + design tokens (tailwind.config.js from Design.md)
- [x] Express health check route `GET /api/v1/health`
- [x] Global error handler middleware
- [x] `AppError` class + `catchAsync` wrapper
- [x] `Dockerfile` for client (multi-stage: Vite build → nginx)
- [x] `Dockerfile` for server (multi-stage: tsc build → node)
- [x] `docker-compose.yml` (dev: client + server + mongo)
- [x] `docker-compose.prod.yml` (prod: adds nginx)
- [x] `nginx/nginx.conf`
- [x] `.env.example` files (client + server)
- [x] `.github/workflows/ci-cd.yml` (full pipeline: lint → build-push → deploy)
- [x] Landing page + Login stub + 404 page (React, Tailwind, Glassmorphism UI)
- [x] All TypeScript strict-mode checks pass (client + server)
- [x] Production Vite build succeeds (2.92s)
- [x] 4/4 AppError unit tests pass

**Notes:**

- `node_modules/` excluded from Git (in .gitignore)
- `create-vite` interactive prompt not scriptable — project scaffolded manually (same output)
- Client runs at `localhost:3000`, server at `localhost:5000`
- `vite.config.ts` has API proxy: `/api` → `localhost:5000` for local dev without Docker

**Notes / Blockers:**

---

### T2 — Authentication System

**Status:** ✅ Complete
**Branch:** `feature/t2-auth`
**Started:** 2026-07-27
**Completed:** 2026-07-27

**Checklist:**

- [x] `User` Mongoose model
- [x] `RefreshToken` Mongoose model
- [x] Seed script (5 users, one per role)
- [x] `POST /auth/login`
- [x] `POST /auth/refresh`
- [x] `POST /auth/logout`
- [x] `GET /auth/me`
- [x] `authenticate.ts` middleware
- [x] `authorizeRoles.ts` middleware
- [x] Redux auth slice + RTK Query authApi
- [x] RTK Query auto-refresh interceptor (retry on 401)
- [x] Login page (React Hook Form + Zod)
- [x] `ProtectedRoute` component (role-based)
- [x] Sidebar layout shell
- [x] Role-based redirect on login
- [x] Logout in header dropdown

**Notes / Blockers:**

---

### T3 — University Structure Management

**Status:** ✅ Complete
**Branch:** `feature/t3-structure`
**Started:** 2026-07-27
**Completed:** 2026-07-27

**Checklist:**

- [x] `Department` model + CRUD API
- [x] `Program` model + CRUD API
- [x] `Batch` model + CRUD API
- [x] `Subject` model + CRUD API
- [x] `Room` model + CRUD API
- [x] `TimeSlot` model + CRUD API
- [x] `POST /users/bulk-import` CSV upload
- [x] Email service (`emailService.ts`) for welcome email
- [x] Admin department page
- [x] Admin programs page
- [x] Admin batches page
- [x] Admin subjects page
- [x] Admin rooms page
- [x] Admin time slots page
- [x] Admin users list + single add form
- [x] Admin CSV import with preview
- [x] Faculty profile: assign subjects + preferred slots

**Notes / Blockers:**

---

### T4 — DSA Scheduling Engine

**Status:** ✅ Complete
**Branch:** `feature/t4-dsa-engine`
**Started:** 2026-07-27
**Completed:** 2026-07-27

**Checklist:**

- [x] `dsa/scheduler/types.ts` — all interfaces
- [x] `dsa/scheduler/heap.ts` — MaxHeap class
- [x] `dsa/scheduler/heap.ts` — buildSubjectPriorityQueue()
- [x] `dsa/scheduler/graphColoring.ts` — buildConflictGraph()
- [x] `dsa/scheduler/graphColoring.ts` — assignTimeSlots()
- [x] `dsa/scheduler/backtracking.ts` — resolveConflicts()
- [x] `dsa/scheduler/greedyRoom.ts` — assignRooms()
- [x] `dsa/index.ts` — generateTimetable() orchestrator
- [x] `Timetable` Mongoose model
- [x] `POST /timetable/generate` endpoint
- [x] Unit tests: heap operations
- [x] Unit tests: conflict graph construction
- [x] Unit tests: slot coloring (zero conflicts)
- [x] Unit tests: backtracking (partial schedule)
- [x] Unit tests: greedy room allocation
- [x] Integration test: full scheduler run
- [x] 53/53 tests passing

**Notes / Blockers:**

---

### T5 — Timetable UI & Manual Override

**Status:** ✅ Complete
**Branch:** `feature/t5-timetable-ui`
**Started:** 2026-07-27
**Completed:** 2026-07-27

**Checklist:**

- [x] `GET /timetable/:semesterId`
- [x] `PUT /timetable/override`
- [x] `POST /timetable/:id/publish`
- [x] `GET /timetable/faculty/:facultyId`
- [x] `GET /timetable/student/:studentId`
- [x] `GET /timetable/:id/pdf` (Puppeteer)
- [x] `timetable.hbs` PDF template
- [x] Timetable grid component (Days × Slots CSS grid)
- [x] Cell color-coding by subject
- [x] Hover tooltip (room, faculty, batch)
- [x] Conflict cells (red highlight)
- [x] Conflict panel / cards
- [x] Override modal (slot + room selector)
- [x] Publish button (disabled if conflicts)
- [x] Faculty personal timetable view
- [x] Student personal timetable view + PDF download
- [x] HOD published timetable view page
- [x] All timetable routes wired in App.tsx (HOD, Faculty, Student)

**Notes:**

- Manual cell override uses a modal (slot + room selectors) instead of drag-and-drop; @dnd-kit not installed
- HOD view page at `/hod/timetable/view` shows any dept's published timetable with filter selectors
- All 3 role views (HOD generate, Faculty personal, Student personal) are wired and accessible

---

### T6 — Attendance Module

**Status:** ⬜ Not Started
**Branch:** `feature/t6-attendance`
**Dependencies:** T5 complete

**Checklist:**

- [ ] `Attendance` Mongoose model
- [ ] `POST /attendance/mark`
- [ ] Duplicate submission guard (409)
- [ ] `GET /attendance/student/:studentId/summary`
- [ ] `GET /attendance/batch/:batchId/report`
- [ ] `GET /attendance/batch/:batchId/report/pdf` (Puppeteer)
- [ ] `attendanceReport.hbs` PDF template
- [ ] Daily cron job (node-cron, 8 PM)
- [ ] 75% threshold email notification
- [ ] Faculty attendance marking page
- [ ] Bulk mark all present/absent
- [ ] Student attendance summary page (donut chart)
- [ ] Warning banner (< 75%)
- [ ] Lecture-by-lecture log table
- [ ] HOD attendance heatmap
- [ ] HOD filter bar (batch, subject, date range)
- [ ] HOD defaulters list
- [ ] HOD PDF export button

**Notes / Blockers:**

---

### T7 — Fees Module

**Status:** ⬜ Not Started
**Branch:** `feature/t7-fees`
**Dependencies:** T3 complete (can be parallel to T5/T6)

**Checklist:**

- [ ] `FeeStructure` model
- [ ] `StudentFee` model
- [ ] `Payment` model
- [ ] `Receipt` model
- [ ] `Scholarship` model
- [ ] `POST /fees/structure`
- [ ] `POST /fees/assign`
- [ ] `GET /fees/student/:studentId`
- [ ] `POST /fees/pay/online` (Razorpay order)
- [ ] `POST /fees/webhook/razorpay` (HMAC verify)
- [ ] `POST /fees/pay/offline`
- [ ] `POST /fees/refund/:paymentId`
- [ ] `GET /fees/receipt/:receiptId/pdf`
- [ ] `GET /fees/analytics`
- [ ] `receipt.hbs` PDF template
- [ ] `lateFeeCalculator.ts` utility
- [ ] Receipt number generator
- [ ] Student fee dashboard page
- [ ] Razorpay checkout modal (client-side)
- [ ] Payment history table
- [ ] Finance Officer fee structure builder
- [ ] Finance Officer student search + cash payment form
- [ ] Finance Officer refund queue
- [ ] Finance Officer analytics dashboard

**Notes / Blockers:**

---

### T8 — Exams Module

**Status:** ⬜ Not Started
**Branch:** `feature/t8-exams`
**Dependencies:** T6 complete

**Checklist:**

- [ ] `ExamSchedule` model
- [ ] `HallTicket` model
- [ ] `Mark` model
- [ ] `Result` model
- [ ] `POST /exams/schedule`
- [ ] `GET /exams/hallticket/:studentId/pdf`
- [ ] QR code generation (qrcode package)
- [ ] `POST /exams/seating`
- [ ] `POST /exams/marks/entry`
- [ ] `gradeCalculator.ts` service
- [ ] SGPA + CGPA computation
- [ ] `POST /exams/results/publish/:semesterId`
- [ ] `GET /exams/results/:studentId`
- [ ] `GET /exams/transcript/:studentId/pdf`
- [ ] `GET /exams/analytics/:semesterId`
- [ ] `hallTicket.hbs` PDF template
- [ ] `transcript.hbs` PDF template
- [ ] Admin exam schedule creator
- [ ] Admin seating arrangement page
- [ ] Faculty mark entry form
- [ ] Student exam page (hall ticket download)
- [ ] Student results page (table + GPA + download)
- [ ] Admin analytics page (charts + toppers + bell curve + export)

**Notes / Blockers:**

---

### T9 — Notifications & UI Polish

**Status:** ⬜ Not Started
**Branch:** `feature/t9-notifications`
**Dependencies:** T7 + T8 complete

**Checklist:**

- [ ] `Notification` model
- [ ] `notificationService.ts` (create + email wrapper)
- [ ] Wire: attendance cron → notification
- [ ] Wire: payment success → notification
- [ ] Wire: overdue cron → notification
- [ ] Wire: hall ticket generated → notification
- [ ] Wire: results published → notification
- [ ] Wire: timetable published → notification
- [ ] Wire: refund processed → notification
- [ ] `GET /notifications` (paginated)
- [ ] `PUT /notifications/:id/read`
- [ ] `PUT /notifications/read-all`
- [ ] Bell icon with unread badge (RTK Query polling 60s)
- [ ] Notification dropdown panel
- [ ] "Mark all read" action
- [ ] Skeleton loaders for all list/table pages
- [ ] Empty state components (per module)
- [ ] Error boundary on all route pages
- [ ] Mobile responsive audit (all pages)
- [ ] Dark mode toggle

**Notes / Blockers:**

---

### T10 — CI/CD Pipeline & EC2 Deployment

**Status:** ⬜ Not Started
**Branch:** `feature/t10-cicd` → merge to main triggers deploy

**Checklist:**

- [ ] Complete `ci-cd.yml` (test + build-push + deploy jobs)
- [ ] GitHub Secrets configured
- [ ] AWS EC2 instance created (Ubuntu 22.04)
- [ ] Docker + Docker Compose installed on EC2
- [ ] `docker-compose.prod.yml` uploaded to EC2
- [ ] `nginx/nginx.conf` uploaded to EC2
- [ ] `.env` files created on EC2 with production values
- [ ] Nginx routing: `/api/*` → server, `/` → client
- [ ] Health check verified post-deploy
- [ ] Webhook notification working (Discord/Slack)
- [ ] End-to-end integration test checklist:
  - [ ] All 5 roles login correctly
  - [ ] Timetable generate → publish → view
  - [ ] Fee payment → receipt → email
  - [ ] Attendance mark → student view → HOD report
  - [ ] Exam schedule → hall ticket → marks → publish → transcript
  - [ ] All PDFs download in production
  - [ ] Data persists across container restart
- [ ] Push lint error → pipeline fails before deploy (verified)
- [ ] Push valid change → deploys successfully (verified)

**Notes / Blockers:**

---

## Decisions Log

| Date | Decision                                    | Reason                                               |
| ---- | ------------------------------------------- | ---------------------------------------------------- |
|      | Razorpay as primary payment gateway         | INR-native, better Indian bank support               |
|      | Puppeteer for PDF generation                | Full HTML/CSS rendering, template flexibility        |
|      | Single `users` collection (role field)      | Simpler queries across roles, role-based field usage |
|      | RTK Query for API layer                     | Caching, auto-refetch, optimistic updates built-in   |
|      | Zod for validation (shared client + server) | Single source of truth for schemas                   |

---

## Known Risks

| Risk                                             | Likelihood | Impact | Mitigation                                                 |
| ------------------------------------------------ | ---------- | ------ | ---------------------------------------------------------- |
| Puppeteer heavy in Docker container              | Medium     | High   | Use `--no-sandbox` flag, allocate enough EC2 memory (≥2GB) |
| Backtracking stack overflow on complex schedules | Low        | Medium | Cap backtrack depth, return partial schedule gracefully    |
| Razorpay webhook race condition                  | Low        | High   | Idempotency check: skip if payment already marked success  |
| MongoDB memory usage on analytics aggregations   | Medium     | Medium | Add indexes, paginate analytics queries                    |
| EC2 downtime during deploy                       | Low        | High   | Use `--no-deps` + health check before traffic switch       |

---

## Environment Checklist

### Local Development

- [ ] Node.js 20 installed
- [ ] Docker Desktop running
- [ ] `client/.env` created from `.env.example`
- [ ] `server/.env` created from `.env.example`
- [ ] `docker-compose up` starts all services
- [ ] Seed script run: `npm run seed`

### Production (EC2)

- [ ] EC2 instance running (Ubuntu 22.04, t2.medium minimum)
- [ ] Docker + Docker Compose installed
- [ ] Ports 80, 443, 22 open in security group
- [ ] GitHub Secrets all set
- [ ] `~/university-erp/` directory created
- [ ] Production `.env` files in place
- [ ] SSL certificate (optional: Let's Encrypt via Certbot)
