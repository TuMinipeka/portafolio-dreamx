import { create } from "zustand";

/** Numbers produced by the 3D world that the page shows as text (e.g. the Hub's check-ins). */
export const useLive = create<{ checkins: number; checkIn: () => void }>((set) => ({
  checkins: 0,
  checkIn: () => set((s) => ({ checkins: s.checkins + 1 })),
}));
