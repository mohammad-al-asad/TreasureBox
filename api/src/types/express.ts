import { AuthAccount, AuthRole } from '../middlewares/auth.middleware';

declare global {
  namespace Express {
    interface Request {
      account?: AuthAccount;
      auth?: {
        accountId: string;
        role: AuthRole;
      };
    }
  }
}

export {};
