import React, { forwardRef, useEffect, useRef } from "react";

interface WaveformProps {
  isActive: boolean;
}

export const Waveform = forwardRef<HTMLCanvasElement, WaveformProps>(
  ({ isActive }, ref) => {
    const localRef = useRef<HTMLCanvasElement>(null);

    useEffect(() => {
      const canvas = (ref as React.RefObject<HTMLCanvasElement>)?.current || localRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      if (isActive) {
        // Simple animated waveform
        let frame = 0;
        let anim: number;
        const draw = () => {
          ctx.clearRect(0, 0, canvas.width, canvas.height);
          ctx.strokeStyle = "#3b82f6";
          ctx.lineWidth = 2;
          ctx.beginPath();
          for (let x = 0; x < canvas.width; x += 4) {
            const y =
              canvas.height / 2 +
              Math.sin((x + frame * 8) / 20) * (canvas.height / 4);
            ctx.lineTo(x, y);
          }
          ctx.stroke();
          frame++;
          anim = requestAnimationFrame(draw);
        };
        draw();
        return () => cancelAnimationFrame(anim);
      }
    }, [isActive, ref]);

    return (
      <canvas
        ref={ref || localRef}
        width={240}
        height={32}
        className="w-full h-8 bg-gray-200 rounded"
        aria-label="Waveform"
      />
    );
  }
);