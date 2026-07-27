import mongoose from 'mongoose';
import { Department } from '../models/Department';
import { Program } from '../models/Program';
import { Batch } from '../models/Batch';
import { Subject } from '../models/Subject';
import { Room } from '../models/Room';
import { TimeSlot } from '../models/TimeSlot';
import { AppError } from '../utils/AppError';
import { PAGINATION_DEFAULTS } from '../config/constants';
import type {
  CreateDepartmentInput, UpdateDepartmentInput,
  CreateProgramInput, UpdateProgramInput,
  CreateBatchInput, UpdateBatchInput,
  CreateSubjectInput, UpdateSubjectInput,
  CreateRoomInput, UpdateRoomInput,
  CreateTimeSlotInput, UpdateTimeSlotInput,
  ListQueryInput,
} from '../validators/structureSchemas';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function paginate(page: number, limit: number) {
  const safePage = Math.max(1, page);
  const safeLimit = Math.min(limit, PAGINATION_DEFAULTS.MAX_LIMIT);
  return { skip: (safePage - 1) * safeLimit, limit: safeLimit, page: safePage };
}

// ─── Department ───────────────────────────────────────────────────────────────

export const listDepartments = async (query: ListQueryInput) => {
  const { skip, limit, page } = paginate(query.page ?? 1, query.limit ?? 20);
  const filter: Record<string, unknown> = {};
  if (query.isActive !== undefined) filter['isActive'] = query.isActive;
  if (query.search) filter['$or'] = [
    { name: { $regex: query.search, $options: 'i' } },
    { code: { $regex: query.search, $options: 'i' } },
  ];

  const [items, total] = await Promise.all([
    Department.find(filter)
      .populate('hod', 'name email')
      .populate('programs', 'name code')
      .sort({ name: 1 })
      .skip(skip)
      .limit(limit),
    Department.countDocuments(filter),
  ]);
  return { items, total, page, limit };
};

export const getDepartment = async (id: string) => {
  const dept = await Department.findById(id)
    .populate('hod', 'name email')
    .populate('programs', 'name code durationYears totalSemesters');
  if (!dept) throw new AppError('Department not found.', 404);
  return dept;
};

export const createDepartment = async (data: CreateDepartmentInput) => {
  const exists = await Department.findOne({
    $or: [{ name: data.name }, { code: data.code }],
  });
  if (exists) throw new AppError('A department with this name or code already exists.', 409);
  return Department.create(data);
};

export const updateDepartment = async (id: string, data: UpdateDepartmentInput) => {
  const dept = await Department.findByIdAndUpdate(id, data, { new: true, runValidators: true })
    .populate('hod', 'name email');
  if (!dept) throw new AppError('Department not found.', 404);
  return dept;
};

export const deleteDepartment = async (id: string) => {
  const dept = await Department.findById(id);
  if (!dept) throw new AppError('Department not found.', 404);
  const programCount = await Program.countDocuments({ department: id });
  if (programCount > 0) throw new AppError('Cannot delete department with existing programs.', 422);
  await dept.deleteOne();
};

// ─── Program ──────────────────────────────────────────────────────────────────

export const listPrograms = async (query: ListQueryInput) => {
  const { skip, limit, page } = paginate(query.page ?? 1, query.limit ?? 20);
  const filter: Record<string, unknown> = {};
  if (query.isActive !== undefined) filter['isActive'] = query.isActive;
  if (query.department) filter['department'] = new mongoose.Types.ObjectId(query.department);
  if (query.search) filter['$or'] = [
    { name: { $regex: query.search, $options: 'i' } },
    { code: { $regex: query.search, $options: 'i' } },
  ];

  const [items, total] = await Promise.all([
    Program.find(filter)
      .populate('department', 'name code')
      .sort({ name: 1 })
      .skip(skip)
      .limit(limit),
    Program.countDocuments(filter),
  ]);
  return { items, total, page, limit };
};

