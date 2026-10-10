import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { dashboardApi, TransactionDto } from '../../services/dashboardApi';

interface EarningsState {
  items: TransactionDto[];
  loading: boolean;
  error: string | null;
}

const initialState: EarningsState = {
  items: [],
  loading: false,
  error: null,
};

export const fetchTransactionsThunk = createAsyncThunk(
  'earnings/fetchTransactions',
  async (_, { rejectWithValue }) => {
    try {
      const data = await dashboardApi.getAllPaymentTransactions();
      return data;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to fetch payment ledger';
      return rejectWithValue(message);
    }
  }
);

export const earningsSlice = createSlice({
  name: 'earnings',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchTransactionsThunk.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchTransactionsThunk.fulfilled, (state, action) => {
        state.loading = false;
        state.items = action.payload || [];
      })
      .addCase(fetchTransactionsThunk.rejected, (state, action) => {
        state.loading = false;
        state.error = (action.payload as string) || 'Could not retrieve live payment transactions';
      });
  },
});

export default earningsSlice.reducer;
