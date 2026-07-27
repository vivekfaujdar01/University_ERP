import { Router } from 'express';
import multer from 'multer';
import { authenticate } from '../middleware/authenticate';
import { authorizeRoles } from '../middleware/authorizeRoles';
import { validate } from '../middleware/validate';
import { createUserSchema, updateUserSchema } from '../validators/structureSchemas';
import {
  getUsers,
  getUserById,
  postUser,
  putUser,
  removeUser,
  bulkImport,
  putFacultyProfile,
} from '../controllers/userController';
import { FILE_UPLOAD } from '../config/constants';

const router = Router();

// All user routes require authentication
// eslint-disable-next-line @typescript-eslint/no-misused-promises
router.use(authenticate);

const adminOnly = authorizeRoles('super_admin');

// Multer — in-memory storage for CSV parsing
const csvUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: FILE_UPLOAD.MAX_CSV_SIZE_MB * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (
      FILE_UPLOAD.ALLOWED_CSV_MIME_TYPES.includes(
        file.mimetype as (typeof FILE_UPLOAD.ALLOWED_CSV_MIME_TYPES)[number]
      ) ||
      file.originalname.endsWith('.csv')
    ) {
      cb(null, true);
    } else {
      cb(new Error('Only CSV files are allowed'));
    }
  },
});

// ─── User routes ──────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-misused-promises
router.get('/', adminOnly, getUsers);
// eslint-disable-next-line @typescript-eslint/no-misused-promises
router.post('/', adminOnly, validate(createUserSchema), postUser);
// eslint-disable-next-line @typescript-eslint/no-misused-promises
router.post('/bulk-import', adminOnly, csvUpload.single('file'), bulkImport);
// eslint-disable-next-line @typescript-eslint/no-misused-promises
router.get('/:id', adminOnly, getUserById);
// eslint-disable-next-line @typescript-eslint/no-misused-promises
router.put('/:id', adminOnly, validate(updateUserSchema), putUser);
// eslint-disable-next-line @typescript-eslint/no-misused-promises
router.delete('/:id', adminOnly, removeUser);

// Faculty profile — faculty/hod can update their own assigned subjects + preferred slots
// eslint-disable-next-line @typescript-eslint/no-misused-promises
router.put(
  '/:id/profile',
  authorizeRoles('super_admin', 'faculty', 'hod'),
  putFacultyProfile
);

export default router;
