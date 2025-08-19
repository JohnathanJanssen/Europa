import React, { useEffect, useRef } from "react";

interface WaveformProps {
  isActive: boolean;
}

export const Waveform: React.FC<WaveformProps> = ({ isActive }) => {
  const animationRef = useRef<number>();
  const barsRef = useRef<number[]>([8, 14, 10, 18, 12, 16, 9, 13, 11, 15]);
  const [bars, setBars] = React.useState<number[]>(barsRef.current);

  useEffect(() => {
    let frame = 0;
    function animate() {
      if (isActive) {
        // Animate bars with a smooth, intelligent pulse
        setBars(bars =>
          bars.map((_, i) =>
            8 +
            Math.round(
              8 +
                Math.sin(frame / 7 + i) * 6 +
                Math.cos(frame / 11 - i) * 4 +
                (Math.random() - 0.5) * 2
            )
          )
        );
        frame++;
        animationRef.current = requestAnimationFrame(animate);
      }
    }
    if (isActive) {
      animate();
    } else {
      setBars([8, 14, 10, 18, 12, 16, 9, 13, 11, 15]);
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    }
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [isActive]);

  return (
    <div className="flex items-end gap-[2px] h-8 w-full px-2">
      {bars.map((h, i) => (
        <div
          key={i}
          className={`transition-all duration-100 rounded-full`}
          style={{
            width: 6,
            height: `${h * 1.5}px`,
            background: isActive
              ? `linear-gradient(180deg, #60a5fa 0%, #a21caf 100%)`
              : `linear-gradient(180deg, #334155 0%, #1e293b 100%)`,
            boxShadow: isActive
              ? "0 0 8px 2px #6366f1, 0 0 16px 4px #a21caf44"
              : "none",
            opacity: isActive ? 0.95 : 0.5,
          }}
        />
      ))}
    </div>
  );
};