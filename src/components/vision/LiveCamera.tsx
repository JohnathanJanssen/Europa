import React, { useEffect, useRef, useState } from 'react';
import { VisionEngine, Det } from '../../vision/engine';
import Overlay from './Overlay';

type Props = {
  onClose?: () => void;
  onEnrolledName?: (name: string) => void; // optional: bubble up
};

export default function LiveCamera({ onClose, onEnrolledName }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [ready, setReady] = useState(false);
  const [dets, setDets] = useState<Det[]>([]);
  const [asking, setAsking] = useState(false);
  const [name, setName] = useState('');
  const [dims, setDims] = useState({ w: 640, h: 480 });
  const engineRef = useRef(new VisionEngine());
  const askedOnceRef = useRef(false);

  // Camera open/close
  useEffect(() => {
    let stream: MediaStream | null = null;
    let mounted = true;

    async function openCam() {
      try {
        stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' }, audio: false });
        if (!mounted) return;
        const v = videoRef.current!;
        v.srcObject = stream;
        await v.play();
        setDims({ w: v.videoWidth || 640, h: v.videoHeight || 480 });

        await engineRef.current.init();
        engineRef.current.start(v, (d) => {
          setDets(d);
          // Ask for identity once per session if we see a person and no stored name
          const stored = localStorage.getItem('jupiter_user_name');
          const seesPerson = d.some(x => x.label === 'person' && x.score > 0.6);
          if (!stored && seesPerson && !askedOnceRef.current) {
            askedOnceRef.current = true;
            setAsking(true);
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
      setReady(false);
      engineRef.current.stop();
      engineRef.current.dispose();
      if (stream) stream.getTracks().forEach(t => t.stop());
    };
  }, []);

  const submitName = () => {
    const clean = name.trim();
    if (!clean) return;
    localStorage.setItem('jupiter_user_name', clean);
    setAsking(false);
    onEnrolledName?.(clean);
  };

  return (
    <div className="w-full">
      <div className="relative rounded-xl overflow-hidden border border-white/10 bg-black/40">
        <video ref={videoRef} muted playsInline
               className="w-full h-auto block" />
        <Overlay dets={dets} width={dims.w} height={dims.h} />
        {!ready && (
          <div className="absolute inset-0 grid place-items-center text-white/80 text-sm">
            Starting camera…
          </div>
        )}
      </div>

      {/* Same chat input row for identity (shows only once, then hides) */}
      {asking && (
        <div className="mt-3 flex items-center gap-2">
          <div className="flex-1 rounded-2xl bg-[#171821]/75 border border-white/10 px-4 py-3 text-white/90">
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={(e) => (e.key === 'Enter' ? submitName() : null)}
              placeholder="I don’t recognize you yet — what should I call you?"
              className="bg-transparent outline-none w-full placeholder-white/40"
            />
          </div>
          <button
            onClick={submitName}
            className="h-11 w-11 rounded-2xl bg-gradient-to-br from-[#5b63ff] to-[#ab35ff] grid place-items-center
                       shadow hover:scale-[1.02] active:scale-[0.98] transition"
            aria-label="Send"
          >
            ➤
          </button>
        </div>
      )}

      <div className="mt-2 flex justify-end">
        <button
          onClick={onClose}
          className="text-white/60 text-sm hover:text-white/90"
        >
          Close
        </button>
      </div>
    </div>
  );
}