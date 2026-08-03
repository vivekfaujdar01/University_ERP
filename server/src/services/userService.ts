import mongoose from 'mongoose';
import { parse as csvParse } from 'csv-parse/sync';
import { User } from '../models/User';
import { Department } from '../models/Department';
import { Program } from '../models/Program';
import { Batch } from '../models/Batch';
import { AppError } from '../utils/AppError';

// Ensure models are registered for Mongoose populate
void Department.modelName;
void Program.modelName;
import { PAGINATION_DEFAULTS } from '../config/constants';
import { sendWelcomeEmail } from './emailService';
import type { CreateUserInput, UpdateUserInput, ListQueryInput } from '../validators/structureSchemas';

// ─── List ─────────────────────────────────────────────────────────────────────

export const listUsers = async (query: ListQueryInput) => {
  const page = Math.max(1, query.page ?? 1);
  const limit = Math.min(query.limit ?? 20, PAGINATION_DEFAULTS.MAX_LIMIT);
  const skip = (page - 1) * limit;

  const filter: Record<string, unknown> = {};
  if (query.role) filter['role'] = query.role;
  if (query.department) filter['department'] = new mongoose.Types.ObjectId(query.department);
  if (query.batch) filter['batch'] = new mongoose.Types.ObjectId(query.batch);
  if (query.isActive !== undefined) filter['isActive'] = query.isActive;
  if (query.search) {
    filter['$or'] = [
      { name: { $regex: query.search, $options: 'i' } },
      { email: { $regex: query.search, $options: 'i' } },
      { enrollmentNumber: { $regex: query.search, $options: 'i' } },
      { employeeId: { $regex: query.search, $options: 'i' } },
    ];
  }

  const [items, total] = await Promise.all([
    User.find(filter)
      .populate('department', 'name code')
      .populate('program', 'name code')
      .populate('batch', 'year section')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit),
    User.countDocuments(filter),
  ]);

  return { items, total, page, limit };
};

// ─── Get single ───────────────────────────────────────────────────────────────

export const getUser = async (id: string) => {
  const user = await User.findById(id)
    .populate('department', 'name code')
    .populate('program', 'name code')
    .populate('batch', 'year section')
    .populate('subjectsAssigned', 'name code semester')
    .populate('preferredSlots', 'day startTime endTime');
  if (!user) throw new AppError('User not found.', 404);
  return user;
};

// ─── Create single ────────────────────────────────────────────────────────────

export const createUser = async (data: CreateUserInput) => {
  const existing = await User.findOne({ email: data.email });
  if (existing) throw new AppError('A user with this email already exists.', 409);

  if (data.enrollmentNumber) {
    const dupEnroll = await User.findOne({ enrollmentNumber: data.enrollmentNumber });
    if (dupEnroll) throw new AppError('Enrollment number already in use.', 409);
  }
  if (data.employeeId) {
    const dupEmp = await User.findOne({ employeeId: data.employeeId });
    if (dupEmp) throw new AppError('Employee ID already in use.', 409);
  }

  const user = await User.create({
    ...data,
    passwordHash: data.password, // pre-save hook hashes it
  });

  // Increment batch student count for students
  if (data.role === 'student' && data.batch) {
    await Batch.findByIdAndUpdate(data.batch, { $inc: { currentStudentCount: 1 } });
  }

  // Fire-and-forget welcome email
  sendWelcomeEmail(user.email, user.name, data.password, user.role).catch(
    (err: unknown) => process.stderr.write(`[Email] Welcome email failed: ${String(err)}\n`)
  );

  return user;
};

// ─── Update ───────────────────────────────────────────────────────────────────

export const updateUser = async (id: string, data: UpdateUserInput) => {
  const user = await User.findByIdAndUpdate(id, data, { new: true, runValidators: true })
    .populate('department', 'name code')
    .populate('subjectsAssigned', 'name code')
    .populate('preferredSlots', 'day startTime endTime');
  if (!user) throw new AppError('User not found.', 404);
  return user;
};

