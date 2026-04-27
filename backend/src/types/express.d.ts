import type { Request } from 'express';

export type AuthContext = {
  userId: string;
  isPro: boolean;
  cloudBackupEnabled: boolean;
  aiAssistQuota: number;
};

declare module 'express-serve-static-core' {
  interface Request {
    auth?: AuthContext;
  }
}

export type AuthenticatedRequest = Request & { auth: AuthContext };
