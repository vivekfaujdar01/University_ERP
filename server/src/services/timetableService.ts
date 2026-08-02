import mongoose from 'mongoose';
import { generateTimetable } from '../dsa/index';
import { Timetable } from '../models/Timetable';
import { Department } from '../models/Department';
import { Batch } from '../models/Batch';
import { Subject } from '../models/Subject';
import { Room } from '../models/Room';
import { TimeSlot } from '../models/TimeSlot';
import { User } from '../models/User';
import { AppError } from '../utils/AppError';
import type {
  SchedulerInput, SchedulerSubject, SchedulerFaculty,
  SchedulerBatch, SchedulerRoom, SchedulerTimeSlot,
} from '../dsa/scheduler/types';

export interface GenerateInput {
  departmentId: string;
  semester: number;
  academicYear: string;
}

/** Load all data from MongoDB, convert to plain scheduler types, run DSA, persist. */
export const generateAndSave = async (
  input: GenerateInput,
  requesterId: string
): Promise<InstanceType<typeof Timetable>> => {
  const { departmentId, semester, academicYear } = input;

  const dept = await Department.findById(departmentId);
  if (!dept) throw new AppError('Department not found.', 404);

  // ── Load programs for this department ──────────────────────────────────────
  const programIds = dept.programs.map(String);
  if (programIds.length === 0) throw new AppError('Department has no programs.', 422);

  // ── Batches for these programs ─────────────────────────────────────────────
  const mongoBatches = await Batch.find({ program: { $in: programIds }, isActive: true });
  if (mongoBatches.length === 0) throw new AppError('No active batches found.', 422);

  // ── Subjects for this semester in these programs ───────────────────────────
  const mongoSubjects = await Subject.find({
    program: { $in: programIds },
    semester,
    isActive: true,
  });
  if (mongoSubjects.length === 0) throw new AppError('No subjects found for this semester.', 422);

  // ── Faculty in this department ─────────────────────────────────────────────
  const mongoFaculty = await User.find({
    department: departmentId,
    role: { $in: ['faculty', 'hod'] },
    isActive: true,
  });

  // ── Rooms ──────────────────────────────────────────────────────────────────
  const mongoRooms = await Room.find({ isActive: true });

  // ── Time slots ─────────────────────────────────────────────────────────────
  const mongoSlots = await TimeSlot.find().sort({ day: 1, slotNumber: 1 });

  // ── Convert to plain scheduler types ──────────────────────────────────────
  const subjects: SchedulerSubject[] = mongoSubjects.map((s) => ({
    id:          String(s._id),
    name:        s.name,
    credits:     s.credits,
    isLab:       s.isLab,
    hoursPerWeek: s.hoursPerWeek,
    programId:   String(s.program),
    semester:    s.semester,
  }));

  const batches: SchedulerBatch[] = mongoBatches.map((b) => ({
    id:           String(b._id),
    programId:    String(b.program),
    section:      b.section,
    year:         b.year,
    studentCount: b.currentStudentCount || 1,
  }));

  const faculty: SchedulerFaculty[] = mongoFaculty.map((f) => ({
    id:               String(f._id),
    subjectsAssigned: f.subjectsAssigned.map(String),
    preferredSlots:   f.preferredSlots.map(String),
    maxHoursPerDay:   f.maxHoursPerDay,
  }));

  const rooms: SchedulerRoom[] = mongoRooms.map((r) => ({
    id:       String(r._id),
    name:     r.name,
    capacity: r.capacity,
    isLab:    r.isLab,
  }));

  const timeSlots: SchedulerTimeSlot[] = mongoSlots.map((s) => ({
    id:           String(s._id),
    day:          s.day,
    startTime:    s.startTime,
    endTime:      s.endTime,
    slotNumber:   s.slotNumber ?? 0,
    isLunchBreak: s.isLunchBreak,
  }));

  const lunchBreakSlotIds = timeSlots.filter((s) => s.isLunchBreak).map((s) => s.id);

  const schedulerInput: SchedulerInput = {
    batches, subjects, faculty, rooms, timeSlots,
    constraints: {
      lunchBreakSlotIds,
      maxHoursPerDayPerFaculty: 6,
    },
  };

  // ── Run DSA engine ────────────────────────────────────────────────────────
  const result = generateTimetable(schedulerInput);

  // ── Convert output back to ObjectIds for MongoDB ──────────────────────────
  const entries = result.schedule.map((e) => ({
    subject:  new mongoose.Types.ObjectId(e.subjectId),
    faculty:  new mongoose.Types.ObjectId(e.facultyId),
    batch:    new mongoose.Types.ObjectId(e.batchId),
    room:     new mongoose.Types.ObjectId(e.roomId),
    timeSlot: new mongoose.Types.ObjectId(e.timeSlotId),
  }));

  const conflicts = result.conflicts.map((c, idx) => ({
    type:                c.type,
    description:         c.description,
    involvedEntryIndexes: [idx],
  }));

  // ── Upsert timetable (replace draft if one already exists) ────────────────
  const timetable = await Timetable.findOneAndUpdate(
    { department: departmentId, semester, academicYear, status: 'draft' },
    {
      $set: {
        entries,
        conflicts,
        isComplete:  result.isComplete,
        generatedAt: new Date(),
        status:      'draft',
      },
    },
    { upsert: true, new: true }
  );

  void requesterId; // audit log reserved for T9
  return timetable;
};

