# University ERP — Product Requirements Document (PRD)

## 1. Product Overview

A production-grade University ERP system built on the MERN stack with DSA-powered scheduling algorithms and a full DevOps pipeline. Designed for a single university with multiple departments, handling academics, finance, and administration.

---

## 2. Problem Statement

Universities manage attendance, fees, exams, and timetables across disconnected systems — spreadsheets, paper forms, and standalone tools. This causes scheduling conflicts, payment gaps, delayed results, and poor visibility for all stakeholders.

---

## 3. Goals

- Centralize academic and financial management for a university
- Use DSA algorithms (Graph Coloring, Heap, Backtracking, Greedy) for intelligent timetable scheduling
- Provide role-specific dashboards and workflows for all 5 user types
- Automate receipts, hall tickets, transcripts, and reports as PDFs
- Deploy with a repeatable, automated CI/CD pipeline to AWS EC2

---

## 4. Non-Goals

- Multi-tenant SaaS (single university only)
- Mobile native app (web-responsive only)
- LMS features (assignments, course content delivery)
- Video conferencing or live class integration

---

## 5. User Roles & Permissions

| Role             | Key Capabilities                                                                 |
|------------------|---------------------------------------------------------------------------------|
| Super Admin      | Full system access, create departments, manage all roles, view all reports       |
| HOD              | Manage faculty/students in dept, approve timetables, view dept analytics         |
| Faculty          | Mark attendance, enter marks, view their timetable, raise schedule requests      |
| Student          | View attendance, pay fees, download hall ticket/transcript, view results          |
| Finance Officer  | Manage fee structures, record offline payments, process refunds, view analytics  |

---

## 6. Modules

### 6.1 Attendance

- Faculty marks attendance per lecture (batch + subject)
- Students view their own attendance percentage per subject
- Auto-alert when attendance drops below 75%
- HOD views department-wide attendance reports
- Monthly/semester attendance reports with PDF export
- Conflict prevention: cannot mark same lecture slot twice

### 6.2 Fees

- Fee structure definition per semester/program by Finance Officer
- Online payment via Razorpay (primary) / Stripe (secondary)
- Offline cash payment recorded manually by Finance Officer
- Partial payments with due balance tracking
- Late fee auto-calculation past due date (configurable daily rate)
- PDF receipt generation + automatic email dispatch to student
- Scholarship management (flat or percentage deduction from total)
- Refund workflow: Student/Finance requests → HOD/Admin approves → processed
- Analytics: collection rate, pending dues, department-wise breakdown
- Payment history timeline per student

### 6.3 Exams

- Exam schedule creation (subject, date, time, room, exam type)
- Hall ticket auto-generation (PDF) with eligibility check (attendance ≥ 75%)
- Seating arrangement generation per exam
- Mark entry by faculty (internal + external + practical marks)
- Configurable grading scheme (grade boundaries, grade points)
- GPA calculation per semester, CGPA cumulative calculation
- Result publishing with visibility toggle (draft → published)
- Email notification to students on result publish
- Transcript generation as PDF (downloadable)
- Backlog / reappear subject management and tracking
- Analytics:
  - Pass/fail percentage per subject and batch
  - Topper lists (class, department, semester)
  - Subject-wise performance breakdown
  - Department-wise performance comparison
  - Semester trend charts
  - Student progress over time (CGPA trend)
  - Faculty performance insights
  - Bell curve visualization
  - Grade distribution charts
  - Downloadable reports (Excel + PDF)

### 6.4 Timetable Scheduling (DSA Core)

- Constraint-based automatic schedule generation engine
- Hard Constraints (must not be violated):
  - No teacher conflict (same teacher cannot have two classes at the same slot)
  - No classroom conflict (same room cannot host two classes at the same slot)
  - No student batch conflict (same batch cannot have two classes at the same slot)
  - Lab subjects must only be assigned to lab rooms
  - Classroom capacity must be ≥ batch size
  - Configured lunch break slots must remain free
- Soft Constraints (best-effort optimization):
  - Faculty preferred time slots respected where possible
  - Subject frequency per week maintained
  - Semester-specific timing configurations
  - Maximum teaching hours per day per faculty
- Algorithm Stack:
  - **Priority Queue (Max-Heap):** Schedule high-credit / lab / core subjects first
  - **Graph Coloring:** Assign time slot "colors" with no adjacent conflicting node sharing a color
  - **Backtracking:** Resolve dead-end slot assignments by reversing and trying alternatives
  - **Greedy Heuristics:** Fast room allocation (smallest valid room ≥ batch size)
- Manual override by HOD / Super Admin after generation
- Real-time conflict detection on manual edits
- Conflict report generation listing unresolved constraints
- Export timetable as PDF (full grid and individual faculty/student views)

---

## 7. Success Metrics

| Metric                                             | Target                        |
|----------------------------------------------------|-------------------------------|
| Timetable generation hard constraint violations    | 0                             |
| Timetable generation time (single department)     | < 10 seconds                  |
| Fee dashboard real-time accuracy                   | Reflects payment within 30s   |
| Exam result publish to student visible             | Immediate on publish toggle   |
| Attendance alert delivery                          | Within 24 hours of threshold  |
| CI/CD pipeline duration (merge to live on EC2)     | < 10 minutes                  |
| PDF generation time (receipt/hall ticket)          | < 3 seconds                   |

---

## 8. Constraints & Assumptions

- Single university, one MongoDB instance (no multi-tenancy)
- Faculty and students are pre-loaded by Super Admin (no self-registration)
- Email service via NodeMailer + SMTP (Gmail or SendGrid)
- PDF generation via Puppeteer (HTML-to-PDF with Handlebars templates)
- Primary payment gateway: Razorpay; secondary: Stripe
- Deployment target: AWS EC2 (Ubuntu 22.04), single region
- All monetary values stored in smallest currency unit (paise for INR)
- Academic year format: "2024-25"

---

## 9. Future Scope (Out of Current Scope)

- Parent portal with fee and attendance visibility
- Online exam / MCQ test engine
- Library management module
- Hostel management module
- Mobile app (React Native)
- AI-based predictive analytics (dropout risk, performance forecasting)
