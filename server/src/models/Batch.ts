import mongoose, { Document, Schema } from 'mongoose';

export interface IBatch extends Document {
  _id: mongoose.Types.ObjectId;
  program: mongoose.Types.ObjectId;
  year: number;
  section: string;
  maxStudents: number;
  currentStudentCount: number;
  academicYear: string;
  isActive: boolean;
  createdAt: Date;
}

const batchSchema = new Schema<IBatch>(
  {
    program: { type: Schema.Types.ObjectId, ref: 'Program', required: true },
    year: { type: Number, required: true },
    section: { type: String, required: true, trim: true, uppercase: true },
    maxStudents: { type: Number, required: true, min: 1 },
    currentStudentCount: { type: Number, default: 0 },
    academicYear: { type: String, trim: true }, // e.g. '2024-25'
    isActive: { type: Boolean, default: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

// A program can only have one batch per year+section combination
batchSchema.index({ program: 1, year: 1, section: 1 }, { unique: true });

export const Batch = mongoose.model<IBatch>('Batch', batchSchema);