// ─── Delete (soft-deactivate) ─────────────────────────────────────────────────

export const deleteUser = async (id: string) => {
  const user = await User.findById(id);
  if (!user) throw new AppError('User not found.', 404);
  user.isActive = false;
  await user.save();
};

// ─── CSV Bulk Import ──────────────────────────────────────────────────────────

export interface BulkImportRow {
  name: string;
  email: string;
  password: string;
  role: string;
  enrollmentNumber?: string;
  employeeId?: string;
  department?: string;
  program?: string;
  batch?: string;
  semester?: string;
  admissionYear?: string;
  designation?: string;
  phone?: string;
}

export interface BulkImportResult {
  created: number;
  skipped: number;
  errors: Array<{ row: number; email: string; message: string }>;
}

export const bulkImportUsers = async (csvBuffer: Buffer): Promise<BulkImportResult> => {
  let rows: BulkImportRow[];
  try {
    rows = csvParse(csvBuffer, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    }) as BulkImportRow[];
  } catch {
    throw new AppError('Invalid CSV format. Please check the file and try again.', 400);
  }

  const result: BulkImportResult = { created: 0, skipped: 0, errors: [] };

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const rowNum = i + 2; // +2 = header row + 1-based index

    try {
      if (!row.email || !row.name || !row.role || !row.password) {
        result.errors.push({ row: rowNum, email: row.email ?? '', message: 'Missing required fields: name, email, role, password' });
        result.skipped++;
        continue;
      }

      const validRoles = ['super_admin', 'hod', 'faculty', 'student'];

      if (!validRoles.includes(row.role)) {
        result.errors.push({ row: rowNum, email: row.email, message: `Invalid role: ${row.role}` });
        result.skipped++;
        continue;
      }

      const existing = await User.findOne({ email: row.email.toLowerCase() });
      if (existing) {
        result.errors.push({ row: rowNum, email: row.email, message: 'Email already exists — skipped' });
        result.skipped++;
        continue;
      }

      const userData: Record<string, unknown> = {
        name: row.name,
        email: row.email.toLowerCase(),
        passwordHash: row.password,
        role: row.role,
        phone: row.phone,
      };

      if (row.role === 'student') {
        userData['enrollmentNumber'] = row.enrollmentNumber;
        userData['semester'] = row.semester ? parseInt(row.semester, 10) : undefined;
        userData['admissionYear'] = row.admissionYear ? parseInt(row.admissionYear, 10) : undefined;
        if (row.program && mongoose.isValidObjectId(row.program)) userData['program'] = row.program;
        if (row.batch && mongoose.isValidObjectId(row.batch)) {
          userData['batch'] = row.batch;
          await Batch.findByIdAndUpdate(row.batch, { $inc: { currentStudentCount: 1 } });
        }
      }

      if (row.role === 'faculty' || row.role === 'hod') {
        userData['employeeId'] = row.employeeId;
        userData['designation'] = row.designation;
        if (row.department && mongoose.isValidObjectId(row.department)) {
          userData['department'] = row.department;
        }
      }

      await User.create(userData);

      sendWelcomeEmail(row.email, row.name, row.password, row.role).catch(
        (err: unknown) => process.stderr.write(`[Email] Welcome email failed for ${row.email}: ${String(err)}\n`)
      );

      result.created++;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      result.errors.push({ row: rowNum, email: row.email ?? '', message: msg });
      result.skipped++;
    }
  }

  return result;
};

// ─── Assign subjects / preferred slots to faculty ─────────────────────────────

export const assignFacultyProfile = async (
  facultyId: string,
  subjectsAssigned: string[],
  preferredSlots: string[]
) => {
  const user = await User.findOneAndUpdate(
    { _id: facultyId, role: { $in: ['faculty', 'hod'] } },
    { subjectsAssigned, preferredSlots },
    { new: true }
  )
    .populate('subjectsAssigned', 'name code semester')
    .populate('preferredSlots', 'day startTime endTime');

  if (!user) throw new AppError('Faculty member not found.', 404);
  return user;
};
