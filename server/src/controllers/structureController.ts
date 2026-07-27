import { Request, Response } from 'express';
import { catchAsync } from '../utils/catchAsync';
import * as svc from '../services/structureService';
import { listQuerySchema } from '../validators/structureSchemas';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function parseListQuery(req: Request) {
  return listQuerySchema.parse({ ...req.query });
}

function sendList(res: Response, result: { items: unknown[]; total: number; page: number; limit: number }): void {
  res.status(200).json({ status: 'success', data: result });
}

function sendOne(res: Response, data: unknown, status = 200): void {
  res.status(status).json({ status: 'success', data });
}

function id(req: Request): string {
  return req.params['id'] ?? '';
}

// ─── Departments ──────────────────────────────────────────────────────────────

export const getDepartments = catchAsync(async (req, res) => { sendList(res, await svc.listDepartments(parseListQuery(req))); });
export const getDepartmentById = catchAsync(async (req, res) => { sendOne(res, await svc.getDepartment(id(req))); });
export const postDepartment = catchAsync(async (req, res) => { sendOne(res, await svc.createDepartment(req.body as Parameters<typeof svc.createDepartment>[0]), 201); });
export const putDepartment = catchAsync(async (req, res) => { sendOne(res, await svc.updateDepartment(id(req), req.body as Parameters<typeof svc.updateDepartment>[1])); });
export const removeDepartment = catchAsync(async (req, res) => { await svc.deleteDepartment(id(req)); res.status(204).send(); });

// ─── Programs ─────────────────────────────────────────────────────────────────

export const getPrograms = catchAsync(async (req, res) => { sendList(res, await svc.listPrograms(parseListQuery(req))); });
export const getProgramById = catchAsync(async (req, res) => { sendOne(res, await svc.getProgram(id(req))); });
export const postProgram = catchAsync(async (req, res) => { sendOne(res, await svc.createProgram(req.body as Parameters<typeof svc.createProgram>[0]), 201); });
export const putProgram = catchAsync(async (req, res) => { sendOne(res, await svc.updateProgram(id(req), req.body as Parameters<typeof svc.updateProgram>[1])); });
export const removeProgram = catchAsync(async (req, res) => { await svc.deleteProgram(id(req)); res.status(204).send(); });

// ─── Batches ──────────────────────────────────────────────────────────────────

export const getBatches = catchAsync(async (req, res) => { sendList(res, await svc.listBatches(parseListQuery(req))); });
export const getBatchById = catchAsync(async (req, res) => { sendOne(res, await svc.getBatch(id(req))); });
export const postBatch = catchAsync(async (req, res) => { sendOne(res, await svc.createBatch(req.body as Parameters<typeof svc.createBatch>[0]), 201); });
export const putBatch = catchAsync(async (req, res) => { sendOne(res, await svc.updateBatch(id(req), req.body as Parameters<typeof svc.updateBatch>[1])); });
export const removeBatch = catchAsync(async (req, res) => { await svc.deleteBatch(id(req)); res.status(204).send(); });

// ─── Subjects ─────────────────────────────────────────────────────────────────

export const getSubjects = catchAsync(async (req, res) => { sendList(res, await svc.listSubjects(parseListQuery(req))); });
export const getSubjectById = catchAsync(async (req, res) => { sendOne(res, await svc.getSubject(id(req))); });
export const postSubject = catchAsync(async (req, res) => { sendOne(res, await svc.createSubject(req.body as Parameters<typeof svc.createSubject>[0]), 201); });
export const putSubject = catchAsync(async (req, res) => { sendOne(res, await svc.updateSubject(id(req), req.body as Parameters<typeof svc.updateSubject>[1])); });
export const removeSubject = catchAsync(async (req, res) => { await svc.deleteSubject(id(req)); res.status(204).send(); });

// ─── Rooms ────────────────────────────────────────────────────────────────────

export const getRooms = catchAsync(async (req, res) => { sendList(res, await svc.listRooms(parseListQuery(req))); });
export const getRoomById = catchAsync(async (req, res) => { sendOne(res, await svc.getRoom(id(req))); });
export const postRoom = catchAsync(async (req, res) => { sendOne(res, await svc.createRoom(req.body as Parameters<typeof svc.createRoom>[0]), 201); });
export const putRoom = catchAsync(async (req, res) => { sendOne(res, await svc.updateRoom(id(req), req.body as Parameters<typeof svc.updateRoom>[1])); });
export const removeRoom = catchAsync(async (req, res) => { await svc.deleteRoom(id(req)); res.status(204).send(); });

// ─── TimeSlots ────────────────────────────────────────────────────────────────

export const getTimeSlots = catchAsync(async (req, res) => { sendList(res, await svc.listTimeSlots(parseListQuery(req))); });
export const getTimeSlotById = catchAsync(async (req, res) => { sendOne(res, await svc.getTimeSlot(id(req))); });
export const postTimeSlot = catchAsync(async (req, res) => { sendOne(res, await svc.createTimeSlot(req.body as Parameters<typeof svc.createTimeSlot>[0]), 201); });
export const putTimeSlot = catchAsync(async (req, res) => { sendOne(res, await svc.updateTimeSlot(id(req), req.body as Parameters<typeof svc.updateTimeSlot>[1])); });
export const removeTimeSlot = catchAsync(async (req, res) => { await svc.deleteTimeSlot(id(req)); res.status(204).send(); });
