import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { dashboardApi, OverviewMetricsDto } from '../../services/dashboardApi';

const INITIAL_METRICS: OverviewMetricsDto = {
  totalRevenue: 0,
  activeHuntsCount: 0,
  inProgressHuntsCount: 0,
  pendingClaimsCount: 0,
  foundHuntsCount: 0,
  totalHuntsCount: 0,
  recentClaims: [],
  recentPayments: [],
};

interface OverviewState {
  metrics: OverviewMetricsDto;
  loading: boolean;
  error: string | null;
}

const initialState: OverviewState = {
  metrics: INITIAL_METRICS,
  loading: false,
  error: null,
};

export const fetchOverviewMetricsThunk = createAsyncThunk(
  'overview/fetchMetrics',
  async (_, { rejectWithValue }) => {
    try {
      const data = await dashboardApi.getOverviewMetrics();
      return data;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to fetch overview metrics';
      return rejectWithValue(message);
    }
  }
);

export const overviewSlice = createSlice({
  name: 'overview',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchOverviewMetricsThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchOverviewMetricsThunk.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload) {
          state.metrics = action.payload;
        }
      })
      .addCase(fetchOverviewMetricsThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) || 'Could not fetch live metrics';
      });
  },
});

export default overviewSlice.reducer;
