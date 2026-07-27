# University ERP — Technical Specification

## 1. Tech Stack

| Layer            | Technology                                      |
|------------------|-------------------------------------------------|
| Frontend         | React 18, TypeScript, Vite                      |
| UI Library       | Tailwind CSS + shadcn/ui                        |
| State Management | Redux Toolkit + RTK Query                       |
| Charts           | Recharts                                        |
| Forms            | React Hook Form + Zod                           |
| Backend          | Node.js 20, Express.js, TypeScript              |
| Database         | MongoDB 7 + Mongoose ODM                        |
| Validation       | Zod (shared schemas client + server)            |
| Authentication   | JWT (Access Token + Refresh Token)              |
| File / PDF       | Puppeteer (HTML→PDF), Handlebars templates      |
| File Uploads     | Multer + AWS S3 (or local volume)               |
| Email            | NodeMailer + Gmail SMTP / SendGrid              |
| Payments         | Razorpay SDK (primary) + Stripe SDK (secondary) |
| DSA Engine       | Pure TypeScript modules (no external lib)       |
| Containerization | Docker + Docker Compose                         |
| CI/CD            | GitHub Actions                                  |
| Container Registry | Docker Hub                                    |
| Hosting          | AWS EC2 (Ubuntu 22.04)                          |
| Reverse Proxy    | Nginx                                           |
| Process Manager  | PM2 (inside server container)                   |

---

## 2. Repository Structure

