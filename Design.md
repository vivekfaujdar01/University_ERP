# University ERP — Design Specification

## 1. Design System

| Property          | Value                                      |
|-------------------|--------------------------------------------|
| Framework         | Tailwind CSS v3 + shadcn/ui                |
| Typography        | Inter (Google Fonts, sans-serif)           |
| Primary           | `#3B82F6` — Blue-500                       |
| Primary Dark      | `#1D4ED8` — Blue-700                       |
| Accent            | `#10B981` — Emerald-500                    |
| Warning           | `#F59E0B` — Amber-500                      |
| Error             | `#EF4444` — Red-500                        |
| Success           | `#22C55E` — Green-500                      |
| Background        | `#F9FAFB` — Gray-50 (light mode)           |
| Surface           | `#FFFFFF` — White (cards, modals)          |
| Text Primary      | `#111827` — Gray-900                       |
| Text Secondary    | `#6B7280` — Gray-500                       |
| Border            | `#E5E7EB` — Gray-200                       |
| Dark Mode BG      | `#0F172A` — Slate-900                      |
| Dark Mode Surface | `#1E293B` — Slate-800                      |
| Border Radius     | `0.5rem` (cards), `0.375rem` (inputs)      |
| Shadow            | `shadow-sm` default, `shadow-md` on cards  |

---

## 2. Layout Architecture

### Shell Layout (All authenticated pages)

```
┌──────────────────────────────────────────────────────────┐
│  HEADER (fixed top, h-16)                                 │
│  [Logo]  [Breadcrumb]          [🔔 Bell] [Avatar ▾]      │
├────────────┬─────────────────────────────────────────────┤
│            │                                             │
│  SIDEBAR   │   MAIN CONTENT AREA                        │
│  (fixed,   │   (scrollable)                             │
│   w-64)    │                                             │
│            │   [Page Title]                              │
│  Nav links │   [Action Buttons]                          │
│  grouped   │   [Content Cards / Tables / Charts]         │
│  by module │                                             │
│            │                                             │
└────────────┴─────────────────────────────────────────────┘
```

### Sidebar Behavior
- Full width (w-64) on desktop (≥1024px)
- Icon-only (w-16) on tablet (640px–1024px) — tooltip on hover
- Slide-over drawer on mobile (<640px) — hamburger toggles
- Active link: `bg-primary/10 text-primary font-medium border-r-2 border-primary`
- Inactive link: `text-gray-600 hover:bg-gray-100`

---

## 3. Role-Based Sidebar Navigation

### Super Admin
```
Dashboard
├── Users & Structure
│   ├── Users
│   ├── Departments
│   ├── Programs & Batches
│   ├── Subjects
│   └── Rooms & Time Slots
├── Timetable
├── Analytics
└── Settings
```

### HOD
```
Dashboard
├── Timetable
│   ├── Generate
│   └── View Published
├── Attendance
│   ├── Reports
│   └── Defaulters
├── Exams
│   ├── Schedule
│   ├── Results
│   └── Analytics
└── Faculty Management
```

### Faculty
```
Dashboard
├── My Timetable
├── Attendance
│   └── Mark Attendance
└── Exams
    └── Mark Entry
```

### Student
```
Dashboard
├── My Timetable
├── Attendance
├── Fees
│   ├── Pay Fees
│   └── Payment History
└── Exams
    ├── Hall Ticket
    └── Results & Transcript
```

### Finance Officer
```
Dashboard
├── Fee Structures
├── Student Fees
├── Payments
│   ├── Record Cash Payment
│   └── Refunds
├── Scholarships
└── Analytics
```

---

## 4. Dashboard Designs

### Super Admin Dashboard (`/admin/dashboard`)

```
┌──────────┬──────────┬──────────┬──────────┐
│ Students │ Faculty  │   Depts  │Pending   │
│   1,240  │   87     │    12    │ Dues ₹4L │
└──────────┴──────────┴──────────┴──────────┘

┌────────────────────────┬───────────────────┐
│ Recent Activity Log    │ Quick Actions     │
│ (scrollable list)      │ [+ Add Dept]      │
│                        │ [+ Add User]      │
│ • HOD published        │ [Generate TT]     │
│   timetable (2m ago)   │ [Publish Results] │
│ • 12 payments today    │                   │
│ • 3 refunds pending    │                   │
└────────────────────────┴───────────────────┘

┌────────────────────────────────────────────┐
│ Fee Collection This Month                  │
│ [============================>  82%]       │
│ ₹8.2L collected / ₹10L target             │
└────────────────────────────────────────────┘
```

### Student Dashboard (`/student/dashboard`)

