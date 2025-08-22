import React, { useEffect, useRef } from "react";
import type { Det } from "../../vision/engine";

export default function Overlay({
  dets, video
}: { dets: Det[]; video: HTMLVideoElement | null }) {
  const canvasRef = useRef<HTMLCanvasElement|null>(null);

  useEffect(() => {
    const cvs = canvasRef.current;
    if (!cvs || !video) return;
    const vw = video.videoWidth || video.clientWidth;
    const vh = video.videoHeight || video.clientHeight;
    if (!vw || !vh) return;
    const cw = cvs.clientWidth, ch = cvs.clientHeight;
    cvs.width = cw; cvs.height = ch;
    const sx = cw / vw, sy = ch / vh;

    const ctx = cvs.getContext("2d")!;
    ctx.clearRect(0,0,cw,ch);
    ctx.lineWidth = 2;
    ctx.font = "12px system-ui";
    ctx.textBaseline = "top";

    dets.forEach(d => {
      const x = Math.max(0, Math.floor(d.x * sx));
      const y = Math.max(0, Math.floor(d.y * sy));
      const w = Math.floor(d.w * sx);
      const h = Math.floor(d.h * sy);

      // box
      ctx.strokeStyle = "rgba(180, 180, 255, 0.95)";
      ctx.shadowColor = "rgba(0,0,0,0.7)";
      ctx.shadowBlur = 6;
      ctx.strokeRect(x, y, w, h);
      ctx.shadowBlur = 0;

      // label pill
      const label = `${d.label} ${(d.score*100|0)}%`;
      const padX = 6, padY = 2;
      const tw = Math.ceil(ctx.measureText(label).width) + padX*2;
      const th = 16;
      ctx.fillStyle = "rgba(18,18,28,0.85)";
      ctx.fillRect(x, Math.max(0,y-th), tw, th);
      ctx.fillStyle = "rgba(220,220,255,0.95)";
      ctx.fillText(label, x+padX, Math.max(0,y-th)+padY);
    });
  }, [dets, video]);

  // “what I’m noticing” strip (top-left)
  const chips = Array.from(new Set(dets.map(d=>d.label))).slice(0,4);

  return (
    <>
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none"/>
      <div className="absolute top-2 left-2 flex gap-1 flex-wrap max-w-[70%]">
        {chips.map(c => (
          <span key={c}
            className="text-[11px] px-2 py-[2px] rounded-full bg-black/60 text-zinc-100 backdrop-blur">
            {c}
          </span>
        ))}
      </div>
    </>
  );
}