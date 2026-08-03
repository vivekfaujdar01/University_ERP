import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { validate } from '../middleware/validate';
import { authenticate } from '../middleware/authenticate';
import { loginSchema, registerSchema } from '../validators/authSchemas';
import {
  loginHandler,
  registerHandler,
  refreshHandler,
  logoutHandler,
  getMeHandler,
} from '../controllers/authController';

const router = Router();

// Rate limiter for auth endpoints: 100 requests / 15 min per IP
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: {
    status: 'error',
    statusCode: 429,
    message: 'Too many attempts. Please try again in 15 minutes.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});


// eslint-disable-next-line @typescript-eslint/no-misused-promises
router.post('/login', authLimiter, validate(loginSchema), loginHandler);
// eslint-disable-next-line @typescript-eslint/no-misused-promises
router.post('/register', authLimiter, validate(registerSchema), registerHandler);
router.post('/refresh', refreshHandler);
router.post('/logout', logoutHandler);

// eslint-disable-next-line @typescript-eslint/no-misused-promises
router.get('/me', authenticate, getMeHandler);

export default router;
