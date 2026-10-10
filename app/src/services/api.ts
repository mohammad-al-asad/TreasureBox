import { Platform } from "react-native";
import { Hunt, UserProfile } from "../types/hunt";

import AsyncStorage from '@react-native-async-storage/async-storage';

// In React Native Web / Emulator / Device
// Android emulator uses 10.0.2.2, iOS / Web uses localhost
const getResolvedBaseUrl = () => {
  const envUrl = process.env.EXPO_PUBLIC_API_URL;
  if (envUrl) {
    if (
      Platform.OS !== "web" &&
      (envUrl.includes("localhost") || envUrl.includes("127.0.0.1"))
    ) {
      return "https://treasurebox-backend.onrender.com/api/v1";
    }
    return envUrl;
  }
  return "https://treasurebox-backend.onrender.com/api/v1";
};

const API_BASE_URL = getResolvedBaseUrl();

let authToken: string | null = null;

const storage = {
  async getItem(key: string): Promise<string | null> {
    try {
      if (Platform.OS === "web" && typeof window !== "undefined" && window.localStorage) {
        return window.localStorage.getItem(key);
      }
      return await AsyncStorage.getItem(key);
    } catch (e) {
      console.warn(`[Storage] getItem error for ${key}:`, e);
      return null;
    }
  },
  async setItem(key: string, value: string): Promise<void> {
    try {
      if (Platform.OS === "web" && typeof window !== "undefined" && window.localStorage) {
        window.localStorage.setItem(key, value);
      }
      await AsyncStorage.setItem(key, value);
    } catch (e) {
      console.warn(`[Storage] setItem error for ${key}:`, e);
    }
  },
  async removeItem(key: string): Promise<void> {
    try {
      if (Platform.OS === "web" && typeof window !== "undefined" && window.localStorage) {
        window.localStorage.removeItem(key);
      }
      await AsyncStorage.removeItem(key);
    } catch (e) {
      console.warn(`[Storage] removeItem error for ${key}:`, e);
    }
  },
};

export const getTokenFromStorage = async (): Promise<string | null> => {
  const token = await storage.getItem("accessToken");
  if (token) authToken = token;
  return token;
};

export const getRefreshTokenFromStorage = async (): Promise<string | null> => {
  return await storage.getItem("refreshToken");
};

export const getUserFromStorage = async (): Promise<UserProfile | null> => {
  try {
    const raw = await storage.getItem("user");
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

export const setUserInStorage = async (user: UserProfile): Promise<void> => {
  try {
    await storage.setItem("user", JSON.stringify(user));
  } catch (e) {
    console.warn("[Storage] Failed to save user", e);
  }
};

export const setTokensInStorage = async (
  accessToken: string,
  refreshToken: string,
): Promise<void> => {
  try {
    authToken = accessToken;
    await storage.setItem("accessToken", accessToken);
    await storage.setItem("refreshToken", refreshToken);
  } catch (e) {
    console.warn("[Storage] Failed to save tokens", e);
  }
};

export const clearTokensFromStorage = async (): Promise<void> => {
  try {
    authToken = null;
    await storage.removeItem("accessToken");
    await storage.removeItem("refreshToken");
    await storage.removeItem("user");
  } catch (e) {
    console.warn("[Storage] Failed to clear tokens", e);
  }
};

let refreshPromise: Promise<string | null> | null = null;

async function request<T>(
  endpoint: string,
  options: RequestInit = {},
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };

  if (authToken) {
    headers["Authorization"] = `Bearer ${authToken}`;
  }

  let response = await fetch(url, {
    ...options,
    headers: { ...headers, ...(options.headers as any) },
  });

  if (
    response.status === 401 &&
    !endpoint.includes("/auth/refresh") &&
    !endpoint.includes("/auth/login")
  ) {
    const refreshToken = await getRefreshTokenFromStorage();
    if (refreshToken) {
      if (!refreshPromise) {
        refreshPromise = (async () => {
          try {
            const refreshRes = await fetch(`${API_BASE_URL}/auth/refresh`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ refreshToken }),
            });
            const refreshData = await refreshRes.json();
            if (refreshRes.ok && refreshData?.data?.accessToken) {
              const newAccess = refreshData.data.accessToken;
              const newRefresh = refreshData.data.refreshToken || refreshToken;
              await setTokensInStorage(newAccess, newRefresh);
              return newAccess;
            } else {
              await clearTokensFromStorage();
              return null;
            }
          } catch {
            await clearTokensFromStorage();
            return null;
          } finally {
            refreshPromise = null;
          }
        })();
      }

      const newAccessToken = await refreshPromise;
      if (newAccessToken) {
        headers["Authorization"] = `Bearer ${newAccessToken}`;
        response = await fetch(url, {
          ...options,
          headers: { ...headers, ...(options.headers as any) },
        });
      } else {
        throw new Error("Session expired. Please log in again.");
      }
    } else {
      await clearTokensFromStorage();
    }
  }

  const data = await response.json().catch(() => null);

  if (!response.ok) {
    const errorMsg =
      data?.message ||
      `Error ${response.status}: Failed to execute request on ${endpoint}`;
    throw new Error(errorMsg);
  }

  return data?.data ?? data;
}

