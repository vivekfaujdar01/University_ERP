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
      1. Store accessToken in Redux memory (NOT localStorage)
      2. Decode role from JWT payload
      3. Redirect based on role:
           super_admin    → /admin/dashboard
           hod            → /hod/dashboard
           faculty        → /faculty/dashboard
           student        → /student/dashboard
           finance_officer → /finance/dashboard

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

STEP 1: Create Departments
  → Navigate to /admin/departments
  → Click "Add Department"
  → Fill: name, code
  → POST /departments
  → Assign HOD (select from faculty users)

STEP 2: Create Programs
  → Navigate to /admin/programs
  → Click "Add Program"
  → Fill: name (B.Tech, M.Tech), code, department, duration (years)
  → POST /programs

STEP 3: Create Batches
  → Navigate to /admin/batches
  → Fill: program, year, section (A/B/C), max students
  → POST /batches

STEP 4: Add Subjects
  → Navigate to /admin/subjects
  → Fill: name, code, credits, isLab, hoursPerWeek, semester, program
  → POST /subjects

STEP 5: Add Rooms
  → Navigate to /admin/rooms
  → Fill: name, capacity, isLab, building, floor
  → POST /rooms

STEP 6: Configure Time Slots
  → Navigate to /admin/timeslots
  → Add slots: Day + Start Time + End Time + isLunchBreak
  → POST /timeslots

STEP 7: Create Users
  → Navigate to /admin/users
  → Option A: Add single user (fill form)
  → Option B: Bulk import via CSV (upload file)
  → POST /users or POST /users/bulk-import
  → System auto-sends welcome email with temp password

STEP 8: Assign Faculty to Subjects
  → Navigate to Faculty profile
  → Select subjects they teach + preferred time slots
  → PUT /users/:facultyId
```

---

## 3. Timetable Generation Flow

```
HOD / Super Admin → /timetable/generate

STEP 1: Select Parameters
  → Choose: Department, Semester, Academic Year
  → System loads: faculty list, subject list, room list, time slots

STEP 2: Review Configuration
  → View faculty ↔ subject assignments
  → Review constraints (lunch break, max hours, etc.)
  → Click "Generate Timetable"

STEP 3: POST /timetable/generate
  → Server builds SchedulerInput from DB
  → DSA Engine runs:
      1. MaxHeap: pop subjects in priority order
      2. Graph Coloring: assign time slots (colors) conflict-free
      3. Greedy: assign rooms
      4. Backtracking: resolve dead ends
  → Returns: { schedule[], conflicts[], isComplete }

STEP 4: Review Result
  → If isComplete = true:
      → Show timetable grid (Days × Slots, color-coded by subject)
      → Hover tooltip: Room, Faculty, Batch
  → If isComplete = false:
      → Show partial grid
      → Conflict panel lists each conflict with type + description
      → Suggest: "Change preferred slots for [Faculty X]"

STEP 5: Manual Override (if needed)
  → Drag-and-drop entry to different slot
  → PUT /timetable/override
  → Server immediately checks new conflicts
  → Conflict cells highlighted red in real time

STEP 6: Publish
  → Click "Publish Timetable"
  → POST /timetable/:id/publish
  → Status changes: draft → published
  → Faculty and Students can now view their individual timetables
  → Export PDF option unlocked

Faculty View (/faculty/timetable):
  → Personal filtered timetable (only their assigned slots)
  → Color-coded by subject

Student View (/student/timetable):
  → Personal filtered timetable (only their batch)
  → Download as PDF button
```

---

## 4. Attendance Flow

```
FACULTY — Marking Attendance

  Faculty → /faculty/attendance
  → Select Today's Lecture (pre-populated from timetable for current time slot)
  → System fetches: batch student list for that subject
  → Faculty toggles each student: Present (green) / Absent (red)
  → Bulk action: "Mark All Present" button
  → Click "Submit Attendance"
  → POST /attendance/mark
      {
        subjectId, batchId, date, timeSlotId,
        records: [{ studentId, status }]
      }
  → If already submitted for this slot → 409 Conflict response

STUDENT — Viewing Attendance

  Student → /student/attendance
  → Summary cards: each subject with attendance %
  → Donut chart: overall attendance
  → Red alert banner if any subject < 75%:
      "⚠ You are at 68% in Mathematics. Minimum required: 75%"
  → Click subject → detailed lecture-by-lecture log

HOD — Attendance Reports

  HOD → /hod/attendance
  → Filter by: batch, subject, date range
  → Attendance heatmap: Students (rows) × Dates (columns)
  → Color: green (present), red (absent), grey (no class)
  → Summary table: student name, total classes, attended, %
  → Defaulters list: students below 75% threshold
  → GET /attendance/batch/:batchId/report
  → Export PDF: GET /attendance/batch/:batchId/report/pdf

