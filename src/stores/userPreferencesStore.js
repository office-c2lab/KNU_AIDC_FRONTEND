import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useUserPreferencesStore = create(
  persist(
    set => ({
      showClock: true,
      reducePanelMotion: false,
      setShowClock: showClock => set({ showClock }),
      setReducePanelMotion: reducePanelMotion => set({ reducePanelMotion }),
    }),
    {
      name: 'knu-aidc-ui-preferences',
      partialize: ({ showClock, reducePanelMotion }) => ({ showClock, reducePanelMotion }),
    }
  )
);