```
university-erp/
├── client/                          # React + TypeScript frontend
│   ├── public/
│   ├── src/
│   │   ├── components/              # Shared reusable UI components
│   │   │   ├── ui/                  # shadcn/ui base components
│   │   │   ├── layout/              # Sidebar, Header, PageWrapper
│   │   │   ├── charts/              # Recharts wrappers
│   │   │   └── pdf/                 # PDF download buttons
│   │   ├── pages/                   # Route-level page components
│   │   │   ├── auth/
│   │   │   ├── admin/
│   │   │   ├── hod/
│   │   │   ├── faculty/
│   │   │   ├── student/
│   │   │   └── finance/
│   │   ├── features/                # Redux slices per module
│   │   │   ├── authSlice.ts
│   │   │   ├── attendanceSlice.ts
│   │   │   ├── feesSlice.ts
│   │   │   ├── examsSlice.ts
│   │   │   └── timetableSlice.ts
│   │   ├── services/                # RTK Query API definitions
│   │   │   ├── authApi.ts
│   │   │   ├── attendanceApi.ts
│   │   │   ├── feesApi.ts
│   │   │   ├── examsApi.ts
│   │   │   └── timetableApi.ts
│   │   ├── hooks/                   # Custom React hooks
│   │   ├── utils/                   # Helpers, formatters, constants
│   │   ├── types/                   # Shared TypeScript interfaces
│   │   ├── store.ts                 # Redux store configuration
│   │   ├── router.tsx               # React Router v6 config
│   │   └── main.tsx
│   ├── Dockerfile
│   ├── nginx.conf                   # For serving production build
│   ├── .env.example
│   └── vite.config.ts
│
├── server/                          # Node.js + Express backend
│   ├── src/
│   │   ├── controllers/             # Route handlers per module
│   │   │   ├── authController.ts
│   │   │   ├── userController.ts
│   │   │   ├── attendanceController.ts
│   │   │   ├── feesController.ts
│   │   │   ├── examsController.ts
│   │   │   └── timetableController.ts
│   │   ├── models/                  # Mongoose schemas
│   │   │   ├── User.ts
│   │   │   ├── Department.ts
│   │   │   ├── Program.ts
│   │   │   ├── Batch.ts
│   │   │   ├── Subject.ts
│   │   │   ├── Room.ts
│   │   │   ├── TimeSlot.ts
│   │   │   ├── Timetable.ts
│   │   │   ├── Attendance.ts
│   │   │   ├── FeeStructure.ts
│   │   │   ├── StudentFee.ts
│   │   │   ├── Payment.ts
│   │   │   ├── Receipt.ts
│   │   │   ├── Scholarship.ts
│   │   │   ├── ExamSchedule.ts
│   │   │   ├── HallTicket.ts
│   │   │   ├── Mark.ts
│   │   │   ├── Result.ts
│   │   │   └── Notification.ts
│   │   ├── routes/                  # Express routers
│   │   │   ├── authRoutes.ts
│   │   │   ├── userRoutes.ts
│   │   │   ├── attendanceRoutes.ts
│   │   │   ├── feesRoutes.ts
│   │   │   ├── examsRoutes.ts
│   │   │   ├── timetableRoutes.ts
│   │   │   ├── reportRoutes.ts
│   │   │   └── analyticsRoutes.ts
│   │   ├── middleware/              # Express middleware
│   │   │   ├── authenticate.ts      # JWT verification
│   │   │   ├── authorizeRoles.ts    # RBAC guard
│   │   │   ├── errorHandler.ts      # Global error middleware
│   │   │   ├── validate.ts          # Zod schema validation
│   │   │   └── rateLimiter.ts
│   │   ├── services/                # Business logic layer
│   │   │   ├── authService.ts
│   │   │   ├── attendanceService.ts
│   │   │   ├── feesService.ts
│   │   │   ├── examsService.ts
│   │   │   ├── timetableService.ts
│   │   │   ├── pdfService.ts
│   │   │   ├── emailService.ts
│   │   │   └── paymentService.ts
│   │   ├── dsa/                     # DSA algorithm modules
│   │   │   ├── scheduler/
│   │   │   │   ├── heap.ts          # MaxHeap + priority queue
│   │   │   │   ├── graphColoring.ts # Conflict graph + slot coloring
│   │   │   │   ├── backtracking.ts  # Conflict backtrack resolver
│   │   │   │   ├── greedyRoom.ts    # Greedy room allocator
│   │   │   │   └── types.ts         # Scheduler TypeScript types
│   │   │   └── index.ts             # Scheduler orchestrator
│   │   ├── templates/               # Handlebars HTML templates for PDF
│   │   │   ├── receipt.hbs
│   │   │   ├── hallTicket.hbs
│   │   │   ├── transcript.hbs
│   │   │   ├── timetable.hbs
│   │   │   └── attendanceReport.hbs
│   │   ├── utils/
│   │   │   ├── AppError.ts
│   │   │   ├── catchAsync.ts
│   │   │   ├── generateReceiptNumber.ts
│   │   │   └── lateFeeCalculator.ts
│   │   ├── config/
│   │   │   ├── db.ts
│   │   │   ├── env.ts
│   │   │   └── constants.ts
│   │   └── app.ts                   # Express app entry
│   ├── Dockerfile
│   ├── .env.example
│   └── tsconfig.json
│
├── nginx/
│   └── nginx.conf                   # Reverse proxy config
│
├── docker-compose.yml               # Local development
├── docker-compose.prod.yml          # Production deployment
│
├── .github/
│   └── workflows/
│       └── ci-cd.yml                # GitHub Actions pipeline
│
└── docs/                            # All planning documents
    ├── PRD.md
    ├── TechSpec.md
    ├── AppFlow.md
    ├── Design.md
    ├── Schema.md
    ├── ImplementationPlan.md
    ├── Tracker.md
    └── Rules.md
```

---

## 3. Authentication & Authorization

### JWT Strategy
- **Access Token:** 15-minute expiry, returned in response body
- **Refresh Token:** 7-day expiry, stored as httpOnly + Secure cookie
- Refresh token rotation on every use (old token invalidated)
- Refresh tokens stored in DB for blacklisting on logout

### Middleware Chain
```
Request → authenticate.ts (verify JWT) → authorizeRoles('hod','admin') → controller
```

### Role Guards Per Module

