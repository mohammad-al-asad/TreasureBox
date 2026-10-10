import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { dashboardApi, NotificationItemDto, PaginatedNotificationsDto } from '../../services/dashboardApi';

interface PaginationMeta {
  total: number;
  page: number;
  totalPages: number;
  limit: number;
}

interface NotificationsState {
  items: NotificationItemDto[];
  pagination: PaginationMeta;
  loading: boolean;
  loadingMore: boolean;
  error: string | null;
}

const initialState: NotificationsState = {
  items: [],
  pagination: { total: 0, page: 1, totalPages: 1, limit: 20 },
  loading: false,
  loadingMore: false,
  error: null,
};

/** Fetches page 1 — replaces the entire items list */
export const fetchNotificationsThunk = createAsyncThunk<
  PaginatedNotificationsDto,
  { page?: number; limit?: number } | undefined
>(
  'notifications/fetchAll',
  async (args, { rejectWithValue }) => {
    try {
      const raw = await dashboardApi.getNotifications(args?.page ?? 1, args?.limit ?? 20);

      // Safe shape normalization: handle legacy array response gracefully
      if (Array.isArray(raw)) {
        return {
          data: raw as NotificationItemDto[],
          total: (raw as NotificationItemDto[]).length,
          page: 1,
          totalPages: 1,
          limit: args?.limit ?? 20,
        };
      }

      return raw;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to fetch notifications';
      return rejectWithValue(message);
    }
  }
);

/** Fetches a subsequent page — appends to the existing list */
export const fetchMoreNotificationsThunk = createAsyncThunk<
  PaginatedNotificationsDto,
  { page: number; limit?: number }
>(
  'notifications/fetchMore',
  async ({ page, limit = 20 }, { rejectWithValue }) => {
    try {
      return await dashboardApi.getNotifications(page, limit);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to load more notifications';
      return rejectWithValue(message);
    }
  }
);

export const notificationsSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {
    addRealtimeNotification: (state, action: PayloadAction<NotificationItemDto>) => {
      const exists = state.items.some((item) => item._id === action.payload._id);
      if (!exists) {
        state.items.unshift(action.payload);
        state.pagination.total += 1;
      }
    },
    markAllAsRead: (state) => {
      state.items.forEach((item) => {
        item.read = true;
      });
    },
  },
  extraReducers: (builder) => {
    builder
      // fetchNotificationsThunk — full replace
      .addCase(fetchNotificationsThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchNotificationsThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload.data ?? [];
        state.pagination = {
          total: action.payload.total,
          page: action.payload.page,
          totalPages: action.payload.totalPages,
          limit: action.payload.limit,
        };
      })
      .addCase(fetchNotificationsThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) || 'Could not fetch live notifications';
      })

      // fetchMoreNotificationsThunk — append
      .addCase(fetchMoreNotificationsThunk.pending, (state) => {
        state.loadingMore = true;
      })
      .addCase(fetchMoreNotificationsThunk.fulfilled, (state, action) => {
        state.loadingMore = false;
        // Append only items not already in state (guard against duplicates)
        const existingIds = new Set(state.items.map((n) => n._id));
        const newItems = (action.payload.data ?? []).filter((n) => !existingIds.has(n._id));
        state.items.push(...newItems);
        state.pagination = {
          total: action.payload.total,
          page: action.payload.page,
          totalPages: action.payload.totalPages,
          limit: action.payload.limit,
        };
      })
      .addCase(fetchMoreNotificationsThunk.rejected, (state) => {
        state.loadingMore = false;
      });
  },
});

export const { addRealtimeNotification, markAllAsRead } = notificationsSlice.actions;

export default notificationsSlice.reducer;
