'use client';

import { useEffect, useRef, useState } from 'react';

export function DealCountdown({
  endsAt,
  onEnd,
  className = '',
}: {
  endsAt: string;
  onEnd?: () => void;
  className?: string;
}) {
  const [left, setLeft] = useState(0);
  const endedRef = useRef(false);

  useEffect(() => {
    endedRef.current = false;
    const tick = () => {
      const end = new Date(endsAt).getTime();
      const next = Math.max(0, Math.floor((end - Date.now()) / 1000));
      setLeft(next);
      if (next === 0 && onEnd && !endedRef.current) {
        endedRef.current = true;
        onEnd();
      }
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [endsAt, onEnd]);

  const h = Math.floor(left / 3600);
  const m = Math.floor((left % 3600) / 60);
  const s = left % 60;
  return (
    <span className={`font-mono tabular-nums text-sm font-semibold tracking-wide ${className}`}>
      {String(h).padStart(2, '0')}:{String(m).padStart(2, '0')}:{String(s).padStart(2, '0')}
    </span>
  );
}
