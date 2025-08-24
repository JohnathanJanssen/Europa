import React, { useEffect, useRef, useState } from 'react';
import { speak } from "../../runtime/voice";
import { VisionEngine, Det, Detection } from '../../vision/engine';
import Overlay from '../vision/Overlay';
import { getFaceName, setFaceName, type TrackId } from "../../vision/face/db";

function AskForName({ onSubmit }:{ onSubmit:(name:string)=>void }){
  const [v,setV] = React.useState("");
  React.useEffect(()=>{
    speak("I don't recognize you yet. What should I call you?");
  },[]);
  return (
    <div className="mt-4 flex items-center gap-3">
      <input
        autoFocus
        value={v}
        onChange={e=>setV(e.target.value)}
        onKeyDown={e=>{ if(e.key==="Enter" && v.trim()) onSubmit(v.trim());}}
        placeholder="What should I call you?"
        className="flex-1 rounded-2xl px-4 py-3 text-slate-200 bg-slate-950/60 ring-1 ring-white/10 focus:outline-none"
      />
      <button
        onClick={()=> v.trim() && onSubmit(v.trim())}
        className="rounded-2xl px-4 py-3 bg-gradient-to-br from-violet-500 to-fuchsia-500 text-white font-semibold shadow-lg shadow-violet-500/20">
        ➤
      </button>
    </div>
  );
}

export default function VisionPanel() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [dets, setDets] = useState<Det[]>([]);
  const [dims, setDims] = useState({ w: 640, h: 480 });
  const engineRef = useRef(new VisionEngine());
  const [isPaused, setIsPaused] = useState(document.hidden);
  const [needNameFor, setNeedNameFor] = useState<TrackId | undefined>(undefined);

  useEffect(() => {
    let stream: MediaStream | null = null;
    let mounted = true;

    async function onUnknownFace(trackId: TrackId) {
      if (getFaceName(trackId) || needNameFor === trackId) return;
      setNeedNameFor(trackId);
    }

    async function openCam() {
      if (isPaused) return;
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' }, audio: false });
        if (!mounted) return;
        const v = videoRef.current!;
        v.srcObject = stream;
        await v.play();
        setDims({ w: v.videoWidth || 640, h: v.videoHeight || 480 });

        await engineRef.current.init();
        engineRef.current.start(v, (detections: Detection[]) => {
          if (!mounted || isPaused) return;
          const labeledDets: Det[] = detections.map((d, i) => {
            const trackId = (d as any).trackId ?? `${i}`;
            if (d.label === 'face' && !getFaceName(trackId)) {
              onUnknownFace(trackId);
            }
            const [x, y, w, h] = d.box;
            return { x, y, w, h, label: getFaceName(trackId) ?? d.label, score: d.score, trackId };
          });
          setDets(labeledDets);
        });
      } catch (err) {
        console.error("Camera/vision error:", err);
      }
    }

    openCam();
    const handleVisibilityChange = () => setIsPaused(document.hidden);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      mounted = false;
      engineRef.current.stop();
      if (stream) stream.getTracks().forEach(t => t.stop());
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [isPaused]);

  function enrollName(name: string) {
    if (needNameFor) setFaceName(needNameFor, name);
    setNeedNameFor(undefined);
  }

  return (
    <div className="w-full relative">
      <div className="relative rounded-xl overflow-hidden border border-white/10 bg-black/40">
        <video ref={videoRef} muted playsInline className="w-full h-auto block" />
        <Overlay dets={dets} width={dims.w} height={dims.h} />
        {isPaused && (
          <div className="absolute inset-0 grid place-items-center text-white/80 text-sm">
            Vision paused
          </div>
        )}
      </div>
      {needNameFor && <AskForName onSubmit={enrollName} />}
    </div>
  );
}