# University ERP — Implementation Plan

> Core focus: Timetable Generation (DSA Engine) + Attendance Marker System efficiently handled and deployed via GitHub Actions CI/CD to AWS EC2.

---

## Task Progress Summary

| Task | Title | Status | Completion Date |
| :--- | :--- | :--- | :--- |
| **T1** | Project Scaffolding & DevOps Foundation | ✅ **Complete** | 2026-07-27 |
| **T2** | Authentication System (JWT + Roles) | ✅ **Complete** | 2026-07-27 |
| **T3** | University Structure Management (Depts, Programs, Batches, Subjects, Rooms, Slots, Users) | ✅ **Complete** | 2026-07-27 |
| **T4** | DSA Timetable Scheduling Engine (MaxHeap, Conflict Graph, Backtracking, Room Allocation) | ✅ **Complete** | 2026-07-27 |
| **T5** | Timetable UI, Manual Overrides & PDF Generation | ✅ **Complete** | 2026-07-27 |
| **T6** | Attendance Marking Module, Defaulter Calculations & PDF Export | ✅ **Complete** | 2026-07-28 |
| **T7** | Fees Module | ⏸ **Out of Scope (Deferred)** | — |
| **T8** | Exams Module | ⏸ **Out of Scope (Deferred)** | — |
| **T9** | Notifications & UI Polish | ✅ **Complete** | 2026-08-02 |
| **T10** | Docker Containerization & GitHub Actions Deployment to AWS EC2 | ✅ **Complete** | 2026-08-02 |

---

## Detailed Task Specifications

### Task 4 & 5: DSA Timetable Scheduling Engine & UI (Complete)
- **Algorithms**:
  - `buildSubjectPriorityQueue()` using MaxHeap.
  - `buildConflictGraph()` adjacency graph representation.
  - `assignTimeSlots()` Graph Coloring heuristic.
  - `resolveConflicts()` Backtracking with depth cap.
  - `assignRooms()` Greedy allocation matching capacity and lab types.
- **UI & PDF**:
  - Timetable Grid component (Days × Slots).
  - Conflict warning panel & HOD override modal.
  - Puppeteer PDF template for grid downloads.

### Task 6: Attendance Marking Module (Complete)
- **Backend & Service**:
  - Faculty lecture marking endpoint (`POST /attendance/mark`) with duplicate submit guard (409).
  - Student summary percentage calculation (`< 75%` defaulter threshold).
  - Defaulter notification email service and HOD batch report PDF generation (`attendanceReport.hbs`).
- **UI**:
  - Faculty batch mark page with quick bulk actions.
  - Student attendance breakdown cards and low-attendance alert banners.
  - HOD attendance analytics dashboard and PDF export button.

### Task 10: Docker & CI/CD Deployment to AWS EC2 (Complete)
- Multi-stage Dockerfiles for Client (`client/Dockerfile`) and Server (`server/Dockerfile`).
- Docker Compose files (`docker-compose.yml` for dev, `docker-compose.prod.yml` with Nginx reverse proxy for production).
- Automated GitHub Actions workflow (`.github/workflows/ci-cd.yml`):
  - Job 1: `test-and-lint` (Node 20, ESLint, TypeScript check, 60 Jest unit tests).
  - Job 2: `build-and-push` (Buildx multi-platform build to Docker Hub).
  - Job 3: `deploy` (SSH deployment to AWS EC2 with automatic health check).
