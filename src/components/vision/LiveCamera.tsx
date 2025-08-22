import { listCameras, startCamera, stopStream, waitForVideoReady } from '../../vision/camera';
import { VisionEngine } from '../../vision/engine';
import type { Det, Track, Insight, Face } from '../../vision/types';
import Overlay from './Overlay';
import React, { useEffect, useRef, useState } from 'react';
import { Monitor, Smartphone, RefreshCw } from 'lucide-react';
import { Recognizer } from '../../vision/face/recognizer';
import NameFace from './NameFace';

const Pill = ({text}:{text:string}) => <div className="ml-auto text-xs bg-zinc-900/70 rounded-md px-2 py-1">{text}</div>;

export default function LiveCamera() {
  const videoRef = useRef<HTMLVideoElement|null>(null);
  const [cams, setCams] = useState<{id:string;label:string}[]>([]);
  const [activeId, setActiveId] = useState<string|undefined>(undefined);
  const [stream, setStream] = useState<MediaStream|null>(null);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<'idle'|'loading'|'running'>('idle');
  const [dets, setDets] = useState<Det[]>([]);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [motion, setMotion] = useState<{grid:Float32Array,w:number,h:number}|null>(null);
  const [analyze, setAnalyze] = useState(true);
  const [log, setLog] = useState<string[]>([]);
  const [faces, setFaces] = useState<Face[]>([]);
  const [nameAsk, setNameAsk] = useState<Face|null>(null);
  const engineRef = useRef<VisionEngine|null>(null);
  const recognizerRef = useRef<Recognizer|null>(null);

  async function refreshList(){ const list=await listCameras(); const mapped=list.map(d=>({id:d.deviceId,label:d.label||'Camera'})); setCams(mapped); if(!activeId && mapped[0]) setActiveId(mapped[0].id); }

  async function start(id?:string){
    setBusy(true); setStatus('loading'); 
    engineRef.current?.stop();
    recognizerRef.current?.stop();
    stopStream(stream);
    try{
      const s=await startCamera(id); setStream(s);
      if(videoRef.current){ videoRef.current.srcObject=s; await videoRef.current.play(); await waitForVideoReady(videoRef.current); }
      
      setDets([]); setTracks([]); setMotion(null); setFaces([]);
      if(videoRef.current){
        engineRef.current=new VisionEngine(videoRef.current);
        engineRef.current.fps=6; engineRef.current.minScore=0.30;
        await engineRef.current.start(({tracks,dets,insights,motion})=>{
          if (!analyze) return;
          setDets(dets); setTracks(tracks); setMotion(motion);
          // insights ticker (compact)
          const lines: string[] = [];
          for (const i of insights) {
            if (i.kind==='count') {
              const top = Object.entries(i.counts).sort((a,b)=>b[1]-a[1]).slice(0,2).map(([k,v])=>`${v} ${k}`).join(', ');
              lines.push(top ? `seeing: ${top}` : '');
            } else if (i.kind==='motion') {
              lines.push(`motion: ${i.zone}`);
            } else if (i.kind==='novel') {
              lines.push(`new: ${i.label}`);
            }
          }
          const msg = lines.filter(Boolean)[0];
          if (msg) setLog(prev => (prev[0]===msg ? prev : [msg, ...prev].slice(0,5)));
        });

        // start face recognizer
        recognizerRef.current = new Recognizer(videoRef.current);
        recognizerRef.current.start((fs)=>{
          if (!analyze) return;
          setFaces(fs);
          // if an unknown face appears, ask once (non-blocking)
          const unknown = fs.find(f => f.isNew && f.descriptor);
          if (unknown && !nameAsk) setNameAsk(unknown);
        });
      }
      setStatus('running');
      setActiveId(id);
    } finally { setBusy(false); }
  }

  useEffect(()=>{ refreshList(); return () => { stopStream(stream); engineRef.current?.stop(); recognizerRef.current?.stop(); } },[]);
  useEffect(()=>{ if(activeId) start(activeId); },[activeId]);
  // allow toggling analyze without restarting camera
  useEffect(()=>{ if(!analyze){ setDets([]); setTracks([]); setMotion(null); setFaces([]); } },[analyze]);

  return (
    <div className="w-full h-[360px] sm:h-[400px] rounded-xl overflow-hidden bg-black relative text-white">
      <video ref={videoRef} className="absolute inset-0 w-full h-full object-cover" playsInline muted />
      <Overlay dets={dets} tracks={tracks} video={videoRef.current} motion={motion} faces={faces}/>
      {/* controls */}
      <div className="absolute left-2 right-2 bottom-2 flex items-center gap-2">
        <div className="flex items-center gap-2 bg-zinc-900/70 backdrop-blur rounded-xl px-2 py-1">
          <button className="p-2 rounded-md hover:bg-zinc-800 disabled:opacity-50" disabled={busy || cams.length===0} onClick={()=>cams[0] && setActiveId(cams[0].id)} title="Desktop camera"><Monitor size={18}/></button>
          <button className="p-2 rounded-md opacity-50 cursor-not-allowed" title="iPhone camera (coming soon)"><Smartphone size={18}/></button>
          <button className="p-2 rounded-md hover:bg-zinc-800 disabled:opacity-50" disabled={busy || cams.length<2} onClick={()=>{
            if (cams.length<2) return; const idx=Math.max(0,cams.findIndex(c=>c.id===activeId)); const next=cams[(idx+1)%cams.length]; if(next) setActiveId(next.id); }} title="Next camera"><RefreshCw size={18}/></button>
          <select className="bg-transparent text-sm outline-none" value={activeId || ''} onChange={(e)=>setActiveId(e.target.value)}>
            {cams.map(c => <option key={c.id} value={c.id}>{c.label || 'Camera'}</option>)}
          </select>
          <label className="ml-2 text-xs flex items-center gap-1 text-white">
            <input type="checkbox" checked={analyze} onChange={e=>setAnalyze(e.target.checked)} className="form-checkbox h-3 w-3 text-blue-500 bg-gray-800 border-gray-600 rounded focus:ring-blue-500" /> Analyze
          </label>
        </div>
        <Pill text={status==='loading'?'Loading…': status==='running'?(dets.length?`Live · ${dets.length}`:'Live · …'):'Ready'} />
      </div>
      <NameFace candidate={nameAsk} onDone={()=>setNameAsk(null)} />
      {/* quiet ticker (Jupiter's thoughts) */}
      <div className="absolute top-2 right-2 text-[11px] bg-black/55 rounded-md px-2 py-1 max-w-[46%] backdrop-blur text-white text-right">
        {log[0] || 'observing'}
      </div>
      <div className="sr-only">Privacy: face memory stores locally only. Use Settings → Forget Faces to clear.</div>
    </div>
  );
}