```
┌──────────────────────────────────────────┐
│ ⚠ Attendance Warning                     │
│ Mathematics: 68% — Minimum required: 75% │
└──────────────────────────────────────────┘

┌──────────┬──────────┬──────────┬──────────┐
│Attendance│  Fees    │  CGPA    │Upcoming  │
│  74.2%   │ ₹2,000  │   8.4    │Exams: 3  │
│          │ due      │          │          │
└──────────┴──────────┴──────────┴──────────┘

┌─────────────────────┬────────────────────┐
│ Attendance per Sub  │ Today's Timetable  │
│ [Donut chart]       │ 9-10  Maths  R101  │
│                     │ 10-11 DS     Lab1  │
│                     │ 2-3   OS     R203  │
└─────────────────────┴────────────────────┘
```

### Finance Officer Dashboard (`/finance/dashboard`)

```
┌──────────┬──────────┬──────────┬──────────┐
│ Collected│  Pending │ Overdue  │ Refunds  │
│  ₹48.2L  │  ₹12.4L │  ₹3.1L  │    7     │
└──────────┴──────────┴──────────┴──────────┘

┌──────────────────────────┬───────────────┐
│ Monthly Collection Bar   │ Overdue List  │
│ Chart (Recharts)         │ Student Name  │
│ Jan Feb Mar Apr May Jun  │ Days overdue  │
│                          │ Amount due    │
└──────────────────────────┴───────────────┘
```

---

## 5. Key Page Designs

### Timetable Grid (`/hod/timetable`)

```
         MON        TUE        WED        THU        FRI
09-10  [MATHS   ][  OS    ][  DS    ][ MATHS  ][  OS    ]
       R101 FacA  R203 FacB  Lab1 FacC  R101 FacA  R203 FacB

10-11  [  DS    ][ MATHS  ][        ][  OS    ][  DS    ]
       Lab1 FacC  R101 FacA  LUNCH    R203 FacB  Lab1 FacC

11-12  [  OS    ][  DS    ][ MATHS  ][        ][ MATHS  ]
       ...

CONFLICT cells: bg-red-100 border border-red-500
LAB cells:      bg-purple-100
Normal cells:   bg-blue-50 (color varies by subject)
Empty cells:    bg-gray-50

Hover tooltip:
  ┌─────────────────┐
  │ Data Structures │
  │ Faculty: Dr. X  │
  │ Room: Lab 1     │
  │ Batch: CS-A     │
  └─────────────────┘
```

### Attendance Marking Page (`/faculty/attendance/mark`)

```
Subject: Data Structures | Batch: CS-A | Date: Mon 15 Jan | Slot: 10-11 AM

[Mark All Present]  [Mark All Absent]

┌──┬──────────────────┬────────────┬──────────────────┐
│# │ Student Name     │ Roll No    │ Status           │
├──┼──────────────────┼────────────┼──────────────────┤
│1 │ Arjun Sharma     │ CS21001    │ [P] [A] [Late]   │
│2 │ Priya Patel      │ CS21002    │ [P] [A] [Late]   │
│3 │ Rahul Verma      │ CS21003    │ [P] [A] [Late]   │
└──┴──────────────────┴────────────┴──────────────────┘

P = green button (selected = bg-green-500 text-white)
A = red button (selected = bg-red-500 text-white)

[Submit Attendance]  (disabled if not all marked)
```

### Fee Dashboard — Student (`/student/fees`)

```
┌────────────────────────────────────────────────┐
│ Semester 5 — 2024-25                           │
│ Total: ₹55,000 | Scholarship: ₹5,000           │
│ Net Payable: ₹50,000                           │
│ [██████████████████░░░░░░] 72% Paid            │
│ Paid: ₹36,000 | Balance: ₹14,000              │
│ Due Date: 31 Jan 2025  ⚠ 5 days overdue       │
│ Late Fee: ₹50 (₹10/day × 5 days)             │
│                                                │
│ [Pay ₹14,050 Online]  [Download Receipt]       │
└────────────────────────────────────────────────┘

Payment History:
┌────────────┬──────────┬────────────┬─────────┬──────────┐
│ Date       │ Amount   │ Mode       │ Status  │ Receipt  │
├────────────┼──────────┼────────────┼─────────┼──────────┤
│ 10 Jan     │ ₹20,000  │ Razorpay   │ Paid ✓  │ [PDF]    │
│ 20 Dec     │ ₹16,000  │ Cash       │ Paid ✓  │ [PDF]    │
└────────────┴──────────┴────────────┴─────────┴──────────┘
```

### Exam Results Page — Student (`/student/results`)

```
Semester 5 Results  |  SGPA: 8.6  |  CGPA: 8.4  |  [Download Transcript]

┌──────────────────┬──────┬──────┬───────┬───────┬────────┐
│ Subject          │ Int  │ Ext  │ Total │ Grade │ Status │
├──────────────────┼──────┼──────┼───────┼───────┼────────┤
│ Data Structures  │  28  │  62  │  90   │  O    │ Pass ✓ │
│ Operating System │  25  │  58  │  83   │  A+   │ Pass ✓ │
│ Mathematics III  │  20  │  45  │  65   │  B    │ Pass ✓ │
│ Computer Networks│  18  │  32  │  50   │  C    │ Pass ✓ │
│ Lab: DS          │  38  │  —   │  38   │  A    │ Pass ✓ │
└──────────────────┴──────┴──────┴───────┴───────┴────────┘

[Bell Curve Chart — Class Distribution for each subject]
```

