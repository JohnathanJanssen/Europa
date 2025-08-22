import * as tf from '@tensorflow/tfjs';
import * as cocoSsd from '@tensorflow-models/coco-ssd';

export type Det = {
  bbox: [number, number, number, number]; // x,y,w,h
  label: string;
  score: number;
};

export class VisionEngine {
  private model: cocoSsd.ObjectDetection | null = null;
  private rafId: number | null = null;
  private running = false;
  private lastInfer = 0;
  private minIntervalMs = 80; // ~12.5 FPS (keeps Chrome happy)

  async init() {
    if (this.model) return;
    // Force CPU if the device/GPU is flaky:
    // await tf.setBackend('cpu');  // (uncomment if you see GPU/WebGL crashes)
    this.model = await cocoSsd.load({ base: 'lite_mobilenet_v2' });
  }

  start(videoEl: HTMLVideoElement, onDetections: (dets: Det[]) => void) {
    if (!this.model || this.running) return;
    this.running = true;

    const loop = async (t: number) => {
      if (!this.running || !this.model) return;
      if (t - this.lastInfer >= this.minIntervalMs) {
        this.lastInfer = t;
        try {
          const preds = await this.model.detect(videoEl);
          const dets: Det[] = preds.map(p => ({
            bbox: p.bbox as [number, number, number, number],
            label: p.class,
            score: p.score
          }));
          onDetections(dets);
        } catch {
          // swallow transient errors (camera switching, tab hidden, etc.)
        }
      }
      this.rafId = requestAnimationFrame(loop);
    };
    this.rafId = requestAnimationFrame(loop);
  }

  async stop() {
    this.running = false;
    if (this.rafId != null) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }
  }

  async dispose() {
    await this.stop();
    // tfjs models from coco-ssd don’t expose a dispose, but free tensors anyway:
    try { tf.engine().disposeVariables(); } catch {}
  }
}