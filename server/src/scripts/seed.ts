/**
 * Seed script — idempotent, creates demo data for all T1–T3 entities.
 * Run: npm run seed
 */
import mongoose from 'mongoose';
import { connectDB } from '../config/db';
import { User } from '../models/User';
import { Department } from '../models/Department';
import { Program } from '../models/Program';
import { Batch } from '../models/Batch';
import { Subject } from '../models/Subject';
import { Room } from '../models/Room';
import { TimeSlot } from '../models/TimeSlot';
import { ROLES } from '../config/constants';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function log(msg: string) { process.stdout.write(msg + '\n'); }

// ─── Seed data ────────────────────────────────────────────────────────────────

async function seed(): Promise<void> {
  await connectDB();

  // ── Users ──────────────────────────────────────────────────────────────────
  const seedUsers = [
    { name: 'Super Admin',    email: 'admin@university.edu',   passwordHash: 'Admin@123',    role: ROLES.SUPER_ADMIN },
    { name: 'Dr. Meera Sharma', email: 'hod@university.edu',  passwordHash: 'Hod@1234',     role: ROLES.HOD, employeeId: 'EMP-HOD-01', designation: 'Professor' },
    { name: 'Prof. Raj Kumar',  email: 'faculty@university.edu', passwordHash: 'Faculty@123', role: ROLES.FACULTY, employeeId: 'EMP-001', designation: 'Assistant Professor', maxHoursPerDay: 6 },
    { name: 'Arjun Patel',    email: 'student@university.edu', passwordHash: 'Student@123',  role: ROLES.STUDENT, enrollmentNumber: 'CS21001', semester: 5, admissionYear: 2021, cgpa: 8.4 },
    { name: 'Priya Nair',     email: 'finance@university.edu', passwordHash: 'Finance@123',  role: ROLES.FINANCE_OFFICER },
  ];

  for (const u of seedUsers) {
    if (!(await User.findOne({ email: u.email }))) {
      await User.create(u);
      log(`[Seed] User created: ${u.email} (${u.role})`);
    } else {
      log(`[Seed] User skipped: ${u.email}`);
    }
  }

  // ── Department ─────────────────────────────────────────────────────────────
  let dept = await Department.findOne({ code: 'CSE' });
  if (!dept) {
    const hod = await User.findOne({ role: ROLES.HOD });
    dept = await Department.create({
      name: 'Computer Science & Engineering',
      code: 'CSE',
      hod: hod?._id,
      isActive: true,
    });
    log('[Seed] Department created: CSE');
  } else {
    log('[Seed] Department skipped: CSE');
  }

  // Link HOD to department
  const hodUser = await User.findOne({ role: ROLES.HOD });
  if (hodUser && !hodUser.department) {
    hodUser.department = dept._id;
    await hodUser.save();
  }
  const facultyUser = await User.findOne({ role: ROLES.FACULTY });
  if (facultyUser && !facultyUser.department) {
    facultyUser.department = dept._id;
    await facultyUser.save();
  }

  // ── Program ────────────────────────────────────────────────────────────────
  let program = await Program.findOne({ code: 'BTECH-CSE' });
  if (!program) {
    program = await Program.create({
      name: 'B.Tech Computer Science & Engineering',
      code: 'BTECH-CSE',
      department: dept._id,
      durationYears: 4,
      totalSemesters: 8,
      isActive: true,
    });
    await Department.findByIdAndUpdate(dept._id, { $addToSet: { programs: program._id } });
    log('[Seed] Program created: BTECH-CSE');
  } else {
    log('[Seed] Program skipped: BTECH-CSE');
  }

  // ── Batch ──────────────────────────────────────────────────────────────────
  let batch = await Batch.findOne({ program: program._id, year: 2021, section: 'A' });
  if (!batch) {
    batch = await Batch.create({
      program: program._id,
      year: 2021,
      section: 'A',
      maxStudents: 60,
      currentStudentCount: 1,
      academicYear: '2024-25',
      isActive: true,
    });
    log('[Seed] Batch created: 2021-A');
  } else {
    log('[Seed] Batch skipped: 2021-A');
  }

  // Link student to program + batch
  const studentUser = await User.findOne({ role: ROLES.STUDENT });
  if (studentUser && !studentUser.program) {
    studentUser.program = program._id;
    studentUser.batch = batch._id;
    await studentUser.save();
  }

  // ── Subjects ───────────────────────────────────────────────────────────────
  const subjectSeeds = [
    { name: 'Data Structures & Algorithms', code: 'CS301', credits: 4, hoursPerWeek: 4, semester: 5, subjectType: 'theory' as const, isLab: false },
    { name: 'Operating Systems',            code: 'CS302', credits: 3, hoursPerWeek: 3, semester: 5, subjectType: 'theory' as const, isLab: false },
    { name: 'Computer Networks',            code: 'CS303', credits: 3, hoursPerWeek: 3, semester: 5, subjectType: 'theory' as const, isLab: false },
    { name: 'Mathematics III',              code: 'MA301', credits: 4, hoursPerWeek: 4, semester: 5, subjectType: 'theory' as const, isLab: false },
    { name: 'DS Lab',                       code: 'CS391', credits: 1, hoursPerWeek: 2, semester: 5, subjectType: 'lab' as const,    isLab: true },
  ];

  const createdSubjects: mongoose.Types.ObjectId[] = [];
  for (const s of subjectSeeds) {
    let subject = await Subject.findOne({ code: s.code });
    if (!subject) {
      subject = await Subject.create({ ...s, department: dept._id, program: program._id, isActive: true });
      log(`[Seed] Subject created: ${s.code}`);
    } else {
      log(`[Seed] Subject skipped: ${s.code}`);
    }
    createdSubjects.push(subject._id);
  }

  // Assign subjects to faculty
  if (facultyUser) {
    await User.findByIdAndUpdate(facultyUser._id, { subjectsAssigned: createdSubjects.slice(0, 3) });
  }

  // ── Rooms ──────────────────────────────────────────────────────────────────
  const roomSeeds = [
    { name: 'R101', capacity: 60, isLab: false, building: 'Main Block', floor: 1, facilities: ['projector', 'AC'] },
    { name: 'R102', capacity: 60, isLab: false, building: 'Main Block', floor: 1, facilities: ['projector'] },
    { name: 'R203', capacity: 60, isLab: false, building: 'Main Block', floor: 2, facilities: ['projector', 'AC'] },
    { name: 'Lab-A', capacity: 40, isLab: true,  building: 'Tech Block', floor: 1, facilities: ['computers', 'projector'] },
    { name: 'Lab-B', capacity: 40, isLab: true,  building: 'Tech Block', floor: 1, facilities: ['computers'] },
  ];

  for (const r of roomSeeds) {
    if (!(await Room.findOne({ name: r.name }))) {
      await Room.create({ ...r, isActive: true });
      log(`[Seed] Room created: ${r.name}`);
    } else {
      log(`[Seed] Room skipped: ${r.name}`);
    }
  }

  // ── TimeSlots ──────────────────────────────────────────────────────────────
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'] as const;
  const slots = [
    { startTime: '09:00', endTime: '10:00', slotNumber: 1 },
    { startTime: '10:00', endTime: '11:00', slotNumber: 2 },
    { startTime: '11:00', endTime: '12:00', slotNumber: 3 },
    { startTime: '12:00', endTime: '13:00', slotNumber: 4, isLunchBreak: true },
    { startTime: '14:00', endTime: '15:00', slotNumber: 5 },
    { startTime: '15:00', endTime: '16:00', slotNumber: 6 },
    { startTime: '16:00', endTime: '17:00', slotNumber: 7 },
  ];

  let slotCount = 0;
  for (const day of days) {
    for (const slot of slots) {
      const exists = await TimeSlot.findOne({ day, startTime: slot.startTime });
      if (!exists) {
        await TimeSlot.create({ day, ...slot, isLunchBreak: slot.isLunchBreak ?? false });
        slotCount++;
      }
    }
  }
  log(`[Seed] TimeSlots created: ${slotCount} (5 days × 7 slots)`);

  // ── Summary ────────────────────────────────────────────────────────────────
  log('\n[Seed] ✅ Done.\n');
  log('Demo credentials:');
  for (const u of seedUsers) {
    log(`  ${u.role.padEnd(16)} ${u.email.padEnd(30)}  ${u.passwordHash}`);
  }

  await mongoose.disconnect();
  process.exit(0);
}

seed().catch((err: unknown) => {
  process.stderr.write(`[Seed] Error: ${String(err)}\n`);
  process.exit(1);
});
