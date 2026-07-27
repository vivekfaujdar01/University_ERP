# University ERP — Implementation Plan

> Build order: Each task produces working, demoable functionality. No orphaned code. Every task integrates into the previous one.

---

## Task 1: Project Scaffolding & DevOps Foundation

**Objective:** Bootstrap the full monorepo with client, server, Docker, and CI skeleton so every future task has a deployable base to build on.

**Implementation:**
- Initialize Git repo with `client/` (Vite + React + TypeScript) and `server/` (Express + TypeScript + ts-node-dev)
- Configure ESLint + Prettier for both workspaces with shared rules
- Set up Tailwind CSS + shadcn/ui in the client with the design token values from Design.md
- Create base Express app (`app.ts`) with:
  - Global JSON body parser
  - CORS configured for client origin
  - Global error handler middleware (`errorHandler.ts`)
  - `AppError` class + `catchAsync` wrapper
  - Health check route: `GET /api/v1/health → { status: 'ok', timestamp }`
- Write `Dockerfile` for both client (multi-stage: build → nginx serve) and server
- Write `docker-compose.yml` for local dev (client + server + mongo containers)
- Write `docker-compose.prod.yml` for production (adds nginx reverse proxy)
- Write `nginx/nginx.conf` routing `/api` to server, `/` to client
- Add `.env.example` files for both
- Scaffold `.github/workflows/ci-cd.yml` with lint + type-check job (deploy jobs stubbed)

**Tests:**
- `GET /api/v1/health` returns `200 { status: 'ok' }`
- `docker-compose up` starts all 3 services without errors
- Client Vite app loads in browser at `localhost:3000`
- MongoDB connection confirmed in server logs

**Demo:** Run `docker-compose up` — browser shows the React app shell (white page with "University ERP" heading), server health check returns OK, MongoDB connected log visible.

---

## Task 2: Authentication System

**Objective:** Full JWT-based auth with role-based access control, login UI, and protected route scaffolding.

**Implementation:**
- `User` Mongoose model (schema from Schema.md, password excluded from queries by default)
- Seed script: create one user of each role with known credentials for development
- `POST /auth/login`:
  - Validate with Zod
  - Find user by email, compare bcrypt hash
  - Generate accessToken (15m) + refreshToken (7d)
  - Save refreshToken hash to `refresh_tokens` collection
  - Set refreshToken as httpOnly cookie, return accessToken in body
- `POST /auth/refresh`: validate cookie, rotate token
- `POST /auth/logout`: invalidate refresh token in DB
- `GET /auth/me`: return current user from accessToken
- `authenticate.ts` middleware: verify Bearer accessToken
- `authorizeRoles(...roles)` middleware: check role against allowed list
- **Frontend:**
  - Redux auth slice (`authSlice.ts`): stores `{ user, accessToken }`
  - RTK Query `authApi.ts`: login, logout, me endpoints
  - RTK Query base query with auto-refresh interceptor (retry on 401)
  - Login page: email + password form, Zod validation, error toast
  - `ProtectedRoute` component: checks role, redirects to `/unauthorized` if denied
  - Role-based redirect after login to appropriate dashboard stub page
  - Logout button in header dropdown

**Tests:**
- Login with each of the 5 seed users → correct role in response
- Access protected route without token → 401
- Access route with wrong role → 403
- Refresh token rotation: old token rejected after refresh

**Demo:** Open login page → enter each role's credentials → redirected to their stub dashboard → header shows name + role badge → logout works → refresh page stays logged in (token auto-refreshed).

---

## Task 3: University Structure Management (Super Admin)

**Objective:** Super Admin can build the complete university data model: departments, programs, batches, subjects, rooms, time slots, and users.

**Implementation:**
- Mongoose models: `Department`, `Program`, `Batch`, `Subject`, `Room`, `TimeSlot`
- CRUD REST APIs for each (all guarded by `authorizeRoles('super_admin')`)
- `POST /users/bulk-import`: accept CSV upload (Multer), parse with `csv-parse`, create users in bulk, send welcome email with temp password
- **Frontend (Admin pages):**
  - `/admin/departments` — list + create/edit/delete form
  - `/admin/programs` — list + form (linked to department)
  - `/admin/batches` — list + form (linked to program)
  - `/admin/subjects` — list + form (credits, isLab, hoursPerWeek, semester)
  - `/admin/rooms` — list + form (capacity, isLab)
  - `/admin/timeslots` — weekly slot builder UI (day + start + end, mark lunch break)
  - `/admin/users` — list + single add form + CSV import with preview step
  - Faculty profile: assign subjects + preferred slots
