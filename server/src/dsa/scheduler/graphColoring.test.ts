import { buildConflictGraph, assignTimeSlots } from './graphColoring';
import { MaxHeap } from './heap';
import type {
  ScheduleNode, SchedulerTimeSlot, SchedulerFaculty, ConflictGraph,
} from './types';

// ─── buildConflictGraph ───────────────────────────────────────────────────────

describe('buildConflictGraph', () => {
  const makeNode = (id: string, subjectId: string, batchId: string, facultyId: string): ScheduleNode => ({
    nodeId: id, subjectId, batchId, facultyId, priority: 10,
  });

  it('should build an empty graph for an empty node list', () => {
    const g = buildConflictGraph([]);
    expect(g.size).toBe(0);
  });

  it('should create a node entry for each input node', () => {
    const nodes = [
      makeNode('n1', 's1', 'b1', 'f1'),
      makeNode('n2', 's2', 'b2', 'f2'),
    ];
    const g = buildConflictGraph(nodes);
    expect(g.has('n1')).toBe(true);
    expect(g.has('n2')).toBe(true);
  });

  it('should create an edge when two nodes share the same faculty', () => {
    const nodes = [
      makeNode('n1', 's1', 'b1', 'f1'),
      makeNode('n2', 's2', 'b2', 'f1'), // same faculty
    ];
    const g = buildConflictGraph(nodes);
    expect(g.get('n1')!.has('n2')).toBe(true);
    expect(g.get('n2')!.has('n1')).toBe(true);
  });

  it('should create an edge when two nodes share the same batch', () => {
    const nodes = [
      makeNode('n1', 's1', 'b1', 'f1'),
      makeNode('n2', 's2', 'b1', 'f2'), // same batch
    ];
    const g = buildConflictGraph(nodes);
    expect(g.get('n1')!.has('n2')).toBe(true);
    expect(g.get('n2')!.has('n1')).toBe(true);
  });

  it('should NOT create an edge between nodes that share neither faculty nor batch', () => {
    const nodes = [
      makeNode('n1', 's1', 'b1', 'f1'),
      makeNode('n2', 's2', 'b2', 'f2'),
    ];
    const g = buildConflictGraph(nodes);
    expect(g.get('n1')!.size).toBe(0);
    expect(g.get('n2')!.size).toBe(0);
  });

  it('should handle three nodes where two conflict with the third but not each other', () => {
    const nodes = [
      makeNode('n1', 's1', 'b1', 'f1'), // f1, b1
      makeNode('n2', 's2', 'b2', 'f1'), // f1 conflicts with n1
      makeNode('n3', 's3', 'b3', 'f2'), // no conflict
    ];
    const g = buildConflictGraph(nodes);
    expect(g.get('n1')!.has('n2')).toBe(true);
    expect(g.get('n1')!.has('n3')).toBe(false);
    expect(g.get('n2')!.has('n3')).toBe(false);
  });

  it('should be symmetric — edges are bidirectional', () => {
    const nodes = [
      makeNode('n1', 's1', 'b1', 'f1'),
      makeNode('n2', 's2', 'b1', 'f2'),
      makeNode('n3', 's3', 'b3', 'f1'),
    ];
    const g = buildConflictGraph(nodes);
    for (const [nodeId, neighbours] of g.entries()) {
      for (const nId of neighbours) {
        expect(g.get(nId)!.has(nodeId)).toBe(true);
      }
    }
  });
});

// ─── assignTimeSlots ──────────────────────────────────────────────────────────

const makeSlots = (count: number): SchedulerTimeSlot[] =>
  Array.from({ length: count }, (_, i) => ({
    id: `slot${i + 1}`,
    day: 'Monday',
    startTime: `0${9 + i}:00`,
    endTime:   `${10 + i}:00`,
    slotNumber: i + 1,
    isLunchBreak: false,
  }));

const makeFacultyMap = (facultyId: string, preferredSlots: string[] = []): Map<string, SchedulerFaculty> =>
  new Map([[facultyId, { id: facultyId, subjectsAssigned: [], preferredSlots, maxHoursPerDay: 6 }]]);

