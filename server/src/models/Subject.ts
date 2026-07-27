import mongoose, { Document, Schema } from 'mongoose';

export type SubjectType = 'theory' | 'lab' | 'tutorial' | 'project';

export interface ISubject extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  code: string;
  credits: number;
  isLab: boolean;
  hoursPerWeek: number;
  department: mongoose.Types.ObjectId;
  program: mongoose.Types.ObjectId;
  semester: number;
  subjectType: SubjectType;
  isActive: boolean;
  createdAt: Date;
}

const subjectSchema = new Schema<ISubject>(
  {
    name: { type: String, required: true, trim: true },
    code: { type: String, required: true, unique: true, trim: true, uppercase: true },
    credits: { type: Number, required: true, min: 1, max: 5 },
    isLab: { type: Boolean, default: false },
    hoursPerWeek: { type: Number, required: true, min: 1 },
    department: { type: Schema.Types.ObjectId, ref: 'Department', required: true },
    program: { type: Schema.Types.ObjectId, ref: 'Program', required: true },
    semester: { type: Number, required: true, min: 1, max: 12 },
    subjectType: {
      type: String,
      enum: ['theory', 'lab', 'tutorial', 'project'],
      default: 'theory',
    },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

subjectSchema.index({ program: 1, semester: 1 });

export const Subject = mongoose.model<ISubject>('Subject', subjectSchema);
