import { loadDetector } from "./models";

export type Det = { x:number; y:number; w:number; h:number; label:string; score:number };

export class VisionEngine {
  private video: HTMLVideoElement;
  private running = false;
  private fps = 5;               // keep CPU/GPU light
  private minScore = 0.35;

  constructor(video: HTMLVideoElement) { this.video = video; }

  async start(onDetections: (dets: Det[]) => void) {
    if (this.running) return;
    this.running = true;
    const model = await loadDetector();
    const tick = async () => {
      if (!this.running) return;
      try {
        const preds = await model.detect(this.video, 10);
        const dets: Det[] = (preds || [])
          .filter(p => (p.score ?? 0) >= this.minScore)
          .map(p => {
            const [x,y,w,h] = p.bbox as [number,number,number,number];
            return { x, y, w, h, label: p.class, score: p.score ?? 0 };
          });
        onDetections(dets);
      } catch {}
      if (this.running) setTimeout(tick, 1000/this.fps);
    };
    tick();
  }
  stop() { this.running = false; }
}