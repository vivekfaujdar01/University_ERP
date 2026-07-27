import { MaxHeap, subjectPriority, buildSubjectPriorityQueue } from './heap';
import type { SchedulerSubject, SchedulerFaculty, SchedulerBatch } from './types';

// ─── MaxHeap ──────────────────────────────────────────────────────────────────

describe('MaxHeap', () => {
  const cmp = (a: number, b: number) => a - b;

  it('should start empty', () => {
    const h = new MaxHeap<number>(cmp);
    expect(h.isEmpty()).toBe(true);
    expect(h.size).toBe(0);
  });

  it('should return undefined when popping an empty heap', () => {
    const h = new MaxHeap<number>(cmp);
    expect(h.pop()).toBeUndefined();
  });

  it('should push and pop a single element', () => {
    const h = new MaxHeap<number>(cmp);
    h.push(42);
    expect(h.peek()).toBe(42);
    expect(h.pop()).toBe(42);
    expect(h.isEmpty()).toBe(true);
  });

  it('should maintain max-heap property across multiple pushes', () => {
    const h = new MaxHeap<number>(cmp);
    [3, 1, 4, 1, 5, 9, 2, 6].forEach((n) => h.push(n));
    expect(h.pop()).toBe(9);
    expect(h.pop()).toBe(6);
    expect(h.pop()).toBe(5);
  });

  it('should pop elements in descending order', () => {
    const h = new MaxHeap<number>(cmp);
    [7, 3, 8, 1, 5].forEach((n) => h.push(n));
    const result: number[] = [];
    while (!h.isEmpty()) result.push(h.pop()!);
    expect(result).toEqual([8, 7, 5, 3, 1]);
  });

  it('should handle duplicate values correctly', () => {
    const h = new MaxHeap<number>(cmp);
    [2, 2, 2].forEach((n) => h.push(n));
    expect(h.size).toBe(3);
    expect(h.pop()).toBe(2);
    expect(h.pop()).toBe(2);
    expect(h.pop()).toBe(2);
    expect(h.isEmpty()).toBe(true);
  });

  it('should build from array using Floyd\'s algorithm', () => {
    const items = [4, 10, 3, 5, 1];
    const h = MaxHeap.from(items, cmp);
    expect(h.size).toBe(5);
    expect(h.pop()).toBe(10);
    expect(h.pop()).toBe(5);
  });

  it('should handle a single-element heap built via from()', () => {
    const h = MaxHeap.from([99], cmp);
    expect(h.pop()).toBe(99);
    expect(h.isEmpty()).toBe(true);
  });

  it('should maintain heap property after interleaved pushes and pops', () => {
    const h = new MaxHeap<number>(cmp);
    h.push(5);
    h.push(3);
    expect(h.pop()).toBe(5);
    h.push(10);
    h.push(1);
    expect(h.pop()).toBe(10);
    expect(h.pop()).toBe(3);
    expect(h.pop()).toBe(1);
    expect(h.isEmpty()).toBe(true);
  });

  it('should work with object comparator', () => {
    interface Item { priority: number; label: string }
    const h = new MaxHeap<Item>((a, b) => a.priority - b.priority);
    h.push({ priority: 3, label: 'c' });
    h.push({ priority: 1, label: 'a' });
    h.push({ priority: 2, label: 'b' });
    expect(h.pop()!.label).toBe('c');
    expect(h.pop()!.label).toBe('b');
    expect(h.pop()!.label).toBe('a');
  });
});

// ─── subjectPriority ──────────────────────────────────────────────────────────

describe('subjectPriority', () => {
  const base: SchedulerSubject = {
    id: 's1', name: 'Maths', credits: 4,
    isLab: false, hoursPerWeek: 4, programId: 'p1', semester: 1,
  };

  it('should compute priority as (credits×10) + (isLab?5:0) + hoursPerWeek', () => {
    expect(subjectPriority(base)).toBe(4 * 10 + 0 + 4); // 44
  });

  it('should add 5 for lab subjects', () => {
    expect(subjectPriority({ ...base, isLab: true })).toBe(4 * 10 + 5 + 4); // 49
  });

  it('should scale with credits', () => {
    expect(subjectPriority({ ...base, credits: 1 })).toBe(1 * 10 + 0 + 4); // 14
    expect(subjectPriority({ ...base, credits: 5 })).toBe(5 * 10 + 0 + 4); // 54
  });
});

// ─── buildSubjectPriorityQueue ────────────────────────────────────────────────

describe('buildSubjectPriorityQueue', () => {
  const subjects: SchedulerSubject[] = [
    { id: 's1', name: 'DS',    credits: 4, isLab: false, hoursPerWeek: 3, programId: 'p1', semester: 5 },
    { id: 's2', name: 'DS Lab', credits: 1, isLab: true,  hoursPerWeek: 2, programId: 'p1', semester: 5 },
  ];
  const batches: SchedulerBatch[] = [
    { id: 'b1', programId: 'p1', section: 'A', year: 2021, studentCount: 60 },
  ];
  const faculty: SchedulerFaculty[] = [
    { id: 'f1', subjectsAssigned: ['s1', 's2'], preferredSlots: [], maxHoursPerDay: 6 },
  ];

  it('should return a non-empty heap when faculty are assigned', () => {
    const heap = buildSubjectPriorityQueue(subjects, batches, faculty);
    expect(heap.isEmpty()).toBe(false);
    // s1 has hoursPerWeek=3 → 3 nodes; s2 has hoursPerWeek=2 → 2 nodes → total 5
    expect(heap.size).toBe(5);
  });

  it('should pop highest-priority subject node first', () => {
    const heap = buildSubjectPriorityQueue(subjects, batches, faculty);
    // s1: priority = 40 + 0 + 3 = 43; s2: priority = 10 + 5 + 2 = 17
    // highest = s1
    const top = heap.pop()!;
    expect(top.subjectId).toBe('s1');
  });

  it('should return empty heap when no faculty assigned to subjects', () => {
    const noFaculty: SchedulerFaculty[] = [
      { id: 'f1', subjectsAssigned: [], preferredSlots: [], maxHoursPerDay: 6 },
    ];
    const heap = buildSubjectPriorityQueue(subjects, batches, noFaculty);
    expect(heap.isEmpty()).toBe(true);
  });

  it('should return empty heap when no matching batches exist', () => {
    const otherBatches: SchedulerBatch[] = [
      { id: 'b2', programId: 'p2', section: 'A', year: 2021, studentCount: 60 },
    ];
    const heap = buildSubjectPriorityQueue(subjects, otherBatches, faculty);
    expect(heap.isEmpty()).toBe(true);
  });

  it('node IDs should be unique across all nodes', () => {
    const heap = buildSubjectPriorityQueue(subjects, batches, faculty);
    const ids: string[] = [];
    while (!heap.isEmpty()) ids.push(heap.pop()!.nodeId);
    const unique = new Set(ids);
    expect(unique.size).toBe(ids.length);
  });
});
