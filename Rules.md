# University ERP — Project Rules & Guidelines

> Follow these architectural and engineering guidelines strictly across all features and CI/CD operations.

---

## 1. Core Focus & Architecture

- **Primary Features**: Timetable Generation (DSA Engine) & Attendance Marker (Session marking, summary, defaulters, PDF export).
- **Foundation Modules**: Authentication (JWT + refresh token cookie), Structure Management (Department, Program, Batch, Subject, Room, TimeSlot, User).
- **Deployment Infrastructure**: AWS EC2 using Docker & Docker Compose orchestrating Nginx, Client, Server, and MongoDB containers.

---

## 2. Quality & Code Verification Standards

- **TypeScript Strictness**: `strict: true` across client and server. Zero `tsc` compilation errors.
- **Linting Standard**: Zero ESLint errors on `npm run lint`.
- **Test Coverage**: All DSA scheduling engine algorithms (MaxHeap, Conflict Graph, Slot Coloring, Backtracking, Room Allocation) and Attendance Service MUST have unit test suites with 100% pass rate before committing or deploying.
- **Build Verification**: Vite client build (`npm run build`) and Express server build (`npm run build`) must complete cleanly without warnings or errors.

---

## 3. Containerization & DevOps Rules

1. **Docker Multi-Stage Builds**:
   - Client: Build stage (Vite) → Production stage (Nginx serving static assets).
   - Server: Build stage (tsc compilation) → Production stage (Node 20 runtime executing dist/app.js).
2. **Environment Isolation**:
   - Local development uses `docker-compose.yml` with host volume mounts.
   - Production uses `docker-compose.prod.yml` with Nginx reverse proxy routing `/api/*` to express server and `/` to React client.
3. **CI/CD Pipeline**:
   - Triggered on `push` to `main`.
   - Executes 3 sequential jobs: `test-and-lint` → `build-and-push` (Docker Hub) → `deploy` (AWS EC2 via SSH).

---

## 4. API & Error Handling Rules

- All API routes use standard RESTful naming under `/api/v1/`.
- All async controllers wrapped with `catchAsync` middleware.
- Unhandled errors handled by central `errorHandler` returning structured JSON: `{ status: 'error', message, errors? }`.
- Duplicate attendance submission returns HTTP `409 Conflict`.
