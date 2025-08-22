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
import Thoughts from './Thoughts';

const Pill = ({text}:{text:string}) =>
  <div className="ml-auto text-xs bg-zinc-900/70 rounded-md px-2 py-1">{text}</div>;

export default function LiveCamera() {
  const videoRef = useRef<HTMLVideoElement|null>(null);
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

  // feature toggles
  const [analyze, setAnalyze]   = useState(true);
  const [enableFaces, setEnableFaces] = useState(true);
  const [enablePose, setEnablePose] = useState(true);
  const [enableQR, setEnableQR]       = useState(true);
  const [enableScene, setEnableScene] = useState(true);
  const [enableOCR, setEnableOCR]     = useState(false); // heavy; off by default

  async function refreshList() {
    const list = await listCameras();
    const mapped = list.map(d => ({ id: d.deviceId, label: d.label || 'Camera' }));
    setCams(mapped);
    if (!activeId && mapped[0]) setActiveId(mapped[0].id);
  }

  async function start(id?:string) {
    setBusy(true); setStatus('loading'); stopStream(stream);
    try {
      const s = await startCamera(id); setStream(s);
      if (videoRef.current) {
        videoRef.current.srcObject = s;
        await videoRef.current.play();
        await waitForVideoReady(videoRef.current);
      }

      // engine
      engineRef.current?.stop();
      if (videoRef.current) {
        engineRef.current = new VisionEngine(videoRef.current);
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
        reconRef.current?.stop();
        setFaces([]);
        if (enableFaces) {
          reconRef.current = new Recognizer(videoRef.current);
          reconRef.current.start((fs) => {
            setFaces(fs);
            const known = fs.filter(f => f.name).map(f => f.name).join(', ');
            if (known) think(`with ${known}`);
            if (fs.some(f => f.isNew)) think('new face—name?');
          });
        }

        // cadence loops
        const v = videoRef.current;
        const timers:number[] = [];
        const every = (ms:number, fn:()=>void) => { fn(); const id = window.setInterval(fn, ms); timers.push(id as any); };

        const loopPose  = async () => { if (!enablePose  || !analyze) return;
          const p = await detectPose(v); setPose(p); if (p && p.score>0.5) think('tracking posture'); };

        const loopQR    = async () => { if (!enableQR    || !analyze) return;
          const h = scanQR(v); if (h) { setQR(h); think('found QR'); } else setQR(null); };

        const loopScene = async () => { if (!enableScene || !analyze) return;
          const s = await classifyScene(v); if (s) setScene(s); };

        const loopOCR   = async () => { if (!enableOCR   || !analyze) return;
          const t = await scanCenterText(v); if (t) { setOCR(t); think(`text: ${t.text.slice(0,40)}`); } else setOCR(null); };

        every(250,  loopPose);   // ~4 Hz
        every(1000, loopQR);     // 1 Hz
        every(2500, loopScene);  // 0.4 Hz
        every(4000, loopOCR);    // 0.25 Hz

        // cleanup on camera swap
        return () => timers.forEach(clearInterval);
      }

      setStatus('running');
    } finally {
      setBusy(false);
    }
  }

  useEffect(()=>{ refreshList(); return () => stopStream(stream); },[]);
  useEffect(()=>{ if (activeId) start(activeId); },[activeId]);
  useEffect(()=>{ if(!analyze){ setDets([]); setTracks([]); setMotion(null); setPose(null); setQR(null); setOCR(null); setScene(null); } },[analyze]);

  return (
    <div className="w-full h-[360px] sm:h-[400px] rounded-xl overflow-hidden bg-black relative">
      <video ref={videoRef} className="absolute inset-0 w-full h-full object-cover" playsInline muted />

      <Overlay
        dets={dets} tracks={tracks} video={videoRef.current} motion={motion}
        faces={faces} pose={pose} qr={qr} ocr={ocr} scene={scene}
      />

      {/* Controls */}
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

          <label className="text-xs flex items-center gap-1 ml-1">
            <input type="checkbox" checked={analyze} onChange={e=>setAnalyze(e.target.checked)}/> Analyze
          </label>
          <label className="text-xs flex items-center gap-1">
            <input type="checkbox" checked={enableFaces} onChange={e=>setEnableFaces(e.target.checked)}/> Faces
          </label>
          <label className="text-xs flex items-center gap-1">
            <input type="checkbox" checked={enablePose} onChange={e=>setEnablePose(e.target.checked)}/> Pose
          </label>
          <label className="text-xs flex items-center gap-1">
            <input type="checkbox" checked={enableQR} onChange={e=>setEnableQR(e.target.checked)}/> QR
          </label>
          <label className="text-xs flex items-center gap-1">
            <input type="checkbox" checked={enableScene} onChange={e=>setEnableScene(e.target.checked)}/> Scene
          </label>
          <label className="text-xs flex items-center gap-1">
            <input type="checkbox" checked={enableOCR} onChange={e=>setEnableOCR(e.target.checked)}/> Text
          </label>
        </div>
        <Pill text={status==='loading' ? 'Loading…' : status==='running' ? (dets.length ? `Live · ${dets.length}` : 'Live · …') : 'Ready'} />
      </div>

      {/* Jupiter's live thoughts */}
      <Thoughts />
    </div>
  );
}