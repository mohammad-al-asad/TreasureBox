import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { dashboardApi, HunterUserDto } from '../../services/dashboardApi';

interface UsersState {
  items: HunterUserDto[];
  loading: boolean;
  error: string | null;
  notice: string | null;
}

const initialState: UsersState = {
  items: [],
  loading: false,
  error: null,
  notice: null,
};

export const fetchUsersThunk = createAsyncThunk(
  'users/fetchAll',
  async (
    params: { search?: string; status?: string } | undefined,
    { rejectWithValue }
  ) => {
    try {
      const data = await dashboardApi.getAllUsers(params?.search, params?.status);
      return data;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to fetch hunter users';
      return rejectWithValue(message);
    }
  }
);

export const toggleUserStatusThunk = createAsyncThunk(
  'users/toggleStatus',
  async (userId: string, { rejectWithValue }) => {
    try {
      const data = await dashboardApi.toggleUserStatus(userId);
      return data;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to toggle status';
      return rejectWithValue(message);
    }
  }
);

export const resetUserAccessThunk = createAsyncThunk(
  'users/resetAccess',
  async (email: string, { rejectWithValue }) => {
    try {
      const data = await dashboardApi.resetUserAccess(email);
      return data;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to reset access';
      return rejectWithValue(message);
    }
  }
);

export const revokeUserRecordThunk = createAsyncThunk(
  'users/revokeRecord',
  async (userId: string, { rejectWithValue }) => {
    try {
      const data = await dashboardApi.revokeUserRecord(userId);
      return { userId, data };
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to revoke user';
      return rejectWithValue(message);
    }
  }
);

export const usersSlice = createSlice({
  name: 'users',
  initialState,
  reducers: {
    clearNotice: (state) => {
      state.notice = null;
    },
    setNotice: (state, action) => {
      state.notice = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchUsersThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUsersThunk.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload && action.payload.length > 0) {
          state.items = action.payload;
        }
      })
      .addCase(fetchUsersThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) || 'Could not fetch live users';
      })
      .addCase(toggleUserStatusThunk.fulfilled, (state, action) => {
        if (action.payload) {
          const userId = action.payload._id || action.payload.id;
          const idx = state.items.findIndex((u) => (u._id || u.id) === userId);
          if (idx !== -1) {
            state.items[idx] = action.payload;
          }
          state.notice = `User access status updated to ${action.payload.status}`;
        }
      })
      .addCase(resetUserAccessThunk.fulfilled, (state, action) => {
        state.notice = action.payload.message || 'Password reset instructions dispatched';
      })
      .addCase(revokeUserRecordThunk.fulfilled, (state, action) => {
        state.items = state.items.filter(
          (u) => (u._id || u.id) !== action.payload.userId
        );
        state.notice = 'Hunter account record revoked and cleared';
      });
  },
});

export const { clearNotice, setNotice } = usersSlice.actions;
export default usersSlice.reducer;
