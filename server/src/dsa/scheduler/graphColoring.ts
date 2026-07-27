/**
 * T4 — Graph Coloring: conflict graph construction + time-slot assignment
 *
 * Algorithm:
 *   1. Build a conflict graph — two nodes conflict if they share faculty, batch, or room
 *   2. Pop nodes from the MaxHeap (highest priority first)
 *   3. For each node, find all colors (slot IDs) used by its conflict-neighbours
 *   4. Assign the first available preferred slot, otherwise the first non-conflicting slot
 *   5. If no slot available → return null (caller triggers backtracking)
 */

import type {
  ScheduleNode, SchedulerTimeSlot, SchedulerFaculty,
  ConflictGraph, ColorAssignment,
} from './types';
import type { MaxHeap } from './heap';

// ─── Build conflict graph ─────────────────────────────────────────────────────

/**
 * Two nodes conflict if they share:
 *   - same facultyId  (teacher can't teach two classes simultaneously)
 *   - same batchId    (batch can't attend two classes simultaneously)
 *
 * Room conflicts are handled later in greedyRoom.ts (not at slot-assignment time).
 */
export function buildConflictGraph(nodes: ScheduleNode[]): ConflictGraph {
  const graph: ConflictGraph = new Map();

  // Initialise adjacency sets
  for (const node of nodes) {
    graph.set(node.nodeId, new Set());
  }

  // O(n²) edge construction — acceptable for typical university schedule sizes
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const a = nodes[i];
      const b = nodes[j];

      const conflicts =
        a.facultyId === b.facultyId ||
        a.batchId   === b.batchId;

      if (conflicts) {
        graph.get(a.nodeId)!.add(b.nodeId);
        graph.get(b.nodeId)!.add(a.nodeId);
      }
    }
  }

  return graph;
}

// ─── Assign time slots ────────────────────────────────────────────────────────

/**
 * assignTimeSlots
 *
 * Pops nodes from the MaxHeap one by one (highest priority first).
 * For each node:
 *   - Collects slots already used by conflicting neighbours
 *   - Tries faculty preferred slots first (soft constraint)
 *   - Falls back to any non-conflicting, non-lunch-break slot
 *   - If no slot found → adds node to `unresolved` list for backtracking
 *
 * Returns:
 *   colors      — nodeId → timeSlotId assignment
 *   unresolved  — nodes that couldn't be assigned (input to backtracking)
 *   order       — the sequence nodes were popped (needed for backtracking)
 */
export function assignTimeSlots(
  heap: MaxHeap<ScheduleNode>,
  graph: ConflictGraph,
  timeSlots: SchedulerTimeSlot[],
  facultyMap: Map<string, SchedulerFaculty>,
  constraints: { lunchBreakSlotIds: string[] }
): {
  colors: ColorAssignment;
  unresolved: ScheduleNode[];
  order: ScheduleNode[];
} {
  const colors: ColorAssignment = new Map();
  const unresolved: ScheduleNode[] = [];
  const order: ScheduleNode[] = [];

  // Pre-filter available slots (exclude lunch breaks)
  const availableSlots = timeSlots.filter(
    (s) => !s.isLunchBreak && !constraints.lunchBreakSlotIds.includes(s.id)
  );

  while (!heap.isEmpty()) {
    const node = heap.pop()!;
    order.push(node);

    // Colours used by neighbours
    const usedColors = new Set<string>();
    const neighbours = graph.get(node.nodeId) ?? new Set<string>();
    for (const neighbourId of neighbours) {
      const c = colors.get(neighbourId);
      if (c) usedColors.add(c);
    }

    // Try preferred slots first
    const faculty = facultyMap.get(node.facultyId);
    const preferred = faculty?.preferredSlots ?? [];

    let assigned: string | null = null;

    for (const slotId of preferred) {
      if (!usedColors.has(slotId) && availableSlots.some((s) => s.id === slotId)) {
        assigned = slotId;
        break;
      }
    }

    // Fall back to any available slot
    if (!assigned) {
      for (const slot of availableSlots) {
        if (!usedColors.has(slot.id)) {
          assigned = slot.id;
          break;
        }
      }
    }

    if (assigned) {
      colors.set(node.nodeId, assigned);
    } else {
      unresolved.push(node);
    }
  }

  return { colors, unresolved, order };
}
