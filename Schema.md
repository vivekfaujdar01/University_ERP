# University ERP — Database Schema (MongoDB / Mongoose)

## Collections Overview

| Collection       | Purpose                                       |
|------------------|-----------------------------------------------|
| users            | All user roles (single collection, role field) |
| departments      | Academic departments                           |
| programs         | Degree programs (B.Tech, M.Tech, etc.)         |
| batches          | Student groups per program + year + section    |
| subjects         | Course catalog with credit and lab info        |
| rooms            | Classrooms and labs                            |
| timeslots        | Available time slots across the week           |
| timetables       | Generated + published schedules                |
| attendance       | Per-lecture attendance records                 |
| fee_structures   | Fee definitions per program/semester           |
| student_fees     | Per-student fee assignment and tracking        |
| payments         | All payment transactions                       |
| receipts         | Generated receipt metadata                     |
| scholarships     | Scholarship definitions                        |
| exam_schedules   | Individual exam event records                  |
| hall_tickets     | Generated hall ticket records                  |
| marks            | Faculty-entered marks per student per exam     |
| results          | Computed grades, SGPA, CGPA per student        |
| notifications    | In-app and email notification queue            |
| refresh_tokens   | Stored refresh tokens for JWT invalidation     |

---

## Schemas

---

### 1. users

```typescript
{
  _id: ObjectId,
  name: String (required, trim),
  email: String (required, unique, lowercase),
  passwordHash: String (required, select: false),
  role: {
    type: String,
    enum: ['super_admin', 'hod', 'faculty', 'student', 'finance_officer'],
    required: true
  },
  phone: String,
  avatar: String,       // URL
  isActive: Boolean (default: true),

  // --- Student-specific fields ---
  enrollmentNumber: String (unique, sparse),
  program: { type: ObjectId, ref: 'Program' },
  batch: { type: ObjectId, ref: 'Batch' },
  semester: Number,
  admissionYear: Number,
  cgpa: Number (default: 0),

  // --- Faculty-specific fields ---
  employeeId: String (unique, sparse),
  designation: String,
  department: { type: ObjectId, ref: 'Department' },
  subjectsAssigned: [{ type: ObjectId, ref: 'Subject' }],
  preferredSlots: [{ type: ObjectId, ref: 'TimeSlot' }],
  maxHoursPerDay: { type: Number, default: 6 },

  createdAt: Date,
  updatedAt: Date
}

Indexes:
  { email: 1 }                        unique
  { enrollmentNumber: 1 }             unique, sparse
  { employeeId: 1 }                   unique, sparse
  { role: 1, department: 1 }
  { batch: 1 }
```

---

### 2. departments

```typescript
{
  _id: ObjectId,
  name: String (required, unique),
  code: String (required, unique, uppercase),  // e.g. 'CSE', 'ECE'
  hod: { type: ObjectId, ref: 'User' },
  programs: [{ type: ObjectId, ref: 'Program' }],
  isActive: Boolean (default: true),
  createdAt: Date,
  updatedAt: Date
}
```

---

### 3. programs

```typescript
{
  _id: ObjectId,
  name: String (required),         // e.g. 'B.Tech Computer Science'
  code: String (required, unique), // e.g. 'BTECH-CSE'
  department: { type: ObjectId, ref: 'Department', required: true },
  durationYears: Number (required),
  totalSemesters: Number (required),
  isActive: Boolean (default: true),
  createdAt: Date
}
```

---

### 4. batches

```typescript
{
  _id: ObjectId,
  program: { type: ObjectId, ref: 'Program', required: true },
  year: Number (required),            // e.g. 2022 (admission year)
  section: String (required),         // e.g. 'A', 'B', 'C'
  maxStudents: Number (required),
  currentStudentCount: Number (default: 0),
  academicYear: String,               // e.g. '2024-25'
  isActive: Boolean (default: true),
  createdAt: Date
}

Indexes:
  { program: 1, year: 1, section: 1 }  unique
```

---

### 5. subjects

```typescript
{
  _id: ObjectId,
  name: String (required),
  code: String (required, unique),
  credits: Number (required, min: 1, max: 5),
  isLab: Boolean (default: false),
  hoursPerWeek: Number (required),
  department: { type: ObjectId, ref: 'Department', required: true },
  program: { type: ObjectId, ref: 'Program', required: true },
  semester: Number (required, min: 1, max: 12),
  subjectType: {
    type: String,
    enum: ['theory', 'lab', 'tutorial', 'project'],
    default: 'theory'
  },
  isActive: Boolean (default: true),
  createdAt: Date
}

Indexes:
  { program: 1, semester: 1 }
  { code: 1 }  unique
```

