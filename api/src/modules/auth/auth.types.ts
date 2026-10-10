export type AccountRole = 'ADMIN' | 'SUPERADMIN' | 'USER';

export interface AuthAccountResponse {
  id: string;
  role: AccountRole;
  name: string;
  email: string;
  status: string;
  avatar?: string;
}

export interface AuthTokenResponse {
  account: AuthAccountResponse;
  accessToken: string;
  refreshToken: string;
}
