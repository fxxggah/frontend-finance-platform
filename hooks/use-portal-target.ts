'use client';

import { useSyncExternalStore } from 'react';

const subscribe = () => () => {};
const getTarget = () => document.body;
const getServerTarget = () => null;

/** Portal somente após hidratar, com snapshot SSR estável. */
export function usePortalTarget() {
  return useSyncExternalStore<HTMLElement | null>(subscribe, getTarget, getServerTarget);
}
