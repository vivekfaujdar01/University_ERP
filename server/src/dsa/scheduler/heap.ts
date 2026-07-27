/**
 * T4 — MaxHeap + Subject Priority Queue
 *
 * Priority score = (credits × 10) + (isLab ? 5 : 0) + hoursPerWeek
 * Higher-priority subjects are scheduled first to ensure core/lab subjects
 * get their preferred slots before electives.
 */

import type { ScheduleNode, SchedulerSubject, SchedulerFaculty, SchedulerBatch } from './types';

// ─── MaxHeap ──────────────────────────────────────────────────────────────────

export class MaxHeap<T> {
  private readonly data: T[] = [];

  constructor(private readonly comparator: (a: T, b: T) => number) {}

  get size(): number {
    return this.data.length;
  }

  isEmpty(): boolean {
    return this.data.length === 0;
  }

  /** Insert a value and bubble it up to restore the heap property. O(log n) */
  push(value: T): void {
    this.data.push(value);
    this.bubbleUp(this.data.length - 1);
  }

  /** Remove and return the maximum element. O(log n) */
  pop(): T | undefined {
    if (this.data.length === 0) return undefined;
    const top = this.data[0];
    const last = this.data.pop()!;
    if (this.data.length > 0) {
      this.data[0] = last;
      this.sinkDown(0);
    }
    return top;
  }

  /** Peek at the maximum without removing it. O(1) */
  peek(): T | undefined {
    return this.data[0];
  }

  /** Build heap from an existing array in O(n) via Floyd's algorithm. */
  static from<T>(items: T[], comparator: (a: T, b: T) => number): MaxHeap<T> {
    const heap = new MaxHeap<T>(comparator);
    heap.data.push(...items);
    // Start from last non-leaf and sink down
    for (let i = Math.floor(heap.data.length / 2) - 1; i >= 0; i--) {
      heap.sinkDown(i);
    }
    return heap;
  }

  // ─── Internal helpers ──────────────────────────────────────────────────────

  private bubbleUp(i: number): void {
    while (i > 0) {
      const parent = Math.floor((i - 1) / 2);
      if (this.comparator(this.data[i], this.data[parent]) > 0) {
        this.swap(i, parent);
        i = parent;
      } else {
        break;
      }
    }
  }

  private sinkDown(i: number): void {
    const n = this.data.length;
    // eslint-disable-next-line no-constant-condition
    while (true) {
      const left  = 2 * i + 1;
      const right = 2 * i + 2;
      let largest = i;

      if (left < n && this.comparator(this.data[left], this.data[largest]) > 0) {
        largest = left;
      }
      if (right < n && this.comparator(this.data[right], this.data[largest]) > 0) {
        largest = right;
      }
      if (largest === i) break;

      this.swap(i, largest);
      i = largest;
    }
  }

  private swap(a: number, b: number): void {
    const tmp    = this.data[a];
    this.data[a] = this.data[b]!;
    this.data[b] = tmp;
  }
}

// ─── Priority score ───────────────────────────────────────────────────────────

export function subjectPriority(subject: SchedulerSubject): number {
  return subject.credits * 10 + (subject.isLab ? 5 : 0) + subject.hoursPerWeek;
}

// ─── Build priority queue ─────────────────────────────────────────────────────

/**
 * buildSubjectPriorityQueue
 *
 * For every (subject, batch, faculty) combination that needs to be scheduled,
 * create a ScheduleNode and push it into a MaxHeap ordered by subject priority.
 *
 * A subject needs `hoursPerWeek` slots per batch.  Each slot is a separate node
 * so the graph-coloring step assigns a distinct time slot to each occurrence.
 */
export function buildSubjectPriorityQueue(
  subjects: SchedulerSubject[],
  batches: SchedulerBatch[],
  faculty: SchedulerFaculty[]
): MaxHeap<ScheduleNode> {
  const nodes: ScheduleNode[] = [];

  for (const subject of subjects) {
    // Find all batches that belong to this subject's program + semester
    const relevantBatches = batches.filter(
      (b) => b.programId === subject.programId
    );

    // Find faculty assigned to this subject
    const assignedFaculty = faculty.filter((f) =>
      f.subjectsAssigned.includes(subject.id)
    );

    if (assignedFaculty.length === 0 || relevantBatches.length === 0) continue;

    const priority = subjectPriority(subject);

    for (const batch of relevantBatches) {
      // Round-robin faculty across required hours
      for (let hour = 0; hour < subject.hoursPerWeek; hour++) {
        const fac = assignedFaculty[hour % assignedFaculty.length];
        nodes.push({
          nodeId:    `${subject.id}::${batch.id}::${fac.id}::h${hour}`,
          subjectId: subject.id,
          batchId:   batch.id,
          facultyId: fac.id,
          priority,
        });
      }
    }
  }

  return MaxHeap.from<ScheduleNode>(
    nodes,
    (a, b) => a.priority - b.priority
  );
}
