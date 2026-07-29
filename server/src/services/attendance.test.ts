import mongoose from 'mongoose';
import { Attendance } from '../models/Attendance';

describe('Attendance Model & Duplicate Guard Tests', () => {
  it('should validate Attendance schema structure', () => {
    const doc = new Attendance({
      batch: new mongoose.Types.ObjectId(),
      subject: new mongoose.Types.ObjectId(),
      faculty: new mongoose.Types.ObjectId(),
      timeSlot: new mongoose.Types.ObjectId(),
      date: new Date('2026-07-28'),
      academicYear: '2024-25',
      records: [
        {
          student: new mongoose.Types.ObjectId(),
          status: 'present',
        },
      ],
      totalStudents: 1,
      presentCount: 1,
    });

    expect(doc.records.length).toBe(1);
    expect(doc.presentCount).toBe(1);
    expect(doc.academicYear).toBe('2024-25');
  });
});
