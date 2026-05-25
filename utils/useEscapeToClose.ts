import { router } from 'expo-router';
import { useEffect } from 'react';
import { Platform } from 'react-native';

export function useEscapeToClose(enabled: boolean = true) {
  useEffect(() => {
    if (!enabled || Platform.OS !== 'web') return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        router.back();
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [enabled]);
}
