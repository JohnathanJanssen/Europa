import { ensureFaceModels, faceapi } from './loader';
import type { Face } from '../types';
import { match } from './db';

export class Recognizer {
  private running = false;
  private fps = 3; // light
  constructor(private video: HTMLVideoElement) {}

  async start(onFaces: (faces: Face[]) => void) {
    if (this.running) return; this.running = true;
    await ensureFaceModels();

    const options = new faceapi.TinyFaceDetectorOptions({ inputSize: 256, scoreThreshold: 0.35 });
    const tick = async () => {
      if (!this.running) return;
      try {
        const results = await faceapi.detectAllFaces(this.video, options)
          .withFaceLandmarks()
          .withFaceDescriptors();
        const faces: Face[] = [];
        for (const r of results) {
          const bb = r.detection.box;
          const vec = Array.from(r.descriptor) as number[];
          const hit = match(vec);
          faces.push({
            x: bb.x, y: bb.y, w: bb.width, h: bb.height,
            name: hit?.name, distance: hit?.distance, descriptor: hit ? undefined : vec,
            isNew: !hit
          });
        }
        onFaces(faces);
      } catch {}
      if (this.running) setTimeout(tick, 1000/this.fps);
    };
    tick();
  }
  stop() { this.running = false; }
}