- Breadcrumb navigation in header
- All list pages use shadcn/ui `DataTable` with sorting + search

**Tests:**
- Create department → add program → add batch → add 3 students via CSV → all visible in user list
- Role guard: HOD cannot access `/admin/departments` routes (403)
- Duplicate email in CSV → partial success response with error list

**Demo:** Super Admin creates CSE department, adds B.Tech CSE program, adds Batch CS-A 2022, imports 5 student CSV, assigns Dr. Kumar to Data Structures subject. All data visible in respective list pages.

---

## Task 4: DSA Scheduling Engine (Backend Core)

**Objective:** Implement the complete constraint-based timetable generation engine as pure TypeScript modules with full unit test coverage.

**Implementation:**

`server/src/dsa/scheduler/types.ts`:
- Define all interfaces: `SchedulerInput`, `SchedulerOutput`, `ScheduleEntry`, `ConflictReport`

`server/src/dsa/scheduler/heap.ts`:
- `MaxHeap<T>` generic class: `insert`, `extractMax`, `peek`, `size`
- `buildSubjectPriorityQueue(subjects[])`: compute priority score = `(credits × 10) + (isLab ? 5 : 0) + hoursPerWeek`
- Returns subjects sorted highest → lowest

`server/src/dsa/scheduler/graphColoring.ts`:
- `buildConflictGraph(entries[])`: constructs adjacency list
  - Edge between nodes if: same faculty OR same room OR same batch at same slot
- `assignTimeSlots(graph, timeSlots[], heap)`: assign slot "colors" using conflict graph
  - For each node popped from heap: find all colors used by neighbors, pick first unused color

`server/src/dsa/scheduler/backtracking.ts`:
- `resolveConflicts(graph, partialSchedule, timeSlots[])`: backtrack resolver
  - Walk back to most recent assignment when a node has no valid color
  - Try next available color, re-propagate
  - Cap at `MAX_BACKTRACK_DEPTH = 500`
  - Unresolvable nodes added to `ConflictReport[]`

`server/src/dsa/scheduler/greedyRoom.ts`:
- `assignRooms(schedule[], rooms[])`: for each scheduled entry
  - Filter: `room.isLab === subject.isLab`
  - Filter: `room.capacity >= batch.studentCount`
  - Sort by capacity ascending
  - Pick first room not already used in that slot

`server/src/dsa/index.ts`:
- `generateTimetable(input: SchedulerInput): SchedulerOutput` — orchestrates all 4 steps

`Timetable` Mongoose model + `POST /timetable/generate` endpoint:
- Loads all required data from DB
- Builds `SchedulerInput`
- Calls `generateTimetable()`
- Saves result as draft timetable document
- Returns `SchedulerOutput`

**Tests (Jest):**
- Heap: insert 10 subjects → extractMax returns highest priority each time
- Graph: 3 nodes with shared faculty → edge exists between conflicting pairs
- Coloring: 3 batches, 5 subjects → zero same-slot conflicts in output
- Backtracking: inject unsolvable constraint → partial schedule returned + conflict list populated
- Greedy room: lab subject → only lab rooms assigned; batch of 40 → no room with capacity < 40
- Integration: full scheduler run with realistic 10 subjects, 5 faculty, 3 batches → valid output in < 5 seconds

**Demo:** POST `/api/v1/timetable/generate` with full CSE department payload → Postman shows a valid schedule JSON, `isComplete: true`, zero conflicts. Run again with impossible constraints → `isComplete: false`, conflict list explains each unresolved entry.

---

## Task 5: Timetable UI, Manual Override & Publishing

**Objective:** Full timetable management UI — generate, visualize, fix conflicts, override, publish, and export.

