import mongoose, { Document, Schema } from 'mongoose';
import bcrypt from 'bcryptjs';
import { ROLES, type Role } from '../config/constants';
import { BCRYPT_SALT_ROUNDS } from '../config/constants';

export interface IUser extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  email: string;
  passwordHash: string;
  role: Role;
  phone?: string;
  avatar?: string;
  isActive: boolean;

  // Student-specific
  enrollmentNumber?: string;
  program?: mongoose.Types.ObjectId;
  batch?: mongoose.Types.ObjectId;
  semester?: number;
  admissionYear?: number;
  cgpa: number;

  // Faculty-specific
  employeeId?: string;
  designation?: string;
  department?: mongoose.Types.ObjectId;
  subjectsAssigned: mongoose.Types.ObjectId[];
  preferredSlots: mongoose.Types.ObjectId[];
  maxHoursPerDay: number;

  createdAt: Date;
  updatedAt: Date;

  // Instance methods
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const userSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: { type: String, required: true, select: false },
    role: {
      type: String,
      enum: Object.values(ROLES),
      required: true,
    },
    phone: { type: String, trim: true },
    avatar: { type: String },
    isActive: { type: Boolean, default: true },

    // Student-specific
    enrollmentNumber: { type: String, unique: true, sparse: true, trim: true },
    program: { type: Schema.Types.ObjectId, ref: 'Program' },
    batch: { type: Schema.Types.ObjectId, ref: 'Batch' },
    semester: { type: Number, min: 1 },
    admissionYear: { type: Number },
    cgpa: { type: Number, default: 0 },

    // Faculty-specific
    employeeId: { type: String, unique: true, sparse: true, trim: true },
    designation: { type: String },
    department: { type: Schema.Types.ObjectId, ref: 'Department' },
    subjectsAssigned: [{ type: Schema.Types.ObjectId, ref: 'Subject' }],
    preferredSlots: [{ type: Schema.Types.ObjectId, ref: 'TimeSlot' }],
    maxHoursPerDay: { type: Number, default: 6 },
  },
  { timestamps: true }
);

// Indexes
userSchema.index({ role: 1, department: 1 });
userSchema.index({ batch: 1 });

// Hash password before save
userSchema.pre('save', async function (next) {
  if (!this.isModified('passwordHash')) return next();
  this.passwordHash = await bcrypt.hash(this.passwordHash, BCRYPT_SALT_ROUNDS);
  next();
});

// Instance method — compare password
userSchema.methods.comparePassword = async function (
  candidatePassword: string
): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.passwordHash as string);
};

export const User = mongoose.model<IUser>('User', userSchema);
