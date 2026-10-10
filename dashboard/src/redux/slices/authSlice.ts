import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import {
  dashboardApi,
  AuthUserDto,
  getStoredToken,
  getStoredUser,
  setStoredAuth,
  clearStoredAuth,
} from '../../services/dashboardApi';

interface AuthState {
  user: AuthUserDto | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  error: string | null;
}

const initialToken = getStoredToken();
const initialUser = getStoredUser();

const initialState: AuthState = {
  user: initialUser,
  token: initialToken,
  isAuthenticated: !!initialToken,
  loading: false,
  error: null,
};

export const loginThunk = createAsyncThunk(
  'auth/login',
  async (
    credentials: { email: string; password: string; role?: string },
    { rejectWithValue }
  ) => {
    try {
      const response = await dashboardApi.login(credentials);
      const token = response.accessToken || response.tokens?.accessToken || '';
      setStoredAuth(token, response.account);
      return { ...response, accessToken: token };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Invalid operator credentials';
      return rejectWithValue(message);
    }
  }
);

export const fetchMeThunk = createAsyncThunk('auth/fetchMe', async (_, { rejectWithValue }) => {
  try {
    const user = await dashboardApi.getMe();
    return user;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to retrieve operator session';
    return rejectWithValue(message);
  }
});

export const logoutThunk = createAsyncThunk('auth/logout', async () => {
  try {
    await dashboardApi.logout();
  } catch {
    // Graceful logout even if backend is unreachable
  } finally {
    clearStoredAuth();
  }
  return true;
});

export const changePasswordThunk = createAsyncThunk(
  'auth/changePassword',
  async (
    payload: { currentPassword: string; newPassword: string },
    { rejectWithValue }
  ) => {
    try {
      const res = await dashboardApi.changePassword(payload);
      return res;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to change password';
      return rejectWithValue(message);
    }
  }
);

export const updateProfileThunk = createAsyncThunk(
  'auth/updateProfile',
  async (payload: { name: string; avatar?: string }, { rejectWithValue }) => {
    try {
      const updatedUser = await dashboardApi.updateMyProfile(payload);
      const token = getStoredToken();
      if (token) {
        setStoredAuth(token, updatedUser);
      }
      return updatedUser;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to update profile';
      return rejectWithValue(message);
    }
  }
);

export const uploadProfileAvatarThunk = createAsyncThunk(
  'auth/uploadProfileAvatar',
  async (formData: FormData, { rejectWithValue }) => {
    try {
      const response = await dashboardApi.uploadProfileImage(formData);
      const token = getStoredToken();
      if (token) {
        setStoredAuth(token, response.account);
      }
      return response.account;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to upload profile photo';
      return rejectWithValue(message);
    }
  }
);

export const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearAuthError: (state) => {
      state.error = null;
    },
    syncClientAuth: (state) => {
      const token = getStoredToken();
      const user = getStoredUser();
      state.token = token;
      state.user = user;
      state.isAuthenticated = !!token;
    },
  },
  extraReducers: (builder) => {
    builder
      // Login
      .addCase(loginThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.token = action.payload.accessToken || action.payload.tokens?.accessToken || '';
        state.user = action.payload.account;
        state.isAuthenticated = true;
        state.error = null;
      })
      .addCase(loginThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) || 'Authentication failed';
        state.isAuthenticated = false;
      })
      // Fetch Me
      .addCase(fetchMeThunk.fulfilled, (state, action) => {
        if (action.payload) {
          state.user = action.payload;
          state.isAuthenticated = true;
        }
      })
      .addCase(fetchMeThunk.rejected, (state) => {
        // If /auth/me fails (token expired), clear state
        state.user = null;
        state.token = null;
        state.isAuthenticated = false;
        clearStoredAuth();
      })
      // Logout
      .addCase(logoutThunk.fulfilled, (state) => {
        state.user = null;
        state.token = null;
        state.isAuthenticated = false;
        state.error = null;
      })
      // Update Profile
      .addCase(updateProfileThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateProfileThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload;
        state.error = null;
      })
      .addCase(updateProfileThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) || 'Failed to update profile';
      })
      // Upload Profile Avatar (Multer)
      .addCase(uploadProfileAvatarThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(uploadProfileAvatarThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload;
        state.error = null;
      })
      .addCase(uploadProfileAvatarThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) || 'Failed to upload profile photo';
      });
  },
});

export const { clearAuthError, syncClientAuth } = authSlice.actions;
export default authSlice.reducer;
