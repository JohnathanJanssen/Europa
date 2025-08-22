import React, { useEffect, useRef } from "react";

type Props = {
  className?: string;
  onClose?: () => void;
  stream?: MediaStream | null;
  boxes?: Array<{ x:number; y:number; w:number; h:number; label?: string; p?: number }>;
};

export default function VisionPanel({ className, onClose, stream, boxes = [] }: Props){
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    v.srcObject = stream ?? null;
    if (stream) v.play().catch(()=>{});
  }, [stream]);

  useEffect(() => {
    const cvs = canvasRef.current, v = videoRef.current;
    if (!cvs || !v) return;
    const ctx = cvs.getContext("2d");
    if (!ctx) return;

    const draw = () => {
      const { videoWidth: w, videoHeight: h } = v;
      if (w && h) { cvs.width = w; cvs.height = h; }
      ctx.clearRect(0,0,cvs.width,cvs.height);
      for (const b of boxes) {
        ctx.strokeStyle = "rgba(180,200,255,.85)";
        ctx.lineWidth = 2;
        ctx.strokeRect(b.x, b.y, b.w, b.h);
        if (b.label){
          const tag = `${b.label}${b.p ? ` ${Math.round(b.p*100)}%` : ""}`;
          ctx.fillStyle = "rgba(20,26,40,.9)";
          ctx.fillRect(b.x, Math.max(0, b.y-18), ctx.measureText(tag).width + 10, 18);
          ctx.fillStyle = "rgba(220,230,255,.95)";
          ctx.font = "12px ui-sans-serif, system-ui";
          ctx.fillText(tag, b.x + 5, Math.max(12, b.y-6));
        }
      }
      requestAnimationFrame(draw);
    };
    let id = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(id);
  }, [boxes]);

  return (
    <div className={className ?? ""} role="region" aria-label="Vision">
      <div className="panel-head">
        <div className="title">Vision</div>
        <button className="x" onClick={onClose} aria-label="Close">Close</button>
      </div>
      <div className="vision-wrap">
        <video ref={videoRef} playsInline muted className="vision-video" />
        <canvas ref={canvasRef} className="vision-overlay" />
      </div>
    </div>
  );
}