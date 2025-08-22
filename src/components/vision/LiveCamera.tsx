import { useEffect, useRef, useState } from "react";
import { VisionEngine } from '../../vision/engine';
import { Recognizer } from '../../vision/face/recognizer';
import type { Det, Track, Face } from '../../vision/types';
import Overlay from './Overlay';
import VisionBoundary from '../VisionBoundary';

const askedOnce = new Set<string>();

function Inner() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [ready, setReady] = useState(false);
  const [asking, setAsking] = useState<null | { faceId: string }>(null);

  const [dets, setDets] = useState<Det[]>([]);
  const [tracks, setTracks] = useState<Track[]>([]);
  const [faces, setFaces] = useState<Face[]>([]);

  useEffect(() => {
    let media: MediaStream | null = null;
    let engine: VisionEngine | null = null;
    let recog: Recognizer | null = null;

    const boot = async () => {
      try {
        if (document.hidden) {
          const onVis = () => { document.removeEventListener("visibilitychange", onVis); boot(); };
          document.addEventListener("visibilitychange", onVis);
          return;
        }
        media = await navigator.mediaDevices.getUserMedia({
          video: { width: 640, height: 360, frameRate: { ideal: 24, max: 24 } },
          audio: false
        });
        const v = videoRef.current!;
        v.srcObject = media;
        await v.play();
        setReady(true);

        engine = new VisionEngine(v);
        await engine.start(({ tracks, dets }) => {
          setTracks(tracks);
          setDets(dets);
        });

        recog = new Recognizer(v);
        recog.start((fs) => {
          setFaces(fs);
          const u = fs.find(f => !f.name);
          if (u) {
            const faceId = (u as any).signature || `${Math.round(u.x || 0)}:${Math.round(u.y || 0)}`;
            if (!askedOnce.has(faceId)) {
              askedOnce.add(faceId);
              setAsking({ faceId });
            }
          }
        });

      } catch (e) {
        console.error("Vision init failed", e);
      }
    };

    boot();

    return () => {
      try {
        engine?.stop();
        recog?.stop();
        const v = videoRef.current;
        if (v) v.pause();
        if (media) media.getTracks().forEach(t => t.stop());
      } catch {}
    };
  }, []);

  return (
    <div className="relative">
      <div className="rounded-xl overflow-hidden border border-white/10 bg-black/40">
        <video ref={videoRef} playsInline muted className="block w-full h-[280px] object-cover bg-black/40"/>
        <Overlay dets={dets} tracks={tracks} faces={faces} video={videoRef.current} motion={null} />
      </div>

      {asking && (
        <form
          className="absolute inset-x-0 bottom-0 p-2"
          onSubmit={(e) => {
            e.preventDefault();
            const fd = new FormData(e.currentTarget);
            const name = (fd.get("name") as string)?.trim();
            if (name) {
              // In a real app, you would enroll this name against the faceId.
              console.log(`Enrolling ${asking.faceId} as ${name}`);
              setAsking(null);
            }
          }}
        >
          <div className="flex items-center gap-2 rounded-2xl bg-white/5 border border-white/10 px-3 py-2 backdrop-blur-xl">
            <input
              name="name"
              autoFocus
              placeholder="I don’t recognize you yet. What should I call you?"
              className="flex-1 bg-transparent outline-none text-white/90 placeholder:text-white/40 text-[14px]"
            />
            <button
              className="rounded-xl bg-white/10 hover:bg-white/20 px-3 py-1 text-white/90 text-sm"
              type="submit"
            >
              Send
            </button>
          </div>
        </form>
      )}

      {!ready && (
        <div className="absolute inset-0 grid place-items-center text-white/60 text-sm">
          Connecting camera…
        </div>
      )}
    </div>
  );
}

export default function LiveCamera() {
    return <VisionBoundary><Inner/></VisionBoundary>
}