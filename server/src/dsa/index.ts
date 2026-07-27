/**
 * T4 — Timetable Scheduler Orchestrator
 *
 * Executes the 6-step scheduling pipeline:
 *   1. Build ScheduleNodes + MaxHeap (priority queue by subject importance)
 *   2. Build conflict graph (teacher + batch constraints)
 *   3. Graph coloring — assign time slots (highest priority first)
 *   4. Backtracking — resolve any unassigned nodes within depth cap
 *   5. Greedy room allocation (smallest valid room first)
 *   6. Return SchedulerOutput
 *
 * Throws if execution exceeds 30 seconds (configurable guard).
 * All inputs/outputs are plain TypeScript objects — no Mongoose inside this module.
 */

import { buildSubjectPriorityQueue } from './scheduler/heap';
import { buildConflictGraph, assignTimeSlots } from './scheduler/graphColoring';
import { resolveConflicts } from './scheduler/backtracking';
import { assignRooms } from './scheduler/greedyRoom';
import type {
  SchedulerInput, SchedulerOutput,
  SchedulerFaculty, SchedulerSubject, SchedulerBatch,
} from './scheduler/types';

const SCHEDULER_TIMEOUT_MS = 30_000;

export function generateTimetable(input: SchedulerInput): SchedulerOutput {
  const startTime = Date.now();

  const guard = () => {
    if (Date.now() - startTime > SCHEDULER_TIMEOUT_MS) {
      throw new Error('Scheduler timed out after 30 seconds. Reduce input size or constraints.');
    }
  };

  const { batches, subjects, faculty, rooms, timeSlots, constraints } = input;

  // ── Index maps for O(1) lookups in downstream modules ──────────────────────
  const facultyMap  = new Map<string, SchedulerFaculty>(faculty.map((f) => [f.id, f]));
  const subjectMap  = new Map<string, SchedulerSubject>(subjects.map((s) => [s.id, s]));
  const batchMap    = new Map<string, SchedulerBatch>(batches.map((b) => [b.id, b]));

  // ── Step 1: Build MaxHeap (priority queue) ──────────────────────────────────
  guard();
  const heap = buildSubjectPriorityQueue(subjects, batches, faculty);

  if (heap.isEmpty()) {
    return { schedule: [], conflicts: [], isComplete: true };
  }

  // Snapshot nodes before popping (needed for backtracking)
  const allNodes = [];
  const heapCopy = buildSubjectPriorityQueue(subjects, batches, faculty);
  while (!heapCopy.isEmpty()) {
    allNodes.push(heapCopy.pop()!);
  }

  // ── Step 2: Build conflict graph ────────────────────────────────────────────
  guard();
  const graph = buildConflictGraph(allNodes);

  // ── Step 3: Graph coloring (slot assignment) ────────────────────────────────
  guard();
  const { colors, unresolved, order } = assignTimeSlots(
    heap,
    graph,
    timeSlots,
    facultyMap,
    constraints
  );

  // ── Step 4: Backtracking ────────────────────────────────────────────────────
  guard();
  let finalColors = colors;
  let slotConflicts: ReturnType<typeof resolveConflicts>['conflicts'] = [];

  if (unresolved.length > 0) {
    const bt = resolveConflicts(unresolved, order, colors, graph, timeSlots, constraints);
    finalColors  = bt.colors;
    slotConflicts = bt.conflicts;
  }

  // ── Step 5: Greedy room allocation ──────────────────────────────────────────
  guard();
  const { entries, conflicts: roomConflicts } = assignRooms(
    allNodes,
    finalColors,
    rooms,
    subjectMap,
    batchMap
  );

  // ── Step 6: Compile output ──────────────────────────────────────────────────
  const allConflicts = [...slotConflicts, ...roomConflicts];

  return {
    schedule:   entries,
    conflicts:  allConflicts,
    isComplete: allConflicts.length === 0,
  };
}
