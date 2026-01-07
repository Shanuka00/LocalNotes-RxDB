import { useEffect, useState } from 'react';
import type { Observable, Subscription } from 'rxjs';

export function useRxObservable<T>(observable$: Observable<T>, initialValue: T): T {
  const [value, setValue] = useState<T>(initialValue);

  useEffect(() => {
    const sub: Subscription = observable$.subscribe({
      next: (v) => setValue(v),
    });

    return () => sub.unsubscribe();
  }, [observable$]);

  return value;
}
