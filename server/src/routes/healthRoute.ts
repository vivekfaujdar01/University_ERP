import { Router, Request, Response } from 'express';

const router = Router();

/**
 * GET /api/v1/health
 * Public endpoint used by load balancers and CI/CD pipelines to verify service health.
 */
router.get('/', (_req: Request, res: Response): void => {
  res.status(200).json({
    status: 'success',
    data: {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env['NODE_ENV'] ?? 'development',
    },
  });
});

export default router;
