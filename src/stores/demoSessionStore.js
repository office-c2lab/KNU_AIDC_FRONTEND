import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

// This flag controls the demo entry flow; it is not server-side authentication.
export const useDemoSessionStore = create(
  persist(
    set => ({
      hasEntered: false,
      enter: () => set({ hasEntered: true }),
      leave: () => set({ hasEntered: false }),
    }),
    {
      name: 'knu-aidc-demo-session',
      storage: createJSONStorage(() => sessionStorage),
      partialize: ({ hasEntered }) => ({ hasEntered }),
    }
  )
);
