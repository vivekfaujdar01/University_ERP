import mongoose, { Document, Schema } from 'mongoose';

export interface IAttendanceRecord {
  student: mongoose.Types.ObjectId;
  status: 'present' | 'absent' | 'late';
  remarks?: string;
}

export interface IAttendance extends Document {
  _id: mongoose.Types.ObjectId;
  batch: mongoose.Types.ObjectId;
  subject: mongoose.Types.ObjectId;
  faculty: mongoose.Types.ObjectId;
  timeSlot: mongoose.Types.ObjectId;
  date: Date; // Normalized to 00:00:00 UTC/Local
  academicYear: string;
  records: IAttendanceRecord[];
  totalStudents: number;
  presentCount: number;
  createdAt: Date;
  updatedAt: Date;
}

const attendanceRecordSchema = new Schema<IAttendanceRecord>(
  {
    student: { type: Schema.Types.ObjectId, ref: 'User', required: true },
    status:  { type: String, enum: ['present', 'absent', 'late'], required: true },
    remarks: { type: String },
  },
  { _id: false }
);

const attendanceSchema = new Schema<IAttendance>(
  {
    batch:        { type: Schema.Types.ObjectId, ref: 'Batch', required: true },
    subject:      { type: Schema.Types.ObjectId, ref: 'Subject', required: true },
    faculty:      { type: Schema.Types.ObjectId, ref: 'User', required: true },
    timeSlot:     { type: Schema.Types.ObjectId, ref: 'TimeSlot', required: true },
    date:         { type: Date, required: true },
    academicYear: { type: String, required: true },
    records:      [attendanceRecordSchema],
    totalStudents: { type: Number, required: true, default: 0 },
    presentCount:  { type: Number, required: true, default: 0 },
  },
  { timestamps: true }
);

// Compound unique index to prevent duplicate attendance submission for same slot/date/batch/subject
attendanceSchema.index(
  { batch: 1, subject: 1, timeSlot: 1, date: 1 },
  { unique: true }
);

// Index for student queries
attendanceSchema.index({ 'records.student': 1, academicYear: 1 });

export const Attendance = mongoose.model<IAttendance>('Attendance', attendanceSchema);