---

### 6. rooms

```typescript
{
  _id: ObjectId,
  name: String (required),         // e.g. 'R101', 'Lab-A'
  capacity: Number (required),
  isLab: Boolean (default: false),
  building: String,
  floor: Number,
  facilities: [String],            // e.g. ['projector', 'AC', 'computers']
  isActive: Boolean (default: true),
  createdAt: Date
}
```

---

### 7. timeslots

```typescript
{
  _id: ObjectId,
  day: {
    type: String,
    enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
    required: true
  },
  startTime: String (required),   // e.g. '09:00'
  endTime: String (required),     // e.g. '10:00'
  slotNumber: Number,             // e.g. 1, 2, 3... for ordering
  isLunchBreak: Boolean (default: false),
  createdAt: Date
}

Indexes:
  { day: 1, startTime: 1 }  unique
```

---

### 8. timetables

```typescript
{
  _id: ObjectId,
  semester: Number (required),
  department: { type: ObjectId, ref: 'Department', required: true },
  academicYear: String (required),   // e.g. '2024-25'
  status: {
    type: String,
    enum: ['draft', 'published'],
    default: 'draft'
  },
  entries: [{
    subject: { type: ObjectId, ref: 'Subject', required: true },
    faculty: { type: ObjectId, ref: 'User', required: true },
    batch: { type: ObjectId, ref: 'Batch', required: true },
    room: { type: ObjectId, ref: 'Room', required: true },
    timeSlot: { type: ObjectId, ref: 'TimeSlot', required: true }
  }],
  conflicts: [{
    type: {
      type: String,
      enum: ['teacher', 'room', 'batch', 'capacity', 'lab']
    },
    description: String,
    involvedEntryIndexes: [Number]
  }],
  isComplete: Boolean (default: false),
  generatedAt: Date,
  publishedAt: Date,
  publishedBy: { type: ObjectId, ref: 'User' },
  createdAt: Date,
  updatedAt: Date
}

Indexes:
  { department: 1, semester: 1, academicYear: 1 }
  { status: 1 }
```

---

### 9. attendance

```typescript
{
  _id: ObjectId,
  date: Date (required),
  subject: { type: ObjectId, ref: 'Subject', required: true },
  faculty: { type: ObjectId, ref: 'User', required: true },
  batch: { type: ObjectId, ref: 'Batch', required: true },
  timeSlot: { type: ObjectId, ref: 'TimeSlot', required: true },
  records: [{
    student: { type: ObjectId, ref: 'User', required: true },
    status: {
      type: String,
      enum: ['present', 'absent', 'late'],
      required: true
    }
  }],
  totalStudents: Number,
  presentCount: Number,
  markedAt: Date,
  isLocked: Boolean (default: false),  // true after 24h, no edits
  createdAt: Date
}

Indexes:
  { date: 1, subject: 1, batch: 1, timeSlot: 1 }  unique
  { 'records.student': 1, subject: 1 }
  { faculty: 1, date: 1 }
```

---

### 10. fee_structures

```typescript
{
  _id: ObjectId,
  program: { type: ObjectId, ref: 'Program', required: true },
  semester: Number (required),
  academicYear: String (required),
  components: [{
    name: String (required),     // e.g. 'Tuition Fee', 'Lab Fee'
    amount: Number (required),
    isMandatory: Boolean (default: true),
    description: String
  }],
  totalAmount: Number (required),
  dueDate: Date (required),
  lateFeePerDay: Number (default: 10),  // in smallest currency unit
  isActive: Boolean (default: true),
  createdBy: { type: ObjectId, ref: 'User' },
  createdAt: Date,
  updatedAt: Date
}

Indexes:
  { program: 1, semester: 1, academicYear: 1 }  unique
```

---

### 11. student_fees

