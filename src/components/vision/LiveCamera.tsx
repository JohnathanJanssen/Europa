import { listCameras, startCamera, stopStream, waitForVideoReady } from '../../vision/camera';
import { VisionEngine } from '../../vision/engine';
import type { Det, Track, Face, Pose, QRHit, OCRHit, SceneSense } from '../../vision/types';
import Overlay from './Overlay';
import React, { useEffect, useRef, useState } from 'react';
import { Monitor, Smartphone, RefreshCw } from 'lucide-react';
import { Recognizer } from '../../vision/face/recognizer';
import NameFace from './NameFace';
import { detectPose } from '../../vision/skills/pose';
import { scanQR } from '../../vision/skills/qr';
import { classifyScene } from '../../vision/skills/scene';
import { scanCenterText } from '../../vision/skills/ocr';
import { think } from '../../vision/thoughts/bus';
import Thoughts from './Thoughts';

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

  const [faces, setFaces] = useState<Face[]>([]);
  const [nameAsk, setNameAsk] = useState<Face|null>(null);

  const [pose, setPose] = useState<Pose|null>(null);
  const [qr, setQR] = useState<QRHit|null>(null);
  const [ocr, setOCR] = useState<OCRHit|null>(null);
  const [scene, setScene] = useState<SceneSense|null>(null);

  const engineRef = useRef<VisionEngine|null>(null);
  const reconRef = useRef<Recognizer|null>(null);

  // feature toggles
  const [analyze, setAnalyze] = useState(true);
  const [enableFaces, setEnableFaces] = useState(true);
  const [enablePose, setEnablePose] = useState(true);
  const [enableQR, setEnableQR] = useState(true);
  const [enableScene, setEnableScene] = useState(true);
  const [enableOCR, setEnableOCR] = useState(false); // heavy, opt-in

  async function refreshList(){ const list=await listCameras(); const mapped=list.map(d=>({id:d.deviceId,label:d.label||'Camera'})); setCams(mapped); if(!activeId && mapped[0]) setActiveId(mapped[0].id); }

  async function start(id?:string){
    setBusy(true); setStatus('loading'); stopStream(stream);
    let cleanup: (()=>void) | undefined;
    try{
      const s=await startCamera(id); setStream(s);
      if(videoRef.current){ videoRef.current.srcObject=s; await videoRef.current.play(); await waitForVideoReady(videoRef.current); }
      engineRef.current?.stop();
      if(videoRef.current){
        engineRef.current=new VisionEngine(videoRef.current);
        engineRef.current.fps=6; engineRef.current.minScore=0.30;
        await engineRef.current.start(({tracks,dets,insights,motion})=>{
          if (!analyze) return;
          setDets(dets); setTracks(tracks); setMotion(motion);
          // translate insights → thoughts
          insights.forEach(i=>{
            if (i.kind==='count') {
              const top = Object.entries(i.counts).sort((a,b)=>b[1]-a[1]).slice(0,2).map(([k,v])=>`${v} ${k}`).join(', ');
              if (top) think(`seeing ${top}`);
            } else if (i.kind==='motion') {
              think(`motion on the ${i.zone}`);
            } else if (i.kind==='novel') {
              think(`new ${i.label}`);
            }
          });
        });

        // faces
        reconRef.current?.stop(); setFaces([]); setNameAsk(null);
        if (enableFaces) {
          reconRef.current = new Recognizer(videoRef.current);
          reconRef.current.start((fs)=>{
            if (!analyze) return;
            setFaces(fs);
            const unk = fs.find(f => f.isNew && f.descriptor);
            if (unk) { setNameAsk(unk); think('new face—name?'); }
            const known = fs.filter(f=>f.name).map(f=>f.name).join(', ');
            if (known) think(`with ${known}`);
          });
        }

        // side loops (pose/qr/scene/ocr) at different cadences
        const v = videoRef.current;
        const loopPose = async ()=>{ if (!enablePose || !analyze) return; const p = await detectPose(v); setPose(p); if (p && p.score>0.5) think('tracking posture'); };
        const loopQR   = async ()=>{ if (!enableQR  || !analyze) return; const h = scanQR(v); if (h) { setQR(h); think('found QR'); } else setQR(null); };
        const loopScene= async ()=>{ if (!enableScene || !analyze) return; const s = await classifyScene(v); if (s) { setScene(s); } };
        const loopOCR  = async ()=>{ if (!enableOCR || !analyze) return; const t = await scanCenterText(v); if (t) { setOCR(t); think(`text: ${t.text.slice(0,40)}`); } else setOCR(null); };

        // timers
        const timers:number[] = [];
        const every = (ms:number, fn:()=>void) => { fn(); const id = window.setInterval(fn, ms); timers.push(id as any); };
        every(250, loopPose);      // ~4 Hz (fast but cheap)
        every(1000, loopQR);       // 1 Hz
        every(2500, loopScene);    // 0.4 Hz
        every(4000, loopOCR);      // 0.25 Hz (only if toggled)

        // teardown on camera change
        cleanup = () => {
          timers.forEach(clearInterval);
          engineRef.current?.stop();
          reconRef.current?.stop();
        };
      }
      setStatus('running');
      setActiveId(id);
    } finally { setBusy(false); }
    return cleanup;
  }

  useEffect(()=>{
    refreshList();
    return () => {
      stopStream(stream);
      engineRef.current?.stop();
      reconRef.current?.stop();
    }
  },[]);

  useEffect(()=>{
    let cleanup: (()=>void) | undefined;
    if (activeId) {
      start(activeId).then(c => cleanup = c);
    }
    return () => cleanup?.();
  <think>Deciding which files are relevant...

{
  "complexity": "high",
  "relevantFiles": [
    "package.json",
    "src/vision/types.ts",
    "src/vision/thoughts/bus.ts",
    "src/vision/skills/pose.ts",
    "src/vision/skills/qr.ts",
    "src/vision/skills/scene.ts",
    "src/vision/skills/ocr.ts",
    "src/components/vision/Overlay.tsx",
    "src/components/vision/Thoughts.tsx",
    "src/components/vision/LiveCamera.tsx"
  ]
}</think><think>Ranked files:

src/vision/engine.ts: 0.97

src/runtime/voice.ts: 0.95

src/vision/types.ts: 0.95

src/components/vision/Overlay.tsx: 0.94

src/vision/skills/motion.ts: 0.92

package.json: 0.91

src/vision/models.ts: 0.89

src/vision/skills/tracker.ts: 0.85

src/hooks/use-jupiter-tts.ts: 0.82

src/components/vision/LiveCamera.tsx: 0.81

src/vision/camera.ts: 0.80

src/vision/skills/novelty.ts: 0.72

src/vision/memory.ts: 0.71

src/pages/Settings.tsx: 0.62

src/hooks/use-jupiter-asr.ts: 0.60

src/config/jupiter.ts: 0.60

src/ai/jupiter-sense.ts: 0.53

src/components/ui/switch.tsx: 0.45

src/components/JupiterChat.tsx: 0.41

src/components/panels/SettingsPanel.tsx: 0.37

src/runtime/stt_hf.ts: 0.36

src/runtime/audio.ts: 0.32

jupiter-backend.js: 0.31

src/runtime/cap.ts: 0.28

src/hooks/use-jupiter-emotion.ts: 0.28

src/runtime/brain.ts: 0.27

src/runtime/listen.ts: 0.26

src/runtime/ui.ts: 0.26

src/components/ui/sheet.tsx: 0.25

src/lib/utils.ts: 0.25

src/vision/face/db.ts: 0.24

src/vision/skills/ocr.ts: 0.22

src/vision/face/loader.ts: 0.20

src/vision/face/recognizer.ts: 0.20

src/components/ui/drawer.tsx: 0.20

src/components/SpotlightCard.tsx: 0.20

src/pages/Index.tsx: 0.20

src/components/ui/toggle.tsx: 0.19

src/runtime/wake.ts: 0.19

vite.config.ts: 0.18

src/components/ui/popover.tsx: 0.17

src/personality/jupiter.ts: 0.17

src/components/ui/badge.tsx: 0.16

src/components/ui/sonner.tsx: 0.15

src/components/ui/button.tsx: 0.15

src/state/spotlight.tsx: 0.15

src/components/ui/use-toast.ts: 0.15

tsconfig.json: 0.15

src/components/ui/select.tsx: 0.14

AI_RULES.md: 0.13

src/components/Waveform.tsx: 0.13

src/App.tsx: 0.13

src/hooks/use-toast.ts: 0.13

src/globals.css: 0.12

tailwind.config.ts: 0.12

src/vision/face/settings.ts: 0.12

tsconfig.app.json: 0.12

src/hooks/use-openai-chat.ts: 0.12

src/components/ui/progress.tsx: 0.11

src/components/ui/toggle-group.tsx: 0.11

src/components/vision/NameFace.tsx: 0.11

launch-jupiter.sh: 0.11

src/components/ui/slider.tsx: 0.11

src/components/ui/dialog.tsx: 0.11

src/main.tsx: 0.11

src/runtime/actions.ts: 0.11

src/components/ui/toaster.tsx: 0.10

src/hooks/use-jupiter-terminal.ts: 0.10

src/components/ui/card.tsx: 0.10

src/utils/toast.ts: 0.09

src/components/ui/label.tsx: 0.09

README_FLASH_DRIVE.md: 0.09

src/components/ui/toast.tsx: 0.09

src/pages/Tools.tsx: 0.09

src/components/ui/input.tsx: 0.09

src/hooks/use-jupiter-files.ts: 0.09

src/components/ui/skeleton.tsx: 0.07

README.md: 0.07

tsconfig.node.json: 0.07

src/components/ui/separator.tsx: 0.06

src/components/ui/scroll-area.tsx: 0.06

src/components/panels/TerminalPanel.tsx: 0.05

src/components/ui/radio-group.tsx: 0.05

src/runtime/backendPreview.ts: 0.05

index.html: 0.04

src/components/ui/form.tsx: 0.04

src/components/ui/checkbox.tsx: 0.04

src/components/ui/alert.tsx: 0.04

src/components/ui/alert-dialog.tsx: 0.04

src/App.css: 0.04

src/components/ui/resizable.tsx: 0.04

src/components/ui/tooltip.tsx: 0.04

postcss.config.js: 0.04

components.json: 0.04

.gitignore: 0.04

src/components/ui/aspect-ratio.tsx: 0.04

src/hooks/use-mobile.tsx: 0.03

src/components/ui/textarea.tsx: 0.03

vercel.json: 0.03

src/components/ui/command.tsx: 0.03

src/components/ui/dropdown-menu.tsx: 0.03

src/components/ui/tabs.tsx: 0.03

src/components/ui/avatar.tsx: 0.03

eslint.config.js: 0.02

src/components/ui/carousel.tsx: 0.02

src/pages/NotFound.tsx: 0.02

src/components/ui/collapsible.tsx: 0.02

public/placeholder.svg: 0.02

src/components/ui/hover-card.tsx: 0.02

src/components/made-with-dyad.tsx: 0.02

public/favicon.ico: 0.02

src/components/ui/accordion.tsx: 0.02

src/components/ui/table.tsx: 0.02

src/components/ui/navigation-menu.tsx: 0.01

src/components/ui/sidebar.tsx: 0.01

public/robots.txt: 0.01

src/components/ui/breadcrumb.tsx: 0.01

src/components/ui/pagination.tsx: 0.01

src/components/ui/input-otp.tsx: 0.01

src/components/ui/context-menu.tsx: 0.01

src/components/ui/chart.tsx: 0.01

src/components/ui/calendar.tsx: 0.01

src/components/ui/menubar.tsx: 0.01</think><dyad-codebase-context files="package.json,src/vision/types.ts,src/vision/thoughts/bus.ts,src/vision/skills/pose.ts,src/vision/skills/qr.ts,src/vision/skills/scene.ts,src/vision/skills/ocr.ts,src/components/vision/Overlay.tsx,src/components/vision/Thoughts.tsx,src/components/vision/LiveCamera.tsx,src/vision/engine.ts,src/runtime/voice.ts,src/vision/skills/motion.ts,src/vision/models.ts,src/vision/skills/tracker.ts,src/hooks/use-jupiter-tts.ts,src/vision/camera.ts"></dyad-codebase-context><think>dyad-token-savings?original-tokens=71194.5&smart-context-tokens=6454</think>},[activeId, analyze, enableFaces, enablePose, enableQR, enableScene, enableOCR]);

  useEffect(()=>{ if(!analyze){ setDets([]); setTracks([]); setMotion(null); setFaces([]); setPose(null); setQR(null); setOCR(null); setScene(null); } },[analyze]);

  return (
    <div className="w-full h-[360px] sm:h-[400px] rounded-xl overflow-hidden bg-black relative text-white">
      <video ref={videoRef} className="absolute inset-0 w-full h-full object-cover" playsInline muted />

      <Overlay dets={dets} tracks={tracks} video={videoRef.current} motion={motion}
               faces={faces} pose={pose} qr={qr} ocr={ocr} scene={scene} />

      {/* Controls */}
      <div className="absolute left-2 right-2 bottom-2 flex items-center gap-2">
        <div className="flex items-center gap-2 bg-zinc-900/70 backdrop-blur rounded-xl px-2 py-1 text-white">
          <button className="p-2 rounded-md hover:bg-zinc-800 disabled:opacity-50"
                  disabled={busy || cams.length===0}
                  onClick={()=>cams[0] && setActiveId(cams[0].id)} title="Primary camera"><Monitor size={18}/></button>
          <button className="p-2 rounded-md opacity-50 cursor-not-allowed" title="iPhone camera (coming soon)"><Smartphone size={18}/></button>
          <button className="p-2 rounded-md hover:bg-zinc-800 disabled:opacity-50"
                  disabled={busy || cams.length<2}
                  onClick={()=>{
                    if (cams.length<2) return;
                    const idx=Math.max(0,cams.findIndex(c=>c.id===activeId));
                    const next=cams[(idx+1)%cams.length]; if(next) setActiveId(next.id);
                  }}
                  title="Next camera"><RefreshCw size={18}/></button>

          {/* Feature toggles */}
          <label className="text-xs flex items-center gap-1 ml-1"><input type="checkbox" className="form-checkbox h-3 w-3 text-blue-500 bg-gray-800 border-gray-600 rounded focus:ring-blue-500" checked={analyze} onChange={e=>setAnalyze(e.target.checked)}/> Analyze</label>
          <label className="text-xs flex items-center gap-1"><input type="checkbox" className="form-checkbox h-3 w-3 text-blue-500 bg-gray-800 border-gray-600 rounded focus:ring-blue-500" checked={enableFaces} onChange={e=>setEnableFaces(e.target.checked)}/> Faces</label>
          <label className="text-xs flex items-center gap-1"><input type="checkbox" className="form-checkbox h-3 w-3 text-blue-500 bg-gray-800 border-gray-600 rounded focus:ring-blue-500" checked={enablePose} onChange={e=>setEnablePose(e.target.checked)}/> Pose</label>
          <label className="text-xs flex items-center gap-1"><input type="checkbox" className="form-checkbox h-3 w-3 text-blue-500 bg-gray-800 border-gray-600 rounded focus:ring-blue-500" checked={enableQR} onChange={e=>setEnableQR(e.target.checked)}/> QR</label>
          <label className="text-xs flex items-center gap-1"><input type="checkbox" className="form-checkbox h-3 w-3 text-blue-500 bg-gray-800 border-gray-600 rounded focus:ring-blue-500" checked={enableScene} onChange={e=>setEnableScene(e.target.checked)}/> Scene</label>
          <label className="text-xs flex items-center gap-1"><input type="checkbox" className="form-checkbox h-3 w-3 text-blue-500 bg-gray-800 border-gray-600 rounded focus:ring-blue-500" checked={enableOCR} onChange={e=>setEnableOCR(e.target.checked)}/> Text</label>
        </div>
        <Pill text={status==='loading'?'Loading…': status==='running'?(dets.length?`Live · ${dets.length}`:'Live · …'):'Ready'} />
      </div>

      <NameFace candidate={nameAsk} onDone={()=>setNameAsk(null)} />
      <Thoughts />
    </div>
  );
}