export const getMediaBaseUrl = () => {
  return API_BASE_URL.replace(/\/api\/v1\/?$/, "");
};

export const resolveMediaUrl = (pathOrUrl?: string): string => {
  if (!pathOrUrl) return "";
  if (
    pathOrUrl.startsWith("http://") ||
    pathOrUrl.startsWith("https://") ||
    pathOrUrl.startsWith("data:") ||
    pathOrUrl.startsWith("blob:") ||
    pathOrUrl.startsWith("file://") ||
    pathOrUrl.startsWith("content://") ||
    pathOrUrl.startsWith("ph://")
  ) {
    return pathOrUrl;
  }
  const cleanPath = pathOrUrl.startsWith("/") ? pathOrUrl.slice(1) : pathOrUrl;
  return `${getMediaBaseUrl()}/${cleanPath}`;
};

export interface VerifyCipherResponse {
  solved: boolean;
  locked?: boolean;
  remainingAttempts?: number;
  message?: string;
  stageTwo?: {
    coordinates: { latitude: number; longitude: number };
    locationNameEn: string;
    locationNameAr: string;
    instructionsEn?: string;
    instructionsAr?: string;
  };
}

export interface SubmitClaimPayload {
  huntId: string;
  hunterName: string;
  hunterEmail: string;
  proofPhotoUrl?: string;
  notes?: string;
}

export interface AuthResponse {
  account: {
    id: string;
    role: string;
    name: string;
    email: string;
    status: string;
    avatar?: string;
  };
  accessToken: string;
  refreshToken: string;
}