```typescript
{
  _id: ObjectId,
  student: { type: ObjectId, ref: 'User', required: true },
  feeStructure: { type: ObjectId, ref: 'FeeStructure', required: true },
  totalAmount: Number (required),
  scholarship: { type: ObjectId, ref: 'Scholarship' },
  discountAmount: Number (default: 0),
  netPayable: Number (required),
  amountPaid: Number (default: 0),
  balance: Number (required),
  status: {
    type: String,
    enum: ['unpaid', 'partial', 'paid', 'overdue'],
    default: 'unpaid'
  },
  dueDate: Date,
  payments: [{ type: ObjectId, ref: 'Payment' }],
  createdAt: Date,
  updatedAt: Date
}

Indexes:
  { student: 1, feeStructure: 1 }  unique
  { status: 1 }
  { student: 1 }
```

---

### 12. payments

```typescript
{
  _id: ObjectId,
  student: { type: ObjectId, ref: 'User', required: true },
  studentFee: { type: ObjectId, ref: 'StudentFee', required: true },
  amount: Number (required, min: 1),
  paymentMode: {
    type: String,
    enum: ['online', 'offline'],
    required: true
  },
  gateway: {
    type: String,
    enum: ['razorpay', 'stripe', 'cash'],
    required: true
  },
  // Gateway fields (online only)
  gatewayOrderId: String,
  gatewayPaymentId: String,
  gatewaySignature: String,
  // Offline fields
  referenceNumber: String,
  remarks: String,
  recordedBy: { type: ObjectId, ref: 'User' },  // Finance Officer
  // Status
  status: {
    type: String,
    enum: ['pending', 'success', 'failed', 'refunded'],
    default: 'pending'
  },
  paidAt: Date,
  refundReason: String,
  refundedAt: Date,
  refundGatewayId: String,
  createdAt: Date
}

Indexes:
  { student: 1 }
  { studentFee: 1 }
  { gatewayPaymentId: 1 }  sparse
  { status: 1 }
  { paidAt: -1 }
```

---

### 13. receipts

```typescript
{
  _id: ObjectId,
  payment: { type: ObjectId, ref: 'Payment', required: true, unique: true },
  student: { type: ObjectId, ref: 'User', required: true },
  receiptNumber: String (required, unique),  // e.g. 'RCPT-2025-0047'
  pdfUrl: String,           // S3 URL or local path
  pdfGeneratedAt: Date,
  emailedAt: Date,
  createdAt: Date
}

Indexes:
  { receiptNumber: 1 }  unique
  { student: 1 }
```

---

### 14. scholarships

```typescript
{
  _id: ObjectId,
  name: String (required),               // e.g. 'Merit Scholarship 10%'
  discountType: {
    type: String,
    enum: ['flat', 'percentage'],
    required: true
  },
  value: Number (required),              // Amount (flat) or % (percentage)
  maxAmount: Number,                     // Cap for percentage discounts
  eligibilityCriteria: String,           // Description text
  isActive: Boolean (default: true),
  createdAt: Date
}
```

---

### 15. exam_schedules

```typescript
{
  _id: ObjectId,
  subject: { type: ObjectId, ref: 'Subject', required: true },
  batch: { type: ObjectId, ref: 'Batch', required: true },
  date: Date (required),
  startTime: String (required),   // e.g. '10:00'
  endTime: String (required),     // e.g. '13:00'
  room: { type: ObjectId, ref: 'Room' },
  examType: {
    type: String,
    enum: ['internal', 'external', 'practical', 'viva'],
    required: true
  },
  semester: Number (required),
  academicYear: String (required),
  status: {
    type: String,
    enum: ['scheduled', 'completed', 'cancelled', 'postponed'],
    default: 'scheduled'
  },
  totalMarks: Number (required),
  passingMarks: Number (required),
  createdBy: { type: ObjectId, ref: 'User' },
  createdAt: Date,
  updatedAt: Date
}

Indexes:
  { batch: 1, date: 1 }
  { subject: 1, semester: 1, academicYear: 1 }
  { date: 1 }
```

---

### 16. hall_tickets

```typescript
{
  _id: ObjectId,
  student: { type: ObjectId, ref: 'User', required: true },
  semester: Number (required),
  academicYear: String (required),
  examSchedules: [{ type: ObjectId, ref: 'ExamSchedule' }],
  isEligible: Boolean (required),
  ineligibilityReasons: [String],   // e.g. ['Attendance < 75% in OS']
  pdfUrl: String,
  qrCode: String,                   // Encoded verification string
  generatedAt: Date,
  emailedAt: Date,
  createdAt: Date
}

Indexes:
  { student: 1, semester: 1, academicYear: 1 }  unique
```

---

### 17. marks

