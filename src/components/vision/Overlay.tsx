import React, { useEffect, useRef } from 'react';
import type { Det } from '../../vision/engine';

export default function Overlay({ dets, video }:{ dets: Det[]; video: HTMLVideoElement | null }) {
  const canvasRef = useRef<HTMLCanvasElement|null>(null);

  useEffect(() => {
    const cvs = canvasRef.current; if (!cvs || !video) return;
    const vw = video.videoWidth || 640, vh = video.videoHeight || 480;
    const cw = cvs.clientWidth || cvs.parentElement?.clientWidth || 640;
    const ch = cvs.clientHeight || cvs.parentElement?.clientHeight || 480;
    cvs.width = cw; cvs.height = ch;
    const sx = cw / vw, sy = ch / vh;

    const ctx = cvs.getContext('2d')!;
    ctx.clearRect(0,0,cw,ch);
    ctx.lineWidth = 2; ctx.font = '12px system-ui'; ctx.textBaseline = 'top';

    dets.forEach(d => {
      const x = Math.max(0, Math.floor(d.x * sx));
      const y = Math.max(0, Math.floor(d.y * sy));
      const w = Math.floor(d.w * sx);
      const h = Math.floor(d.h * sy);
      ctx.strokeStyle = 'rgba(180, 180, 255, 0.95)';
      ctx.shadowColor = 'rgba(0,0,0,0.7)'; ctx.shadowBlur = 6;
      ctx.strokeRect(x,y,w,h); ctx.shadowBlur = 0;

      const label = `${d.label} ${(d.score*100|0)}%`;
      const padX=6,padY=2; const th=16; const tw = Math.ceil(ctx.measureText(label).width)+padX*2;
      ctx.fillStyle = 'rgba(18,18,28,0.85)';
      ctx.fillRect(x, Math.max(0,y-th), tw, th);
      ctx.fillStyle = 'rgba(220,220,255,0.95)';
      ctx.fillText(label, x+padX, Math.max(0,y-th)+padY);
    });

    // subtle center reticle to confirm overlay is above the video
    ctx.strokeStyle = 'rgba(255,255,255,0.25)';
    ctx.beginPath(); ctx.moveTo(cw/2-8, ch/2); ctx.lineTo(cw/2+8, ch/2); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cw/2, ch/2-8); ctx.lineTo(cw/2, ch/2+8); ctx.stroke();
  }, [dets, video]);

  const chips = Array.from(new Set(dets.map(d=>d.label))).slice(0,4);
  return (
    <>
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none"/>
      <div className="absolute top-2 left-2 flex gap-1 flex-wrap max-w-[70%]">
        {chips.map(c => <span key={c} className="text-[11px] px-2 py-[2px] rounded-full bg-black/60 text-zinc-100 backdrop-blur">{c}</span>)}
      </div>
    </>
  );
}