AUTOMATED ALERTS:
  → Cron job runs daily at 8 PM
  → Identifies students who dropped below 75% that day
  → Sends email notification:
      Subject: "Attendance Warning - [Subject Name]"
      Body: "Your attendance is now [X]%. Minimum: 75%"
```

---

## 5. Fee Payment Flow

```
FINANCE OFFICER — Setup

  Finance Officer → /finance/fee-structures
  → Click "Create Fee Structure"
  → Fill: program, semester, academic year
  → Add components: Tuition Fee, Lab Fee, Library Fee, etc.
  → Each component: name, amount, isMandatory
  → Set due date + late fee per day (e.g., ₹10/day)
  → POST /fees/structure
  → Click "Assign to Students" → selects batch/program
  → POST /fees/assign → creates StudentFee records for all matching students

  Apply Scholarship:
  → Select student → apply scholarship
  → System calculates: discountAmount, netPayable
  → PUT /fees/student/:studentId/scholarship

---

STUDENT — Online Payment Flow

  Student → /student/fees
  → Dashboard shows:
      Total Fee | Scholarship | Net Payable | Paid | Balance
  → Payment timeline (past payments + upcoming due dates)
  → Late fee indicator if overdue
  → Click "Pay Now" → enter amount (can be partial)

  → POST /fees/pay/online { studentFeeId, amount }
  → Server creates Razorpay order
  → Returns: { orderId, amount, currency, key }
  → Razorpay checkout modal opens in browser
  → Student completes payment (UPI / Card / Net Banking)

  → Razorpay sends webhook → POST /fees/webhook/razorpay
  → Server:
      1. Verify HMAC signature
      2. Mark payment as success in DB
      3. Update StudentFee: amountPaid += amount, recalculate balance
      4. Generate PDF receipt via Puppeteer
      5. Email receipt to student
      6. Student fee status = paid | partial

  → Student sees: "Payment Successful ✓" toast
  → Receipt download available

---

FINANCE OFFICER — Offline Cash Payment

  Finance Officer → /finance/students → search student
  → Open fee record
  → Click "Record Cash Payment"
  → Fill: amount, date, reference number/note
  → POST /fees/pay/offline
  → System marks payment, generates receipt, emails student

---

PARTIAL PAYMENT:
  → Any payment < balance creates a partial record
  → balance = netPayable - SUM(all successful payments)
  → StudentFee.status = 'partial'
  → Next payment continues from remaining balance

LATE FEE:
  → If today > dueDate AND balance > 0:
      lateFee = lateFeePerDay × (today - dueDate).days
  → Shown as additional line item on fee dashboard

REFUND FLOW:
  Student / Finance Officer:
  → POST /fees/refund/:paymentId { reason }
  → Creates refund request (status: pending)

  Finance Officer reviews:
  → Approves → triggers Razorpay/Stripe refund API
  → Payment status updated to 'refunded'
  → Email notification to student

---

FEE ANALYTICS (Finance Officer → /finance/analytics):
  → Total collection vs target (bar chart)
  → Program-wise collection breakdown (pie chart)
  → Month-wise collection trend (line chart)
  → Overdue accounts list with days overdue
  → Scholarship impact summary
```

---

## 6. Exam Flow

```
SUPER ADMIN / HOD — Creating Exam Schedule

  → /admin/exams/schedule
  → Click "Create Exam Schedule"
  → Fill: subject, batch, date, start time, end time, room, exam type (internal/external/practical)
  → POST /exams/schedule
  → Repeat for all exam events

---

HALL TICKET GENERATION (Automated):

  → Cron job runs 14 days before exam date
  → For each registered student in that batch:
      → Check: attendance >= 75% for that subject
      → If eligible: generate hall ticket PDF (Puppeteer)
      → HallTicket fields: student name, enrollment no, exam schedule, photo, QR code
      → Email to student: "Your hall ticket is ready"
  → Ineligible students:
      → Email: "You are not eligible due to low attendance [X]%"

  Student → /student/exams
  → Downloads hall ticket: GET /exams/hallticket/:studentId/pdf

---

SEATING ARRANGEMENT:

  → HOD/Admin → /admin/exams/seating
  → Select exam event → click "Generate Seating"
  → POST /exams/seating
  → System assigns seats: mixes batches/departments to prevent copying
  → Returns: room × seat grid with student assignments
  → Export as PDF

---