```typescript
{
  _id: ObjectId,
  student: { type: ObjectId, ref: 'User', required: true },
  subject: { type: ObjectId, ref: 'Subject', required: true },
  examSchedule: { type: ObjectId, ref: 'ExamSchedule', required: true },
  faculty: { type: ObjectId, ref: 'User', required: true },
  internalMarks: { type: Number, default: 0 },
  externalMarks: { type: Number, default: 0 },
  practicalMarks: { type: Number, default: 0 },
  totalMarks: Number,        // Computed: internal + external + practical
  maxMarks: Number,
  isAbsent: Boolean (default: false),
  semester: Number (required),
  academicYear: String (required),
  enteredAt: Date,
  updatedAt: Date
}

Indexes:
  { student: 1, subject: 1, examSchedule: 1 }  unique
  { examSchedule: 1 }
  { student: 1, semester: 1 }
```

---

### 18. results

```typescript
{
  _id: ObjectId,
  student: { type: ObjectId, ref: 'User', required: true },
  semester: Number (required),
  academicYear: String (required),
  subjectResults: [{
    subject: { type: ObjectId, ref: 'Subject', required: true },
    marks: { type: ObjectId, ref: 'Mark' },
    grade: String,           // e.g. 'O', 'A+', 'A', 'B+', 'B', 'C', 'F'
    gradePoint: Number,      // e.g. 10, 9, 8, 7, 6, 5, 0
    credits: Number,
    creditPoints: Number,    // gradePoint × credits
    status: {
      type: String,
      enum: ['pass', 'fail', 'backlog', 'absent'],
      required: true
    }
  }],
  totalCredits: Number,
  earnedCredits: Number,
  sgpa: Number,
  cgpa: Number,
  isPublished: Boolean (default: false),
  publishedAt: Date,
  publishedBy: { type: ObjectId, ref: 'User' },
  createdAt: Date,
  updatedAt: Date
}

Indexes:
  { student: 1, semester: 1, academicYear: 1 }  unique
  { student: 1 }
  { isPublished: 1 }
```

---

### 19. notifications

```typescript
{
  _id: ObjectId,
  recipient: { type: ObjectId, ref: 'User', required: true },
  type: {
    type: String,
    enum: [
      'attendance_warning',
      'payment_success',
      'payment_overdue',
      'hall_ticket_ready',
      'result_published',
      'timetable_published',
      'refund_processed',
      'general'
    ],
    required: true
  },
  title: String (required),
  message: String (required),
  link: String,               // Frontend route to navigate on click
  isRead: Boolean (default: false),
  emailSent: Boolean (default: false),
  emailSentAt: Date,
  metadata: Mixed,            // Extra data (paymentId, examId, etc.)
  createdAt: Date
}

Indexes:
  { recipient: 1, isRead: 1 }
  { recipient: 1, createdAt: -1 }
```

---

### 20. refresh_tokens

```typescript
{
  _id: ObjectId,
  user: { type: ObjectId, ref: 'User', required: true },
  tokenHash: String (required),    // bcrypt hash of refresh token
  expiresAt: Date (required),
  isRevoked: Boolean (default: false),
  createdAt: Date
}

Indexes:
  { user: 1 }
  { expiresAt: 1 }     // TTL index: auto-delete expired documents
  { tokenHash: 1 }
```

---

## Grading Scheme Reference

```
Marks Range  →  Grade  →  Grade Points
90 – 100     →  O      →  10
80 – 89      →  A+     →  9
70 – 79      →  A      →  8
60 – 69      →  B+     →  7
55 – 59      →  B      →  6
50 – 54      →  C      →  5
45 – 49      →  D      →  4
< 45         →  F      →  0  (Fail / Backlog)

SGPA = SUM(gradePoint × credits) / SUM(credits) [per semester]
CGPA = SUM(all semester creditPoints) / SUM(all credits)
```

---

## Entity Relationship Summary

```
Department  ──< Programs  ──< Batches  ──< Users (students)
Department  ──< Users (faculty, hod)
Programs    ──< Subjects
Batches     ──< Attendance (records[])
Batches     ──< Timetable.entries[]
Subjects    ──< Marks
Subjects    ──< ExamSchedules
Users       ──< StudentFees  ──< Payments  ──< Receipts
Users       ──< Results      ──< subjectResults[]
Users       ──< HallTickets
Users       ──< Notifications
```
