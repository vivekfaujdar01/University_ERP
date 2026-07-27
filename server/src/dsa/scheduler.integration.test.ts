import { generateTimetable } from '../dsa/index';
import type { SchedulerInput, SchedulerSubject, SchedulerFaculty, SchedulerBatch, SchedulerRoom, SchedulerTimeSlot } from '../dsa/scheduler/types';

// ─── Reusable fixtures ────────────────────────────────────────────────────────

function makeSlots(): SchedulerTimeSlot[] {
  const days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
  const times = [
    { start: '09:00', end: '10:00', num: 1 },
    { start: '10:00', end: '11:00', num: 2 },
    { start: '11:00', end: '12:00', num: 3 },
    { start: '14:00', end: '15:00', num: 5 },
    { start: '15:00', end: '16:00', num: 6 },
  ];
  const slots: SchedulerTimeSlot[] = [];
  let idx = 0;
  for (const day of days) {
    for (const t of times) {
      slots.push({ id: `slot${++idx}`, day, startTime: t.start, endTime: t.end, slotNumber: t.num, isLunchBreak: false });
    }
  }
  // Add a lunch break slot
  slots.push({ id: 'lunch1', day: 'Monday', startTime: '13:00', endTime: '14:00', slotNumber: 4, isLunchBreak: true });
  return slots;
}

function makeBasicInput(): SchedulerInput {
  const subjects: SchedulerSubject[] = [
    { id: 's1', name: 'Data Structures', credits: 4, isLab: false, hoursPerWeek: 3, programId: 'p1', semester: 5 },
    { id: 's2', name: 'OS',              credits: 3, isLab: false, hoursPerWeek: 2, programId: 'p1', semester: 5 },
    { id: 's3', name: 'DS Lab',          credits: 1, isLab: true,  hoursPerWeek: 2, programId: 'p1', semester: 5 },
  ];
  const batches: SchedulerBatch[] = [
    { id: 'b1', programId: 'p1', section: 'A', year: 2021, studentCount: 40 },
  ];
  const faculty: SchedulerFaculty[] = [
    { id: 'f1', subjectsAssigned: ['s1', 's2'], preferredSlots: ['slot1'], maxHoursPerDay: 6 },
    { id: 'f2', subjectsAssigned: ['s3'],       preferredSlots: [],         maxHoursPerDay: 6 },
  ];
  const rooms: SchedulerRoom[] = [
    { id: 'r1', name: 'R101',  capacity: 60,  isLab: false },
    { id: 'r2', name: 'Lab-A', capacity: 40,  isLab: true  },
  ];
  return {
    batches, subjects, faculty, rooms,
    timeSlots: makeSlots(),
    constraints: { lunchBreakSlotIds: ['lunch1'], maxHoursPerDayPerFaculty: 6 },
  };
}

// ─── Integration tests ────────────────────────────────────────────────────────

describe('generateTimetable (integration)', () => {
  it('should return a SchedulerOutput with required shape', () => {
    const result = generateTimetable(makeBasicInput());
    expect(result).toHaveProperty('schedule');
    expect(result).toHaveProperty('conflicts');
    expect(result).toHaveProperty('isComplete');
    expect(Array.isArray(result.schedule)).toBe(true);
    expect(Array.isArray(result.conflicts)).toBe(true);
  });

  it('should produce zero hard-constraint violations when input is satisfiable', () => {
    const result = generateTimetable(makeBasicInput());
    expect(result.conflicts).toHaveLength(0);
    expect(result.isComplete).toBe(true);
  });

  it('should schedule the correct total number of hours', () => {
    const input = makeBasicInput();
    const result = generateTimetable(input);
    // s1: 3 hrs, s2: 2 hrs, s3: 2 hrs for batch b1 = 7 total entries
    expect(result.schedule).toHaveLength(7);
  });

  it('should not assign the same slot to two entries that share a faculty member', () => {
    const result = generateTimetable(makeBasicInput());
    const slotsByFaculty = new Map<string, Set<string>>();
    for (const entry of result.schedule) {
      if (!slotsByFaculty.has(entry.facultyId)) {
        slotsByFaculty.set(entry.facultyId, new Set());
      }
      const slots = slotsByFaculty.get(entry.facultyId)!;
      expect(slots.has(entry.timeSlotId)).toBe(false); // no duplicate slot for same faculty
      slots.add(entry.timeSlotId);
    }
  });

  it('should not assign the same slot to two entries that share a batch', () => {
    const result = generateTimetable(makeBasicInput());
    const slotsByBatch = new Map<string, Set<string>>();
    for (const entry of result.schedule) {
      if (!slotsByBatch.has(entry.batchId)) {
        slotsByBatch.set(entry.batchId, new Set());
      }
      const slots = slotsByBatch.get(entry.batchId)!;
      expect(slots.has(entry.timeSlotId)).toBe(false);
      slots.add(entry.timeSlotId);
    }
  });

  it('should not assign the same room in the same slot to two entries', () => {
    const result = generateTimetable(makeBasicInput());
    const roomSlotKeys = new Set<string>();
    for (const entry of result.schedule) {
      const key = `${entry.roomId}::${entry.timeSlotId}`;
      expect(roomSlotKeys.has(key)).toBe(false);
      roomSlotKeys.add(key);
    }
  });

  it('should not assign lab entries to non-lab rooms', () => {
    const result = generateTimetable(makeBasicInput());
    // s3 is a lab subject — its entries must use a lab room
    const labEntries = result.schedule.filter((e) => e.subjectId === 's3');
    for (const entry of labEntries) {
      expect(entry.roomId).toBe('r2'); // only lab room in fixture
    }
  });

  it('should never use lunch-break slots', () => {
    const result = generateTimetable(makeBasicInput());
    for (const entry of result.schedule) {
      expect(entry.timeSlotId).not.toBe('lunch1');
    }
  });

  it('should return empty schedule for empty input', () => {
    const empty: SchedulerInput = {
      batches: [], subjects: [], faculty: [], rooms: [],
      timeSlots: makeSlots(),
      constraints: { lunchBreakSlotIds: [], maxHoursPerDayPerFaculty: 6 },
    };
    const result = generateTimetable(empty);
    expect(result.schedule).toHaveLength(0);
    expect(result.isComplete).toBe(true);
  });

  it('should set isComplete = false when conflicts exist', () => {
    // Make it impossible: only 1 slot, 2 conflicting nodes
    const input: SchedulerInput = {
      batches:  [{ id: 'b1', programId: 'p1', section: 'A', year: 2021, studentCount: 10 }],
      subjects: [{ id: 's1', name: 'DS', credits: 4, isLab: false, hoursPerWeek: 2, programId: 'p1', semester: 5 }],
      faculty:  [{ id: 'f1', subjectsAssigned: ['s1'], preferredSlots: [], maxHoursPerDay: 6 }],
      rooms:    [{ id: 'r1', name: 'R101', capacity: 60, isLab: false }],
      timeSlots: [{ id: 'slot1', day: 'Monday', startTime: '09:00', endTime: '10:00', slotNumber: 1, isLunchBreak: false }],
      constraints: { lunchBreakSlotIds: [], maxHoursPerDayPerFaculty: 6 },
    };
    const result = generateTimetable(input);
    // 2 hours needed but only 1 slot → conflict
    expect(result.isComplete).toBe(false);
    expect(result.conflicts.length).toBeGreaterThan(0);
  });
});
