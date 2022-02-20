import { useCallback, useRef } from 'react';

export function useCallbackRef<T extends (...args: any[]) => any>(fn: T, deps: any[]) {
  const ref = useRef<T>();
  ref.current = useCallback<T>(fn, deps);
  return ref as React.MutableRefObject<T>;
};
