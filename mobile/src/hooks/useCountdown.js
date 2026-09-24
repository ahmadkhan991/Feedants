import { useEffect, useMemo, useState } from 'react';

/**
 * The server only ever sends a target ISO timestamp (see
 * utils/competitionState.js on the backend) - never a pre-formatted
 * "01d:06h:28m" string. That's deliberate: a string computed at request
 * time is already stale by the time it renders, and gets more wrong every
 * second after that. Ticking locally from a fixed target is both simpler
 * and correct regardless of network latency or how long the screen stays open.
 */
export function useCountdown(targetIso) {
  const target = useMemo(() => (targetIso ? new Date(targetIso).getTime() : null), [targetIso]);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    if (!target) return undefined;
    const interval = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(interval);
  }, [target]);

  if (!target) return { expired: true, days: 0, hours: 0, minutes: 0, seconds: 0, label: null };

  const msRemaining = target - now;
  if (msRemaining <= 0) return { expired: true, days: 0, hours: 0, minutes: 0, seconds: 0, label: null };

  const totalSeconds = Math.floor(msRemaining / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const pad = (n) => String(n).padStart(2, '0');
  return { expired: false, days, hours, minutes, seconds, label: `${pad(days)}d : ${pad(hours)}h : ${pad(minutes)}m : ${pad(seconds)}s` };
}
