import mongoose, { Document, Schema } from 'mongoose';

export interface ITimetableEntry {
  subject: mongoose.Types.ObjectId;
  faculty: mongoose.Types.ObjectId;
  batch: mongoose.Types.ObjectId;
  room: mongoose.Types.ObjectId;
  timeSlot: mongoose.Types.ObjectId;
}

export interface ITimetableConflict {
  type: 'teacher' | 'room' | 'batch' | 'capacity' | 'lab';
  description: string;
  involvedEntryIndexes: number[];
}

export interface ITimetable extends Document {
  _id: mongoose.Types.ObjectId;
  semester: number;
  department: mongoose.Types.ObjectId;
  academicYear: string;
  status: 'draft' | 'published';
  entries: ITimetableEntry[];
  conflicts: ITimetableConflict[];
  isComplete: boolean;
  generatedAt: Date;
  publishedAt?: Date;
  publishedBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const entrySchema = new Schema<ITimetableEntry>(
  {
    subject:  { type: Schema.Types.ObjectId, ref: 'Subject',  required: true },
    faculty:  { type: Schema.Types.ObjectId, ref: 'User',     required: true },
    batch:    { type: Schema.Types.ObjectId, ref: 'Batch',    required: true },
    room:     { type: Schema.Types.ObjectId, ref: 'Room',     required: true },
    timeSlot: { type: Schema.Types.ObjectId, ref: 'TimeSlot', required: true },
  },
  { _id: false }
);

const conflictSchema = new Schema<ITimetableConflict>(
  {
    type:                 { type: String, enum: ['teacher', 'room', 'batch', 'capacity', 'lab'], required: true },
    description:          { type: String, required: true },
    involvedEntryIndexes: [{ type: Number }],
  },
  { _id: false }
);

const timetableSchema = new Schema<ITimetable>(
  {
    semester:     { type: Number, required: true },
    department:   { type: Schema.Types.ObjectId, ref: 'Department', required: true },
    academicYear: { type: String, required: true },
    status:       { type: String, enum: ['draft', 'published'], default: 'draft' },
    entries:      [entrySchema],
    conflicts:    [conflictSchema],
    isComplete:   { type: Boolean, default: false },
    generatedAt:  { type: Date, default: Date.now },
    publishedAt:  { type: Date },
    publishedBy:  { type: Schema.Types.ObjectId, ref: 'User' },
  },
  { timestamps: true }
);

timetableSchema.index({ department: 1, semester: 1, academicYear: 1 });
timetableSchema.index({ status: 1 });

export const Timetable = mongoose.model<ITimetable>('Timetable', timetableSchema);
