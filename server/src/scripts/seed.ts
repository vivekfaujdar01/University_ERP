/**
 * Seed script — idempotent, creates demo data for all T1–T5 entities.
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
import { Timetable } from '../models/Timetable';
import { ROLES } from '../config/constants';

function log(msg: string) {
  process.stdout.write(msg + '\n');
}

async function seed(): Promise<void> {
  await connectDB();

  // ── 1. Users ─────────────────────────────────────────────────────────────────
  const seedUsers = [
    {
      name: 'Super Admin',
      email: 'admin@university.edu',
      passwordHash: 'Admin@123',
      role: ROLES.SUPER_ADMIN,
    },
    {
      name: 'Dr. Meera Sharma',
      email: 'hod@university.edu',
      passwordHash: 'Hod@1234',
      role: ROLES.HOD,
      employeeId: 'EMP-HOD-01',
      designation: 'Professor',
    },
    // Faculty 1
    {
      name: 'Prof. Raj Kumar',
      email: 'faculty@university.edu',
      passwordHash: 'Faculty@123',
      role: ROLES.FACULTY,
      employeeId: 'EMP-001',
      designation: 'Assistant Professor',
      maxHoursPerDay: 6,
    },
    // Faculty 2
    {
      name: 'Dr. Ananya Roy',
      email: 'ananya.faculty@university.edu',
      passwordHash: 'Faculty@123',
      role: ROLES.FACULTY,
      employeeId: 'EMP-002',
      designation: 'Associate Professor',
      maxHoursPerDay: 6,
    },
    // Faculty 3
    {
      name: 'Prof. Vikram Singh',
      email: 'vikram.faculty@university.edu',
      passwordHash: 'Faculty@123',
      role: ROLES.FACULTY,
      employeeId: 'EMP-003',
      designation: 'Assistant Professor',
      maxHoursPerDay: 6,
    },
    // Student 1 (Batch A)
    {
      name: 'Arjun Patel',
      email: 'student@university.edu',
      passwordHash: 'Student@123',
      role: ROLES.STUDENT,
      enrollmentNumber: 'CS21001',
      semester: 5,
      admissionYear: 2021,
      cgpa: 8.4,
    },
    // Student 2 (Batch A)
    {
      name: 'Riya Sen',
      email: 'riya.student@university.edu',
      passwordHash: 'Student@123',
      role: ROLES.STUDENT,
      enrollmentNumber: 'CS21002',
      semester: 5,
      admissionYear: 2021,
      cgpa: 8.9,
    },
    // Student 3 (Batch A)
    {
      name: 'Karan Verma',
      email: 'karan.student@university.edu',
      passwordHash: 'Student@123',
      role: ROLES.STUDENT,
      enrollmentNumber: 'CS21003',
      semester: 5,
      admissionYear: 2021,
      cgpa: 7.8,
    },
    // Student 4 (Batch B)
    {
      name: 'Neha Gupta',
      email: 'neha.student@university.edu',
      passwordHash: 'Student@123',
      role: ROLES.STUDENT,
      enrollmentNumber: 'CS21061',
      semester: 5,
      admissionYear: 2021,
      cgpa: 8.2,
    },
    // Student 5 (Batch B)
    {
      name: 'Rohan Sharma',
      email: 'rohan.student@university.edu',
      passwordHash: 'Student@123',
      role: ROLES.STUDENT,
      enrollmentNumber: 'CS21062',
      semester: 5,
      admissionYear: 2021,
      cgpa: 7.5,
    },
    // Finance
    {
      name: 'Priya Nair',
      email: 'finance@university.edu',
      passwordHash: 'Finance@123',
      role: ROLES.FINANCE_OFFICER,
    },
  ];

  for (const u of seedUsers) {
    if (!(await User.findOne({ email: u.email }))) {
      await User.create(u);
      log(`[Seed] User created: ${u.email} (${u.role})`);
    } else {
      log(`[Seed] User skipped: ${u.email}`);
    }
  }

  // ── 2. Department ─────────────────────────────────────────────────────────────
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
  }

  // Link HOD & Faculty to Department
  const hodUser = await User.findOne({ role: ROLES.HOD });
  if (hodUser && !hodUser.department) {
    hodUser.department = dept._id;
    await hodUser.save();
  }

  const facultyMembers = await User.find({ role: ROLES.FACULTY });
  for (const f of facultyMembers) {
    if (!f.department) {
      f.department = dept._id;
      await f.save();
    }
  }

  // ── 3. Program ────────────────────────────────────────────────────────────────
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
  }

  // ── 4. Batches ────────────────────────────────────────────────────────────────
  let batchA = await Batch.findOne({ program: program._id, year: 2021, section: 'A' });
  if (!batchA) {
    batchA = await Batch.create({
      program: program._id,
      year: 2021,
      section: 'A',
      maxStudents: 60,
      currentStudentCount: 3,
      academicYear: '2024-25',
      isActive: true,
    });
    log('[Seed] Batch created: 2021-A');
  }

  let batchB = await Batch.findOne({ program: program._id, year: 2021, section: 'B' });
  if (!batchB) {
    batchB = await Batch.create({
      program: program._id,
      year: 2021,
      section: 'B',
      maxStudents: 60,
      currentStudentCount: 2,
      academicYear: '2024-25',
      isActive: true,
    });
    log('[Seed] Batch created: 2021-B');
  }

  // Link Students to Program & Batch
  const batchAStudents = ['CS21001', 'CS21002', 'CS21003'];
  const batchBStudents = ['CS21061', 'CS21062'];

  for (const en of batchAStudents) {
    const s = await User.findOne({ enrollmentNumber: en });
    if (s) {
      s.program = program._id;
      s.batch = batchA._id;
      await s.save();
    }
  }

  for (const en of batchBStudents) {
    const s = await User.findOne({ enrollmentNumber: en });
    if (s) {
      s.program = program._id;
      s.batch = batchB._id;
      await s.save();
    }
  }

  // ── 5. Subjects ───────────────────────────────────────────────────────────────
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
    }
    createdSubjects.push(subject._id);
  }

  // Assign subjects to faculty
  const f1 = await User.findOne({ email: 'faculty@university.edu' });
  const f2 = await User.findOne({ email: 'ananya.faculty@university.edu' });
  const f3 = await User.findOne({ email: 'vikram.faculty@university.edu' });

  if (f1) await User.findByIdAndUpdate(f1._id, { subjectsAssigned: [createdSubjects[0], createdSubjects[1]] });
  if (f2) await User.findByIdAndUpdate(f2._id, { subjectsAssigned: [createdSubjects[2], createdSubjects[3]] });
  if (f3) await User.findByIdAndUpdate(f3._id, { subjectsAssigned: [createdSubjects[4], createdSubjects[1]] });

  // ── 6. Rooms ──────────────────────────────────────────────────────────────────
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
    }
  }

  // ── 7. TimeSlots ──────────────────────────────────────────────────────────────
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'] as const;
  const slotTemplates = [
    { startTime: '09:00', endTime: '10:00', slotNumber: 1 },
    { startTime: '10:00', endTime: '11:00', slotNumber: 2 },
    { startTime: '11:00', endTime: '12:00', slotNumber: 3 },
    { startTime: '12:00', endTime: '13:00', slotNumber: 4, isLunchBreak: true },
    { startTime: '14:00', endTime: '15:00', slotNumber: 5 },
    { startTime: '15:00', endTime: '16:00', slotNumber: 6 },
    { startTime: '16:00', endTime: '17:00', slotNumber: 7 },
  ];

  for (const day of days) {
    for (const slot of slotTemplates) {
      const exists = await TimeSlot.findOne({ day, startTime: slot.startTime });
      if (!exists) {
        await TimeSlot.create({ day, ...slot, isLunchBreak: slot.isLunchBreak ?? false });
      }
    }
  }

  // ── 8. Published Timetable for CSE Semester 5 ────────────────────────────────
  const existingTT = await Timetable.findOne({ department: dept._id, semester: 5, academicYear: '2024-25' });
  if (!existingTT) {
    const cs301 = await Subject.findOne({ code: 'CS301' });
    const cs302 = await Subject.findOne({ code: 'CS302' });
    const cs303 = await Subject.findOne({ code: 'CS303' });
    const ma301 = await Subject.findOne({ code: 'MA301' });
    const cs391 = await Subject.findOne({ code: 'CS391' });

    const r101 = await Room.findOne({ name: 'R101' });
    const r102 = await Room.findOne({ name: 'R102' });
    const labA = await Room.findOne({ name: 'Lab-A' });

    const mon09 = await TimeSlot.findOne({ day: 'Monday', startTime: '09:00' });
    const mon10 = await TimeSlot.findOne({ day: 'Monday', startTime: '10:00' });
    const mon11 = await TimeSlot.findOne({ day: 'Monday', startTime: '11:00' });

    const tue09 = await TimeSlot.findOne({ day: 'Tuesday', startTime: '09:00' });
    const tue10 = await TimeSlot.findOne({ day: 'Tuesday', startTime: '10:00' });

    const wed09 = await TimeSlot.findOne({ day: 'Wednesday', startTime: '09:00' });
    const wed10 = await TimeSlot.findOne({ day: 'Wednesday', startTime: '10:00' });

    const thu09 = await TimeSlot.findOne({ day: 'Thursday', startTime: '09:00' });
    const thu10 = await TimeSlot.findOne({ day: 'Thursday', startTime: '10:00' });

    const fri09 = await TimeSlot.findOne({ day: 'Friday', startTime: '09:00' });
    const fri10 = await TimeSlot.findOne({ day: 'Friday', startTime: '10:00' });

    if (
      cs301 && cs302 && cs303 && ma301 && cs391 &&
      f1 && f2 && f3 &&
      r101 && r102 && labA &&
      mon09 && mon10 && mon11 &&
      tue09 && tue10 &&
      wed09 && wed10 &&
      thu09 && thu10 &&
      fri09 && fri10
    ) {
      await Timetable.create({
        semester: 5,
        department: dept._id,
        academicYear: '2024-25',
        status: 'published',
        isComplete: true,
        generatedAt: new Date(),
        publishedAt: new Date(),
        publishedBy: hodUser?._id,
        entries: [
          // Monday
          { subject: cs301._id, faculty: f1._id, batch: batchA._id, room: r101._id, timeSlot: mon09._id },
          { subject: cs302._id, faculty: f1._id, batch: batchA._id, room: r101._id, timeSlot: mon10._id },
          { subject: cs303._id, faculty: f2._id, batch: batchB._id, room: r102._id, timeSlot: mon11._id },

          // Tuesday
          { subject: cs301._id, faculty: f1._id, batch: batchA._id, room: r101._id, timeSlot: tue09._id },
          { subject: ma301._id, faculty: f2._id, batch: batchA._id, room: r101._id, timeSlot: tue10._id },

          // Wednesday
          { subject: cs303._id, faculty: f2._id, batch: batchA._id, room: r101._id, timeSlot: wed09._id },
          { subject: cs391._id, faculty: f3._id, batch: batchA._id, room: labA._id, timeSlot: wed10._id },

          // Thursday
          { subject: ma301._id, faculty: f2._id, batch: batchA._id, room: r101._id, timeSlot: thu09._id },
          { subject: cs302._id, faculty: f3._id, batch: batchB._id, room: r102._id, timeSlot: thu10._id },

          // Friday
          { subject: cs301._id, faculty: f1._id, batch: batchA._id, room: r101._id, timeSlot: fri09._id },
          { subject: cs302._id, faculty: f1._id, batch: batchA._id, room: r101._id, timeSlot: fri10._id },
        ],
        conflicts: [],
      });
      log('[Seed] Published Timetable created for CSE Sem 5 (2024-25)');
    }
  }

  // ── Summary ────────────────────────────────────────────────────────────────
  log('\n[Seed] ✅ Done. Demo accounts ready:\n');
  log('  Role             Email                           Password');
  log('  -------------------------------------------------------------');
  log('  super_admin      admin@university.edu            Admin@123');
  log('  hod              hod@university.edu              Hod@1234');
  log('  faculty          faculty@university.edu          Faculty@123  (Prof. Raj Kumar - CS301, CS302)');
  log('  faculty          ananya.faculty@university.edu   Faculty@123  (Dr. Ananya Roy - CS303, MA301)');
  log('  faculty          vikram.faculty@university.edu   Faculty@123  (Prof. Vikram Singh - CS391 Lab)');
  log('  student          student@university.edu          Student@123  (Arjun Patel - Batch 2021A)');
  log('  student          riya.student@university.edu     Student@123  (Riya Sen - Batch 2021A)');
  log('  student          karan.student@university.edu    Student@123  (Karan Verma - Batch 2021A)');
  log('  student          neha.student@university.edu     Student@123  (Neha Gupta - Batch 2021B)');
  log('  student          rohan.student@university.edu    Student@123  (Rohan Sharma - Batch 2021B)');
  log('  finance_officer  finance@university.edu          Finance@123');

  await mongoose.disconnect();
  process.exit(0);
}

seed().catch((err: unknown) => {
  process.stderr.write(`[Seed] Error: ${String(err)}\n`);
  process.exit(1);
});
