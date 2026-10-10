import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { dashboardApi, ClaimRecordDto } from '../../services/dashboardApi';

interface ClaimsState {
  items: ClaimRecordDto[];
  loading: boolean;
  error: string | null;
}

const initialState: ClaimsState = {
  items: [],
  loading: false,
  error: null,
};

export const fetchClaimsThunk = createAsyncThunk(
  'claims/fetchAll',
  async (statusFilter: string | undefined, { rejectWithValue }) => {
    try {
      const data = await dashboardApi.getAllClaimsRegister(statusFilter);
      return data;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to fetch claims register';
      return rejectWithValue(message);
    }
  }
);

export const verifyOrRejectClaimThunk = createAsyncThunk(
  'claims/verifyOrReject',
  async (
    payload: { claimId: string; status: 'VERIFIED' | 'REJECTED'; reviewNotes?: string },
    { rejectWithValue }
  ) => {
    try {
      const data = await dashboardApi.verifyOrRejectClaim(payload);
      return data;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to update claim review';
      return rejectWithValue(message);
    }
  }
);

export const claimsSlice = createSlice({
  name: 'claims',
  initialState,
  reducers: {
    addRealtimeClaim: (state, action) => {
      const claim = action.payload;
      if (!claim) return;
      const claimId = claim._id || claim.id;
      const exists = state.items.some((c) => (c._id || c.id) === claimId);
      if (!exists) {
        state.items.unshift(claim);
      }
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchClaimsThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchClaimsThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload || [];
      })
      .addCase(fetchClaimsThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) || 'Could not fetch live claims';
      })
      .addCase(verifyOrRejectClaimThunk.fulfilled, (state, action) => {
        if (action.payload) {
          const claimId = action.payload._id || action.payload.id;
          const idx = state.items.findIndex((c) => (c._id || c.id) === claimId);
          if (idx !== -1) {
            state.items[idx] = action.payload;
          }
        }
      });
  },
});

export const { addRealtimeClaim } = claimsSlice.actions;

export default claimsSlice.reducer;
