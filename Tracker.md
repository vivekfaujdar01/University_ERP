# University ERP — Project Tracker

> Update this file as you complete tasks. Mark status, add notes, log blockers.

---

## Progress Overview

| Task | Title                                      | Status      | Started    | Completed  |
|------|--------------------------------------------|-------------|------------|------------|
| T1   | Project Scaffolding & DevOps Foundation    | ⬜ Not Started |            |            |
| T2   | Authentication System                       | ⬜ Not Started |            |            |
| T3   | University Structure Management            | ⬜ Not Started |            |            |
| T4   | DSA Scheduling Engine (Backend)            | ⬜ Not Started |            |            |
| T5   | Timetable UI & Manual Override             | ⬜ Not Started |            |            |
| T6   | Attendance Module                           | ⬜ Not Started |            |            |
| T7   | Fees Module                                 | ⬜ Not Started |            |            |
| T8   | Exams Module                               | ⬜ Not Started |            |            |
| T9   | Notifications & UI Polish                  | ⬜ Not Started |            |            |
| T10  | CI/CD Pipeline & EC2 Deployment            | ⬜ Not Started |            |            |

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

**Status:** ⬜ Not Started
**Branch:** `feature/t1-scaffolding`

**Checklist:**
- [ ] Initialize Git repo
- [ ] `client/` — Vite + React + TypeScript
- [ ] `server/` — Express + TypeScript + ts-node-dev
- [ ] ESLint + Prettier configured (both)
- [ ] Tailwind CSS + shadcn/ui in client
- [ ] Express health check route `GET /api/v1/health`
- [ ] Global error handler middleware
- [ ] `AppError` class + `catchAsync` wrapper
- [ ] `Dockerfile` for client (multi-stage)
- [ ] `Dockerfile` for server
- [ ] `docker-compose.yml` (dev: client + server + mongo)
- [ ] `docker-compose.prod.yml` (prod: adds nginx)
- [ ] `nginx/nginx.conf`
- [ ] `.env.example` files
- [ ] `.github/workflows/ci-cd.yml` (lint job skeleton)
- [ ] All containers start with `docker-compose up`

**Notes / Blockers:**

---

### T2 — Authentication System

**Status:** ⬜ Not Started
**Branch:** `feature/t2-auth`
**Dependencies:** T1 complete

**Checklist:**
- [ ] `User` Mongoose model
- [ ] `RefreshToken` Mongoose model
- [ ] Seed script (5 users, one per role)
- [ ] `POST /auth/login`
- [ ] `POST /auth/refresh`
- [ ] `POST /auth/logout`
- [ ] `GET /auth/me`
- [ ] `authenticate.ts` middleware
- [ ] `authorizeRoles.ts` middleware
- [ ] Redux auth slice + RTK Query authApi
- [ ] RTK Query auto-refresh interceptor (retry on 401)
- [ ] Login page (React Hook Form + Zod)
- [ ] `ProtectedRoute` component (role-based)
- [ ] Sidebar layout shell
- [ ] Role-based redirect on login
- [ ] Logout in header dropdown

**Notes / Blockers:**

---

### T3 — University Structure Management

**Status:** ⬜ Not Started
**Branch:** `feature/t3-structure`
**Dependencies:** T2 complete

**Checklist:**
- [ ] `Department` model + CRUD API
- [ ] `Program` model + CRUD API
- [ ] `Batch` model + CRUD API
- [ ] `Subject` model + CRUD API
- [ ] `Room` model + CRUD API
- [ ] `TimeSlot` model + CRUD API
- [ ] `POST /users/bulk-import` CSV upload
- [ ] Email service (`emailService.ts`) for welcome email
- [ ] Admin department page
- [ ] Admin programs page
- [ ] Admin batches page
- [ ] Admin subjects page
- [ ] Admin rooms page
- [ ] Admin time slots page
- [ ] Admin users list + single add form
- [ ] Admin CSV import with preview
- [ ] Faculty profile: assign subjects + preferred slots

**Notes / Blockers:**

---

### T4 — DSA Scheduling Engine

**Status:** ⬜ Not Started
**Branch:** `feature/t4-dsa-engine`
**Dependencies:** T3 complete

**Checklist:**
- [ ] `dsa/scheduler/types.ts` — all interfaces
- [ ] `dsa/scheduler/heap.ts` — MaxHeap class
- [ ] `dsa/scheduler/heap.ts` — buildSubjectPriorityQueue()
- [ ] `dsa/scheduler/graphColoring.ts` — buildConflictGraph()
- [ ] `dsa/scheduler/graphColoring.ts` — assignTimeSlots()
- [ ] `dsa/scheduler/backtracking.ts` — resolveConflicts()
- [ ] `dsa/scheduler/greedyRoom.ts` — assignRooms()
- [ ] `dsa/index.ts` — generateTimetable() orchestrator
- [ ] `Timetable` Mongoose model
- [ ] `POST /timetable/generate` endpoint
- [ ] Unit tests: heap operations
- [ ] Unit tests: conflict graph construction
- [ ] Unit tests: slot coloring (zero conflicts)
- [ ] Unit tests: backtracking (partial schedule)
- [ ] Unit tests: greedy room allocation
- [ ] Integration test: full scheduler run

**Notes / Blockers:**

---

### T5 — Timetable UI & Manual Override

**Status:** ⬜ Not Started
**Branch:** `feature/t5-timetable-ui`
**Dependencies:** T4 complete

**Checklist:**
- [ ] `GET /timetable/:semesterId`
- [ ] `PUT /timetable/override`
- [ ] `POST /timetable/:id/publish`
- [ ] `GET /timetable/faculty/:facultyId`
- [ ] `GET /timetable/student/:studentId`
- [ ] `GET /timetable/:id/pdf` (Puppeteer)
- [ ] `timetable.hbs` PDF template
- [ ] Timetable grid component (Days × Slots CSS grid)
- [ ] Cell color-coding by subject
- [ ] Hover tooltip (room, faculty, batch)
- [ ] Conflict cells (red highlight)
- [ ] Conflict panel / cards
- [ ] Drag-and-drop override
- [ ] Publish button (disabled if conflicts)
- [ ] Faculty personal timetable view
- [ ] Student personal timetable view + PDF download

**Notes / Blockers:**

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

| Date | Decision | Reason |
|------|----------|--------|
|      | Razorpay as primary payment gateway | INR-native, better Indian bank support |
|      | Puppeteer for PDF generation | Full HTML/CSS rendering, template flexibility |
|      | Single `users` collection (role field) | Simpler queries across roles, role-based field usage |
|      | RTK Query for API layer | Caching, auto-refetch, optimistic updates built-in |
|      | Zod for validation (shared client + server) | Single source of truth for schemas |

---

## Known Risks

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Puppeteer heavy in Docker container | Medium | High | Use `--no-sandbox` flag, allocate enough EC2 memory (≥2GB) |
| Backtracking stack overflow on complex schedules | Low | Medium | Cap backtrack depth, return partial schedule gracefully |
| Razorpay webhook race condition | Low | High | Idempotency check: skip if payment already marked success |
| MongoDB memory usage on analytics aggregations | Medium | Medium | Add indexes, paginate analytics queries |
| EC2 downtime during deploy | Low | High | Use `--no-deps` + health check before traffic switch |

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
