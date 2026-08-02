import { Router } from 'express';
import { authenticate } from '../middleware/authenticate';
import { authorizeRoles } from '../middleware/authorizeRoles';
import {
  postMark,
  getFacultyMarkedSessions,
  getStudentSummary,
  getBatchReport,
  getBatchPdf,
  getDefaulters,
  postNotifyDefaulters,
} from '../controllers/attendanceController';

const router = Router();

// eslint-disable-next-line @typescript-eslint/no-misused-promises
router.use(authenticate);

// Mark attendance — faculty, hod, super_admin
// eslint-disable-next-line @typescript-eslint/no-misused-promises
router.post('/mark', authorizeRoles('faculty', 'hod', 'super_admin'), postMark);

// Get marked sessions for logged-in faculty on a date
// eslint-disable-next-line @typescript-eslint/no-misused-promises
router.get('/faculty-marked', authorizeRoles('faculty', 'hod', 'super_admin'), getFacultyMarkedSessions);

// Student attendance summary — student can only access their own record;
// faculty, hod, and super_admin can access any student's record.
// eslint-disable-next-line @typescript-eslint/no-misused-promises
router.get(
  '/student/:studentId/summary',
  authorizeRoles('student', 'faculty', 'hod', 'super_admin'),
  getStudentSummary
);

// HOD & Admin Batch Report
// eslint-disable-next-line @typescript-eslint/no-misused-promises
router.get('/batch/:batchId/report', authorizeRoles('hod', 'super_admin'), getBatchReport);

// HOD & Admin Batch PDF Report
// eslint-disable-next-line @typescript-eslint/no-misused-promises
router.get('/batch/:batchId/report/pdf', authorizeRoles('hod', 'super_admin', 'faculty'), getBatchPdf);

// HOD & Admin Defaulters List
// eslint-disable-next-line @typescript-eslint/no-misused-promises
router.get('/defaulters', authorizeRoles('hod', 'super_admin'), getDefaulters);

// HOD & Admin Trigger Email Warnings to Defaulters
// eslint-disable-next-line @typescript-eslint/no-misused-promises
router.post('/defaulters/notify', authorizeRoles('hod', 'super_admin'), postNotifyDefaulters);

export default router;
