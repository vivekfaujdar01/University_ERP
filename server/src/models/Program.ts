import mongoose, { Document, Schema } from 'mongoose';

export interface IProgram extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  code: string;
  department: mongoose.Types.ObjectId;
  durationYears: number;
  totalSemesters: number;
  isActive: boolean;
  createdAt: Date;
}

const programSchema = new Schema<IProgram>(
  {
    name: { type: String, required: true, trim: true },
    code: { type: String, required: true, unique: true, trim: true, uppercase: true },
    department: { type: Schema.Types.ObjectId, ref: 'Department', required: true },
    durationYears: { type: Number, required: true, min: 1 },
    totalSemesters: { type: Number, required: true, min: 1 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

programSchema.index({ department: 1 });

export const Program = mongoose.model<IProgram>('Program', programSchema);