FACULTY — Mark Entry:

  → Faculty → /faculty/marks
  → Select exam event they invigilated/taught
  → Student list shown with input fields: internal, external, practical
  → POST /exams/marks/entry
      { examScheduleId, marks: [{ studentId, internal, external, practical, isAbsent }] }
  → System calculates: total = internal + external + practical
  → Grade assigned based on configured grading scheme:
      Example: 90-100 = O (10 pts), 80-89 = A+ (9 pts), etc.

---

RESULT CALCULATION (Triggered after all marks entered):

  → GET /exams/results/:studentId (internal, not published yet)
  → For each subject:
      gradePoint = grade point value
      creditPoints = gradePoint × subject.credits
  → Semester GPA (SGPA) = SUM(creditPoints) / SUM(credits)
  → Cumulative GPA (CGPA) = SUM(all semester creditPoints) / SUM(all credits)
  → Backlog flagged: status = 'fail' | 'backlog'

RESULT PUBLISHING:

  → HOD / Super Admin reviews results
  → POST /exams/results/publish/:semesterId
  → isPublished = true
  → All students in that semester receive email:
      "Your results for Semester [N] are now available"

STUDENT — Viewing Results:

  → /student/results
  → Table: Subject | Internal | External | Total | Grade | Status
  → SGPA + CGPA displayed prominently
  → Backlog subjects highlighted in red
  → Download transcript: GET /exams/transcript/:studentId/pdf

EXAM ANALYTICS (/admin/analytics/exams):
  → Pass % per subject (bar chart)
  → Grade distribution (pie/donut chart)
  → Bell curve (normal distribution overlay, Recharts)
  → Topper list: top 10 students by SGPA
  → Department comparison (grouped bar chart)
  → Semester trend for each student (line chart)
  → Export: PDF report + Excel (.xlsx)
```

---

## 7. Notification Flow

```
TRIGGERS → NOTIFICATIONS:

  Attendance below 75%         → Email to student
  Payment successful           → Email receipt to student
  Payment overdue              → Email reminder to student (cron: daily 9 AM)
  Hall ticket generated        → Email with PDF attachment to student
  Result published             → Email to all students in batch
  Timetable published          → In-app notification to all faculty + students in dept
  Refund processed             → Email to student

IN-APP NOTIFICATIONS:
  → Bell icon in top header with unread count badge
  → GET /notifications (paginated, latest first)
  → Click → marks as read
  → Types: info, warning, success, error

EMAIL SERVICE:
  → NodeMailer with Handlebars HTML email templates
  → Queue: notifications processed async (not blocking request response)
  → Retry on failure: 3 attempts with exponential backoff
```

---

## 8. CI/CD Pipeline Flow

```
DEVELOPER WORKFLOW:

  1. Developer creates feature branch from main
  2. Opens Pull Request to main

  GitHub Actions — ON PULL REQUEST:
  ├── Job: test-and-lint
  │   ├── npm ci (server + client)
  │   ├── ESLint check
  │   ├── TypeScript type-check (tsc --noEmit)
  │   ├── Jest unit tests (server)
  │   └── Build check (vite build for client)
  └── PR blocked if any check fails

  MERGE TO MAIN:

  GitHub Actions — ON PUSH TO MAIN:
  ├── Job: test-and-lint (same as above)
  ├── Job: build-and-push (runs after test pass)
  │   ├── docker build ./server → tag :latest + :$GITHUB_SHA
  │   ├── docker build ./client → tag :latest + :$GITHUB_SHA
  │   ├── docker push to Docker Hub
  │   └── Both images published
  └── Job: deploy (runs after images pushed)
      ├── SSH into AWS EC2 (appleboy/ssh-action)
      ├── cd ~/university-erp
      ├── docker-compose -f docker-compose.prod.yml pull
      ├── docker-compose -f docker-compose.prod.yml up -d
      ├── docker system prune -f (clean old images)
      ├── Health check: curl GET /api/v1/health → expect 200
      ├── On SUCCESS → Webhook POST (Discord/Slack) "✅ Deployed"
      └── On FAILURE → Webhook POST "❌ Deployment Failed"

SECRETS REQUIRED IN GITHUB:
  DOCKERHUB_USERNAME
  DOCKERHUB_TOKEN
  EC2_HOST
  EC2_SSH_KEY
  WEBHOOK_URL
```

---

## 9. Role-Based Route Guards (Frontend)

```
React Router v6 — Protected Route Component:

<ProtectedRoute allowedRoles={['super_admin', 'hod']}>
  <TimetableGeneratePage />
</ProtectedRoute>

Route Table:
/login                     → Public
/admin/*                   → super_admin only
/hod/*                     → hod only
/faculty/*                 → faculty only
/student/*                 → student only
/finance/*                 → finance_officer only
/unauthorized              → shown when role check fails
```