/** Publish a draft timetable — only allowed if isComplete (no conflicts). */
export const publishTimetable = async (
  timetableId: string,
  publisherId: string
): Promise<InstanceType<typeof Timetable>> => {
  const tt = await Timetable.findById(timetableId);
  if (!tt) throw new AppError('Timetable not found.', 404);
  if (tt.status === 'published') throw new AppError('Already published.', 409);
  if (!tt.isComplete) throw new AppError('Cannot publish a timetable with unresolved conflicts.', 422);

  tt.status      = 'published';
  tt.publishedAt = new Date();
  tt.publishedBy = new mongoose.Types.ObjectId(publisherId);
  await tt.save();
  return tt;
};

/** Get a timetable with full population. */
export const getTimetable = async (timetableId: string) => {
  const tt = await Timetable.findById(timetableId)
    .populate('entries.subject', 'name code credits isLab')
    .populate('entries.faculty', 'name email employeeId')
    .populate('entries.batch',   'year section program')
    .populate('entries.room',    'name capacity isLab')
    .populate('entries.timeSlot', 'day startTime endTime slotNumber');
  if (!tt) throw new AppError('Timetable not found.', 404);
  return tt;
};

/** Get timetable by department + semester + academic year. */
export const getTimetableByDept = async (
  departmentId: string,
  semester: number,
  academicYear: string
) => {
  return Timetable.findOne({ department: departmentId, semester, academicYear })
    .populate('entries.subject',  'name code credits isLab')
    .populate('entries.faculty',  'name email')
    .populate('entries.batch',    'year section')
    .populate('entries.room',     'name capacity isLab')
    .populate('entries.timeSlot', 'day startTime endTime slotNumber');
};

/** Get personal timetable entries for a faculty member.
 *  Returns full TimetableDoc objects so the client TimetableGrid
 *  receives the expected shape (including conflicts[]).
 *  Client-side filtering by facultyId is handled via the filterFacultyId prop.
 */
export const getFacultyTimetable = async (facultyId: string, academicYear: string) => {
  // Only return timetables that actually contain at least one entry for this faculty
  const timetables = await Timetable.find({
    academicYear,
    status: 'published',
    'entries.faculty': facultyId,
  })
    .populate('entries.subject',  'name code isLab')
    .populate('entries.faculty',  'name email employeeId')
    .populate('entries.batch',    'year section program')
    .populate('entries.room',     'name capacity isLab')
    .populate('entries.timeSlot', 'day startTime endTime slotNumber isLunchBreak');

  return timetables;
};

/** Get personal timetable entries for a student (via their batch).
 *  Returns all published timetables; client filters entries by batchId
 *  via the filterBatchId prop on TimetableGrid.
 */
export const getStudentTimetable = async (
  _studentId: string,
  academicYear: string
) => {
  return Timetable.find({ academicYear, status: 'published' })
    .populate('entries.subject',  'name code isLab')
    .populate('entries.faculty',  'name')
    .populate('entries.batch',    'year section')
    .populate('entries.room',     'name capacity isLab')
    .populate('entries.timeSlot', 'day startTime endTime slotNumber isLunchBreak');
};

// ─── Manual override ──────────────────────────────────────────────────────────

export interface OverrideEntry {
  entryIndex: number;        // index in timetable.entries[]
  timeSlotId: string;
  roomId: string;
}

