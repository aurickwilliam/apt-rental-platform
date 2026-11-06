import type { View } from 'react-native';

export interface TutorialRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

// Tutorial targets register their native view under a stable key (the same
// keys web uses as `data-tour`). A missing key simply means "no spotlight".
const targets = new Map<string, View>();

export function registerTutorialTarget(key: string, view: View | null): void {
  if (view) targets.set(key, view);
  else targets.delete(key);
}

export function measureTutorialTarget(key: string): Promise<TutorialRect | null> {
  const view = targets.get(key);
  if (!view) return Promise.resolve(null);
  return new Promise((resolve) => {
    view.measureInWindow((x, y, width, height) => {
      resolve(width > 0 && height > 0 ? { x, y, width, height } : null);
    });
  });
}
