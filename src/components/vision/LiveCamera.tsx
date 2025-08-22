import React, { useEffect, useRef, useState } from 'react';
import { VisionEngine, Det } from '../../vision/engine';
import Overlay from './Overlay';

export default function LiveCamera() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [ready, setReady] = useState(false);
  const [dets, setDets] = useState<Det[]>([]);
  const [dims, setDims] = useState({ w: 640, h: 480 });
  const engineRef = useRef(new VisionEngine());
  const askedOnceRef = useRef(false);
  const [isPaused, setIsPaused] = useState(document.hidden);

  const [askName, setAskName] = useState(false);
  const [name, setName] = useState('');

  useEffect(() => {
    const handleVisibilityChange = () => setIsPaused(document.hidden);
    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, []);

  useEffect(() => {
    let stream: MediaStream | null = null;
    let mounted = true;

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
        engineRef.current.start(v, (d) => {
          if (!mounted || isPaused) return;
          setDets(d);
          const stored = localStorage.getItem('jupiter_user_name');
          const seesPerson = d.some(x => x.label === 'person' && x.score > 0.6);
          if (!stored && seesPerson && !askedOnceRef.current) {
            askedOnceRef.current = true;
            setAskName(true);
          }
        });
        setReady(true);
      } catch {
        setReady(false);
      }
    }
    
    openCam();

    return () => {
      mounted = false;
      engineRef.current.stop();
      if (stream) stream.getTracks().forEach(t => t.stop());
    };
  }, [isPaused]);

  const submitName = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = name.trim();
    if (!clean) return;
    localStorage.setItem('jupiter_user_name', clean);
    setAskName(false);
    setName('');
  };

  return (
    <div className="w-full relative">
      <div className="relative rounded-xl overflow-hidden border border-white/10 bg-black/40">
        <video ref={videoRef} muted playsInline className="w-full h-auto block" />
        <Overlay dets={dets} width={dims.w} height={dims.h} />
        {!ready && !isPaused && (
          <div className="absolute inset-0 grid place-items-center text-white/80 text-sm">
            Starting camera…
          </div>
        )}
        {isPaused && (
            <div className="absolute inset-0 grid place-items-center text-white/80 text-sm">
                Vision paused
            </div>
        )}
      </div>

      {askName && (
        <form className="jc-identity-row" onSubmit={submitName}>
          <input className="jc-input" value={name} onChange={e=>setName(e.target.value)} placeholder="I don’t recognize you yet — what should I call you?" autoFocus />
          <button className="jc-send" type="submit" aria-label="Submit">➤</button>
        </form>
      )}
    </div>
  );
}