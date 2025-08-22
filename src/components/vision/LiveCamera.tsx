import React,{useEffect,useRef,useState} from 'react';
import { listCameras, startCamera, stopStream, waitForVideoReady } from '../../vision/camera';
import { VisionEngine } from '../../vision/engine';
import type { Det, Track, Face, Pose, QRHit, OCRHit, SceneSense } from '../../vision/types';
import Overlay from './Overlay';
import { Recognizer } from '../../vision/face/recognizer';
import { detectPose } from '../../vision/skills/pose';
import { scanQR } from '../../vision/skills/qr';
import { classifyScene } from '../../vision/skills/scene';
import { scanCenterText } from '../../vision/skills/ocr';
import { think } from '../../vision/thoughts/bus';
import { visionBus } from '../../runtime/visionBus';
import VisionBoundary from '../VisionBoundary';

function Inner(){
  const mounted = useRef(true);
  useEffect(()=>()=>{ mounted.current=false; },[]);
  const videoRef=useRef<HTMLVideoElement|null>(null);
  const timers: number[] = [];
  const clearTimers=()=>{ timers.forEach(id=>clearInterval(id)); };

  const [cams,setCams]=useState<{id:string;label:string}[]>([]);
  const [activeId,setActiveId]=useState<string>();
  const [stream,setStream]=useState<MediaStream|null>(null);
  const [status,setStatus]=useState<'idle'|'loading'|'running'>('idle');

  const [dets,setDets]=useState<Det[]>([]);
  const [tracks,setTracks]=useState<Track[]>([]);
  const [faces,setFaces]=useState<Face[]>([]);
  const [pose,setPose]=useState<Pose|null>(null);
  const [qr,setQR]=useState<QRHit|null>(null);
  const [ocr,setOCR]=useState<OCRHit|null>(null);
  const [scene,setScene]=useState<SceneSense|null>(null);
  const [motion, setMotion] = useState<{grid:Float32Array,w:number,h:number}|null>(null);

  const [analyze,setAnalyze]=useState(true);
  const [facesOn,setFacesOn]=useState(true);
  const [poseOn,setPoseOn]=useState(true);
  const [qrOn,setQROn]=useState(true);
  const [sceneOn,setSceneOn]=useState(true);
  const [ocrOn,setOCROn]=useState(false);

  useEffect(()=>{ (async()=>{ const L=await listCameras(); setCams(L.map(d=>({id:d.deviceId,label:d.label||'Camera'}))); if(!activeId && L[0]) setActiveId(L[0].deviceId); })(); },[]);
  function cleanup(){
    clearTimers();
    stopStream(stream);
    setStatus('idle');
    visionBus.setOnline(false);
  }
  useEffect(()=>visionBus.onEnroll.on(()=>{/* stop waiting loop on enroll */}),[]);

  useEffect(()=>{ if(!activeId) return;
    (async()=>{
      cleanup(); setStatus('loading');
      try{
        const s=await startCamera(activeId); if(!mounted.current) return;
        setStream(s);
        const v=videoRef.current; if(!v) return;
        v.srcObject=s; await v.play(); await waitForVideoReady(v);

        const engine=new VisionEngine(v); engine.fps=6; engine.minScore=0.30;
        await engine.start(({tracks,dets,insights, motion})=>{
          if(!mounted.current || !analyze) return;
          setTracks(tracks); setDets(dets); setMotion(motion);
          insights.forEach(i=>{ if(i.kind==='count'){ const best=Object.entries(i.counts).sort((a,b)=>b[1]-a[1])[0]; if(best) think(`seeing ${best[1]} ${best[0]}`); }});
        });

        const recog=new Recognizer(v);
        recog.start((fs)=>{
          if(!mounted.current || !analyze || !facesOn) return;
          setFaces(fs);
          const u = fs.find(f=>!f.name);
          if (u){
            const sig = (u as any).signature || `${Math.round(u.x||0)}:${Math.round(u.y||0)}:${Math.round(u.w||0)}:${Math.round(u.h||0)}`;
            visionBus.requestIdentity(sig);
          }
        });

        const every=(ms:number,fn:()=>void)=>{ fn(); const id=window.setInterval(fn,ms); timers.push(id); };
        every(250,  async()=>{ if(poseOn  && analyze && mounted.current) setPose(await detectPose(v)); });
        every(1000,      ()=>{ if(qrOn    && analyze && mounted.current) setQR(scanQR(v) || null); });
        every(2500, async()=>{ if(sceneOn && analyze && mounted.current) setScene(await classifyScene(v)); });
        every(4000, async()=>{ if(ocrOn   && analyze && mounted.current) setOCR(await scanCenterText(v) || null); });

        setStatus('running'); visionBus.setOnline(true);
      } catch { /* swallow */ }
    })();
    return cleanup;
  },[activeId]);

  return (
    <div className="w-full h-[360px] rounded-xl overflow-hidden bg-black relative">
      <video ref={videoRef} className="absolute inset-0 w-full h-full object-cover" playsInline muted />
      <Overlay dets={dets} tracks={tracks} faces={faces} pose={pose} qr={qr} ocr={ocr} scene={scene} video={videoRef.current} motion={motion}/>
      <div className="absolute left-2 right-2 bottom-2 flex items-center gap-2 bg-zinc-900/70 border border-zinc-800 rounded-xl px-2 py-1">
        <button className="text-xs px-2 py-1 rounded hover:bg-zinc-800" onClick={()=>setAnalyze(v=>!v)}>{analyze?'Pause':'Analyze'}</button>
        <label className="text-[11px] flex items-center gap-1"><input type="checkbox" checked={facesOn} onChange={e=>setFacesOn(e.target.checked)}/> Faces</label>
        <label className="text-[11px] flex items-center gap-1"><input type="checkbox" checked={poseOn}  onChange={e=>setPoseOn(e.target.checked)}/> Pose</label>
        <label className="text-[11px] flex items-center gap-1"><input type="checkbox" checked={qrOn}    onChange={e=>setQROn(e.target.checked)}/> QR</label>
        <label className="text-[11px] flex items-center gap-1"><input type="checkbox" checked={sceneOn} onChange={e=>setSceneOn(e.target.checked)}/> Scene</label>
        <label className="text-[11px] flex items-center gap-1"><input type="checkbox" checked={ocrOn}   onChange={e=>setOCROn(e.target.checked)}/> Text</label>
        <div className="ml-auto text-[11px] px-2 py-1 rounded bg-zinc-900/70">{status==='running'?'Live':'Ready'}</div>
      </div>
    </div>
  );
}

export default function LiveCamera(){
  return (
    <VisionBoundary>
      <Inner/>
    </VisionBoundary>
  );
}