export const getProgram = async (id: string) => {
  const prog = await Program.findById(id).populate('department', 'name code');
  if (!prog) throw new AppError('Program not found.', 404);
  return prog;
};

export const createProgram = async (data: CreateProgramInput) => {
  const exists = await Program.findOne({ code: data.code });
  if (exists) throw new AppError('A program with this code already exists.', 409);
  const dept = await Department.findById(data.department);
  if (!dept) throw new AppError('Department not found.', 404);

  const prog = await Program.create(data);
  // Register program in department
  await Department.findByIdAndUpdate(data.department, { $addToSet: { programs: prog._id } });
  return prog.populate('department', 'name code');
};

export const updateProgram = async (id: string, data: UpdateProgramInput) => {
  const prog = await Program.findByIdAndUpdate(id, data, { new: true, runValidators: true })
    .populate('department', 'name code');
  if (!prog) throw new AppError('Program not found.', 404);
  return prog;
};

export const deleteProgram = async (id: string) => {
  const prog = await Program.findById(id);
  if (!prog) throw new AppError('Program not found.', 404);
  const batchCount = await Batch.countDocuments({ program: id });
  if (batchCount > 0) throw new AppError('Cannot delete program with existing batches.', 422);
  await Department.findByIdAndUpdate(prog.department, { $pull: { programs: prog._id } });
  await prog.deleteOne();
};

// ─── Batch ────────────────────────────────────────────────────────────────────

export const listBatches = async (query: ListQueryInput) => {
  const { skip, limit, page } = paginate(query.page ?? 1, query.limit ?? 20);
  const filter: Record<string, unknown> = {};
  if (query.isActive !== undefined) filter['isActive'] = query.isActive;
  if (query.program) filter['program'] = new mongoose.Types.ObjectId(query.program);

  const [items, total] = await Promise.all([
    Batch.find(filter)
      .populate('program', 'name code department')
      .sort({ year: -1, section: 1 })
      .skip(skip)
      .limit(limit),
    Batch.countDocuments(filter),
  ]);
  return { items, total, page, limit };
};

export const getBatch = async (id: string) => {
  const batch = await Batch.findById(id).populate('program', 'name code department');
  if (!batch) throw new AppError('Batch not found.', 404);
  return batch;
};

export const createBatch = async (data: CreateBatchInput) => {
  const prog = await Program.findById(data.program);
  if (!prog) throw new AppError('Program not found.', 404);
  return Batch.create(data);
};

export const updateBatch = async (id: string, data: UpdateBatchInput) => {
  const batch = await Batch.findByIdAndUpdate(id, data, { new: true, runValidators: true })
    .populate('program', 'name code');
  if (!batch) throw new AppError('Batch not found.', 404);
  return batch;
};

export const deleteBatch = async (id: string) => {
  const batch = await Batch.findById(id);
  if (!batch) throw new AppError('Batch not found.', 404);
  if (batch.currentStudentCount > 0) {
    throw new AppError('Cannot delete batch with enrolled students.', 422);
  }
  await batch.deleteOne();
};

// ─── Subject ──────────────────────────────────────────────────────────────────

export const listSubjects = async (query: ListQueryInput) => {
  const { skip, limit, page } = paginate(query.page ?? 1, query.limit ?? 20);
  const filter: Record<string, unknown> = {};
  if (query.isActive !== undefined) filter['isActive'] = query.isActive;
  if (query.department) filter['department'] = new mongoose.Types.ObjectId(query.department);
  if (query.program) filter['program'] = new mongoose.Types.ObjectId(query.program);
  if (query.semester) filter['semester'] = query.semester;
  if (query.search) filter['$or'] = [
    { name: { $regex: query.search, $options: 'i' } },
    { code: { $regex: query.search, $options: 'i' } },
  ];

  const [items, total] = await Promise.all([
    Subject.find(filter)
      .populate('department', 'name code')
      .populate('program', 'name code')
      .sort({ semester: 1, name: 1 })
      .skip(skip)
      .limit(limit),
    Subject.countDocuments(filter),
  ]);
  return { items, total, page, limit };
};

