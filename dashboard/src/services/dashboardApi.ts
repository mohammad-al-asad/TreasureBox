/**
 * Centralized Dashboard API Client for TreasureBox
 * Communicates with the Express action-oriented backend endpoints
 * Automatically attaches Authorization headers and provides local auth storage.
 */

const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api/v1';

export const resolveMediaUrl = (pathOrUrl?: string | null): string => {
  if (!pathOrUrl) return '';
  if (
    pathOrUrl.startsWith('http://') ||
    pathOrUrl.startsWith('https://') ||
    pathOrUrl.startsWith('data:') ||
    pathOrUrl.startsWith('blob:')
  ) {
    return pathOrUrl;
  }
  // Mobile device local file paths cannot be resolved by web dashboard and should not be fetched from backend
  if (
    pathOrUrl.startsWith('file://') ||
    pathOrUrl.startsWith('content://') ||
    pathOrUrl.startsWith('ph://')
  ) {
    return '';
  }
  const baseUrl = API_BASE_URL.replace(/\/api\/v1\/?$/, '');
  const cleanPath = pathOrUrl.replace(/^\//, '');
  return `${baseUrl}/${cleanPath}`;
};

const TOKEN_KEY = 'treasurebox_operator_token';
const USER_KEY = 'treasurebox_operator_user';

export const getStoredToken = (): string | null => {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(TOKEN_KEY);
};

export const setStoredAuth = (token: string, user: AuthUserDto) => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
};

export const clearStoredAuth = () => {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
};

export const getStoredUser = (): AuthUserDto | null => {
  if (typeof window === 'undefined') return null;
  const user = localStorage.getItem(USER_KEY);
  return user ? JSON.parse(user) : null;
};

async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  const token = getStoredToken();
  const headers: Record<string, string> = {
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...((options.headers as Record<string, string>) || {}),
  };

  if (!(options.body instanceof FormData) && !headers['Content-Type']) {
    headers['Content-Type'] = 'application/json';
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    let errorMsg =
      data?.message || `HTTP ${response.status}: Failed to execute request on ${endpoint}`;
    if (Array.isArray(data?.errors) && data.errors.length > 0) {
      const detailedErrors = data.errors
        .map((err: { field?: string; message?: string }) =>
          err.field ? `${err.field}: ${err.message}` : (err.message || String(err))
        )
        .join(' | ');
      errorMsg = `${data.message || 'Validation Error'}: ${detailedErrors}`;
    }
    throw new Error(errorMsg);
  }

  return data?.data ?? data;
}

export interface AuthUserDto {
  id: string;
  name: string;
  email: string;
  role: 'ADMIN' | 'SUPERADMIN' | 'USER';
  status: string;
  avatar?: string;
}

export interface AdminUserDto {
  _id: string;
  id?: string;
  name: string;
  email: string;
  avatar?: string;
  role: 'ADMIN' | 'SUPERADMIN';
  status: 'ACTIVE' | 'DISABLED';
  permissions?: string[];
  createdAt: string;
  updatedAt?: string;
}

export interface AuthResponseDto {
  accessToken?: string;
  refreshToken?: string;
  account: AuthUserDto;
  tokens?: {
    accessToken: string;
    refreshToken: string;
  };
}

export interface CategoryDto {
  _id: string;
  name: string;
  slug: string;
  description?: string;
  isActive?: boolean;
}

export interface CabinetHuntDto {
  _id?: string;
  id?: string;
  titleEn: string;
  titleAr?: string;
  descriptionEn?: string;
  descriptionAr?: string;
  price: number;
  difficulty: 'EASY' | 'MEDIUM' | 'HARD';
  status: 'LIVE' | 'DRAFT' | 'IN_PROGRESS' | 'FOUND';
  category?: {
    _id: string;
    name: string;
    slug: string;
  } | string;
  categoryName?: string;
  capitalWorth?: string;
  activeHunter?: {
    hunterName: string;
    hunterEmail: string;
    startedAt: string;
  };
  spotImage?: string;
  images?: string[];
  videos?: Array<{
    url: string;
    description?: string;
  }>;
  hints?: Array<{
    _id?: string;
    titleEn?: string;
    titleAr?: string;
    bodyEn?: string;
    bodyAr?: string;
    description?: string;
    imageUrl?: string;
    mediaUrl?: string;
    mediaType?: 'image' | 'video';
    order: number;
  }>;

  cipher?: {
    barrelCount: number;
    targetSequence?: string;
    initialState: string[];
    cipherHintEn: string;
    cipherHintAr: string;
    cipherHintImage?: string;
  };
  stageOne?: {
    coordinates: { latitude: number; longitude: number };
    locationNameEn: string;
    locationNameAr: string;
  };
  stageTwo?: {
    coordinates: { latitude: number; longitude: number };
    locationNameEn: string;
    locationNameAr: string;
  };
  createdAt?: string;
}

