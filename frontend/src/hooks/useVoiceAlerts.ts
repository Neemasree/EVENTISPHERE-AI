import { useEffect, useRef } from 'react';
import { useEventStore } from '../store/eventStore';
import { speakAlert } from '../utils/helpers';

/**
 * Watches for new critical/high alerts and speaks them via Web Speech API.
 * Respects the global mute toggle.
 */
export function useVoiceAlerts() {
  const alerts  = useEventStore(s => s.alerts);
  const isMuted = useEventStore(s => s.isMuted);
  const seenRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    alerts.forEach(alert => {
      if (seenRef.current.has(alert.id)) return;
      seenRef.current.add(alert.id);

      if (!alert.dismissed && (alert.severity === 'critical' || alert.severity === 'high')) {
        const prefix = alert.severity === 'critical' ? 'Critical alert.' : 'High priority alert.';
        speakAlert(`${prefix} ${alert.title}. ${alert.message}`, isMuted);
      }
    });
  }, [alerts, isMuted]);
}
