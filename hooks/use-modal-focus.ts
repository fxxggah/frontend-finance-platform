'use client';

import { useEffect, useRef, type RefObject } from 'react';

const panels: HTMLElement[] = [];
let previousOverflow = '';
const focusableSelector = 'button:not([disabled]), a[href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

/** Teclado, foco e scroll compartilhados por dialogs e sheets, inclusive aninhados. */
export function useModalFocus(open: boolean, panelRef: RefObject<HTMLDivElement | null>, onClose: () => void) {
  const closeRef = useRef(onClose);
  useEffect(() => { closeRef.current = onClose; }, [onClose]);
  useEffect(() => {
    const panel = panelRef.current;
    if (!open || !panel) return;
    const trigger = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    if (panels.length === 0) {
      previousOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
    }
    panels.push(panel);
    panel.focus({ preventScroll: true });
    const focusables = () => [...panel.querySelectorAll<HTMLElement>(focusableSelector)].filter(element => element.getClientRects().length > 0);
    const handleKey = (event: KeyboardEvent) => {
      if (panels.at(-1) !== panel) return;
      if (event.key === 'Escape') { event.preventDefault(); closeRef.current(); }
      if (event.key !== 'Tab') return;
      const items = focusables();
      const first = items[0];
      const last = items.at(-1);
      if (!first || !last) { event.preventDefault(); panel.focus(); return; }
      if (event.shiftKey && (document.activeElement === first || document.activeElement === panel)) {
        event.preventDefault(); last.focus();
      } else if (!event.shiftKey && (document.activeElement === last || !panel.contains(document.activeElement))) {
        event.preventDefault(); first.focus();
      }
    };
    const handleFocus = (event: FocusEvent) => {
      if (panels.at(-1) === panel && event.target instanceof Node && !panel.contains(event.target)) panel.focus();
    };
    document.addEventListener('keydown', handleKey);
    document.addEventListener('focusin', handleFocus);
    return () => {
      panels.splice(panels.indexOf(panel), 1);
      document.removeEventListener('keydown', handleKey);
      document.removeEventListener('focusin', handleFocus);
      if (panels.length === 0) document.body.style.overflow = previousOverflow;
      if (trigger?.isConnected) trigger.focus({ preventScroll: true });
    };
  }, [open, panelRef]);
}