**Implementation:**
- `GET /timetable/:semesterId` — fetch timetable with populated references
- `PUT /timetable/override` — update a single entry, re-run conflict detection, return updated conflicts
- `POST /timetable/:id/publish` — set status to 'published', validate zero hard conflicts first
- `GET /timetable/faculty/:facultyId` — personal view filtered by faculty
- `GET /timetable/student/:studentId` — personal view filtered by student's batch
- `GET /timetable/:id/pdf` — Puppeteer renders `timetable.hbs` → streams PDF response

**Frontend:**
- `/hod/timetable` — generator page:
  - Semester/department selector
  - "Generate" button with loading spinner
  - Timetable grid (Days × Slots CSS grid, color-coded by subject)
  - Hover tooltip per cell (room, faculty, batch)
  - Conflict panel (red cards listing each conflict)
  - Drag-and-drop cell override (react-beautiful-dnd or @dnd-kit)
  - Conflict cells highlighted `bg-red-100 border-red-500`
  - "Publish Timetable" button (disabled if conflicts exist)
- `/faculty/timetable` — personal read-only timetable grid
- `/student/timetable` — personal read-only timetable grid + PDF download

**Tests:**
- Override entry to conflicting slot → API returns conflict, UI highlights cell red
- Override to valid slot → conflict clears, cell turns normal
- Publish with unresolved conflict → 400 error, button stays disabled
- PDF endpoint → response Content-Type is application/pdf

**Demo:** HOD opens timetable generator, clicks Generate, sees color-coded grid. Drags Data Structures to a conflicting slot → red highlight + conflict card appears. Moves it to valid slot → conflict resolves. Clicks Publish. Faculty logs in → sees only their 3 slots. Student logs in → sees their batch's timetable. Downloads PDF.

---

## Task 6: Attendance Module

**Objective:** Faculty marks attendance per lecture. Students see live percentage alerts. HOD gets reports.

**Implementation:**
- `Attendance` Mongoose model
- `POST /attendance/mark`: validate no duplicate submission for same slot/date/subject/batch; save records; compute presentCount
- `GET /attendance/student/:studentId/summary`: aggregate per-subject stats:
  - totalClasses, attended, percentage per subject
- `GET /attendance/batch/:batchId/report`: full matrix for HOD with student × date data
- `GET /attendance/batch/:batchId/report/pdf`: Puppeteer → `attendanceReport.hbs`
- Cron job (node-cron, runs daily 8 PM):
  - Find students who dropped below 75% attendance today
  - Send email via `emailService.ts`
  - Create in-app notification record

**Frontend:**
- `/faculty/attendance/mark`:
  - Auto-select today's current slot from timetable
  - Student list with Present/Absent/Late toggle buttons
  - Bulk "Mark All Present" button
  - Submit with confirmation dialog
  - Read-only mode for already-submitted lectures
- `/student/attendance`:
  - Warning banner: `⚠ You are at 68% in Mathematics. Minimum: 75%`
  - Donut chart (Recharts PieChart) per subject
  - Expandable table: lecture-by-lecture log
- `/hod/attendance`:
  - Filter bar: batch, subject, date range
  - Heatmap grid: students (rows) × dates (columns), green/red cells
  - Summary table with % and defaulters highlighted
  - "Export PDF" button

**Tests:**
- Mark same slot twice → 409 Conflict
- Submit with 30 students → verify aggregated presentCount in DB
- Student summary: 7/10 classes attended → 70% displayed, warning shown
- Cron fires correctly in test environment with mock date

**Demo:** Faculty marks attendance for batch CS-A in Data Structures at 10 AM slot. Student logs in → sees 80% attendance. HOD opens batch report → sees heatmap with today's lecture. Downloads PDF report.

---

## Task 7: Fees Module

**Objective:** Complete hybrid fee system with online payment, offline cash, PDF receipts, scholarships, late fees, and analytics.

**Implementation:**
- Mongoose models: `FeeStructure`, `StudentFee`, `Payment`, `Receipt`, `Scholarship`
- `POST /fees/structure` — Finance Officer creates fee structure
- `POST /fees/assign` — assign fee structure to a batch/program (creates StudentFee records)
- `GET /fees/student/:studentId` — fetch fee summary with all payments
- `POST /fees/pay/online`:
  - Create Razorpay order (`razorpay.orders.create`)
  - Return `{ orderId, amount, currency, key }`
- `POST /fees/webhook/razorpay`:
  - Verify HMAC-SHA256 signature
  - Mark payment success → update StudentFee balance → generate PDF receipt → email to student