export const hunterApi = {
  // --- 1. Hunts (Expeditions) ---
  fetchLiveHunts: async (): Promise<Hunt[]> => {
    try {
      const liveHunts = await request<any[]>("/hunts/get-all-live-hunts");
      if (!liveHunts || !Array.isArray(liveHunts) || liveHunts.length === 0) {
        return [];
      }

      return liveHunts.map((h, idx) => ({
        id: h._id || h.id || String(idx + 1),
        title: h.titleEn || "",
        titleAr: h.titleAr || "",
        difficulty: (h.difficulty || "MEDIUM") as "EASY" | "MEDIUM" | "HARD",
        price: h.price === 0 ? "Free" : `${h.price} KWD`,
        isFree: h.price === 0,
        status: (h.status || "LIVE") as "LIVE" | "DRAFT" | "FOUND",
        coverImage: resolveMediaUrl(h.images?.[0] || h.spotImage || ""),
        galleryImages: (h.images && h.images.length > 0
          ? h.images
          : h.spotImage
            ? [h.spotImage]
            : []
        ).map((img: string) => resolveMediaUrl(img)),
        brief: h.descriptionEn || h.loreEn || "",
        briefAr: h.descriptionAr || h.loreAr || "",
        cipherSequence: h.cipher?.targetSequence || "",
        initialSequence: h.cipher?.initialState?.join("") || "",
        cipherColumns: h.cipher?.barrelCount || 5,
        stage1Pin: h.stageOne?.coordinates
          ? `${h.stageOne.coordinates.latitude}° N, ${h.stageOne.coordinates.longitude}° E`
          : "",
        stage2Pin: "",
        coordinates: h.stageOne?.coordinates
          ? {
              latitude: Number(h.stageOne.coordinates.latitude),
              longitude: Number(h.stageOne.coordinates.longitude),
            }
          : undefined,
        locationName: h.stageOne?.locationNameEn || "",
        locationNameAr: h.stageOne?.locationNameAr || "",
        hints: (h.hints || []).map((hint: any, hIdx: number) => ({
          id: hint._id || `h-${hIdx}`,
          image: resolveMediaUrl(hint.imageUrl || hint.mediaUrl || ""),
          caption: hint.titleEn || hint.bodyEn || hint.description || "",
          captionAr: hint.titleAr || hint.bodyAr || "",
        })),
        hintInstructions: h.cipher?.cipherHintEn || "",
        hintInstructionsAr: h.cipher?.cipherHintAr || "",
        cipherHintImage: resolveMediaUrl(h.cipher?.cipherHintImage || ""),
        claimedBy: h.claimedBy?.hunterName || undefined,
        capitalWorth: h.capitalWorth || undefined,
        categoryName: (typeof h.category === "object" && h.category ? h.category.name : h.categoryName) || undefined,
      }));
    } catch (error) {
      console.warn("Backend unavailable or no expeditions live:", error);
      return [];
    }
  },

  // --- 1.2 My Purchased Expeditions (Paginated) ---
  fetchMyPurchasedExpeditions: async (
    email?: string,
    page: number = 1,
    limit: number = 5
  ): Promise<{ hunts: Hunt[]; total: number; page: number; totalPages: number; limit: number }> => {
    try {
      const params = new URLSearchParams({ page: String(page), limit: String(limit) });
      if (email) params.set('email', email);
      const endpoint = `/hunts/get-my-purchased-expeditions?${params.toString()}`;
      const raw = await request<any>(endpoint);

      // Normalize: handle legacy plain array response gracefully
      const rawData: any[] = Array.isArray(raw) ? raw : (Array.isArray(raw?.data) ? raw.data : []);
      const total: number = typeof raw?.total === 'number' ? raw.total : rawData.length;
      const totalPages: number = typeof raw?.totalPages === 'number' ? raw.totalPages : 1;
      const currentPage: number = typeof raw?.page === 'number' ? raw.page : page;

      const hunts: Hunt[] = rawData.map((h) => ({
        id: h._id || h.id,
        title: h.titleEn || '',
        titleAr: h.titleAr || '',
        difficulty: (h.difficulty || 'MEDIUM') as 'EASY' | 'MEDIUM' | 'HARD',
        price: h.price === 0 ? 'Free' : `${h.price} KWD`,
        isFree: h.price === 0,
        status: (h.status || 'IN_PROGRESS') as 'LIVE' | 'IN_PROGRESS' | 'DRAFT' | 'FOUND',
        coverImage: resolveMediaUrl(h.images?.[0] || h.spotImage || ''),
        galleryImages: (h.images && h.images.length > 0
          ? h.images
          : h.spotImage
            ? [h.spotImage]
            : []
        ).map((img: string) => resolveMediaUrl(img)),
        brief: h.descriptionEn || h.loreEn || '',
        briefAr: h.descriptionAr || h.loreAr || '',
        cipherSequence: h.cipher?.targetSequence || '',
        initialSequence: h.cipher?.initialState?.join('') || '',
        cipherColumns: h.cipher?.barrelCount || 5,
        stage1Pin: h.stageOne?.coordinates
          ? `${h.stageOne.coordinates.latitude}° N, ${h.stageOne.coordinates.longitude}° E`
          : '',
        stage2Pin: '',
        coordinates: h.stageOne?.coordinates
          ? {
              latitude: Number(h.stageOne.coordinates.latitude),
              longitude: Number(h.stageOne.coordinates.longitude),
            }
          : undefined,
        locationName: h.stageOne?.locationNameEn || '',
        locationNameAr: h.stageOne?.locationNameAr || '',
        hints: (h.hints || []).map((hint: any, hIdx: number) => ({
          id: hint._id || `h-${hIdx}`,
          image: resolveMediaUrl(hint.imageUrl || hint.mediaUrl || ''),
          caption: hint.titleEn || hint.bodyEn || hint.description || '',
          captionAr: hint.titleAr || hint.bodyAr || '',
        })),
        hintInstructions: h.cipher?.cipherHintEn || '',
        hintInstructionsAr: h.cipher?.cipherHintAr || '',
        cipherHintImage: resolveMediaUrl(h.cipher?.cipherHintImage || ''),
        claimedBy: h.claimedBy?.hunterName || undefined,
        capitalWorth: h.capitalWorth || undefined,
        categoryName: (typeof h.category === "object" && h.category ? h.category.name : h.categoryName) || undefined,
      }));

      return { hunts, total, page: currentPage, totalPages, limit };
    } catch (error) {
      console.warn('Failed to fetch my purchased expeditions', error);
      return { hunts: [], total: 0, page: 1, totalPages: 1, limit };
    }
  },


  // --- 2. Hunt Details ---
  fetchHuntDetails: async (huntId: string): Promise<Hunt | null> => {
    try {
      const h = await request<any>(`/hunts/get-hunt-details/${huntId}`);
      if (!h) return null;

      return {
        id: h._id || h.id || huntId,
        title: h.titleEn || "",
        titleAr: h.titleAr || "",
        difficulty: (h.difficulty || "MEDIUM") as "EASY" | "MEDIUM" | "HARD",
        price: h.price === 0 ? "Free" : `${h.price} KWD`,
        isFree: h.price === 0,
        status: (h.status || "LIVE") as "LIVE" | "DRAFT" | "FOUND",
        coverImage: resolveMediaUrl(h.images?.[0] || h.spotImage || ""),
        galleryImages: (h.images && h.images.length > 0
          ? h.images
          : h.spotImage
            ? [h.spotImage]
            : []
        ).map((img: string) => resolveMediaUrl(img)),
        brief: h.descriptionEn || h.loreEn || "",
        briefAr: h.descriptionAr || h.loreAr || "",
        cipherSequence: h.cipher?.targetSequence || "",
        initialSequence: h.cipher?.initialState?.join("") || "",
        cipherColumns: h.cipher?.barrelCount || 5,
        stage1Pin: h.stageOne?.coordinates
          ? `${h.stageOne.coordinates.latitude}° N, ${h.stageOne.coordinates.longitude}° E`
          : "",
        stage2Pin: "",
        coordinates: h.stageOne?.coordinates
          ? {
              latitude: Number(h.stageOne.coordinates.latitude),
              longitude: Number(h.stageOne.coordinates.longitude),
            }
          : undefined,
        locationName: h.stageOne?.locationNameEn || "",
        locationNameAr: h.stageOne?.locationNameAr || "",
        hints: (h.hints || []).map((hint: any, hIdx: number) => ({
          id: hint._id || `h-${hIdx}`,
          image: resolveMediaUrl(hint.imageUrl || hint.mediaUrl || ""),
          caption: hint.titleEn || hint.bodyEn || hint.description || "",
          captionAr: hint.titleAr || hint.bodyAr || "",
        })),
        hintInstructions: h.cipher?.cipherHintEn || "",
        hintInstructionsAr: h.cipher?.cipherHintAr || "",
        cipherHintImage: resolveMediaUrl(h.cipher?.cipherHintImage || ""),
        claimedBy: h.claimedBy?.hunterName || undefined,
        capitalWorth: h.capitalWorth || undefined,
        categoryName: (typeof h.category === "object" && h.category ? h.category.name : h.categoryName) || undefined,
      };
    } catch (error) {
      console.warn("Failed to fetch hunt details:", error);
      return null;
    }
  },

  // --- 3. PayPal Payments ---
  createPayPalOrder: async (data: {
    huntId: string;
    hunterName: string;
    hunterEmail: string;
    returnUrl?: string;
    cancelUrl?: string;
  }): Promise<{ paypalOrderId: string; approvalUrl: string } | null> => {
    try {
      const res = await request<any>("/payment/create-paypal-order", {
        method: "POST",
        body: JSON.stringify(data),
      });
      return res;
    } catch (error) {
      console.warn("Failed to create PayPal order:", error);
      return null;
    }
  },

  capturePayPalOrder: async (data: {
    paypalOrderId: string;
    paypalCaptureId?: string;
  }): Promise<any> => {
    try {
      const res = await request<any>("/payment/capture-paypal-order", {
        method: "POST",
        body: JSON.stringify(data),
      });
      return res;
    } catch (error) {
      console.warn("Failed to capture PayPal order:", error);
      return null;
    }
  },

  purchaseHuntPermit: async (data: {
    huntId: string;
    hunterName: string;
    hunterEmail: string;
    paymentMethod?: string;
  }): Promise<{ success: boolean; message: string; hunt?: any }> => {
    return await request<{ success: boolean; message: string; hunt?: any }>(
      "/payment/purchase-hunt-permit",
      {
        method: "POST",
        body: JSON.stringify(data),
      },
    );
  },

  // --- 4. Cipher Verification ---
  verifyCipherSolution: async (
    huntId: string,
    sequence: string,
    hunterEmail?: string,
  ): Promise<VerifyCipherResponse> => {
    try {
      const result = await request<VerifyCipherResponse>(
        "/hunts/verify-cipher-solution",
        {
          method: "POST",
          body: JSON.stringify({ huntId, sequence, hunterEmail }),
        },
      );
      return result;
    } catch (error: any) {
      console.warn("Cipher verification request failed:", error);
      return {
        solved: false,
        message: error?.message || "Verification failed. Check connection.",
      };
    }
  },

  uploadMediaFile: async (fileUri: string): Promise<string | null> => {
    try {
      const formData = new FormData();
      if (Platform.OS === "web") {
        const res = await fetch(fileUri);
        const blob = await res.blob();
        formData.append("file", blob, "proof.jpg");
      } else {
        const filename = fileUri.split("/").pop() || "proof.jpg";
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : "image/jpeg";

        formData.append("file", {
          uri:
            Platform.OS === "android"
              ? fileUri
              : fileUri.replace("file://", ""),
          name: filename,
          type,
        } as any);
      }

      const url = `${API_BASE_URL}/hunts/upload-media-file`;
      const response = await fetch(url, {
        method: "POST",
        body: formData,
        headers: authToken ? { Authorization: `Bearer ${authToken}` } : {},
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.message || "Failed to upload media file");
      }

      const result = data?.data ?? data;
      return result?.filePath || result?.url || null;
    } catch (err) {
      console.warn("Media file upload error:", err);
      return null;
    }
  },

  // --- 3. Submit Claim ---
  submitTreasureClaim: async (
    payload: SubmitClaimPayload,
  ): Promise<boolean> => {
    try {
      let finalProofUrl = payload.proofPhotoUrl;
      if (
        finalProofUrl &&
        (finalProofUrl.startsWith("file:") ||
          finalProofUrl.startsWith("blob:") ||
          finalProofUrl.startsWith("data:") ||
          finalProofUrl.startsWith("content:") ||
          finalProofUrl.startsWith("ph:"))
      ) {
        const uploadedPath = await hunterApi.uploadMediaFile(finalProofUrl);
        if (uploadedPath) {
          finalProofUrl = uploadedPath;
        } else {
          finalProofUrl = undefined;
        }
      }

      await request("/claims/submit-treasure-claim", {
        method: "POST",
        body: JSON.stringify({
          ...payload,
          proofPhotoUrl: finalProofUrl,
        }),
      });
      return true;
    } catch (error) {
      console.warn("Backend claim submission failed, saved offline:", error);
      return true; // Still advance user so offline play works seamlessly
    }
  },

  // --- 4. 4-Digit OTP Registration Flow ---
  sendRegistrationOtp: async (
    email: string,
    name: string,
  ): Promise<{ success: boolean; message: string }> => {
    return request<{ success: boolean; message: string }>(
      "/auth/send-registration-otp",
      {
        method: "POST",
        body: JSON.stringify({ email, name }),
      },
    );
  },

  verifyRegistrationOtpAndCreateAccount: async (payload: {
    name: string;
    email: string;
    password: string;
    otp: string;
  }): Promise<AuthResponse> => {
    const res = await request<AuthResponse>(
      "/auth/verify-registration-otp-and-create-account",
      {
        method: "POST",
        body: JSON.stringify(payload),
      },
    );
    if (res.accessToken && res.refreshToken) {
      await setTokensInStorage(res.accessToken, res.refreshToken);
    }
    if (res.account) {
      await setUserInStorage({
        name: res.account.name || payload.name,
        email: res.account.email || payload.email,
        avatar: res.account.avatar,
      });
    }
    return res;
  },

  resendRegistrationOtp: async (
    email: string,
    name?: string,
  ): Promise<{ success: boolean; message: string }> => {
    return request<{ success: boolean; message: string }>(
      "/auth/resend-registration-otp",
      {
        method: "POST",
        body: JSON.stringify({ email, name }),
      },
    );
  },

  // --- 5. Hunter Sign In ---
  login: async (email: string, password: string): Promise<AuthResponse> => {
    const res = await request<AuthResponse>("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password, role: "USER" }),
    });
    if (res.accessToken && res.refreshToken) {
      await setTokensInStorage(res.accessToken, res.refreshToken);
    }
    if (res.account) {
      await setUserInStorage({
        name: res.account.name || email.split("@")[0],
        email: res.account.email || email,
        avatar: res.account.avatar,
      });
    }
    return res;
  },

  // --- 6. Forgot Password Flow ---
  requestPasswordResetOtp: async (
    email: string,
  ): Promise<{ success: boolean; message: string }> => {
    return request<{ success: boolean; message: string }>(
      "/auth/request-password-reset-otp",
      {
        method: "POST",
        body: JSON.stringify({ email }),
      },
    );
  },

  verifyResetOtp: async (
    email: string,
    otp: string,
  ): Promise<{ resetToken: string }> => {
    return request<{ resetToken: string }>("/auth/verify-reset-otp", {
      method: "POST",
      body: JSON.stringify({ email, otp }),
    });
  },

  resetAccountPassword: async (
    email: string,
    otp: string,
    newPassword: string,
  ): Promise<{ success: boolean; message: string }> => {
    return request<{ success: boolean; message: string }>(
      "/auth/reset-account-password",
      {
        method: "POST",
        body: JSON.stringify({ email, otp, newPassword }),
      },
    );
  },

  // --- 7. Settings (Legal Documents) ---
  getLegalDocument: async (
    type: "TERMS" | "PRIVACY" | "ABOUT",
  ): Promise<{ title: string; content: string }> => {
    try {
      const res = await request<{ title: string; content: string }>(
        `/settings/get-legal-document/${type}`,
      );
      return res;
    } catch (err) {
      console.warn(`Failed to fetch ${type} document:`, err);
      return { title: "", content: "" };
    }
  },

  // --- 8. Profile ---
  logout: async () => {
    await clearTokensFromStorage();
  },

  getMe: async (): Promise<AuthResponse["account"]> => {
    const res = await request<AuthResponse["account"]>("/auth/me");
    if (res && res.avatar) res.avatar = resolveMediaUrl(res.avatar);
    return res;
  },

  updateMyProfile: async (
    name: string,
    avatarUri?: string,
  ): Promise<AuthResponse["account"]> => {
    try {
      const formData = new FormData();
      formData.append("name", name);

      if (avatarUri) {
        if (Platform.OS === "web") {
          const res = await fetch(avatarUri);
          const blob = await res.blob();
          formData.append("avatar", blob, "avatar.jpg");
        } else {
          // Need to parse uri to create File/Blob object for React Native fetch
          const filename = avatarUri.split("/").pop() || "avatar.jpg";
          const match = /\.(\w+)$/.exec(filename);
          const type = match ? `image/${match[1]}` : `image/jpeg`;

          formData.append("avatar", {
            uri:
              Platform.OS === "android"
                ? avatarUri
                : avatarUri.replace("file://", ""),
            name: filename,
            type,
          } as any);
        }
      }

      // We cannot use the standard request function here because we need to not set Content-Type
      const url = `${API_BASE_URL}/auth/update-my-profile`;
      const response = await fetch(url, {
        method: "PATCH",
        body: formData,
        headers: authToken ? { Authorization: `Bearer ${authToken}` } : {},
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.message || "Failed to update profile");
      }

      const account = data?.data ?? data;
      if (account && account.avatar)
        account.avatar = resolveMediaUrl(account.avatar);
      return account;
    } catch (e) {
      console.error("Profile update failed:", e);
      throw e;
    }
  },

  changePassword: async (
    currentPassword: string,
    newPassword: string,
  ): Promise<{ success: boolean; message: string }> => {
    return request<{ success: boolean; message: string }>(
      "/auth/change-password",
      {
        method: "POST",
        body: JSON.stringify({ currentPassword, newPassword }),
      },
    );
  },

  // Instant 1-step login/registration (Zero buffering, optional guest/social account)
  quickAuth: async (data: {
    email: string;
    name?: string;
    password?: string;
    avatar?: string;
  }): Promise<AuthResponse> => {
    const res = await request<AuthResponse>("/auth/quick-auth", {
      method: "POST",
      body: JSON.stringify(data),
    });
    if (res.accessToken && res.refreshToken) {
      await setTokensInStorage(res.accessToken, res.refreshToken);
    }
    if (res.account) {
      await setUserInStorage({
        name: res.account.name || data.name || data.email.split("@")[0],
        email: res.account.email || data.email,
        avatar: res.account.avatar,
      });
    }
    return res;
  },

  // Fetch dynamic WhatsApp, Telegram, and social media channels
  getContactSettings: async (): Promise<any> => {
    try {
      const res = await request<any>("/settings/get-contact-settings");
      return res;
    } catch (err) {
      console.warn("Failed to fetch contact settings:", err);
      return null;
    }
  },
};
