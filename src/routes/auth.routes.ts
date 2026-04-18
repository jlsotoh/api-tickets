import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';

const router: Router = Router();

/**
 * POST /api/auth/token
 * Intercambia un API key por un JWT token
 * Requiere que la petición pase por el middleware validateApiKey
 */
router.post('/token', (_req: Request, res: Response): void => {
  const token = jwt.sign(
    { authorized: true, issuedAt: new Date().toISOString() },
    env.JWT_SECRET,
    { expiresIn: env.JWT_EXPIRATION as any }
  );

  res.json({
    token,
    type: 'Bearer',
    expiresIn: env.JWT_EXPIRATION,
  });
});

export default router;
