import { Router } from 'express';
import { authenticate } from '../middleware/authenticate';
import { authorizeRoles } from '../middleware/authorizeRoles';
import {
  postGenerate, postPublish, getById,
  getByDept, getFaculty, getStudent,
  putOverride, getPdf,
} from '../controllers/timetableController';

const router = Router();

// eslint-disable-next-line @typescript-eslint/no-misused-promises
router.use(authenticate);

// Generate — super_admin or hod only
// eslint-disable-next-line @typescript-eslint/no-misused-promises
router.post('/generate', authorizeRoles('super_admin', 'hod'), postGenerate);

// Publish — super_admin or hod only
// eslint-disable-next-line @typescript-eslint/no-misused-promises
router.post('/:id/publish', authorizeRoles('super_admin', 'hod'), postPublish);

// Read — all authenticated roles
router.get('/by-dept', getByDept);
// eslint-disable-next-line @typescript-eslint/no-misused-promises
router.get('/faculty/:facultyId', getFaculty);
// eslint-disable-next-line @typescript-eslint/no-misused-promises
router.get('/student/:studentId', getStudent);
router.get('/:id/pdf', getPdf);
router.get('/:id', getById);

// Override — super_admin or hod only
// eslint-disable-next-line @typescript-eslint/no-misused-promises
router.put('/:id/override', authorizeRoles('super_admin', 'hod'), putOverride);

export default router;