export interface ClaimRecordDto {
  _id?: string;
  id?: string;
  huntId: {
    _id: string;
    titleEn: string;
    price: number;
    difficulty?: string;
    stageOne?: {
      coordinates?: { latitude: number; longitude: number };
      locationNameEn?: string;
      locationNameAr?: string;
    };
    stageTwo?: {
      coordinates?: { latitude: number; longitude: number };
      locationNameEn?: string;
      locationNameAr?: string;
    };
  } | string;
  hunterName: string;
  hunterEmail: string;
  proofPhotoUrl: string;
  status: 'PENDING_REVIEW' | 'VERIFIED' | 'REJECTED';
  submittedAt: string;
  reviewedAt?: string;
  reviewerNotes?: string;
}

export interface HunterUserDto {
  _id?: string;
  id?: string;
  name: string;
  email: string;
  avatar: string;
  phone?: string;
  boughtCount: number;
  solvedCount: number;
  revenue: number;
  role?: string;
  status: 'Active' | 'Suspended';
  joinedDate: string;
  recentHunts?: Array<{
    title: string;
    status: 'In Progress' | 'Solved' | 'Abandoned';
    date: string;
    amount: number;
  }>;
}

export interface TransactionDto {
  _id: string;
  paypalOrderId: string;
  paypalCaptureId?: string;
  huntId: {
    _id: string;
    titleEn: string;
    price: number;
  } | string;
  hunterName: string;
  hunterEmail: string;
  amount: number;
  currency: string;
  status: 'COMPLETED' | 'PENDING' | 'FAILED';
  createdAt: string;
}

export interface OverviewMetricsDto {
  totalRevenue: number;
  activeHuntsCount: number;
  inProgressHuntsCount?: number;
  pendingClaimsCount: number;
  foundHuntsCount: number;
  totalHuntsCount: number;
  recentClaims: unknown[];
  recentPayments: unknown[];
}

export interface LegalDocDto {
  type: 'TERMS' | 'PRIVACY' | 'ABOUT';
  title: string;
  content: string;
}

export interface ContactSettingsDto {
  whatsapp: string;
  telegram: string;
  instagram?: string;
  twitter?: string;
  tiktok?: string;
  email: string;
  phone: string;
  workingHoursEn?: string;
  workingHoursAr?: string;
  addressEn?: string;
  addressAr?: string;
}

export interface NotificationItemDto {
  _id: string;
  title: string;
  message?: string;
  body?: string;
  createdAt: string;
  type?: string;
  read?: boolean;
  metadata?: Record<string, unknown>;
}

export interface PaginatedNotificationsDto {
  data: NotificationItemDto[];
  total: number;
  page: number;
  totalPages: number;
  limit: number;
}


