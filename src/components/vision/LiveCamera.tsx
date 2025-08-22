import React, { useEffect, useRef, useState } from 'react';
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

const Pill = ({text}:{text:string}) =>
  <div className="ml-auto text-xs bg-zinc-900/70 rounded-md px-2 py-1">{text}</div>;

export default function LiveCamera() {
  const videoRef = useRef<HTMLVideoElement|null>(null);
  const timersRef = useRef<number[]>([]);
  const [cams, setCams] = useState<{id:string;label:string}[]>([]);
  const [activeId, setActiveId] = useState<string|undefined>();
  const [stream, setStream] = useState<MediaStream|null>(null);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<'idle'|'loading'|'running'>('idle');

  const [dets, setDets] = useState<Det[]>([]);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [motion, setMotion] = useState<{grid:Float32Array,w:number,h:number}|null>(null);

  const [faces, setFaces] = useState<Face[]>([]);
  const [pose, setPose] = useState<Pose|null>(null);
  const [qr, setQR] = useState<QRHit|null>(null);
  const [ocr, setOCR] = useState<OCRHit|null>(null);
  const [scene, setScene] = useState<SceneSense|null>(null);

  const engineRef = useRef<VisionEngine|null>(null);
  const reconRef  = useRef<Recognizer|null>(null);

  const [analyze, setAnalyze] = useState(true);
  const [facesOn, setFacesOn] = useState(true);
  const [poseOn, setPoseOn] = useState(true);
  const [qrOn, setQROn] = useState(true);
  const [sceneOn, setSceneOn] = useState(true);
  const [ocrOn, setOCROn] = useState(false);

  async function refreshList() {
    const list = await listCameras();
    const mapped = list.map(d => ({ id: d.deviceId, label: d.label || 'Camera' }));
    setCams(mapped);
    if (!activeId && mapped[0]) setActiveId(mapped[0].id);
  }

  function clearTimers() { timersRef.current.forEach(id => clearInterval(id)); timersRef.current = []; }
  function cleanup() {
    clearTimers();
    engineRef.current?.stop(); engineRef.current = null;
    reconRef.current?.stop();  reconRef.current  = null;
    stopStream(stream);
    setStatus('idle');
    visionBus.setOnline(false);
  }

  // receive enrollment from chat
  useEffect(() => visionBus.onEnroll.on((name) => {
    const r: any = reconRef.current;
    if (r?.enrollLastUnknown) r.enrollLastUnknown(name);
    think(`enrolled: ${name}`);
  }), []);

  useEffect(()=>{ refreshList(); return cleanup; }, []);

  useEffect(()=>{ if (!activeId) return;
    (async () => {
      cleanup();
      setBusy(true); setStatus('loading');
      try {
        const s = await startCamera(activeId); setStream(s);
        if (videoRef.current) {
          videoRef.current.srcObject = s;
          await videoRef.current.play();
          await waitForVideoReady(videoRef.current);
        }

        if (videoRef.current) {
          const v = videoRef.current;

          // engine
          engineRef.current = new VisionEngine(v);
          engineRef.current.fps = 6;
          engineRef.current.minScore = 0.30;
          await engineRef.current.start(({tracks, dets, insights, motion}) => {
            if (!analyze) return;
            setDets(dets); setTracks(tracks); setMotion(motion);
            insights.forEach(i => {
              if (i.kind === 'count') {
                const top = Object.entries(i.counts).sort((a,b)=>b[1]-a[1]).slice(0,2)
                  .map(([k,v]) => `${v} ${k}`).join(', ');
                if (top) think(`seeing ${top}`);
              } else if (i.kind === 'motion') {
                think(`motion on the ${i.zone}`);
              } else if (i.kind === 'novel') {
                think(`new ${i.label}`);
              }
            });
          });

          // faces
          setFaces([]);
          if (facesOn) {
            reconRef.current = new Recognizer(v);
            reconRef.current.start((fs) => {
              setFaces(fs);
              const known = fs.filter(f => f.name).map(f => f.name).join(', ');
              if (known) think(`with ${known}`);
              if (fs.some(f => f.isNew)) {
                think('new face—name?');
                visionBus.requestIdentity();
              }
            });
          }

          const every = (ms:number, fn:()=>void) => { fn(); const id = window.setInterval(fn, ms); timersRef.current.push(id); };

          every(250,  async () => { if (poseOn  && analyze) setPose(await detectPose(v)); });
          every(1000,       () => { if (qrOn    && analyze) setQR(scanQR(v) || null);     });
          every(2500, async () => { if (sceneOn && analyze) setScene(await classifyScene(v)); });
          every(4000, async () => { if (ocrOn   && analyze) setOCR(await scanCenterText(v) || null); });
        }

        setStatus('running');
        visionBus.setOnline(true);
      } catch (e) {
        cleanup();
        throw e;
      } finally {
        setBusy(false);
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeId, analyze, facesOn, poseOn, qrOn, sceneOn, ocrOn]);

  useEffect(()=>{ if(!analyze){ setDets([]); setTracks([]); setMotion(null); setPose(null); setQR(null); setOCR(null); setScene(null); } },[analyze]);

  return (
    <div className="w-full h-[360px] sm:h-[400px] rounded-xl overflow-hidden bg-black relative">
      <video ref={videoRef} className="absolute inset-0 w-full h-full object-cover" playsInline muted />

      <Overlay
        dets={dets} tracks={tracks} video={videoRef.current} motion={motion}
        faces={faces} pose={pose} qr={qr} ocr={ocr} scene={scene}
      />

      <div className="absolute left-2 right-2 bottom-2 flex items-center gap-2">
        <div className="flex items-center gap-2 bg-zinc-900/70 backdrop-blur rounded-xl px-2 py-1">
          <button className="p-2 rounded-md hover:bg-zinc-800 disabled:opacity-50"
                  disabled={busy || cams.length===0}
                  onClick={()=>cams[0] && setActiveId(cams[0].id)}
                  title="Primary camera">●</button>
          <button className="p-2 rounded-md opacity-50 cursor-not-allowed" title="iPhone camera (coming soon)">📱</button>
          <button className="p-2 rounded-md hover:bg-zinc-800 disabled:opacity-50"
                  disabled={busy || cams.length<2}
                  onClick={()=>{
                    if (cams.length<2) return;
                    const idx = Math.max(0, cams.findIndex(c => c.id===activeId));
                    const next = cams[(idx+1) % cams.length];
                    if (next) setActiveId(next.id);
                  }}
                  title="Next camera">↻</button>

          <label className="text-xs flex items-center gap-1 ml-1"><input type="checkbox" checked={analyze} onChange={e=>setAnalyze(e.target.checked)}/> Analyze</label>
          <label className="text-xs flex items-center gap-1"><input type="checkbox" checked={facesOn} onChange={e=>setFacesOn(e.target.checked)}/> Faces</label>
          <label className="text-xs flex items-center gap-1"><input type="checkbox" checked={poseOn} onChange={e=>setPoseOn(e.target.checked)}/> Pose</label>
          <label className="text-xs flex items-center gap-1"><input type="checkbox" checked={qrOn} onChange={e=>setQROn(e.target.checked)}/> QR</label>
          <label className="text-xs flex items-center gap-1"><input type="checkbox" checked={sceneOn} onChange={e=>setSceneOn(e.target.checked)}/> Scene</label>
          <label className="text-xs flex items-center gap-1"><input type="checkbox" checked={ocrOn} onChange={e=>setOCROn(e.target.checked)}/> Text</label>
        </div>
        <Pill text={status==='loading' ? 'Loading…' : status==='running' ? (dets.length ? `Live · ${dets.length}` : 'Live · …') : 'Ready'} />
      </div>
    </div>
  );
}