import React, { useEffect, useRef, useState } from 'react';
import { listCameras, startCamera, stopStream } from '../../vision/camera';
import { Monitor, Smartphone, RefreshCw } from 'lucide-react';
import { VisionEngine, type Det } from '../../vision/engine';
import Overlay from './Overlay';

type Cam = { id: string; label: string };

export default function LiveCamera() {
  const videoRef = useRef<HTMLVideoElement|null>(null);
  const [cams, setCams] = useState<Cam[]>([]);
  const [activeId, setActiveId] = useState<string|undefined>(undefined);
  const [stream, setStream] = useState<MediaStream|null>(null);
  const [busy, setBusy] = useState(false);
  const [dets, setDets] = useState<Det[]>([]);
  const engineRef = useRef<VisionEngine|null>(null);

  async function refreshList() {
    const list = await listCameras();
    const mapped = list.map(d => ({ id: d.deviceId, label: d.label || 'Camera' }));
    setCams(mapped);
    if (!activeId && mapped[0]) setActiveId(mapped[0].id);
  }

  async function start(id?: string) {
    setBusy(true);
    engineRef.current?.stop();
    stopStream(stream);
    try {
      const s = await startCamera(id);
      setStream(s);
      if (videoRef.current) {
        videoRef.current.srcObject = s;
        await videoRef.current.play();
        engineRef.current = new VisionEngine(videoRef.current!);
        engineRef.current.start((found)=>setDets(found));
      }
      setActiveId(id);
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    refreshList();
    return () => {
      stopStream(stream);
      engineRef.current?.stop();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (activeId) start(activeId);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeId]);

  return (
    <div className="w-full h-[360px] sm:h-[400px] rounded-xl overflow-hidden bg-black relative text-white">
      <video
        ref={videoRef}
        className="absolute inset-0 w-full h-full object-cover"
        playsInline muted
      />
      <Overlay dets={dets} video={videoRef.current}/>
      {/* Controls strip */}
      <div className="absolute left-2 right-2 bottom-2 flex items-center gap-2">
        <div className="flex items-center gap-2 bg-zinc-900/70 backdrop-blur rounded-xl px-2 py-1">
          {/* Desktop camera quick-pick (first cam) */}
          <button
            className="p-2 rounded-md hover:bg-zinc-800 disabled:opacity-50"
            title="Desktop camera"
            disabled={busy || cams.length===0}
            onClick={() => cams[0] && setActiveId(cams[0].id)}
          >
            <Monitor size={18}/>
          </button>

          {/* iPhone pairing - stub for later */}
          <button
            className="p-2 rounded-md opacity-50 cursor-not-allowed"
            title="iPhone camera (coming soon)"
          >
            <Smartphone size={18}/>
          </button>

          {/* Cycle through cams if multiple */}
          <button
            className="p-2 rounded-md hover:bg-zinc-800 disabled:opacity-50"
            title="Next camera"
            disabled={busy || cams.length<2}
            onClick={() => {
              if (cams.length < 2) return;
              const idx = Math.max(0, cams.findIndex(c=>c.id===activeId));
              const next = cams[(idx+1)%cams.length];
              if (next) setActiveId(next.id);
            }}
          >
            <RefreshCw size={18}/>
          </button>

          {/* Small list */}
          <select
            className="bg-transparent text-sm outline-none"
            value={activeId || ''}
            onChange={(e)=>setActiveId(e.target.value)}
          >
            {cams.map(c => <option key={c.id} value={c.id}>{c.label || 'Camera'}</option>)}
          </select>
        </div>

        <div className="ml-auto text-xs bg-zinc-900/70 rounded-md px-2 py-1">
          {busy ? 'Switching…' : (stream ? 'Live' : 'Ready')}
        </div>
      </div>
    </div>
  );
}