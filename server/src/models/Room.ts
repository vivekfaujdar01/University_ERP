import mongoose, { Document, Schema } from 'mongoose';

export interface IRoom extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  capacity: number;
  isLab: boolean;
  building?: string;
  floor?: number;
  facilities: string[];
  isActive: boolean;
  createdAt: Date;
}

const roomSchema = new Schema<IRoom>(
  {
    name: { type: String, required: true, unique: true, trim: true },
    capacity: { type: Number, required: true, min: 1 },
    isLab: { type: Boolean, default: false },
    building: { type: String, trim: true },
    floor: { type: Number },
    facilities: [{ type: String, trim: true }],
    isActive: { type: Boolean, default: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export const Room = mongoose.model<IRoom>('Room', roomSchema);
