import React, { useEffect, useRef } from 'react';
import type { Det } from '../../vision/types';
type Track = import('../../vision/types').Track;

export default function Overlay({
  dets, tracks, video, motion
}: { dets: Det[]; tracks: Track[]; video: HTMLVideoElement | null; motion: {grid:Float32Array,w:number,h:number} | null }) {
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

    // motion heatmap (very subtle)
    if (motion) {
      const cellW = cw / motion.w, cellH = ch / motion.h;
      ctx.save();
      for (let y=0;y<motion.h;y++){
        for (let x=0;x<motion.w;x++){
          const v = motion.grid[y*motion.w+x];
          if (v>0.15){
            ctx.fillStyle = `rgba(255,80,80,${Math.min(0.25, v*0.25)})`;
            ctx.fillRect(x*cellW, y*cellH, cellW, cellH);
          }
        }
      }
      ctx.restore();
    }

    // tracks with trails
    ctx.lineWidth = 2; ctx.textBaseline='top'; ctx.font='12px system-ui';
    tracks.forEach(t => {
      const x = Math.floor(t.x*sx), y = Math.floor(t.y*sy), w = Math.floor(t.w*sx), h = Math.floor(t.h*sy);
      // neon box
      ctx.shadowColor='rgba(100,100,255,0.9)'; ctx.shadowBlur=10; ctx.strokeStyle='rgba(160,180,255,0.95)'; ctx.strokeRect(x,y,w,h);
      ctx.shadowBlur=0;

      // id/label pill
      const label = `#${t.id} ${t.label} ${(t.score*100|0)}%`;
      const padX=6,padY=2, th=16; const tw=Math.ceil(ctx.measureText(label).width)+padX*2;
      ctx.fillStyle='rgba(18,18,28,0.9)'; ctx.fillRect(x, Math.max(0,y-th), tw, th);
      ctx.fillStyle='rgba(230,235,255,0.98)'; ctx.fillText(label, x+padX, Math.max(0,y-th)+padY);

      // trail
      ctx.strokeStyle='rgba(160,180,255,0.6)'; ctx.lineWidth=1.5;
      ctx.beginPath();
      t.trail.forEach(([px,py],i) => { const tx = px*sx, ty = py*sy; if (i===0) ctx.moveTo(tx,ty); else ctx.lineTo(tx,ty); });
      ctx.stroke();
    });

    // center reticle
    ctx.strokeStyle='rgba(255,255,255,0.25)';
    ctx.beginPath(); ctx.moveTo(cw/2-8, ch/2); ctx.lineTo(cw/2+8, ch/2); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cw/2, ch/2-8); ctx.lineTo(cw/2, ch/2+8); ctx.stroke();
  }, [dets, tracks, video, motion]);

  const chips = Array.from(new Set(dets.map(d=>d.label))).slice(0,5);
  return (
    <>
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none"/>
      <div className="absolute top-2 left-2 flex gap-1 flex-wrap max-w-[72%]">
        {chips.map(c => <span key={c} className="text-[11px] px-2 py-[2px] rounded-full bg-black/60 text-zinc-100 backdrop-blur">{c}</span>)}
      </div>
    </>
  );
}