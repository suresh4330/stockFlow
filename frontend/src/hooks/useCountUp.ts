import { useEffect, useRef, useState } from "react";

const EASE_OUT_EXPO = (t: number) => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t));

export function useCountUp(target: number, duration = 600): number {
  const [value, setValue] = useState(0);
  const startTime = useRef<number | null>(null);
  const frame = useRef<number | null>(null);

  useEffect(() => {
    startTime.current = null;
    if (frame.current) cancelAnimationFrame(frame.current);

    const tick = (now: number) => {
      if (startTime.current === null) startTime.current = now;
      const elapsed = now - startTime.current;
      const progress = Math.min(elapsed / duration, 1);
      const eased = EASE_OUT_EXPO(progress);
      setValue(target * eased);
      if (progress < 1) {
        frame.current = requestAnimationFrame(tick);
      } else {
        setValue(target);
      }
    };
    frame.current = requestAnimationFrame(tick);
    return () => {
      if (frame.current) cancelAnimationFrame(frame.current);
    };
  }, [target, duration]);

  return value;
}
