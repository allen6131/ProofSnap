import type { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken';

import { env } from '../config/env';

type TokenClaims = {
  sub: string;
  plan?: 'free' | 'pro' | string;
  cloudBackupEnabled?: boolean;
  aiAssistQuota?: number;
};

const parseBool = (value: unknown, fallback: boolean): boolean => {
  if (typeof value === 'boolean') {
    return value;
  }
  return fallback;
};

const parseNumber = (value: unknown, fallback: number): number => {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  return fallback;
};

export const requireAuth = (req: Request, res: Response, next: NextFunction): void => {
  const authorization = req.header('authorization');
  if (!authorization?.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Missing or invalid Authorization header' });
    return;
  }

  const token = authorization.slice('Bearer '.length);

  try {
    const claims = jwt.verify(token, env.jwtSecret) as TokenClaims;
    if (!claims.sub) {
      res.status(401).json({ error: 'Token missing subject' });
      return;
    }

    const isPro = claims.plan === 'pro';
    req.auth = {
      userId: claims.sub,
      isPro,
      cloudBackupEnabled: parseBool(claims.cloudBackupEnabled, isPro),
      aiAssistQuota: parseNumber(
        claims.aiAssistQuota,
        isPro ? env.aiMonthlyQuotaPro : env.aiMonthlyQuotaFree,
      ),
    };
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
};
