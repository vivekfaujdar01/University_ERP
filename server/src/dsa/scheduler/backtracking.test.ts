import { resolveConflicts } from './backtracking';
import type { ScheduleNode, SchedulerTimeSlot, ConflictGraph, ColorAssignment } from './types';

const makeSlots = (count: number): SchedulerTimeSlot[] =>
  Array.from({ length: count }, (_, i) => ({
    id: `slot${i + 1}`,
    day: 'Monday',
    startTime: `0${9 + i}:00`,
    endTime:   `${10 + i}:00`,
    slotNumber: i + 1,
    isLunchBreak: false,
  }));

const makeNode = (id: string, priority = 10): ScheduleNode => ({
  nodeId: id, subjectId: `s_${id}`, batchId: `b_${id}`, facultyId: `f_${id}`, priority,
});

describe('resolveConflicts', () => {
  it('should return empty conflicts when unresolved list is empty', () => {
    const { colors, conflicts } = resolveConflicts(
      [], [], new Map(), new Map(), makeSlots(3), { lunchBreakSlotIds: [] }
    );
    expect(conflicts).toHaveLength(0);
    expect(colors.size).toBe(0);
  });

  it('should assign a slot to an unresolved node by bumping a lower-priority neighbour', () => {
    // Setup: n1 (high priority) has slot1; n2 (low priority, unresolved) conflicts with n1
    // n1 can move to slot2, freeing slot1 for n2
    const n1 = makeNode('n1', 20);
    const n2 = makeNode('n2', 10);

    const colors: ColorAssignment = new Map([['n1', 'slot1']]);
    const order = [n1]; // n1 was assigned first

    const graph: ConflictGraph = new Map([
      ['n1', new Set(['n2'])],
      ['n2', new Set(['n1'])],
    ]);

    const slots = makeSlots(2); // slot1, slot2

    const { colors: newColors, conflicts } = resolveConflicts(
      [n2], order, colors, graph, slots, { lunchBreakSlotIds: [] }
    );

    expect(conflicts).toHaveLength(0);
    expect(newColors.has('n2')).toBe(true);
  });

  it('should record a conflict if backtracking cannot find any slot', () => {
    // Only 1 slot available, both nodes conflict → impossible to resolve
    const n1 = makeNode('n1', 20);
    const n2 = makeNode('n2', 10);

    const colors: ColorAssignment = new Map([['n1', 'slot1']]);
    const graph: ConflictGraph = new Map([
      ['n1', new Set(['n2'])],
      ['n2', new Set(['n1'])],
    ]);

    const slots = makeSlots(1); // only slot1 — no alternative

    const { conflicts } = resolveConflicts(
      [n2], [n1], colors, graph, slots, { lunchBreakSlotIds: [] }
    );

    expect(conflicts).toHaveLength(1);
    expect(conflicts[0].involvedNodeIds).toContain('n2');
  });

  it('should not mutate the original colors map', () => {
    const n1 = makeNode('n1', 20);
    const n2 = makeNode('n2', 10);
    const original: ColorAssignment = new Map([['n1', 'slot1']]);
    const originalSnapshot = new Map(original);

    const graph: ConflictGraph = new Map([
      ['n1', new Set(['n2'])],
      ['n2', new Set(['n1'])],
    ]);

    resolveConflicts([n2], [n1], original, graph, makeSlots(2), { lunchBreakSlotIds: [] });

    // Original map should not be mutated
    expect(original).toEqual(originalSnapshot);
  });

  it('should skip lunch-break slots when resolving', () => {
    const n1 = makeNode('n1', 20);
    const n2 = makeNode('n2', 10);
    const colors: ColorAssignment = new Map([['n1', 'slot1']]);
    const graph: ConflictGraph = new Map([
      ['n1', new Set(['n2'])],
      ['n2', new Set(['n1'])],
    ]);
    const slots: SchedulerTimeSlot[] = [
      { id: 'slot1', day: 'Monday', startTime: '09:00', endTime: '10:00', slotNumber: 1, isLunchBreak: false },
      { id: 'lunch', day: 'Monday', startTime: '13:00', endTime: '14:00', slotNumber: 4, isLunchBreak: true },
    ];

    const { conflicts } = resolveConflicts(
      [n2], [n1], colors, graph, slots, { lunchBreakSlotIds: [] }
    );

    // Only slot1 and lunch available; lunch should be excluded → n2 unresolvable
    expect(conflicts).toHaveLength(1);
  });

  it('should handle multiple unresolved nodes independently', () => {
    const n1 = makeNode('n1', 30);
    const n2 = makeNode('n2', 20);
    const n3 = makeNode('n3', 10); // conflicts with both n1 and n2 via shared faculty
    const colors: ColorAssignment = new Map([['n1', 'slot1'], ['n2', 'slot2']]);
    const graph: ConflictGraph = new Map([
      ['n1', new Set(['n3'])],
      ['n2', new Set(['n3'])],
      ['n3', new Set(['n1', 'n2'])],
    ]);
    const slots = makeSlots(3); // slot1, slot2, slot3 — n3 can get slot3

    const { colors: newColors, conflicts } = resolveConflicts(
      [n3], [n1, n2], colors, graph, slots, { lunchBreakSlotIds: [] }
    );

    expect(conflicts).toHaveLength(0);
    expect(newColors.has('n3')).toBe(true);
    // n3 should get a slot that doesn't conflict with n1 or n2
    const n3Slot = newColors.get('n3')!;
    expect([newColors.get('n1'), newColors.get('n2')]).not.toContain(n3Slot);
  });
});
