import React, { useEffect, useRef } from "react";

interface WaveformProps {
  isActive: boolean;
}

export const Waveform: React.FC<WaveformProps> = ({ isActive }) => {
  const animationRef = useRef<number>();
  const [bars, setBars] = React.useState<number[]>([8, 12, 18, 14, 10, 16, 12, 9, 13, 11]);

  useEffect(() => {
    let frame = 0;
    function animate() {
      if (isActive) {
        setBars(bars =>
          bars.map((_, i) =>
            10 +
            Math.round(
              6 +
                Math.sin(frame / 10 + i) * 4 +
                Math.cos(frame / 17 - i) * 2 +
                (Math.random() - 0.5) * 1.2
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
      setBars([8, 12, 18, 14, 10, 16, 12, 9, 13, 11]);
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    }
    return () => {
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
    };
  }, [isActive]);

  return (
    <div className="relative w-full flex justify-center items-end h-6 mt-1 pointer-events-none select-none">
      <div className="absolute left-0 right-0 mx-auto flex gap-[3px] justify-center items-end h-full z-10">
        {bars.map((h, i) => (
          <div
            key={i}
            className="rounded-full transition-all duration-100"
            style={{
              width: 7,
              height: `${h}px`,
              background: isActive
                ? "linear-gradient(180deg, #7dd3fc 0%, #a78bfa 100%)"
                : "linear-gradient(180deg, #334155 0%, #1e293b 100%)",
              boxShadow: isActive
                ? "0 0 12px 2px #7dd3fc88, 0 0 24px 6px #a78bfa33"
                : "none",
              opacity: isActive ? 0.7 : 0.3,
              filter: isActive ? "blur(0.5px)" : "blur(0.5px)",
            }}
          />
        ))}
      </div>
      {/* Soft glow under the bars */}
      {isActive && (
        <div className="absolute left-0 right-0 mx-auto h-4 w-36 rounded-full blur-2xl opacity-40 z-0"
          style={{
            background: "radial-gradient(ellipse at center, #7dd3fc88 0%, #a78bfa22 80%, transparent 100%)"
          }}
        />
      )}
    </div>
  );
};