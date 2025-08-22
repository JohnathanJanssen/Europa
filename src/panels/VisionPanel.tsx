import React, { useEffect, useRef, useState } from "react";
import "../styles/shell.css";

/**
 * Loads LiveCamera only if it exists (no hard import),
 * otherwise falls back to a simple getUserMedia camera.
 */
type AnyComp = React.ComponentType<any> | null;

export default function VisionPanel() {
  const [Comp, setComp] = useState<AnyComp>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      // Try to find your real LiveCamera component (safe if missing).
      const candidates = import.meta.glob("/src/components/vision/LiveCamera.tsx");
      const load = candidates["/src/components/vision/LiveCamera.tsx"];
      if (load) {
        try {
          const mod: any = await load();
          if (!cancelled) setComp(() => (mod?.default ?? null));
          return;
        } catch {
          // fall through to fallback
        }
      }
      if (!cancelled) setComp(() => FallbackCamera);
    })();
    return () => { cancelled = true; };
  }, []);

  const Body = Comp ?? Placeholder;
  return (
    <div className="jupiter-panel" style={{ height: "100%", display: "grid" }}>
      <Body />
    </div>
  );
}

function Placeholder() {
  return <div style={{ padding: 12, color: "#cfe1ff" }}>Vision is preparing…</div>;
}

function FallbackCamera() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
        if (!mounted) { stream.getTracks().forEach(t => t.stop()); return; }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play();
        }
      } catch {
        // ignore; camera blocked or unavailable
      }
    })();
    return () => {
      mounted = false;
      const s = streamRef.current;
      if (s) s.getTracks().forEach(t => t.stop());
    };
  }, []);

  return (
    <video
      ref={videoRef}
      playsInline
      muted
      style={{ width: "100%", borderRadius: 12, background: "#000", aspectRatio: "4 / 3" }}
    />
  );
}