describe('assignTimeSlots', () => {
  const makeNode = (id: string, subjectId: string, batchId: string, facultyId: string, priority = 10): ScheduleNode => ({
    nodeId: id, subjectId, batchId, facultyId, priority,
  });

  it('should assign a slot to a single non-conflicting node', () => {
    const node  = makeNode('n1', 's1', 'b1', 'f1');
    const heap  = MaxHeap.from([node], (a, b) => a.priority - b.priority);
    const graph: ConflictGraph = new Map([['n1', new Set()]]);
    const slots = makeSlots(3);
    const { colors, unresolved } = assignTimeSlots(heap, graph, slots, makeFacultyMap('f1'), { lunchBreakSlotIds: [] });
    expect(colors.has('n1')).toBe(true);
    expect(unresolved).toHaveLength(0);
  });

  it('should assign different slots to two conflicting nodes', () => {
    const n1 = makeNode('n1', 's1', 'b1', 'f1');
    const n2 = makeNode('n2', 's2', 'b2', 'f1'); // same faculty → conflict
    const heap = MaxHeap.from([n1, n2], (a, b) => a.priority - b.priority);
    const graph: ConflictGraph = new Map([
      ['n1', new Set(['n2'])],
      ['n2', new Set(['n1'])],
    ]);
    const slots = makeSlots(3);
    const fMap = new Map<string, SchedulerFaculty>([
      ['f1', { id: 'f1', subjectsAssigned: [], preferredSlots: [], maxHoursPerDay: 6 }],
    ]);
    const { colors, unresolved } = assignTimeSlots(heap, graph, slots, fMap, { lunchBreakSlotIds: [] });
    expect(unresolved).toHaveLength(0);
    expect(colors.get('n1')).not.toBe(colors.get('n2'));
  });

  it('should mark a node as unresolved when all slots are taken by neighbours', () => {
    const nodes = [
      makeNode('n1', 's1', 'b1', 'f1', 30),
      makeNode('n2', 's2', 'b2', 'f1', 20), // conflicts with n1
    ];
    const heap = MaxHeap.from(nodes, (a, b) => a.priority - b.priority);
    const graph: ConflictGraph = new Map([
      ['n1', new Set(['n2'])],
      ['n2', new Set(['n1'])],
    ]);
    // Only 1 slot — n1 takes it, n2 has nothing left
    const slots = makeSlots(1);
    const fMap = new Map<string, SchedulerFaculty>([
      ['f1', { id: 'f1', subjectsAssigned: [], preferredSlots: [], maxHoursPerDay: 6 }],
    ]);
    const { unresolved } = assignTimeSlots(heap, graph, slots, fMap, { lunchBreakSlotIds: [] });
    expect(unresolved).toHaveLength(1);
    expect(unresolved[0].nodeId).toBe('n2');
  });

  it('should skip lunch-break slots', () => {
    const node = makeNode('n1', 's1', 'b1', 'f1');
    const heap = MaxHeap.from([node], (a, b) => a.priority - b.priority);
    const graph: ConflictGraph = new Map([['n1', new Set()]]);
    const slots: SchedulerTimeSlot[] = [
      { id: 'lunch', day: 'Monday', startTime: '13:00', endTime: '14:00', slotNumber: 4, isLunchBreak: true },
      { id: 'slot2', day: 'Monday', startTime: '14:00', endTime: '15:00', slotNumber: 5, isLunchBreak: false },
    ];
    const { colors } = assignTimeSlots(heap, graph, slots, makeFacultyMap('f1'), { lunchBreakSlotIds: [] });
    expect(colors.get('n1')).toBe('slot2');
    expect(colors.get('n1')).not.toBe('lunch');
  });

  it('should respect faculty preferred slots', () => {
    const node = makeNode('n1', 's1', 'b1', 'f1');
    const heap = MaxHeap.from([node], (a, b) => a.priority - b.priority);
    const graph: ConflictGraph = new Map([['n1', new Set()]]);
    const slots = makeSlots(3); // slot1, slot2, slot3
    const fMap = makeFacultyMap('f1', ['slot3']); // prefer slot3
    const { colors } = assignTimeSlots(heap, graph, slots, fMap, { lunchBreakSlotIds: [] });
    expect(colors.get('n1')).toBe('slot3');
  });
});
