import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { dashboardApi, LegalDocDto } from '../../services/dashboardApi';

interface SettingsState {
  terms: LegalDocDto | null;
  privacy: LegalDocDto | null;
  about: LegalDocDto | null;
  loading: boolean;
  savedNotice: boolean;
  error: string | null;
}

const initialState: SettingsState = {
  terms: null,
  privacy: null,
  about: null,
  loading: false,
  savedNotice: false,
  error: null,
};

export const fetchLegalDocThunk = createAsyncThunk(
  'settings/fetchLegalDoc',
  async (type: 'TERMS' | 'PRIVACY' | 'ABOUT', { rejectWithValue }) => {
    try {
      const data = await dashboardApi.getLegalDoc(type);
      return data;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to fetch legal document';
      return rejectWithValue(message);
    }
  }
);

export const updateLegalDocThunk = createAsyncThunk(
  'settings/updateLegalDoc',
  async (
    payload: { type: 'TERMS' | 'PRIVACY' | 'ABOUT'; content: string },
    { rejectWithValue }
  ) => {
    try {
      const data = await dashboardApi.updateLegalDoc(payload);
      return data;
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to save legal document';
      return rejectWithValue(message);
    }
  }
);

export const settingsSlice = createSlice({
  name: 'settings',
  initialState,
  reducers: {
    clearSavedNotice: (state) => {
      state.savedNotice = false;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchLegalDocThunk.fulfilled, (state, action) => {
        if (action.payload) {
          if (action.payload.type === 'TERMS') state.terms = action.payload;
          if (action.payload.type === 'PRIVACY') state.privacy = action.payload;
          if (action.payload.type === 'ABOUT') state.about = action.payload;
        }
      })
      .addCase(updateLegalDocThunk.fulfilled, (state, action) => {
        if (action.payload) {
          if (action.payload.type === 'TERMS') state.terms = action.payload;
          if (action.payload.type === 'PRIVACY') state.privacy = action.payload;
          if (action.payload.type === 'ABOUT') state.about = action.payload;
          state.savedNotice = true;
        }
      });
  },
});

export const { clearSavedNotice } = settingsSlice.actions;
export default settingsSlice.reducer;
