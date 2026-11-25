import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useUserPreferencesStore = create(
  persist(
    set => ({
      showClock: true,
      setShowClock: showClock => set({ showClock }),
    }),
    {
      name: 'knu-aidc-ui-preferences',
      partialize: ({ showClock }) => ({ showClock }),
    }
  )
);
