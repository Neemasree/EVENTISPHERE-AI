import { useEffect } from 'react';
import { useEventStore } from '../store/eventStore';

/** Ticks live data every 4s to simulate real-time sensor feed */
export function useLiveTick() {
  const store = useEventStore();

  useEffect(() => {
    const id = setInterval(() => {
      store.tickLiveData?.();
    }, 4000);
    return () => clearInterval(id);
  }, []);
}
