'use client';

import { create } from 'zustand';

interface UiState {
  isBalanceVisible: boolean;
  toggleBalanceVisibility: () => void;
  setBalanceVisibility: (visible: boolean) => void;
}

export const useUiStore = create<UiState>((set) => ({
  isBalanceVisible: true,
  toggleBalanceVisibility: () =>
    set((state) => ({ isBalanceVisible: !state.isBalanceVisible })),
  setBalanceVisibility: (visible: boolean) => set({ isBalanceVisible: visible }),
}));

