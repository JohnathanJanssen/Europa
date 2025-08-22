import { loadDetector } from './models';
export type Det = { x:number; y:number; w:number; h:number; label:string; score:number };

export class VisionEngine {
  private video: HTMLVideoElement;
  private running = false;
  public  fps = 6;        // light but lively
  public  minScore = 0.30;

  constructor(video: HTMLVideoElement) { this.video = video; }

  async start(onDetections: (dets: Det[]) => void) {
    if (this.running) return;
    this.running = true;
    const model = await loadDetector();
    const loop = async () => {
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
      if (this.running) setTimeout(loop, 1000/this.fps);
    };
    loop();
  }
  stop() { this.running = false; }
}