### Analytics — Exam (`/admin/analytics/exams`)

```
Filters: [Semester ▾] [Department ▾] [Subject ▾] [Academic Year ▾]

┌─────────────────────┬─────────────────────┐
│ Pass % by Subject   │ Grade Distribution  │
│ (Horizontal Bar)    │ (Pie Chart)         │
│ DS:       92%       │  O: 15%  A+: 28%   │
│ OS:       87%       │  A: 32%  B+: 18%   │
│ Maths:    74%       │  B: 7%              │
└─────────────────────┴─────────────────────┘

┌─────────────────────┬─────────────────────┐
│ CGPA Trend          │ Topper List         │
│ (Line Chart per     │ 1. Priya Patel 9.8  │
│  student over sems) │ 2. Arjun Sharma 9.6 │
│                     │ 3. ...              │
└─────────────────────┴─────────────────────┘

[Export PDF]  [Export Excel]
```

---

## 6. UI Components Library

### Summary Card
```tsx
<SummaryCard
  title="Total Students"
  value={1240}
  icon={<UsersIcon />}
  trend="+12 this month"
  trendDirection="up"
  color="blue"
/>
```

### Status Badge
```
Paid        → bg-green-100  text-green-800
Partial     → bg-yellow-100 text-yellow-800
Overdue     → bg-red-100    text-red-800
Draft       → bg-gray-100   text-gray-800
Published   → bg-blue-100   text-blue-800
```

### Attendance Percentage Badge
```
≥ 75%  → text-green-600
60–74% → text-yellow-600
< 60%  → text-red-600 (pulsing)
```

---

## 7. Responsive Breakpoints

| Breakpoint | Width       | Sidebar             | Layout            |
|------------|-------------|---------------------|-------------------|
| Mobile     | < 640px     | Hidden (drawer)     | Single column     |
| Tablet     | 640–1024px  | Icon-only (w-16)    | 2 columns max     |
| Desktop    | > 1024px    | Full (w-64)         | Multi-column grid |

---

## 8. Accessibility Standards

- ARIA labels on all icon-only buttons: `aria-label="Mark attendance"`
- Form inputs: `<label>` associated with `htmlFor` on every field
- Color contrast ratio ≥ 4.5:1 for all text (WCAG AA)
- Focus indicators: `focus-visible:ring-2 focus-visible:ring-primary` on all interactive elements
- Keyboard navigation: Tab order matches visual reading order
- Toast notifications use `role="alert"` for screen readers
- Data tables include `<th scope="col">` headers
- Modal dialogs trap focus and restore on close
- Skip navigation link at top of page: "Skip to main content"

> Note: Full WCAG compliance validation requires manual testing with assistive technologies (NVDA, VoiceOver) and expert accessibility review.

---

## 9. Loading & Empty States

### Loading
- Skeleton loaders (not spinners) for table rows and cards
- Inline spinner for button actions (submit, generate)
- Full page loader only for initial auth check

### Empty States
```
[Icon]
No timetable generated yet.
[Generate Timetable]  ← CTA button
```

### Error States
- Inline field errors (red text below input)
- Toast for server errors (top-right, 4 seconds)
- Full page error boundary for critical failures with "Reload" button

---

## 10. PDF Document Designs

### Fee Receipt
```
[University Logo]  [University Name]
──────────────────────────────────────
FEE RECEIPT
Receipt No: RCPT-2025-0047
Date: 15 Jan 2025

Student: Arjun Sharma        Roll: CS21001
Program: B.Tech CSE          Semester: 5

Description              Amount
───────────────────────  ──────
Tuition Fee              ₹40,000
Lab Fee                  ₹5,000
Library Fee              ₹2,000
Scholarship (Merit 10%)  -₹4,700
Late Fee (5 days)        ₹50
───────────────────────  ──────
Total Paid               ₹14,050
Payment Mode: Razorpay (UPI)
Transaction ID: pay_OQ123abc456

[University Seal]         [Authorized Signature]
```

### Hall Ticket
```
[University Logo]        HALL TICKET — END SEMESTER EXAM
Exam: Semester 5, Jan 2025

[Student Photo]  Name: Arjun Sharma
                 Enroll No: CS21001
                 Branch: CSE, Batch: CS-A
                 DOB: 12 Mar 2003

Exam Schedule:
Date         Subject              Time     Room   Seat
20 Jan       Data Structures      10-1PM   R101   B-12
22 Jan       Operating System     10-1PM   R203   A-08
24 Jan       Mathematics III      2-5PM    R101   C-03

[QR Code for verification]

Instructions: Bring this ticket to every exam. No hall ticket = no entry.
```