- `POST /fees/pay/offline` (Finance Officer only):
  - Record payment → update StudentFee → generate receipt → email student
- `POST /fees/refund/:paymentId`:
  - Razorpay refund API call → update payment status
- `GET /fees/receipt/:receiptId/pdf`: stream `receipt.hbs` PDF
- Late fee calculation utility: `lateFeeCalculator.ts` (`today > dueDate ? lateFeePerDay × diff.days : 0`)
- `GET /fees/analytics`: aggregation pipeline for collection stats

**Frontend:**
- `/student/fees`:
  - Summary card: Total | Net Payable | Paid | Balance | Late Fee
  - Progress bar: paid %
  - "Pay Now" modal: amount input (pre-filled with balance) → Razorpay checkout opens
  - Payment history table with receipt download buttons
- `/finance/fee-structures`: create/edit fee structure with component builder
- `/finance/students`: search student → view fee record → record cash payment form
- `/finance/refunds`: refund request queue, approve/reject actions
- `/finance/analytics`:
  - BarChart: monthly collections (Recharts)
  - PieChart: program-wise breakdown
  - Overdue table with days overdue column

**Tests:**
- Razorpay webhook with invalid signature → 400 rejected
- Partial payment → balance updates correctly, status = 'partial'
- Full payment → status = 'paid'
- Late fee calculation: 5 days overdue, ₹10/day → lateFee = ₹50
- PDF receipt endpoint → valid PDF binary response

**Demo:** Finance Officer creates fee structure for B.Tech Sem 5. Assigns to batch CS-A. Student logs in → sees ₹50,000 due. Clicks Pay Now → Razorpay modal → completes payment → success toast → receipt downloaded → email received. Finance Officer records ₹10,000 cash for another student. Analytics dashboard shows updated collection chart.

---

## Task 8: Exams Module

**Objective:** Full exam lifecycle — scheduling, hall tickets, mark entry, grade calculation, result publishing, transcripts, and analytics.

**Implementation:**
- Mongoose models: `ExamSchedule`, `HallTicket`, `Mark`, `Result`
- `POST /exams/schedule` — create exam event
- `GET /exams/hallticket/:studentId/pdf`:
  - Check attendance ≥ 75% for each subject
  - Generate/retrieve HallTicket record
  - Render `hallTicket.hbs` → PDF with QR code (qrcode npm package)
- `POST /exams/seating` — greedy seat assignment (mix batches across rooms)
- `POST /exams/marks/entry` — faculty enters marks; validate totals ≤ maxMarks
- Grade calculation service: `gradeCalculator.ts`
  - Configurable grade boundaries (stored in constants)
  - Compute grade, gradePoint, creditPoints per subject
  - Compute SGPA, CGPA
- `POST /exams/results/publish/:semesterId`:
  - Set `isPublished = true`
  - Create notification for each student in batch
  - Send email notifications
- `GET /exams/results/:studentId` — fetch results with subject breakdown
- `GET /exams/transcript/:studentId/pdf` — render `transcript.hbs` → PDF
- `GET /exams/analytics/:semesterId` — aggregation pipeline:
  - Pass % per subject
  - Grade distribution
  - Topper list (top 10 by SGPA)
  - Department comparison

**Frontend:**
- `/admin/exams/schedule` — exam schedule creator (subject, date, time, room, type)
- `/admin/exams/seating` — seating arrangement generator + printable view
- `/faculty/marks` — mark entry form per exam event, student list with inline inputs
- `/student/exams`:
  - Hall ticket download card (eligibility status shown)
  - Upcoming exams list
- `/student/results`:
  - Subject results table: Internal | External | Total | Grade | Status
  - SGPA/CGPA badges
  - Backlog subjects in red
  - Download transcript button
- `/admin/analytics/exams`:
  - Pass % horizontal bar chart per subject
  - Grade distribution donut chart
  - Bell curve chart (AreaChart with normal distribution overlay)
  - Topper leaderboard table
  - CGPA trend line chart per student
  - Export PDF + Export Excel buttons

**Tests:**
- Hall ticket: student with 70% attendance → ineligible flag in response
- Mark entry: marks > maxMarks → 400 validation error
- Grade calculation: 92 marks → 'O' grade, 10 grade points
- SGPA: 3 subjects (10, 9, 8 points) × (4, 3, 3 credits) → SGPA = (40+27+24)/10 = 9.1
- PDF transcript: valid binary response with correct Content-Type

