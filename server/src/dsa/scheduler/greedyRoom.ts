/**
 * T4 — Greedy Room Allocation
 *
 * After time slots are assigned, each scheduled node needs a room.
 *
 * Strategy (greedy — smallest valid room first):
 *   For each (node, assignedSlot) pair:
 *     1. Filter rooms: isLab matches subject.isLab
 *     2. Filter rooms: capacity >= batch.studentCount
 *     3. Filter rooms: not already occupied in this time slot
 *     4. Sort by capacity ascending (pack rooms tightly)
 *     5. Assign the first available room
 *     6. If none available → record a 'room' or 'capacity' conflict
 */

import type {
  ScheduleNode, SchedulerRoom, SchedulerSubject, SchedulerBatch,
  ColorAssignment, ScheduleEntry, ConflictReport,
} from './types';

export interface RoomAllocationResult {
  entries: ScheduleEntry[];
  conflicts: ConflictReport[];
}

export function assignRooms(
  nodes: ScheduleNode[],
  colors: ColorAssignment,
  rooms: SchedulerRoom[],
  subjectMap: Map<string, SchedulerSubject>,
  batchMap: Map<string, SchedulerBatch>
): RoomAllocationResult {
  const entries: ScheduleEntry[] = [];
  const conflicts: ConflictReport[] = [];

  // Track which rooms are occupied per slot: slotId → Set<roomId>
  const occupiedRooms = new Map<string, Set<string>>();

  // Sort nodes: process highest-priority first (same ordering as coloring)
  const sortedNodes = [...nodes].sort((a, b) => b.priority - a.priority);

  for (const node of sortedNodes) {
    const slotId = colors.get(node.nodeId);
    if (!slotId) continue; // unresolved node — no slot, skip

    const subject = subjectMap.get(node.subjectId);
    const batch   = batchMap.get(node.batchId);

    if (!subject || !batch) continue;

    // Rooms already taken in this slot
    if (!occupiedRooms.has(slotId)) {
      occupiedRooms.set(slotId, new Set());
    }
    const takenInSlot = occupiedRooms.get(slotId)!;

    // Filter: correct type + capacity + not occupied
    const candidates = rooms
      .filter((r) => r.isLab === subject.isLab)
      .filter((r) => r.capacity >= batch.studentCount)
      .filter((r) => !takenInSlot.has(r.id))
      .sort((a, b) => a.capacity - b.capacity); // smallest valid first

    if (candidates.length === 0) {
      // Determine conflict type for better reporting
      const anyCapacity = rooms
        .filter((r) => r.isLab === subject.isLab)
        .filter((r) => r.capacity >= batch.studentCount);

      const type: ConflictReport['type'] =
        anyCapacity.length === 0 ? 'capacity' : 'room';

      conflicts.push({
        type,
        description:
          type === 'capacity'
            ? `No ${subject.isLab ? 'lab' : 'classroom'} with capacity ≥ ${batch.studentCount} exists for node ${node.nodeId}.`
            : `All suitable rooms are occupied in slot ${slotId} for node ${node.nodeId}.`,
        involvedNodeIds: [node.nodeId],
      });
      continue;
    }

    const room = candidates[0];
    takenInSlot.add(room.id);

    entries.push({
      subjectId:  node.subjectId,
      facultyId:  node.facultyId,
      batchId:    node.batchId,
      roomId:     room.id,
      timeSlotId: slotId,
    });
  }

  return { entries, conflicts };
}
