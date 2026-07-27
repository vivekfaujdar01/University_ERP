/**
 * T4 — DSA Scheduler Types
 * All plain-object interfaces; no Mongoose dependencies inside dsa/.
 */

// ─── Input ────────────────────────────────────────────────────────────────────

export interface SchedulerSubject {
  id: string;
  name: string;
  credits: number;
  isLab: boolean;
  hoursPerWeek: number;
  programId: string;
  semester: number;
}

export interface SchedulerFaculty {
  id: string;
  subjectsAssigned: string[];   // subject IDs
  preferredSlots: string[];     // timeSlot IDs
  maxHoursPerDay: number;
}

export interface SchedulerBatch {
  id: string;
  programId: string;
  section: string;
  year: number;
  studentCount: number;
}

export interface SchedulerRoom {
  id: string;
  name: string;
  capacity: number;
  isLab: boolean;
}

export interface SchedulerTimeSlot {
  id: string;
  day: string;
  startTime: string;
  endTime: string;
  slotNumber: number;
  isLunchBreak: boolean;
}

export interface SchedulerConstraints {
  lunchBreakSlotIds: string[];
  maxHoursPerDayPerFaculty: number;
}

export interface SchedulerInput {
  batches: SchedulerBatch[];
  subjects: SchedulerSubject[];
  faculty: SchedulerFaculty[];
  rooms: SchedulerRoom[];
  timeSlots: SchedulerTimeSlot[];
  constraints: SchedulerConstraints;
}

// ─── Internal working node ────────────────────────────────────────────────────

/** A scheduling node = one (subject, batch, faculty) assignment needing a slot + room */
export interface ScheduleNode {
  nodeId: string;         // `${subjectId}::${batchId}::${facultyId}`
  subjectId: string;
  batchId: string;
  facultyId: string;
  priority: number;       // higher = schedule first
}

// ─── Output ───────────────────────────────────────────────────────────────────

export interface ScheduleEntry {
  subjectId: string;
  facultyId: string;
  batchId: string;
  roomId: string;
  timeSlotId: string;
}

export interface ConflictReport {
  type: 'teacher' | 'room' | 'batch' | 'capacity' | 'lab';
  description: string;
  involvedNodeIds: string[];
}

export interface SchedulerOutput {
  schedule: ScheduleEntry[];
  conflicts: ConflictReport[];
  isComplete: boolean;
}

// ─── Graph coloring state ─────────────────────────────────────────────────────

/** adjacency list: nodeId → Set of conflicting nodeIds */
export type ConflictGraph = Map<string, Set<string>>;

/** nodeId → assigned timeSlotId */
export type ColorAssignment = Map<string, string>;