export const getSubject = async (id: string) => {
  const subject = await Subject.findById(id)
    .populate('department', 'name code')
    .populate('program', 'name code');
  if (!subject) throw new AppError('Subject not found.', 404);
  return subject;
};

export const createSubject = async (data: CreateSubjectInput) => {
  const exists = await Subject.findOne({ code: data.code });
  if (exists) throw new AppError('A subject with this code already exists.', 409);
  return Subject.create(data);
};

export const updateSubject = async (id: string, data: UpdateSubjectInput) => {
  const subject = await Subject.findByIdAndUpdate(id, data, { new: true, runValidators: true })
    .populate('department', 'name code')
    .populate('program', 'name code');
  if (!subject) throw new AppError('Subject not found.', 404);
  return subject;
};

export const deleteSubject = async (id: string) => {
  const subject = await Subject.findById(id);
  if (!subject) throw new AppError('Subject not found.', 404);
  await subject.deleteOne();
};

// ─── Room ─────────────────────────────────────────────────────────────────────

export const listRooms = async (query: ListQueryInput) => {
  const { skip, limit, page } = paginate(query.page ?? 1, query.limit ?? 20);
  const filter: Record<string, unknown> = {};
  if (query.isActive !== undefined) filter['isActive'] = query.isActive;
  if (query.search) filter['name'] = { $regex: query.search, $options: 'i' };

  const [items, total] = await Promise.all([
    Room.find(filter).sort({ name: 1 }).skip(skip).limit(limit),
    Room.countDocuments(filter),
  ]);
  return { items, total, page, limit };
};

export const getRoom = async (id: string) => {
  const room = await Room.findById(id);
  if (!room) throw new AppError('Room not found.', 404);
  return room;
};

export const createRoom = async (data: CreateRoomInput) => {
  const exists = await Room.findOne({ name: data.name });
  if (exists) throw new AppError('A room with this name already exists.', 409);
  return Room.create(data);
};

export const updateRoom = async (id: string, data: UpdateRoomInput) => {
  const room = await Room.findByIdAndUpdate(id, data, { new: true, runValidators: true });
  if (!room) throw new AppError('Room not found.', 404);
  return room;
};

export const deleteRoom = async (id: string) => {
  const room = await Room.findById(id);
  if (!room) throw new AppError('Room not found.', 404);
  await room.deleteOne();
};

// ─── TimeSlot ─────────────────────────────────────────────────────────────────

export const listTimeSlots = async (query: ListQueryInput) => {
  const { skip, limit, page } = paginate(query.page ?? 1, query.limit ?? 100);
  const filter: Record<string, unknown> = {};
  if (query.search) filter['day'] = { $regex: query.search, $options: 'i' };

  const [items, total] = await Promise.all([
    TimeSlot.find(filter)
      .sort({ day: 1, slotNumber: 1, startTime: 1 })
      .skip(skip)
      .limit(limit),
    TimeSlot.countDocuments(filter),
  ]);
  return { items, total, page, limit };
};

export const getTimeSlot = async (id: string) => {
  const slot = await TimeSlot.findById(id);
  if (!slot) throw new AppError('Time slot not found.', 404);
  return slot;
};

export const createTimeSlot = async (data: CreateTimeSlotInput) => {
  const exists = await TimeSlot.findOne({ day: data.day, startTime: data.startTime });
  if (exists) throw new AppError('A time slot for this day and start time already exists.', 409);
  return TimeSlot.create(data);
};

export const updateTimeSlot = async (id: string, data: UpdateTimeSlotInput) => {
  const slot = await TimeSlot.findByIdAndUpdate(id, data, { new: true, runValidators: true });
  if (!slot) throw new AppError('Time slot not found.', 404);
  return slot;
};

export const deleteTimeSlot = async (id: string) => {
  const slot = await TimeSlot.findById(id);
  if (!slot) throw new AppError('Time slot not found.', 404);
  await slot.deleteOne();
};