/**
 * overrideEntry — manually reassign a single timetable entry's slot + room.
 * Validates that the new slot doesn't create a teacher or batch conflict.
 */
export const overrideEntry = async (
  timetableId: string,
  override: OverrideEntry
): Promise<InstanceType<typeof Timetable>> => {
  const tt = await Timetable.findById(timetableId);
  if (!tt) throw new AppError('Timetable not found.', 404);
  if (tt.status === 'published') throw new AppError('Cannot edit a published timetable.', 422);

  const entry = tt.entries[override.entryIndex];
  if (!entry) throw new AppError('Entry index out of range.', 400);

  // Simple conflict check — ensure no other entry in this timetable shares the new slot
  // with the same faculty or batch
  const newSlotId = new mongoose.Types.ObjectId(override.timeSlotId);
  for (let i = 0; i < tt.entries.length; i++) {
    if (i === override.entryIndex) continue;
    const other = tt.entries[i];
    if (
      String(other.timeSlot) === override.timeSlotId &&
      (String(other.faculty) === String(entry.faculty) ||
       String(other.batch)   === String(entry.batch))
    ) {
      throw new AppError(
        'This time slot conflicts with another entry (same faculty or batch).',
        409
      );
    }
  }

  entry.timeSlot = newSlotId;
  entry.room     = new mongoose.Types.ObjectId(override.roomId);

  // Re-check for conflicts and update isComplete flag
  tt.isComplete = tt.conflicts.length === 0;
  tt.markModified('entries');
  await tt.save();
  return tt;
};

// ─── PDF generation ───────────────────────────────────────────────────────────

import { generatePdf } from './pdfService';
import type { IUser } from '../models/User';
import type { ISubject } from '../models/Subject';
import type { IRoom } from '../models/Room';
import type { ITimeSlot } from '../models/TimeSlot';

/**
 * getTimetablePdf — builds template data, renders PDF, returns Buffer.
 */
export const getTimetablePdf = async (timetableId: string): Promise<Buffer> => {
  const tt = await Timetable.findById(timetableId)
    .populate<{ 'entries.subject': ISubject }>('entries.subject', 'name code isLab')
    .populate<{ 'entries.faculty': IUser }>('entries.faculty', 'name')
    .populate<{ 'entries.room': IRoom }>('entries.room', 'name')
    .populate<{ 'entries.timeSlot': ITimeSlot }>('entries.timeSlot', 'day startTime endTime slotNumber isLunchBreak');

  if (!tt) throw new AppError('Timetable not found.', 404);

  const dept = await (await import('../models/Department')).Department.findById(tt.department).select('name');

  const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];

  // Collect unique slot labels sorted by slotNumber
  const slotMap = new Map<string, ITimeSlot>();
  for (const e of tt.entries) {
    const ts = e.timeSlot as unknown as ITimeSlot;
    if (ts?._id) slotMap.set(String(ts._id), ts);
  }
  const sortedSlots = [...slotMap.values()].sort(
    (a, b) => (a.slotNumber ?? 0) - (b.slotNumber ?? 0)
  );

  const slotRows = sortedSlots.map((slot) => ({
    label: `${slot.startTime}–${slot.endTime}`,
    cells: DAYS.map((day) => {
      if (slot.isLunchBreak) return { isLunch: true };
      const entry = tt.entries.find(
        (e) =>
          String((e.timeSlot as unknown as ITimeSlot)._id) === String(slot._id) &&
          (e.timeSlot as unknown as ITimeSlot).day === day
      );
      if (!entry) return {};
      const subj = entry.subject as unknown as ISubject;
      const fac  = entry.faculty as unknown as IUser;
      const room = entry.room    as unknown as IRoom;
      return {
        entry: {
          subjectCode: subj.code,
          facultyName: fac.name,
          roomName:    room.name,
        },
        isLab: subj.isLab,
        isConflict: false,
      };
    }),
  }));

  const templateData: Record<string, unknown> = {
    department:  dept?.name ?? '—',
    semester:    tt.semester,
    academicYear: tt.academicYear,
    status:      tt.status,
    days:        DAYS,
    slotRows,
    conflicts:   tt.conflicts,
    generatedAt: new Date().toLocaleString('en-IN'),
  };

  return generatePdf('timetable.hbs', templateData);
};
