import mongoose, { Document, Schema } from 'mongoose';

export type WeekDay =
  | 'Monday'
  | 'Tuesday'
  | 'Wednesday'
  | 'Thursday'
  | 'Friday'
  | 'Saturday';

export interface ITimeSlot extends Document {
  _id: mongoose.Types.ObjectId;
  day: WeekDay;
  startTime: string; // e.g. '09:00'
  endTime: string;   // e.g. '10:00'
  slotNumber: number;
  isLunchBreak: boolean;
  createdAt: Date;
}

const timeSlotSchema = new Schema<ITimeSlot>(
  {
    day: {
      type: String,
      enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
      required: true,
    },
    startTime: { type: String, required: true },
    endTime: { type: String, required: true },
    slotNumber: { type: Number },
    isLunchBreak: { type: Boolean, default: false },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

timeSlotSchema.index({ day: 1, startTime: 1 }, { unique: true });

export const TimeSlot = mongoose.model<ITimeSlot>('TimeSlot', timeSlotSchema);