export const dashboardApi = {
  // --- Authentication ---
  login: (payload: { email: string; password: string; role?: string }) =>
    request<AuthResponseDto>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ ...payload, role: payload.role || 'ADMIN' }),
    }),

  getMe: () => request<AuthUserDto>('/auth/me'),

  logout: () =>
    request<{ success: boolean }>('/auth/logout', {
      method: 'POST',
    }),

  sendForgotPasswordOtp: (email: string, role: string = 'ADMIN') =>
    request<{ email: string; expiresInMinutes: number; message: string }>('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email, role }),
    }),

  verifyResetOtp: (email: string, otp: string, role: string = 'ADMIN') =>
    request<{ email: string; verified: boolean; message: string }>('/auth/verify-reset-otp', {
      method: 'POST',
      body: JSON.stringify({ email, otp, role }),
    }),

  resetPassword: (payload: { email: string; otp: string; newPassword: string; role?: string }) =>
    request<{ success: boolean; message: string }>('/auth/reset-password', {
      method: 'POST',
      body: JSON.stringify({ ...payload, role: payload.role || 'ADMIN' }),
    }),

  changePassword: (payload: { currentPassword: string; newPassword: string }) =>
    request<{ success: boolean; message: string }>('/auth/change-password', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  updateMyProfile: (payload: { name: string; avatar?: string }) =>
    request<AuthUserDto>('/auth/update-my-profile', {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),

  uploadProfileImage: (formData: FormData) =>
    request<{ avatar: string; account: AuthUserDto }>('/auth/upload-profile-image', {
      method: 'POST',
      body: formData,
    }),

  // --- Operator / Admin Management ---
  getAllAdmins: () =>
    request<AdminUserDto[]>('/admin/get-all-admins'),

  createNewAdmin: (payload: {
    name: string;
    email: string;
    password: string;
    role?: 'ADMIN' | 'SUPERADMIN';
  }) =>
    request<AdminUserDto>('/admin/create-new-admin', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  toggleAdminStatus: (adminId: string) =>
    request<AdminUserDto>(`/admin/toggle-admin-status/${adminId}`, {
      method: 'PATCH',
    }),

  deleteAdmin: (adminId: string) =>
    request<{ success: boolean; message: string }>(`/admin/delete-admin/${adminId}`, {
      method: 'DELETE',
    }),

  // --- Overview ---
  getOverviewMetrics: () =>
    request<OverviewMetricsDto>('/dashboard/get-overview-metrics'),

  // --- Expeditions (Cabinet Hunts) ---
  getAllCabinetHunts: (status?: string) => {
    const query = status && status !== 'ALL' ? `?status=${encodeURIComponent(status)}` : '';
    return request<CabinetHuntDto[]>(`/hunts/get-all-cabinet-hunts${query}`);
  },

  getCabinetHuntById: (huntId: string) =>
    request<CabinetHuntDto>(`/hunts/get-cabinet-hunt-by-id/${huntId}`),

  createHunt: (payload: Partial<CabinetHuntDto>) =>
    request<CabinetHuntDto>('/hunts/create-new-hunt', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  updateHunt: (huntId: string, payload: Partial<CabinetHuntDto>) =>
    request<CabinetHuntDto>(`/hunts/update-hunt-details/${huntId}`, {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),

  deleteHunt: (huntId: string) =>
    request<{ success: boolean; message: string }>(`/hunts/delete-hunt/${huntId}`, {
      method: 'DELETE',
    }),

  uploadMediaFile: async (file: File): Promise<{ filePath: string; url: string }> => {
    const formData = new FormData();
    formData.append('file', file);
    const token = getStoredToken();
    const res = await fetch(`${API_BASE_URL}/hunts/upload-media-file`, {
      method: 'POST',
      headers: {
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: formData,
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.message || 'Failed to upload media file');
    }
    return data.data;
  },

  // --- Claims Register ---
  getAllClaimsRegister: (status?: string) => {
    const query = status && status !== 'ALL' ? `?status=${encodeURIComponent(status)}` : '';
    return request<ClaimRecordDto[]>(`/claims/get-all-claims-register${query}`);
  },

  verifyOrRejectClaim: (payload: {
    claimId: string;
    status: 'VERIFIED' | 'REJECTED';
    reviewNotes?: string;
  }) =>
    request<ClaimRecordDto>('/claims/verify-or-reject-claim', {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),

  // --- Hunter Users ---
  getAllUsers: (search?: string, status?: string) => {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (status && status !== 'ALL') params.append('status', status);
    const qs = params.toString() ? `?${params.toString()}` : '';
    return request<HunterUserDto[]>(`/users/get-all-users${qs}`);
  },

  toggleUserStatus: (userId: string) =>
    request<HunterUserDto>(`/users/toggle-user-status/${userId}`, {
      method: 'PATCH',
    }),

  resetUserAccess: (email: string) =>
    request<{ success: boolean; message: string }>('/users/reset-user-access', {
      method: 'POST',
      body: JSON.stringify({ email }),
    }),

  revokeUserRecord: (userId: string) =>
    request<{ success: boolean; message: string }>(`/users/revoke-user-record/${userId}`, {
      method: 'DELETE',
    }),

  // --- Settings / Legal Docs ---
  getLegalDoc: (type: 'TERMS' | 'PRIVACY' | 'ABOUT') =>
    request<LegalDocDto>(`/settings/get-legal-document/${type}`),

  updateLegalDoc: (payload: { type: 'TERMS' | 'PRIVACY' | 'ABOUT'; content: string }) =>
    request<LegalDocDto>('/settings/update-legal-document', {
      method: 'PUT',
      body: JSON.stringify(payload),
    }),

  // --- Contact & Social Channels ---
  getContactSettings: () =>
    request<ContactSettingsDto>('/settings/get-contact-settings'),

  updateContactSettings: (payload: Partial<ContactSettingsDto>) =>
    request<ContactSettingsDto>('/settings/update-contact-settings', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  // --- Payments / Transactions ---
  getAllPaymentTransactions: () =>
    request<TransactionDto[]>('/payments/get-all-payment-transactions'),

  // --- Notifications ---
  getNotifications: (page: number = 1, limit: number = 20): Promise<PaginatedNotificationsDto> => {
    const params = new URLSearchParams({ page: String(page), limit: String(limit) });
    return request<PaginatedNotificationsDto>(`/notifications/get-all-notifications?${params.toString()}`);
  },

  // --- Categories ---
  getAllCategories: () =>
    request<CategoryDto[]>('/categories/get-all-categories'),

  createCategory: (payload: { name: string; slug: string; description?: string }) =>
    request<CategoryDto>('/categories/create-new-category', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
};

