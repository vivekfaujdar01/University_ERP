import { assignRooms } from './greedyRoom';
import type { ScheduleNode, SchedulerRoom, SchedulerSubject, SchedulerBatch, ColorAssignment } from './types';

const makeNode = (id: string, subjectId: string, batchId: string, priority = 10): ScheduleNode => ({
  nodeId: id, subjectId, batchId, facultyId: 'f1', priority,
});

const makeSubjectMap = (subjects: SchedulerSubject[]) =>
  new Map<string, SchedulerSubject>(subjects.map((s) => [s.id, s]));

const makeBatchMap = (batches: SchedulerBatch[]) =>
  new Map<string, SchedulerBatch>(batches.map((b) => [b.id, b]));

describe('assignRooms', () => {
  const subj: SchedulerSubject = {
    id: 's1', name: 'DS', credits: 4, isLab: false,
    hoursPerWeek: 3, programId: 'p1', semester: 5,
  };
  const batch: SchedulerBatch = {
    id: 'b1', programId: 'p1', section: 'A', year: 2021, studentCount: 40,
  };
  const rooms: SchedulerRoom[] = [
    { id: 'r1', name: 'R101', capacity: 60, isLab: false },
    { id: 'r2', name: 'R102', capacity: 30, isLab: false }, // too small for 40 students
    { id: 'r3', name: 'Lab-A', capacity: 40, isLab: true },
  ];

  it('should assign a valid classroom to a theory subject', () => {
    const node = makeNode('n1', 's1', 'b1');
    const colors: ColorAssignment = new Map([['n1', 'slot1']]);
    const { entries, conflicts } = assignRooms(
      [node], colors, rooms, makeSubjectMap([subj]), makeBatchMap([batch])
    );
    expect(conflicts).toHaveLength(0);
    expect(entries).toHaveLength(1);
    expect(entries[0].roomId).toBe('r1'); // r1 is smallest valid classroom
  });

  it('should assign a lab room to a lab subject', () => {
    const labSubj: SchedulerSubject = { ...subj, id: 's2', isLab: true };
    const node = makeNode('n1', 's2', 'b1');
    const colors: ColorAssignment = new Map([['n1', 'slot1']]);
    const { entries, conflicts } = assignRooms(
      [node], colors, rooms, makeSubjectMap([labSubj]), makeBatchMap([batch])
    );
    expect(conflicts).toHaveLength(0);
    expect(entries[0].roomId).toBe('r3');
  });

  it('should report capacity conflict when no room is large enough', () => {
    const bigBatch: SchedulerBatch = { ...batch, studentCount: 200 };
    const node = makeNode('n1', 's1', 'b1');
    const colors: ColorAssignment = new Map([['n1', 'slot1']]);
    const { conflicts } = assignRooms(
      [node], colors, rooms, makeSubjectMap([subj]), makeBatchMap([bigBatch])
    );
    expect(conflicts).toHaveLength(1);
    expect(conflicts[0].type).toBe('capacity');
  });

  it('should not assign the same room in the same slot to two nodes', () => {
    const n1 = makeNode('n1', 's1', 'b1', 20);
    const n2 = makeNode('n2', 's1', 'b2', 10);
    const batch2: SchedulerBatch = { ...batch, id: 'b2' };
    // Only one suitable classroom: r1
    const smallRooms: SchedulerRoom[] = [{ id: 'r1', name: 'R101', capacity: 60, isLab: false }];
    const colors: ColorAssignment = new Map([['n1', 'slot1'], ['n2', 'slot1']]); // same slot!
    const { entries, conflicts } = assignRooms(
      [n1, n2], colors, smallRooms, makeSubjectMap([subj]), makeBatchMap([batch, batch2])
    );
    // One gets r1, the other gets a room conflict
    expect(entries.length + conflicts.length).toBe(2);
    const roomIds = entries.map((e) => e.roomId + ':' + e.timeSlotId);
    const unique = new Set(roomIds);
    expect(unique.size).toBe(entries.length);
  });

  it('should skip nodes with no color assignment', () => {
    const node = makeNode('n1', 's1', 'b1');
    const colors: ColorAssignment = new Map(); // no slot assigned
    const { entries, conflicts } = assignRooms(
      [node], colors, rooms, makeSubjectMap([subj]), makeBatchMap([batch])
    );
    expect(entries).toHaveLength(0);
    expect(conflicts).toHaveLength(0);
  });

  it('should assign the smallest valid room (greedy)', () => {
    const largeRooms: SchedulerRoom[] = [
      { id: 'big',   name: 'Auditorium', capacity: 500, isLab: false },
      { id: 'small', name: 'R101',       capacity:  50, isLab: false },
    ];
    const node = makeNode('n1', 's1', 'b1');
    const colors: ColorAssignment = new Map([['n1', 'slot1']]);
    const { entries } = assignRooms(
      [node], colors, largeRooms, makeSubjectMap([subj]), makeBatchMap([batch])
    );
    expect(entries[0].roomId).toBe('small');
  });

  it('should produce a complete ScheduleEntry with all required fields', () => {
    const node = makeNode('n1', 's1', 'b1');
    const colors: ColorAssignment = new Map([['n1', 'slotX']]);
    const { entries } = assignRooms(
      [node], colors, rooms, makeSubjectMap([subj]), makeBatchMap([batch])
    );
    const entry = entries[0];
    expect(entry).toHaveProperty('subjectId', 's1');
    expect(entry).toHaveProperty('batchId', 'b1');
    expect(entry).toHaveProperty('timeSlotId', 'slotX');
    expect(entry).toHaveProperty('roomId');
    expect(entry).toHaveProperty('facultyId');
  });
});
