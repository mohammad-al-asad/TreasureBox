import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import huntsReducer from './slices/huntsSlice';
import claimsReducer from './slices/claimsSlice';
import usersReducer from './slices/usersSlice';
import overviewReducer from './slices/overviewSlice';
import settingsReducer from './slices/settingsSlice';
import earningsReducer from './slices/earningsSlice';
import notificationsReducer from './slices/notificationsSlice';

export const makeStore = () => {
  return configureStore({
    reducer: {
      auth: authReducer,
      hunts: huntsReducer,
      claims: claimsReducer,
      users: usersReducer,
      overview: overviewReducer,
      settings: settingsReducer,
      earnings: earningsReducer,
      notifications: notificationsReducer,
    },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({
        serializableCheck: false,
      }),
  });
};

export const store = makeStore();

export type AppStore = ReturnType<typeof makeStore>;
export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
