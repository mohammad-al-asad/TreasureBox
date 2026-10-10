import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { dashboardApi, CabinetHuntDto } from '../../services/dashboardApi';

interface HuntsState {
  items: CabinetHuntDto[];
  loading: boolean;
  error: string | null;
  selectedHunt: CabinetHuntDto | null;
}

const initialState: HuntsState = {
  items: [],
  loading: false,
  error: null,
  selectedHunt: null,
};

export const fetchCabinetHuntsThunk = createAsyncThunk(
  'hunts/fetchAll',
  async (statusFilter: string | undefined, { rejectWithValue }) => {
    try {
      const data = await dashboardApi.getAllCabinetHunts(statusFilter);
      return data;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to fetch expeditions';
      return rejectWithValue(message);
    }
  }
);

export const createHuntThunk = createAsyncThunk(
  'hunts/create',
  async (payload: Partial<CabinetHuntDto>, { rejectWithValue }) => {
    try {
      const data = await dashboardApi.createHunt(payload);
      return data;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to create expedition';
      return rejectWithValue(message);
    }
  }
);

export const updateHuntThunk = createAsyncThunk(
  'hunts/update',
  async (
    { huntId, payload }: { huntId: string; payload: Partial<CabinetHuntDto> },
    { rejectWithValue }
  ) => {
    try {
      const data = await dashboardApi.updateHunt(huntId, payload);
      return data;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to update expedition';
      return rejectWithValue(message);
    }
  }
);

export const deleteHuntThunk = createAsyncThunk(
  'hunts/delete',
  async (huntId: string, { rejectWithValue }) => {
    try {
      await dashboardApi.deleteHunt(huntId);
      return huntId;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to delete expedition';
      return rejectWithValue(message);
    }
  }
);

export const huntsSlice = createSlice({
  name: 'hunts',
  initialState,
  reducers: {
    setSelectedHunt: (state, action: PayloadAction<CabinetHuntDto | null>) => {
      state.selectedHunt = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch
      .addCase(fetchCabinetHuntsThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCabinetHuntsThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload || [];
      })
      .addCase(fetchCabinetHuntsThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) || 'Could not connect to live API';
      })
      // Create
      .addCase(createHuntThunk.fulfilled, (state, action) => {
        if (action.payload) {
          state.items.unshift(action.payload);
        }
      })
      // Update
      .addCase(updateHuntThunk.fulfilled, (state, action) => {
        if (action.payload) {
          const updatedId = action.payload._id || action.payload.id;
          const idx = state.items.findIndex(
            (h) => (h._id || h.id) === updatedId
          );
          if (idx !== -1) {
            state.items[idx] = action.payload;
          }
        }
      })
      // Delete
      .addCase(deleteHuntThunk.fulfilled, (state, action) => {
        state.items = state.items.filter(
          (h) => (h._id || h.id) !== action.payload
        );
      });
  },
});

export const { setSelectedHunt } = huntsSlice.actions;
export default huntsSlice.reducer;
