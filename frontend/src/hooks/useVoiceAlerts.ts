import { useEffect, useRef } from 'react';
import { useEventStore } from '../store/eventStore';
import { Sounds } from '../utils/sounds';

export function useVoiceAlerts() {
  const alerts  = useEventStore(s => s.alerts);
  const isMuted = useEventStore(s => s.isMuted);
  const seenRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (isMuted || !window.speechSynthesis) return;

    alerts.forEach(alert => {
      if (seenRef.current.has(alert.id)) return;
      seenRef.current.add(alert.id);
      if (alert.dismissed) return;

      const isCapacityBreach = alert.title.includes('Over Capacity');
      const isCritical = alert.severity === 'critical';
      const isHigh     = alert.severity === 'high';

      if (!isCritical && !isHigh) return;

      // Play audio tone first
      if (isCapacityBreach || isCritical) {
        Sounds.critical();
      } else {
        Sounds.warning();
      }

      // Then speak after a short delay so tone plays first
      setTimeout(() => {
        if (isMuted || !window.speechSynthesis) return;
        window.speechSynthesis.cancel(); // cut off any ongoing speech

        const utter = new SpeechSynthesisUtterance(
          isCapacityBreach
            ? `Warning! ${alert.zone} has exceeded maximum capacity. Immediate action required.`
            : `${isCritical ? 'Critical alert.' : 'High priority alert.'} ${alert.title}. ${alert.message}`
        );
        utter.rate   = isCapacityBreach ? 1.1 : 0.95;
        utter.pitch  = isCapacityBreach ? 1.2 : 1.0;
        utter.volume = 1.0;
        window.speechSynthesis.speak(utter);
      }, isCapacityBreach ? 600 : 200);
    });
  }, [alerts, isMuted]);
}
