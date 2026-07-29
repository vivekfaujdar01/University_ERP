import { Request, Response } from 'express';
import { catchAsync } from '../utils/catchAsync';
import { AppError } from '../utils/AppError';
import * as attSvc from '../services/attendanceService';

/** Mark attendance for a lecture session */
export const postMark = catchAsync(async (req: Request, res: Response) => {
  const facultyId = req.user?._id ? String(req.user._id) : '';
  if (!facultyId) throw new AppError('Authentication required', 401);

  const doc = await attSvc.markAttendance(facultyId, req.body);
  res.status(201).json({ status: 'success', data: { attendance: doc } });
});

/** Get marked sessions for the logged-in faculty on a date */
export const getFacultyMarkedSessions = catchAsync(async (req: Request, res: Response) => {
  const facultyId = req.user?._id ? String(req.user._id) : '';
  const { date = new Date().toISOString().split('T')[0]! } = req.query as Record<string, string>;

  const sessions = await attSvc.getFacultyMarkedSessions(facultyId, date);
  res.status(200).json({ status: 'success', data: { sessions } });
});

/** Get student attendance summary */
export const getStudentSummary = catchAsync(async (req: Request, res: Response) => {
  const studentId = req.params['studentId'] ?? String(req.user?._id ?? '');
  const { academicYear = '2024-25' } = req.query as Record<string, string>;

  const summary = await attSvc.getStudentSummary(studentId, academicYear);
  res.status(200).json({ status: 'success', data: { summary } });
});

/** Get HOD batch attendance report */
export const getBatchReport = catchAsync(async (req: Request, res: Response) => {
  const batchId = req.params['batchId'] ?? '';
  const { academicYear = '2024-25', subjectId } = req.query as Record<string, string>;

  const report = await attSvc.getBatchReport(batchId, academicYear, subjectId);
  res.status(200).json({ status: 'success', data: { report } });
});

/** Download PDF report for batch attendance */
export const getBatchPdf = catchAsync(async (req: Request, res: Response) => {
  const batchId = req.params['batchId'] ?? '';
  const { academicYear = '2024-25' } = req.query as Record<string, string>;

  const pdfBuffer = await attSvc.generateBatchPdfReport(batchId, academicYear);
  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader(
    'Content-Disposition',
    `inline; filename="attendance-report-${batchId}.pdf"`
  );
  res.send(pdfBuffer);
});

/** Get defaulters list (<75%) */
export const getDefaulters = catchAsync(async (req: Request, res: Response) => {
  const { academicYear = '2024-25', batchId } = req.query as Record<string, string>;
  const defaulters = await attSvc.getDefaulters(academicYear, batchId);
  res.status(200).json({ status: 'success', data: { defaulters } });
});

/** Send warning emails to defaulters */
export const postNotifyDefaulters = catchAsync(async (req: Request, res: Response) => {
  const { academicYear = '2024-25' } = req.body as Record<string, string>;
  const result = await attSvc.checkDefaultersAndNotify(academicYear);
  res.status(200).json({ status: 'success', data: result });
});
