import { listCameras, startCamera, stopStream, waitForVideoReady } from '../../vision/camera';
import { VisionEngine, type Det } from '../../vision/engine';
import Overlay from './Overlay';
import React, { useEffect, useRef, useState } from 'react';
import { Monitor, Smartphone, RefreshCw } from 'lucide-react';

const StatusPill = ({ text }: { text: string }) =>
  <div className="ml-auto text-xs bg-zinc-900/70 rounded-md px-2 py-1">{text}</div>;

export default function LiveCamera() {
  const videoRef = useRef<HTMLVideoElement|null>(null);
  const [cams, setCams] = useState<{id:string;label:string}[]>([]);
  const [activeId, setActiveId] = useState<string|undefined>(undefined);
  const [stream, setStream] = useState<MediaStream|null>(null);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<'idle'|'loading'|'running'>('idle');
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
    setStatus('loading');
    engineRef.current?.stop();
    stopStream(stream);
    try {
      const s = await startCamera(id);
      setStream(s);
      if (videoRef.current) {
        videoRef.current.srcObject = s;
        await videoRef.current.play();
        await waitForVideoReady(videoRef.current);
      }
      setDets([]);
      if (videoRef.current) {
        engineRef.current = new VisionEngine(videoRef.current);
        engineRef.current.fps = 6;
        engineRef.current.minScore = 0.30;
        await engineRef.current.start((found)=>setDets(found));
      }
      setStatus('running');
      setActiveId(id);
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => { refreshList(); return () => { stopStream(stream); engineRef.current?.stop(); } }, []);
  useEffect(() => { if (activeId) start(activeId); }, [activeId]);

  return (
    <div className="w-full h-[360px] sm:h-[400px] rounded-xl overflow-hidden bg-black relative text-white">
      <video ref={videoRef} className="absolute inset-0 w-full h-full object-cover" playsInline muted />
      <Overlay dets={dets} video={videoRef.current}/>
      <div className="absolute left-2 right-2 bottom-2 flex items-center gap-2">
        <div className="flex items-center gap-2 bg-zinc-900/70 backdrop-blur rounded-xl px-2 py-1">
          <button className="p-2 rounded-md hover:bg-zinc-800 disabled:opacity-50" disabled={busy || cams.length===0} onClick={()=>cams[0] && setActiveId(cams[0].id)} title="Desktop camera"><Monitor size={18}/></button>
          <button className="p-2 rounded-md opacity-50 cursor-not-allowed" title="iPhone camera (coming soon)"><Smartphone size={18}/></button>
          <button className="p-2 rounded-md hover:bg-zinc-800 disabled:opacity-50" disabled={busy || cams.length<2} onClick={()=>{
            if (cams.length<2) return;
            const idx = Math.max(0, cams.findIndex(c=>c.id===activeId));
            const next = cams[(idx+1)%cams.length]; if (next) setActiveId(next.id);
          }} title="Next camera"><RefreshCw size={18}/></button>
          <select className="bg-transparent text-sm outline-none" value={activeId || ''} onChange={(e)=>setActiveId(e.target.value)}>
            {cams.map(c => <option key={c.id} value={c.id}>{c.label || 'Camera'}</option>)}
          </select>
        </div>
        <StatusPill text={status==='loading' ? 'Loading model…' : status==='running' ? (dets.length ? `Live · ${dets.length}` : 'Live · …') : 'Ready'} />
      </div>
    </div>
  );
}