| Endpoint Group       | Allowed Roles                              |
|----------------------|---------------------------------------------|
| /auth/*              | Public                                      |
| /users (write)       | super_admin                                 |
| /departments (write) | super_admin                                 |
| /timetable/generate  | super_admin, hod                            |
| /attendance/mark     | faculty                                     |
| /fees/structure      | finance_officer, super_admin               |
| /fees/pay/offline    | finance_officer                             |
| /exams/marks/entry   | faculty                                     |
| /exams/results (pub) | super_admin, hod                            |
| /analytics/*         | super_admin, hod, finance_officer           |

---

## 4. DSA Scheduling Engine

### Input Interface
```typescript
interface SchedulerInput {
  batches: Batch[];           // Student groups
  subjects: Subject[];        // With credit hours, isLab, hoursPerWeek
  faculty: Faculty[];         // With preferredSlots[], subjectsAssigned[]
  rooms: Room[];              // With capacity, isLab flag
  timeSlots: TimeSlot[];      // e.g. Mon 9-10, Mon 10-11, Tue 9-10 ...
  constraints: {
    lunchBreakSlots: string[];     // Slot IDs to keep free
    maxHoursPerDayPerFaculty: number;
    semesterStartTime: string;
    semesterEndTime: string;
  };
}

interface SchedulerOutput {
  schedule: ScheduleEntry[];
  conflicts: ConflictReport[];
  isComplete: boolean;        // false = partial schedule returned
}

interface ScheduleEntry {
  subject: string;            // Subject ID
  faculty: string;            // Faculty ID
  batch: string;              // Batch ID
  room: string;               // Room ID
  timeSlot: string;           // TimeSlot ID
}

interface ConflictReport {
  type: 'teacher' | 'room' | 'batch' | 'capacity' | 'lab';
  description: string;
  involvedEntries: string[];
}
```

### Algorithm Flow
```
STEP 1 — BUILD PRIORITY QUEUE (Max-Heap)
  Input: subjects[]
  Priority score = (credits × 10) + (isLab ? 5 : 0) + hoursPerWeek
  Output: subjects sorted highest → lowest priority

STEP 2 — BUILD CONFLICT GRAPH
  Nodes = all (subject, batch, faculty) combinations
  Edge between NodeA and NodeB if:
    - Same faculty AND overlapping slot
    - Same room AND overlapping slot
    - Same batch AND overlapping slot
  Output: adjacency list representing the conflict graph

STEP 3 — GRAPH COLORING (slot assignment)
  Colors = available TimeSlot IDs
  For each node (popped from heap, high priority first):
    - Find all colors used by adjacent nodes (conflict neighbors)
    - Assign lowest available color not in conflict set
    - If no color available → trigger BACKTRACKING

STEP 4 — BACKTRACKING (conflict resolution)
  When a node cannot be colored:
    - Walk back to most recent assignment
    - Try next available color for that node
    - Re-propagate forward
    - Cap depth at configurable limit (default: 500 iterations)
    - If cap hit → mark node as unresolved, add to ConflictReport

STEP 5 — GREEDY ROOM ALLOCATION
  For each colored (scheduled) node:
    - Filter rooms by: isLab matches subject.isLab
    - Filter by: capacity >= batch.studentCount
    - Sort by capacity ascending (smallest valid room first)
    - Assign first available room not already taken in that slot

STEP 6 — OUTPUT
  Return SchedulerOutput:
    - schedule: all resolved ScheduleEntry[]
    - conflicts: all unresolved ConflictReport[]
    - isComplete: conflicts.length === 0
```

---

## 5. API Design (REST)

**Base URL:** `/api/v1`

### Auth
```
POST   /auth/login
POST   /auth/refresh
POST   /auth/logout
GET    /auth/me
```

### Users & Structure
```
GET    /users
POST   /users
PUT    /users/:id
DELETE /users/:id
POST   /users/bulk-import          # CSV upload
GET    /departments
POST   /departments
GET    /programs
POST   /programs
GET    /batches
POST   /batches
GET    /subjects
POST   /subjects
GET    /rooms
POST   /rooms
GET    /timeslots
POST   /timeslots
```

### Attendance
```
POST   /attendance/mark
GET    /attendance/:batchId/:subjectId
GET    /attendance/student/:studentId/summary
GET    /attendance/batch/:batchId/report
GET    /attendance/batch/:batchId/report/pdf
```

### Timetable
```
POST   /timetable/generate
GET    /timetable/:semesterId
PUT    /timetable/override
POST   /timetable/:id/publish
GET    /timetable/faculty/:facultyId
GET    /timetable/student/:studentId
GET    /timetable/:id/pdf
```

### Fees
```
GET    /fees/structure
POST   /fees/structure
PUT    /fees/structure/:id
POST   /fees/assign                # Assign structure to students
GET    /fees/student/:studentId
POST   /fees/pay/online            # Create Razorpay order
POST   /fees/pay/offline           # Finance Officer cash entry
POST   /fees/webhook/razorpay      # Razorpay webhook
POST   /fees/webhook/stripe        # Stripe webhook
GET    /fees/receipt/:receiptId/pdf
POST   /fees/refund/:paymentId
GET    /fees/analytics
```

### Exams
```
POST   /exams/schedule
GET    /exams/schedule/:semesterId
GET    /exams/hallticket/:studentId/pdf
POST   /exams/seating
POST   /exams/marks/entry
GET    /exams/marks/:examId
POST   /exams/results/publish/:semesterId
GET    /exams/results/:studentId
GET    /exams/transcript/:studentId/pdf
GET    /exams/analytics/:semesterId
```

### Analytics & Reports
```
GET    /analytics/attendance
GET    /analytics/fees
GET    /analytics/exams
GET    /reports/export/pdf
GET    /reports/export/excel
```

---

## 6. Docker Configuration

### docker-compose.yml (Development)
```yaml
version: '3.8'
services:
  mongo:
    image: mongo:7
    ports:
      - "27017:27017"
    volumes:
      - mongo_data:/data/db

  server:
    build: ./server
    ports:
      - "5000:5000"
    env_file: ./server/.env
    depends_on:
      - mongo
    volumes:
      - ./server:/app
      - /app/node_modules

  client:
    build: ./client
    ports:
      - "3000:3000"
    env_file: ./client/.env
    volumes:
      - ./client:/app
      - /app/node_modules

volumes:
  mongo_data:
```

### docker-compose.prod.yml (Production)
```yaml
version: '3.8'
services:
  mongo:
    image: mongo:7
    restart: always
    volumes:
      - mongo_data:/data/db
    networks:
      - erp_network

  server:
    image: yourdockerhub/university-erp-server:latest
    restart: always
    env_file: ./server/.env
    depends_on:
      - mongo
    networks:
      - erp_network

  client:
    image: yourdockerhub/university-erp-client:latest
    restart: always
    networks:
      - erp_network

  nginx:
    image: nginx:alpine
    restart: always
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx/nginx.conf:/etc/nginx/nginx.conf
    depends_on:
      - client
      - server
    networks:
      - erp_network

networks:
  erp_network:

volumes:
  mongo_data:
```

---

## 7. GitHub Actions CI/CD Pipeline

```yaml
# .github/workflows/ci-cd.yml
name: University ERP CI/CD

on:
  push:
    branches: [main]
  pull_request:
    branches: [main]

jobs:
  test-and-lint:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - name: Install & Lint Server
        run: |
          cd server && npm ci && npm run lint && npm run type-check
      - name: Install & Lint Client
        run: |
          cd client && npm ci && npm run lint && npm run type-check
      - name: Run Server Tests
        run: cd server && npm test

  build-and-push:
    needs: test-and-lint
    runs-on: ubuntu-latest
    if: github.ref == 'refs/heads/main'
    steps:
      - uses: actions/checkout@v4
      - name: Login to Docker Hub
        uses: docker/login-action@v3
        with:
          username: ${{ secrets.DOCKERHUB_USERNAME }}
          password: ${{ secrets.DOCKERHUB_TOKEN }}
      - name: Build & Push Server Image
        uses: docker/build-push-action@v5
        with:
          context: ./server
          push: true
          tags: |
            ${{ secrets.DOCKERHUB_USERNAME }}/university-erp-server:latest
            ${{ secrets.DOCKERHUB_USERNAME }}/university-erp-server:${{ github.sha }}
      - name: Build & Push Client Image
        uses: docker/build-push-action@v5
        with:
          context: ./client
          push: true
          tags: |
            ${{ secrets.DOCKERHUB_USERNAME }}/university-erp-client:latest
            ${{ secrets.DOCKERHUB_USERNAME }}/university-erp-client:${{ github.sha }}

  deploy:
    needs: build-and-push
    runs-on: ubuntu-latest
    steps:
      - name: Deploy to AWS EC2
        uses: appleboy/ssh-action@v1
        with:
          host: ${{ secrets.EC2_HOST }}
          username: ubuntu
          key: ${{ secrets.EC2_SSH_KEY }}
          script: |
            cd ~/university-erp
            docker-compose -f docker-compose.prod.yml pull
            docker-compose -f docker-compose.prod.yml up -d
            docker system prune -f
      - name: Health Check
        run: |
          sleep 15
          curl --fail http://${{ secrets.EC2_HOST }}/api/v1/health || exit 1
      - name: Notify on Success
        if: success()
        run: |
          curl -X POST ${{ secrets.WEBHOOK_URL }} \
            -H 'Content-Type: application/json' \
            -d '{"text":"✅ University ERP deployed successfully to EC2"}'
      - name: Notify on Failure
        if: failure()
        run: |
          curl -X POST ${{ secrets.WEBHOOK_URL }} \
            -H 'Content-Type: application/json' \
            -d '{"text":"❌ University ERP deployment FAILED"}'
```

---

## 8. Environment Variables

### Server `.env`
```env
NODE_ENV=production
PORT=5000
MONGO_URI=mongodb://mongo:27017/university_erp
JWT_SECRET=your_jwt_secret_here
JWT_REFRESH_SECRET=your_refresh_secret_here
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d
RAZORPAY_KEY_ID=rzp_live_xxxx
RAZORPAY_KEY_SECRET=your_razorpay_secret
STRIPE_SECRET_KEY=sk_live_xxxx
STRIPE_WEBHOOK_SECRET=whsec_xxxx
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your_email@gmail.com
SMTP_PASS=your_app_password
FROM_EMAIL=noreply@university.edu
CLIENT_URL=https://your-ec2-domain.com
PDF_TEMPLATE_DIR=./src/templates
```

### Client `.env`
```env
VITE_API_URL=https://your-ec2-domain.com/api/v1
VITE_RAZORPAY_KEY_ID=rzp_live_xxxx
VITE_APP_NAME=University ERP
```

---

## 9. Error Handling Strategy

- **Custom Error Class:** `AppError(message, statusCode, isOperational)`
- **Async Wrapper:** `catchAsync(fn)` wraps all controller functions
- **Global Error Middleware:** catches all errors, formats response
- **Zod Validation:** request body/query validated before controller runs
- **Frontend Errors:** RTK Query error interceptor → toast notifications via sonner
- **Unhandled Rejections / Uncaught Exceptions:** logged + graceful server shutdown

```typescript
// Error response shape
{
  "status": "error",
  "statusCode": 400,
  "message": "Validation failed",
  "errors": [{ "field": "email", "message": "Invalid email format" }]
}
```

---

## 10. PDF Generation Strategy

- **Engine:** Puppeteer (headless Chromium, HTML → PDF)
- **Templates:** Handlebars `.hbs` files compiled server-side
- **Storage:** Generated PDFs stored in `/tmp` and streamed directly or saved to S3
- **Documents and templates:**

| Document           | Template File            | Trigger                          |
|--------------------|--------------------------|----------------------------------|
| Fee Receipt        | `receipt.hbs`            | Payment success                  |
| Hall Ticket        | `hallTicket.hbs`         | 14 days before exam              |
| Transcript         | `transcript.hbs`         | Result published + student req   |
| Timetable          | `timetable.hbs`          | On-demand by role                |
| Attendance Report  | `attendanceReport.hbs`   | HOD / Admin export               |
