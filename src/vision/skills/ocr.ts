import { createWorker, WorkerOptions } from 'tesseract.js';

let worker: any = null;
export async function ensureOCR() {
  if (worker) return worker;
  // For tesseract.js v6, createWorker expects Partial<WorkerOptions> as its first argument.
  worker = await createWorker({ logger: () => {} } as Partial<WorkerOptions>);
  await worker.loadLanguage('eng'); await worker.initialize('eng');
  return worker;
}

/** Samples center crop for text; heavy => call sparsely */
export async function scanCenterText(video: HTMLVideoElement) {
  const w = video.videoWidth || 640, h = video.videoHeight || 480;
  if (!w || !h) return null;
  const rx = Math.floor(w*0.18), ry = Math.floor(h*0.18), rw = Math.floor(w*0.64), rh = Math.floor(h*0.64);
  const cvs = document.createElement('canvas'); cvs.width=rw; cvs.height=rh;
  const ctx = cvs.getContext('2d')!; ctx.drawImage(video, rx, ry, rw, rh, 0,0,rw,rh);
  const wkr = await ensureOCR();
  const { data } = await wkr.recognize(cvs);
  const text = (data.text || '').trim();
  if (!text) return null;
  return { box:{ x:rx, y:ry, w:rw, h:rh }, text };
}