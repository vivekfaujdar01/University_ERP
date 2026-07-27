import { Request, Response } from 'express';
import { catchAsync } from '../utils/catchAsync';
import * as ttSvc from '../services/timetableService';
import { z } from 'zod';
import { AppError } from '../utils/AppError';

const generateSchema = z.object({
  departmentId: z.string().regex(/^[a-f\d]{24}$/i, 'Invalid department ID'),
  semester:     z.coerce.number().int().min(1).max(12),
  academicYear: z.string().regex(/^\d{4}-\d{2}$/, 'Format: YYYY-YY'),
});

export const postGenerate = catchAsync(async (req: Request, res: Response) => {
  const parsed = generateSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new AppError('Validation failed', 400, true,
      parsed.error.errors.map((e) => ({ field: e.path.join('.'), message: e.message }))
    );
  }
  const timetable = await ttSvc.generateAndSave(parsed.data, String(req.user!._id));
  res.status(201).json({ status: 'success', data: { timetable } });
});

export const postPublish = catchAsync(async (req: Request, res: Response) => {
  const timetable = await ttSvc.publishTimetable(
    req.params['id'] ?? '',
    String(req.user!._id)
  );
  res.status(200).json({ status: 'success', data: { timetable } });
});

export const getById = catchAsync(async (req: Request, res: Response) => {
  const timetable = await ttSvc.getTimetable(req.params['id'] ?? '');
  res.status(200).json({ status: 'success', data: { timetable } });
});

export const getByDept = catchAsync(async (req: Request, res: Response) => {
  const { departmentId, semester, academicYear } = req.query as Record<string, string>;
  const timetable = await ttSvc.getTimetableByDept(
    departmentId ?? '',
    Number(semester),
    academicYear ?? ''
  );
  res.status(200).json({ status: 'success', data: { timetable } });
});

export const getFaculty = catchAsync(async (req: Request, res: Response) => {
  const { academicYear } = req.query as Record<string, string>;
  const data = await ttSvc.getFacultyTimetable(
    req.params['facultyId'] ?? '',
    academicYear ?? ''
  );
  res.status(200).json({ status: 'success', data });
});

export const getStudent = catchAsync(async (req: Request, res: Response) => {
  const { academicYear } = req.query as Record<string, string>;
  const data = await ttSvc.getStudentTimetable(
    req.params['studentId'] ?? '',
    academicYear ?? ''
  );
  res.status(200).json({ status: 'success', data });
});

export const putOverride = catchAsync(async (req: Request, res: Response) => {
  const { entryIndex, timeSlotId, roomId } = req.body as {
    entryIndex: number; timeSlotId: string; roomId: string;
  };
  const timetable = await ttSvc.overrideEntry(
    req.params['id'] ?? '', { entryIndex, timeSlotId, roomId }
  );
  res.status(200).json({ status: 'success', data: { timetable } });
});

export const getPdf = catchAsync(async (req: Request, res: Response) => {
  const buffer = await ttSvc.getTimetablePdf(req.params['id'] ?? '');
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader('Content-Disposition', `attachment; filename="timetable-${req.params['id']}.pdf"`);
  res.send(buffer);
});
