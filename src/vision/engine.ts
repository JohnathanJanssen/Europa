import { loadDetector } from './models';
import type { Det, Track, Insight } from './types';
import { Tracker } from './skills/tracker';
import { Motion } from './skills/motion';
import { learnFromFrame } from './skills/novelty';

export class VisionEngine {
  private video: HTMLVideoElement;
  private running = false;
  public fps = 6;
  public minScore = 0.30;
  private tracker = new Tracker();
  private motion = new Motion();

  constructor(video: HTMLVideoElement) { this.video = video; }

  async start(onFrame: (state: { tracks: Track[], dets: Det[], insights: Insight[], motion: {grid:Float32Array,w:number,h:number} | null }) => void) {
    if (this.running) return; this.running = true;
    const model = await loadDetector();
    const loop = async () => {
      if (!this.running) return;
      let insights: Insight[] = [];
      let motion = null as {grid:Float32Array,w:number,h:number} | null;
      try {
        const preds = await model.detect(this.video, 10);
        const dets: Det[] = (preds || [])
          .filter(p => (p.score ?? 0) >= this.minScore)
          .map(p => { const [x,y,w,h]=p.bbox as [number,number,number,number]; return { x,y,w,h,label:p.class,score:p.score??0 }; });
        const tracks = this.tracker.update(dets);

        // motion
        const m = this.motion.analyze(this.video); motion = { grid:m.grid, w:m.w, h:m.h };
        const maxZone = Object.entries(m.zones).sort((a,b)=>b[1]-a[1])[0] as any;
        if (maxZone && maxZone[1] > 0.10) { insights.push({ kind:'motion', at:Date.now(), zone:maxZone[0], intensity: maxZone[1] }); }

        // counts
        const counts: Record<string, number> = {};
        for (const d of dets) counts[d.label] = (counts[d.label]||0)+1;
        insights.push({ kind:'count', at:Date.now(), counts });

        // novelty
        const novel = learnFromFrame(this.video, dets).novel;
        if (novel) insights.push({ kind:'novel', at:Date.now(), label:novel.label, score:novel.score });

        onFrame({ tracks, dets, insights, motion });
      } catch { /* swallow */ }
      if (this.running) setTimeout(loop, 1000/this.fps);
    };
    loop();
  }
  stop() { this.running = false; }
}