**Demo:** Admin creates exam schedule for Sem 5. 14 days before exam, student downloads hall ticket (shows exam list, seat). Faculty enters marks. Admin publishes results. Student logs in → sees result table with SGPA 8.6 → downloads transcript PDF. Admin views analytics → pass % chart, topper list, bell curve.

---

## Task 9: Notification System & Final Polish

**Objective:** Wire all notification triggers across modules, implement in-app notification bell, and apply final UI polish.

**Implementation:**
- `Notification` Mongoose model
- `notificationService.ts`: `createNotification(userId, type, title, message, link)` + `sendEmail()`
- Wire notifications into all existing trigger points:
  - Attendance cron → below 75% warning
  - Payment success → receipt email + in-app
  - Payment overdue cron → daily reminder
  - Hall ticket generated → email with PDF
  - Results published → email + in-app for each student
  - Timetable published → in-app for dept faculty + students
  - Refund processed → email + in-app
- `GET /notifications` — paginated, sorted by createdAt desc, filter by isRead
- `PUT /notifications/:id/read` — mark as read
- `PUT /notifications/read-all` — mark all read

**Frontend:**
- Bell icon in Header: shows unread count badge (auto-refreshes every 60s via RTK Query polling)
- Dropdown panel: notification list, click → navigate to relevant page + mark read
- "Mark all as read" action
- Final UI polish across all pages:
  - Consistent loading skeleton components
  - Empty state components per module
  - Error boundary wrapping all route pages
  - Mobile responsive check for all pages
  - Dark mode toggle in header (Tailwind dark: classes)

**Tests:**
- Create payment → notification created in DB and email mock called
- GET /notifications → paginated, ordered latest first
- Mark as read → isRead = true in DB
- Unread count in bell reflects actual unread count

**Demo:** Make a payment → bell icon shows badge "1" → click bell → receipt notification visible → click it → navigates to fee history page → badge clears. Toggle dark mode → all pages render in dark theme.

---

## Task 10: CI/CD Pipeline, EC2 Deployment & Final Integration

**Objective:** Complete the GitHub Actions pipeline, deploy to AWS EC2, and verify the full system end-to-end in production.

**Implementation:**
- Complete `.github/workflows/ci-cd.yml` (all 3 jobs: test, build-push, deploy)
- Add GitHub Secrets: `DOCKERHUB_USERNAME`, `DOCKERHUB_TOKEN`, `EC2_HOST`, `EC2_SSH_KEY`, `WEBHOOK_URL`
- Set up AWS EC2:
  - Ubuntu 22.04, Docker + Docker Compose installed
  - Inbound rules: ports 80, 443, 22
  - Upload `docker-compose.prod.yml` + `nginx/nginx.conf` to `~/university-erp/`
  - Create `.env` files on server with production values
- Configure Nginx reverse proxy:
  - `/api/*` → server container port 5000
  - `/` → client container port 80
- Full `server/.env` and `client/.env` production configuration
- Health check endpoint verified post-deploy
- Webhook notification on deploy success/failure (Discord or Slack)
- Final integration testing checklist:
  - All 5 roles can log in and access correct dashboards
  - Timetable generate → publish → view flow works end-to-end
  - Fee payment → receipt → email flow works end-to-end
  - Attendance mark → student view → HOD report flow works
  - Exam schedule → hall ticket → mark entry → publish → transcript flow works
  - All PDF downloads work in production
  - MongoDB persists data across container restarts (volume mounted)

**Tests:**
- Push to feature branch → only lint/test job runs, no deploy
- Merge to main → all 3 jobs run sequentially
- Introduce lint error → pipeline fails at test job, no deploy triggered
- Health check fails after deploy → pipeline reports failure, webhook fires

**Demo:** Push a UI color change to main → GitHub Actions runs → Docker Hub shows new image with git SHA tag → EC2 pulls and restarts → browser shows updated UI → Discord/Slack shows "✅ University ERP deployed successfully". Walk through full student journey: login → check timetable → view attendance → pay fees online → download receipt → view exam results → download transcript. All working on live EC2 URL.
