import React, { useEffect, useMemo, useRef, useState } from "react";
import { getFaceName, setFaceName } from "../../vision/face/db";

type Box = { x: number; y: number; w: number; h: number; trackId: string; label?: string; conf?: number };

const hasFaceDetector = typeof (window as any).FaceDetector !== "undefined";
const FaceDetectorRef: any = (window as any).FaceDetector;

export default function VisionPanel({
  onClose,
  onSpeak,
  thoughtsPush,
}: {
  onClose?: () => void;
  onSpeak?: (t: string) => void;
  thoughtsPush?: (t: string) => void;
}) {
  const video = useRef<HTMLVideoElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const [askingId, setAskingId] = useState<string | null>(null);
  const [input, setInput] = useState("");

  const detector = useMemo(() => {
    if (hasFaceDetector) {
      try { return new FaceDetectorRef({ fastMode: true }); } catch {}
    }
    return null;
  }, []);

  useEffect(() => {
    let stream: MediaStream | null = null;
    let raf = 0;
    let running = true;

    const start = async () => {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" }, audio: false });
        if (video.current) {
          video.current.srcObject = stream;
          await video.current.play().catch(() => {});
        }
        loop();
      } catch (err) {
        console.error("Failed to get camera stream:", err);
        thoughtsPush?.("Camera not available.");
      }
    };

    const loop = async () => {
      if (!running) return;
      const v = video.current, c = canvas.current;
      if (v && c && v.videoWidth > 0 && v.videoHeight > 0) {
        if (c.width !== v.videoWidth) { c.width = v.videoWidth; c.height = v.videoHeight; }
        const ctx = c.getContext("2d")!;
        ctx.clearRect(0,0,c.width,c.height);

        let boxes: Box[] = [];
        if (detector && document.visibilityState === "visible") {
          try {
            const faces = await detector.detect(v);
            boxes = faces.map((f: any, i: number) => {
              const b = f.boundingBox;
              const trackId = `${Math.round(b.x)}-${Math.round(b.y)}-${Math.round(b.width)}-${Math.round(b.height)}`;
              return { x: b.x, y: b.y, w: b.width, h: b.height, trackId, label: "person", conf: 0.9 };
            });
          } catch {}
        }

        for (const b of boxes) {
          const name = getFaceName(b.trackId);
          drawBox(ctx, b, name ? `${name}` : `${b.label ?? "person"} ${Math.round((b.conf ?? 0.9)*100)}%`);
          if (!name && !askingId) {
            setAskingId(b.trackId);
            const promptText = "I don’t recognize you yet. What should I call you?";
            thoughtsPush?.(promptText);
            onSpeak?.(promptText);
          }
        }
      }
      raf = requestAnimationFrame(loop);
    };

    const vis = () => {
      if (document.visibilityState === "hidden") {
        if (video.current) video.current.pause();
      } else {
        if (video.current && video.current.srcObject) video.current.play().catch(()=>{});
      }
    };
    document.addEventListener("visibilitychange", vis);

    start();
    return () => {
      running = false;
      cancelAnimationFrame(raf);
      document.removeEventListener("visibilitychange", vis);
      if (stream) stream.getTracks().forEach(t => t.stop());
    };
  }, [detector, askingId, onSpeak, thoughtsPush]);

  function submitName() {
    const n = input.trim();
    if (askingId && n) {
      setFaceName(askingId, n);
      setAskingId(null);
      setInput("");
      const confirmation = `Okay. I'll remember you as ${n}.`;
      thoughtsPush?.(`Okay — I’ll remember you as “${n}”.`);
      onSpeak?.(confirmation);
    }
  }

  return (
    <div className="panel-card">
      <div className="panel-head">
        <div className="title">Vision</div>
        <button className="close" onClick={onClose}>Close</button>
      </div>

      <div className="video-wrap">
        <video ref={video} muted playsInline className="video"></video>
        <canvas ref={canvas} className="overlay"></canvas>
      </div>

      {askingId && (
        <div className="enroll-row">
          <input
            autoFocus
            value={input}
            onChange={e=>setInput(e.target.value)}
            placeholder="What should I call you?"
            onKeyDown={e=>{ if(e.key==="Enter") submitName(); }}
          />
          <button className="send" onClick={submitName}>➤</button>
        </div>
      )}
    </div>
  );
}

function drawBox(ctx: CanvasRenderingContext2D, b: Box, text: string) {
  ctx.save();
  ctx.lineWidth = 2;
  ctx.strokeStyle = "rgba(122,162,247,0.95)";
  ctx.fillStyle = "rgba(122,162,247,0.12)";
  ctx.beginPath();
  ctx.roundRect(b.x, b.y, b.w, b.h, 10);
  ctx.fill();
  ctx.stroke();

  const pad = 6;
  ctx.font = "14px ui-sans-serif, system-ui, -apple-system";
  const mw = ctx.measureText(text).width + pad*2;
  const mh = 22;
  ctx.fillStyle = "rgba(15,23,42,0.9)";
  ctx.fillRect(b.x, Math.max(0, b.y - mh - 6), mw, mh);
  ctx.fillStyle = "white";
  ctx.fillText(text, b.x + pad, Math.max(0, b.y - 10));
  ctx.restore();
}