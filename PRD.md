# University ERP — Product Requirements Document (PRD)

## 1. Product Overview

A high-performance, focused University ERP system built on the MERN stack with a **DSA-powered scheduling algorithm engine** and an **automated Attendance Marking system**, completely containerized using Docker and deployed to AWS EC2 via GitHub Actions.

---

## 2. Problem Statement

Universities struggle with manual timetable creation (leading to teacher/room/batch conflicts) and inefficient paper/spreadsheet-based attendance tracking. This system provides an automated, conflict-free timetable scheduling engine and an efficient attendance marker with real-time defaulter tracking and PDF reporting.

---

## 3. Goals

- **Automated Timetable Generation**: DSA-powered scheduling engine using MaxHeap priority queue, Graph Coloring, Backtracking, and Greedy Room Allocation.
- **Efficient Attendance Marking**: Streamlined lecture-wise attendance entry, duplicate submission guards, live student percentage computation, threshold alerts (< 75%), and HOD batch reports.
- **University Structure Management**: Comprehensive management of Departments, Programs, Batches, Subjects, Rooms, TimeSlots, and Users.
- **Containerization & CI/CD**: Full Dockerization (Client, Server, Nginx, MongoDB) deployed seamlessly to AWS EC2 using GitHub Actions.

---

## 4. Non-Goals / Out of Scope

- Financial & Fee Collection modules (Deferred)
- Examinations, Hall Tickets & Grade Transcripts modules (Deferred)
- Multi-tenant SaaS (single university deployment only)
- Native mobile applications (responsive web UI provided)

---

## 5. User Roles & Permissions

| Role | Key Capabilities |
| :--- | :--- |
| **Super Admin** | Full system access, manage structure (depts, programs, batches, subjects, rooms, slots, users), trigger timetable generation. |
| **HOD** | Department management, generate & publish timetables, override slots/rooms, view attendance reports & defaulters list. |
| **Faculty** | View personal timetable, mark lecture attendance per slot, update faculty profile & slot preferences. |
| **Student** | View personal timetable, track subject-wise and overall attendance percentage, download timetable/reports. |

---

## 6. Core Modules

### 6.1 Timetable Scheduling (DSA Engine)
- Constraint-based automatic schedule generation engine.
- **Hard Constraints** (Zero violation allowed):
  - No faculty conflict (faculty cannot be in two places at once).
  - No room conflict (room cannot host two classes at once).
  - No batch conflict (batch cannot have two overlapping classes).
  - Lab subjects must be assigned to valid lab rooms.
  - Classroom capacity must be ≥ batch student count.
- **Algorithm Pipeline**:
  1. **Max-Heap (Priority Queue)**: Order subjects by credit weight, lab status, and weekly frequency.
  2. **Graph Coloring**: Assign non-adjacent time slots.
  3. **Backtracking**: Resolve dead-end slot conflicts.
  4. **Greedy Room Allocation**: Assign smallest valid capacity rooms.
- **Manual Overrides**: HOD/Admin capability to adjust room or time slot with real-time conflict detection.
- **PDF Export**: Print-ready timetable grid PDFs (Department-wide, Faculty personal, Student personal).

### 6.2 Attendance Marking & Analytics
- Lecture-wise attendance entry by Faculty.
- Duplicate submission prevention (409 Conflict guard).
- Live calculation of attendance percentage per subject and overall.
- Defaulter detection (< 75% threshold) with automated email warnings.
- HOD batch attendance reporting with filtering and PDF export via Puppeteer.

---

## 7. Infrastructure & Deployment

- **Containerization**: Docker multi-stage builds for Client (Vite → Nginx) and Server (Node.js/Express).
- **Orchestration**: `docker-compose.yml` for local development and `docker-compose.prod.yml` with Nginx reverse proxy for production.
- **CI/CD Pipeline**: GitHub Actions workflow (`ci-cd.yml`) executing linting, type-checking, Jest tests (60/60 passing), Docker Hub image builds, and automated SSH deployment to AWS EC2.

---

## 8. Success Metrics

| Metric | Target |
| :--- | :--- |
| Timetable Generation Hard Conflict Violations | **0** |
| Timetable Generation Time | **< 5 seconds** |
| Jest Test Suite Pass Rate | **100% (60/60 tests)** |
| Attendance Percentage Computation Time | **< 100ms** |
| CI/CD Deploy Time to AWS EC2 | **< 5 minutes** |
