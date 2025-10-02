import { useEffect, useCallback, useRef } from 'react';

export interface ShortcutConfig {
  key: string;
  ctrl?: boolean;
  alt?: boolean;
  shift?: boolean;
  handler: () => void;
  disabled?: boolean;
}

export function useKeyboardShortcuts(shortcuts: ShortcutConfig[], enabled: boolean = true) {
  const shortcutsRef = useRef(shortcuts);

  useEffect(() => {
    shortcutsRef.current = shortcuts;
  }, [shortcuts]);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent) => {
      if (!enabled) return;

      // Ignore if typing in input/textarea (except for specific keys)
      const target = event.target as HTMLElement;
      const isInput = ['INPUT', 'TEXTAREA'].includes(target.tagName);
      
      for (const shortcut of shortcutsRef.current) {
        if (shortcut.disabled) continue;

        const keyMatch = event.key === shortcut.key || event.code === shortcut.key;
        const ctrlMatch = shortcut.ctrl ? event.ctrlKey || event.metaKey : !event.ctrlKey && !event.metaKey;
        const altMatch = shortcut.alt ? event.altKey : !event.altKey;
        const shiftMatch = shortcut.shift ? event.shiftKey : !event.shiftKey;

        if (keyMatch && ctrlMatch && altMatch && shiftMatch) {
          // Allow F keys even in inputs
          if (event.key.startsWith('F') || !isInput) {
            event.preventDefault();
            shortcut.handler();
            break;
          }
        }
      }
    },
    [enabled]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
}
