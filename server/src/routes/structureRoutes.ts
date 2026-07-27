import { Router } from 'express';
import { authenticate } from '../middleware/authenticate';
import { authorizeRoles } from '../middleware/authorizeRoles';
import { validate } from '../middleware/validate';
import {
  createDepartmentSchema, updateDepartmentSchema,
  createProgramSchema, updateProgramSchema,
  createBatchSchema, updateBatchSchema,
  createSubjectSchema, updateSubjectSchema,
  createRoomSchema, updateRoomSchema,
  createTimeSlotSchema, updateTimeSlotSchema,
} from '../validators/structureSchemas';
import {
  getDepartments, getDepartmentById, postDepartment, putDepartment, removeDepartment,
  getPrograms, getProgramById, postProgram, putProgram, removeProgram,
  getBatches, getBatchById, postBatch, putBatch, removeBatch,
  getSubjects, getSubjectById, postSubject, putSubject, removeSubject,
  getRooms, getRoomById, postRoom, putRoom, removeRoom,
  getTimeSlots, getTimeSlotById, postTimeSlot, putTimeSlot, removeTimeSlot,
} from '../controllers/structureController';

const router = Router();

// All structure routes require authentication
// eslint-disable-next-line @typescript-eslint/no-misused-promises
router.use(authenticate);

const adminOnly = authorizeRoles('super_admin');

// ─── Departments ──────────────────────────────────────────────────────────────
router.get('/departments', getDepartments);
router.get('/departments/:id', getDepartmentById);
// eslint-disable-next-line @typescript-eslint/no-misused-promises
router.post('/departments', adminOnly, validate(createDepartmentSchema), postDepartment);
// eslint-disable-next-line @typescript-eslint/no-misused-promises
router.put('/departments/:id', adminOnly, validate(updateDepartmentSchema), putDepartment);
// eslint-disable-next-line @typescript-eslint/no-misused-promises
router.delete('/departments/:id', adminOnly, removeDepartment);

// ─── Programs ─────────────────────────────────────────────────────────────────
router.get('/programs', getPrograms);
router.get('/programs/:id', getProgramById);
// eslint-disable-next-line @typescript-eslint/no-misused-promises
router.post('/programs', adminOnly, validate(createProgramSchema), postProgram);
// eslint-disable-next-line @typescript-eslint/no-misused-promises
router.put('/programs/:id', adminOnly, validate(updateProgramSchema), putProgram);
// eslint-disable-next-line @typescript-eslint/no-misused-promises
router.delete('/programs/:id', adminOnly, removeProgram);

// ─── Batches ──────────────────────────────────────────────────────────────────
router.get('/batches', getBatches);
router.get('/batches/:id', getBatchById);
// eslint-disable-next-line @typescript-eslint/no-misused-promises
router.post('/batches', adminOnly, validate(createBatchSchema), postBatch);
// eslint-disable-next-line @typescript-eslint/no-misused-promises
router.put('/batches/:id', adminOnly, validate(updateBatchSchema), putBatch);
// eslint-disable-next-line @typescript-eslint/no-misused-promises
router.delete('/batches/:id', adminOnly, removeBatch);

// ─── Subjects ─────────────────────────────────────────────────────────────────
router.get('/subjects', getSubjects);
router.get('/subjects/:id', getSubjectById);
// eslint-disable-next-line @typescript-eslint/no-misused-promises
router.post('/subjects', adminOnly, validate(createSubjectSchema), postSubject);
// eslint-disable-next-line @typescript-eslint/no-misused-promises
router.put('/subjects/:id', adminOnly, validate(updateSubjectSchema), putSubject);
// eslint-disable-next-line @typescript-eslint/no-misused-promises
router.delete('/subjects/:id', adminOnly, removeSubject);

// ─── Rooms ────────────────────────────────────────────────────────────────────
router.get('/rooms', getRooms);
router.get('/rooms/:id', getRoomById);
// eslint-disable-next-line @typescript-eslint/no-misused-promises
router.post('/rooms', adminOnly, validate(createRoomSchema), postRoom);
// eslint-disable-next-line @typescript-eslint/no-misused-promises
router.put('/rooms/:id', adminOnly, validate(updateRoomSchema), putRoom);
// eslint-disable-next-line @typescript-eslint/no-misused-promises
router.delete('/rooms/:id', adminOnly, removeRoom);

// ─── TimeSlots ────────────────────────────────────────────────────────────────
router.get('/timeslots', getTimeSlots);
router.get('/timeslots/:id', getTimeSlotById);
// eslint-disable-next-line @typescript-eslint/no-misused-promises
router.post('/timeslots', adminOnly, validate(createTimeSlotSchema), postTimeSlot);
// eslint-disable-next-line @typescript-eslint/no-misused-promises
router.put('/timeslots/:id', adminOnly, validate(updateTimeSlotSchema), putTimeSlot);
// eslint-disable-next-line @typescript-eslint/no-misused-promises
router.delete('/timeslots/:id', adminOnly, removeTimeSlot);

export default router;
