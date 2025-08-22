import React, { useEffect, useRef } from 'react';
import type { Det, Face, Pose, QRHit, OCRHit, SceneSense } from '../../vision/types';
type Track = import('../../vision/types').Track;

export default function Overlay({
  dets, tracks, video, motion, faces, pose, qr, ocr, scene
}: {
  dets: Det[]; tracks: Track[]; video?: HTMLVideoElement | null;
  motion: {grid:Float32Array,w:number,h:number} | null;
  faces?: Face[]; pose?: Pose | null; qr?: QRHit | null; ocr?: OCRHit | null; scene?: SceneSense | null;
}) {
  const canvasRef = useRef<HTMLCanvasElement|null>(null);

  useEffect(() => {
    const cvs = canvasRef.current; if (!cvs || !video) return;
    const vw = video.videoWidth || 640, vh = video.videoHeight || 480;
    if (!vw || !vh) return; // Guard against 0 dimensions
    const cw = cvs.clientWidth || cvs.parentElement?.clientWidth || 640;
    const ch = cvs.clientHeight || cvs.parentElement?.clientHeight || 480;
    cvs.width = cw; cvs.height = ch;
    const sx = cw / vw, sy = ch / vh;
    const ctx = cvs.getContext('2d')!;
    ctx.clearRect(0,0,cw,ch);

    // motion heatmap (subtle)
    if (motion) {
      const cellW = cw / motion.w, cellH = ch / motion.h;
      for (let y=0;y<motion.h;y++){
        for (let x=0;x<motion.w;x++){
          const v = motion.grid[y*motion.w+x];
          if (v>0.15){
            ctx.fillStyle = `rgba(255,80,80,${Math.min(0.25, v*0.25)})`;
            ctx.fillRect(x*cellW, y*cellH, cellW, cellH);
          }
        }
      }
    }

    // tracked objects (keep from previous version)
    ctx.lineWidth = 2; ctx.textBaseline='top'; ctx.font='12px system-ui';
    tracks.forEach(t => {
      const x = Math.floor(t.x*sx), y = Math.floor(t.y*sy), w = Math.floor(t.w*sx), h = Math.floor(t.h*sy);
      ctx.shadowColor='rgba(100,100,255,0.9)'; ctx.shadowBlur=10; ctx.strokeStyle='rgba(160,180,255,0.95)'; ctx.strokeRect(x,y,w,h); ctx.shadowBlur=0;
      const label = `#${t.id} ${t.label} ${(t.score*100|0)}%`;
      const padX=6,padY=2, th=16; const tw=Math.ceil(ctx.measureText(label).width)+padX*2;
      ctx.fillStyle='rgba(18,18,28,0.9)'; ctx.fillRect(x, Math.max(0,y-th), tw, th);
      ctx.fillStyle='rgba(230,235,255,0.98)'; ctx.fillText(label, x+padX, Math.max(0,y-th)+padY);
      // trail
      ctx.strokeStyle='rgba(160,180,255,0.6)'; ctx.lineWidth=1.5; ctx.beginPath();
      t.trail.forEach(([px,py],i) => { const tx = px*sx, ty = py*sy; if (i===0) ctx.moveTo(tx,ty); else ctx.lineTo(tx,ty); }); ctx.stroke();
    });

    // faces (kept)
    if (faces?.length) for (const f of faces) {
      const x = Math.floor(f.x*sx), y = Math.floor(f.y*sy), w = Math.floor(f.w*sx), h = Math.floor(f.h*sy);
      ctx.strokeStyle = f.name ? 'rgba(178, 102, 255, 0.95)' : 'rgba(255, 190, 92, 0.95)';
      ctx.lineWidth = 2; ctx.shadowColor='rgba(0,0,0,0.6)'; ctx.shadowBlur=8; ctx.strokeRect(x,y,w,h); ctx.shadowBlur=0;
      const label = f.name ? `${f.name}` : `new?`;
      const padX=6,padY=2, th=18; const tw=Math.ceil(ctx.measureText(label).width)+padX*2;
      ctx.fillStyle = f.name ? 'rgba(88, 43, 138, 0.85)' : 'rgba(138, 86, 24, 0.85)';
      ctx.fillRect(x, Math.max(0,y-th), tw, th);
      ctx.fillStyle = 'rgba(240,240,255,0.98)'; ctx.fillText(label, x+padX, Math.max(0,y-th)+padY);
    }

    // pose skeleton
    if (pose && pose.keypoints?.length) {
      ctx.strokeStyle='rgba(0,255,180,0.9)'; ctx.lineWidth=2;
      const pts = pose.keypoints.filter(k=>k.score>0.35).map(k=>({x:k.x*sx, y:k.y*sy}));
      const link = (a:number,b:number)=>{ if(pts[a]&&pts[b]){ ctx.beginPath(); ctx.moveTo(pts[a].x,pts[a].y); ctx.lineTo(pts[b].x,pts[b].y); ctx.stroke(); } };
      // rough skeleton (indices per MoveNet order)
      const [nose, leftEye, rightEye, leftEar, rightEar, leftShoulder, rightShoulder, leftElbow, rightElbow, leftWrist, rightWrist, leftHip, rightHip, leftKnee, rightKnee, leftAnkle, rightAnkle] =
        [0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16];
      [ [leftShoulder,rightShoulder],[leftShoulder,leftElbow],[leftElbow,leftWrist],[rightShoulder,rightElbow],[rightElbow,rightWrist],
        [leftShoulder,leftHip],[rightShoulder,rightHip],[leftHip,rightHip],[leftHip,leftKnee],[leftKnee,leftAnkle],[rightHip,rightKnee],[rightKnee,rightAnkle],
        [nose,leftEye],[nose,rightEye],[leftEye,leftEar],[rightEye,rightEar]
      ].forEach(([a,b])=>link(a,b));
    }

    // QR
    if (qr) {
      ctx.strokeStyle='rgba(255,220,0,0.95)'; ctx.lineWidth=3; ctx.beginPath();
      const c = qr.corners; ctx.moveTo(c[0].x*sx,c[0].y*sy); for(let i=1;i<c.length;i++) ctx.lineTo(c[i].x*sx,c[i].y*sy); ctx.closePath(); ctx.stroke();
      const label = qr.text.slice(0,28);
      ctx.font='12px system-ui'; const tw=Math.ceil(ctx.measureText(label).width)+12;
      ctx.fillStyle='rgba(30,30,0,0.8)'; ctx.fillRect(c[0].x*sx, c[0].y*sy-18, tw, 16);
      ctx.fillStyle='#ffe066'; ctx.fillText(label, c[0].x*sx+6, c[0].y*sy-16+12);
    }

    // OCR box (if any)
    if (ocr) {
      const x=ocr.box.x*sx, y=ocr.box.y*sy, w=ocr.box.w*sx, h=ocr.box.h*sy;
      ctx.setLineDash([6,4]); ctx.strokeStyle='rgba(255,255,255,0.6)'; ctx.strokeRect(x,y,w,h); ctx.setLineDash([]);
    }

    // scene label
    if (scene) {
      const text = `${scene.label} ${(scene.prob*100|0)}%`;
      ctx.font='12px system-ui';
      const tw = Math.ceil(ctx.measureText(text).width)+10;
      ctx.fillStyle='rgba(0,0,0,0.55)'; ctx.fillRect(cw-tw-10, 10, tw, 18);
      ctx.fillStyle='rgba(230,230,255,0.95)'; ctx.fillText(text, cw-tw-5, 23);
    }

    // reticle
    ctx.strokeStyle='rgba(255,255,255,0.25)';
    ctx.beginPath(); ctx.moveTo(cw/2-8, ch/2); ctx.lineTo(cw/2+8, ch/2); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cw/2, ch/2-8); ctx.lineTo(cw/2, ch/2+8); ctx.stroke();
  }, [dets, tracks, video, motion, faces, pose, qr, ocr, scene]);

  const chips = Array.from(new Set([
    ...dets.map(d=>d.label),
    ...(faces||[]).map(f=>f.name || 'face'),
    scene?.label ? `scene:${scene.label}` : ''
  ].filter(Boolean))).slice(0,6);

  return (
    <>
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none"/>
      <div className="absolute top-2 left-2 flex gap-1 flex-wrap max-w-[72%]">
        {chips.map(c => <span key={c} className="text-[11px] px-2 py-[2px] rounded-full bg-black/60 text-zinc-100 backdrop-blur">{c}</span>)}
      </div>
    </>
  );
}