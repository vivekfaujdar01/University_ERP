/**
 * T4 — Backtracking conflict resolver
 *
 * When graph-coloring leaves unresolved nodes (no slot available), this module
 * walks back through the assignment order and tries alternative slot assignments.
 *
 * Strategy:
 *   For each unresolved node:
 *     1. Look at all previously assigned nodes that conflict with it
 *     2. Try to reassign the LOWEST-priority conflicting node to a different slot
 *     3. If that frees up a slot for the unresolved node → accept it
 *     4. If not possible within MAX_BACKTRACK_DEPTH → record as ConflictReport
 *
 * All operations are on plain maps — no database calls inside dsa/.
 */

import { MAX_BACKTRACK_DEPTH } from '../../config/constants';
import type {
  ScheduleNode, SchedulerTimeSlot, ConflictGraph,
  ColorAssignment, ConflictReport,
} from './types';

export interface BacktrackResult {
  colors: ColorAssignment;
  conflicts: ConflictReport[];
}

/**
 * resolveConflicts
 *
 * Mutates `colors` in-place (clones defensively first) and returns the updated
 * assignment plus any nodes that could not be resolved.
 */
export function resolveConflicts(
  unresolved: ScheduleNode[],
  _order: ScheduleNode[],           // nodes in the order they were originally assigned (reserved for future depth-limit optimisation)
  colors: ColorAssignment,
  graph: ConflictGraph,
  timeSlots: SchedulerTimeSlot[],
  constraints: { lunchBreakSlotIds: string[] }
): BacktrackResult {
  // Work on a copy so the caller's map is not mutated on failure
  const assignment = new Map(colors);

  const availableSlots = timeSlots.filter(
    (s) => !s.isLunchBreak && !constraints.lunchBreakSlotIds.includes(s.id)
  );

  const newConflicts: ConflictReport[] = [];

  for (const node of unresolved) {
    let resolved = false;
    let depth    = 0;

    // Slots already taken by this node's conflict neighbours
    const neighbours = graph.get(node.nodeId) ?? new Set<string>();

    // Try to find a slot by bumping a conflicting neighbour
    for (const neighbourId of neighbours) {
      if (depth >= MAX_BACKTRACK_DEPTH) break;
      depth++;

      const neighbourSlot = assignment.get(neighbourId);
      if (!neighbourSlot) continue;

      // Look for an alternative slot for the neighbour
      const neighbourNeighbours = graph.get(neighbourId) ?? new Set<string>();
      const neighbourUsed = new Set<string>();

      for (const nn of neighbourNeighbours) {
        if (nn !== node.nodeId) {
          const c = assignment.get(nn);
          if (c) neighbourUsed.add(c);
        }
      }

      let altSlot: string | null = null;
      for (const s of availableSlots) {
        if (!neighbourUsed.has(s.id) && s.id !== neighbourSlot) {
          altSlot = s.id;
          break;
        }
      }

      if (!altSlot) continue;

      // Reassign neighbour to altSlot
      assignment.set(neighbourId, altSlot);

      // Now check if node can take the freed slot
      const usedByNode = new Set<string>();
      for (const n of neighbours) {
        const c = assignment.get(n);
        if (c) usedByNode.add(c);
      }

      for (const s of availableSlots) {
        if (!usedByNode.has(s.id)) {
          assignment.set(node.nodeId, s.id);
          resolved = true;
          break;
        }
      }

      if (resolved) break;

      // Undo the neighbour reassignment if it didn't help
      assignment.set(neighbourId, neighbourSlot);
    }

    if (!resolved) {
      // Find which node in `order` this conflicts with for the report
      const conflictingNodeIds: string[] = [];
      for (const n of neighbours) {
        if (assignment.has(n)) conflictingNodeIds.push(n);
      }

      newConflicts.push({
        type: 'teacher',
        description: `Could not assign a time slot to node ${node.nodeId} after ${depth} backtrack attempts.`,
        involvedNodeIds: [node.nodeId, ...conflictingNodeIds],
      });
    }
  }

  return { colors: assignment, conflicts: newConflicts };
}
