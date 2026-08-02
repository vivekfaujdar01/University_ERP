# University ERP — Application Flow

## 1. Authentication Flow

```
User → Login Page (/login)
  → Enters email + password
  → POST /api/v1/auth/login
  → Server:
      1. Find user by email
      2. Compare bcrypt password hash
      3. Generate accessToken (15m) + refreshToken (7d)
      4. Save refreshToken hash to DB
      5. Set refreshToken as httpOnly cookie
      6. Return accessToken + user { id, name, role } in response body
  → Frontend:
      1. Store accessToken in Redux memory
      2. Decode role from payload
      3. Redirect based on role:
           super_admin → /admin/dashboard
           hod         → /hod/dashboard
           faculty     → /faculty/dashboard
           student     → /student/dashboard

Token Refresh Flow:
  → RTK Query base query intercepts 401 response
  → POST /auth/refresh (sends cookie automatically)
  → Server validates refreshToken, issues new accessToken + rotated refreshToken
  → Retry original request with new accessToken

Logout:
  → POST /auth/logout
  → Server invalidates refreshToken in DB
  → Client clears Redux auth state
  → Redirect to /login
```

---

## 2. Super Admin — Setup Flow

```
Super Admin logs in → /admin/dashboard

STEP 1: Manage Departments (/admin/departments)
STEP 2: Manage Programs & Batches (/admin/programs, /admin/batches)
STEP 3: Add Subjects & Rooms (/admin/subjects, /admin/rooms)
STEP 4: Configure Time Slots (/admin/timeslots)
STEP 5: Manage Users (/admin/users)
```

---

## 3. Timetable Generation Flow

```
HOD / Super Admin → /hod/timetable/generate (or /admin/timetable/generate)

STEP 1: Select Parameters
  → Select Department, Semester, Academic Year ("2024-25")
  → Click "Generate Timetable"

STEP 2: DSA Scheduler Engine Processing
  → Server calls generateTimetable(input):
      1. Priority Queue (MaxHeap): Orders subjects by credits, lab status, frequency
      2. Graph Coloring: Assigns non-conflicting time slots across batches and faculty
      3. Backtracking: Resolves constraint deadlocks
      4. Greedy Room Allocation: Assigns valid rooms with adequate capacity
  → Returns generated schedule grid + conflict logs

STEP 3: Preview & Manual Override
  → HOD inspects timetable grid
  → Optional: Open Override Modal to swap room or slot
  → System checks real-time conflicts

STEP 4: Publish Timetable
  → Click "Publish Timetable"
  → POST /api/v1/timetable/:id/publish
  → Status changes from 'draft' → 'published'
  → Timetable is immediately available on Faculty & Student dashboards
```

---

## 4. Attendance Marking & Defaulters Flow

```
Faculty → /faculty/attendance

STEP 1: Select Session
  → Choose Batch, Subject, TimeSlot, and Date
  → System checks existing marked sessions (Prevents duplicate submit - 409 Conflict)

STEP 2: Mark Students
  → Student list renders for selected batch
  → Quick Actions: "Mark All Present" / "Mark All Absent"
  → Toggle status per student ('present', 'absent', 'late')

STEP 3: Submit Attendance
  → POST /api/v1/attendance/mark
  → Database creates attendance document & computes present count

---

HOD / Student Verification:
  → Student (/student/attendance): Views subject-wise attendance %, total classes, and logs. Red badge if < 75%.
  → HOD (/hod/attendance/reports): Views batch attendance matrix & exports PDF report.
  → HOD (/hod/attendance/defaulters): Views defaulters list (<75%) and sends warning email notifications.
```

---

## 5. DevOps CI/CD Deployment Flow

```
Developer → git push origin main

GitHub Actions Pipeline (.github/workflows/ci-cd.yml):
  1. test-and-lint job:
       - Runs server & client linting (npm run lint)
       - Runs TypeScript type checks (npm run type-check)
       - Runs Jest unit test suite (60/60 tests)
  2. build-and-push job:
       - Builds Docker images for server and client
       - Pushes tagged images to Docker Hub
  3. deploy job:
       - Connects to AWS EC2 via SSH
       - Runs docker-compose -f docker-compose.prod.yml pull
       - Runs docker-compose -f docker-compose.prod.yml up -d --no-deps
       - Performs health check at http://<EC2_HOST>/api/v1/health
```
