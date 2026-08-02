# University ERP — Database Schema (MongoDB / Mongoose)

## Core Collections Overview

| Collection | Purpose | Status |
| :--- | :--- | :--- |
| `users` | User accounts across Super Admin, HOD, Faculty, and Student roles | ✅ Active |
| `departments` | Academic departments (e.g. CSE, ECE, ME) | ✅ Active |
| `programs` | Degree programs (e.g. B.Tech, M.Tech) | ✅ Active |
| `batches` | Student cohorts grouped by program, year, and section | ✅ Active |
| `subjects` | Course catalog with credits, lab status, and weekly hours | ✅ Active |
| `rooms` | Classrooms, lecture halls, and specialized labs with capacities | ✅ Active |
| `timeslots` | Weekly lecture time slots (days, start/end times) | ✅ Active |
| `timetables` | Generated and published schedule grids with conflict logs | ✅ Active |
| `attendance` | Lecture-wise attendance records and student attendance status | ✅ Active |
| `refresh_tokens` | Stored refresh tokens for secure JWT authentication | ✅ Active |
| `fee_structures` | Fee definitions (Out of Scope for Core Edition) | ⏸ Deferred |
| `student_fees` | Per-student fee tracking (Out of Scope for Core Edition) | ⏸ Deferred |
| `payments` | Fee payment logs (Out of Scope for Core Edition) | ⏸ Deferred |
| `exam_schedules` | Exam schedules (Out of Scope for Core Edition) | ⏸ Deferred |
| `marks` | Student exam marks (Out of Scope for Core Edition) | ⏸ Deferred |

---

## Active Schemas

### 1. `users`
```typescript
{
  _id: ObjectId,
  name: String (required, trim),
  email: String (required, unique, lowercase),
  passwordHash: String (required, select: false),
  role: { type: String, enum: ['super_admin', 'hod', 'faculty', 'student'], required: true },
  phone: String,
  avatar: String,
  isActive: Boolean (default: true),

  // Student fields
  enrollmentNumber: String (unique, sparse),
  program: { type: ObjectId, ref: 'Program' },
  batch: { type: ObjectId, ref: 'Batch' },
  semester: Number,
  admissionYear: Number,

  // Faculty fields
  employeeId: String (unique, sparse),
  designation: String,
  department: { type: ObjectId, ref: 'Department' },
  subjectsAssigned: [{ type: ObjectId, ref: 'Subject' }],
  preferredSlots: [{ type: ObjectId, ref: 'TimeSlot' }],
  maxHoursPerDay: Number (default: 6),

  createdAt: Date,
  updatedAt: Date
}
```

### 2. `departments`
```typescript
{
  _id: ObjectId,
  name: String (required, unique),
  code: String (required, unique, uppercase),
  hod: { type: ObjectId, ref: 'User' },
  isActive: Boolean (default: true),
  createdAt: Date,
  updatedAt: Date
}
```

### 3. `programs`
```typescript
{
  _id: ObjectId,
  name: String (required),
  code: String (required, unique, uppercase),
  department: { type: ObjectId, ref: 'Department', required: true },
  durationYears: Number (required),
  totalSemesters: Number (required),
  isActive: Boolean (default: true),
  createdAt: Date,
  updatedAt: Date
}
```

### 4. `batches`
```typescript
{
  _id: ObjectId,
  program: { type: ObjectId, ref: 'Program', required: true },
  academicYear: String (required),
  year: Number (required),
  section: String (required),
  studentCount: Number (default: 0),
  isActive: Boolean (default: true),
  createdAt: Date,
  updatedAt: Date
}
```

### 5. `subjects`
```typescript
{
  _id: ObjectId,
  name: String (required),
  code: String (required, unique, uppercase),
  credits: Number (required),
  isLab: Boolean (default: false),
  hoursPerWeek: Number (required),
  department: { type: ObjectId, ref: 'Department', required: true },
  program: { type: ObjectId, ref: 'Program', required: true },
  semester: Number (required),
  isActive: Boolean (default: true),
  createdAt: Date
}
```

### 6. `rooms`
```typescript
{
  _id: ObjectId,
  name: String (required, unique),
  building: String (required),
  capacity: Number (required),
  isLab: Boolean (default: false),
  labType: String,
  isActive: Boolean (default: true),
  createdAt: Date
}
```

### 7. `timeslots`
```typescript
{
  _id: ObjectId,
  day: String (required, enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']),
  startTime: String (required), // e.g. "09:00"
  endTime: String (required),   // e.g. "10:00"
  slotIndex: Number (required),
  isBreak: Boolean (default: false),
  isActive: Boolean (default: true)
}
```

### 8. `timetables`
```typescript
{
  _id: ObjectId,
  department: { type: ObjectId, ref: 'Department', required: true },
  semester: Number (required),
  academicYear: String (required),
  status: { type: String, enum: ['draft', 'published'], default: 'draft' },
  entries: [{
    batch: { type: ObjectId, ref: 'Batch' },
    subject: { type: ObjectId, ref: 'Subject' },
    faculty: { type: ObjectId, ref: 'User' },
    room: { type: ObjectId, ref: 'Room' },
    timeSlot: { type: ObjectId, ref: 'TimeSlot' },
    day: String,
    isLab: Boolean
  }],
  conflicts: [{
    type: String,
    description: String,
    severity: String
  }],
  generatedBy: { type: ObjectId, ref: 'User' },
  publishedAt: Date,
  createdAt: Date,
  updatedAt: Date
}
```

### 9. `attendance`
```typescript
{
  _id: ObjectId,
  batch: { type: ObjectId, ref: 'Batch', required: true },
  subject: { type: ObjectId, ref: 'Subject', required: true },
  faculty: { type: ObjectId, ref: 'User', required: true },
  timeSlot: { type: ObjectId, ref: 'TimeSlot', required: true },
  date: Date (required),
  academicYear: String (required),
  records: [{
    student: { type: ObjectId, ref: 'User', required: true },
    status: { type: String, enum: ['present', 'absent', 'late'], required: true },
    remarks: String
  }],
  totalStudents: Number (required),
  presentCount: Number (required),
  createdAt: Date,
  updatedAt: Date
}
```
