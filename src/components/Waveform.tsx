import { useEffect, useState } from "react";

/**
 * useGlowLevel - returns a value between 0 and 1 for glow intensity.
 * When isActive is true, the value pulses smoothly.
 */
export function useGlowLevel(isActive: boolean) {
  const [glow, setGlow] = useState(0);

  useEffect(() => {
    let frame = 0;
    let raf: number;
    function animate() {
      if (isActive) {
        // Pulse between 0.5 and 1.0
        setGlow(0.5 + 0.5 * Math.abs(Math.sin(frame / 18)));
        frame++;
        raf = requestAnimationFrame(animate);
      } else {
        setGlow(0);
      }
    }
    if (isActive) {
      animate();
    } else {
      setGlow(0);
    }
    return () => {
      if (raf) cancelAnimationFrame(raf);
    };
  }, [isActive]);

  return glow;
}