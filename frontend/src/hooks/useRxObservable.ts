import { useEffect, useState } from 'react';
import type { Observable, Subscription } from 'rxjs';

/**
 * Hook to subscribe to an RxJS Observable and get its current value
 * 
 * This is a bridge between RxJS observables and React state:
 * - Subscribes to the observable when component mounts
 * - Updates React state whenever observable emits a new value
 * - Unsubscribes when component unmounts to prevent memory leaks
 * 
 * @param observable$ - The RxJS observable to subscribe to
 * @param initialValue - Initial value to use while waiting for first emission
 * @returns Current value from the observable
 */
export function useRxObservable<T>(observable$: Observable<T>, initialValue: T): T {
  const [value, setValue] = useState<T>(initialValue);

  useEffect(() => {
    // Subscribe to observable and update state on each emission
    const sub: Subscription = observable$.subscribe({
      next: (v) => setValue(v),
    });

    // Cleanup: Unsubscribe when component unmounts or observable changes
    return () => sub.unsubscribe();
  }, [observable$]);

  return value;
}
