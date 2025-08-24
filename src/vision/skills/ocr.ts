import { createWorker, WorkerOptions, OEM, PSM } from 'tesseract.js';

let _worker: any;
export async function ensureWorker() {
  if (_worker) return _worker;
  // Create the worker with only the options object.
  _worker = await createWorker({ logger: ()=>{} } as Partial<WorkerOptions>);
  // Load the language separately.
  await _worker.loadLanguage('eng');
  // Initialize the worker with the language, OEM, and PSM.
  await _worker.initialize('eng', OEM.DEFAULT, PSM.AUTO);
  return _worker;
}
export async function scanCenterText(video: HTMLVideoElement | null){
  if (!video) return null;
  const w = video.videoWidth|0, h = video.videoHeight|0; if (!w || !h) return null;
  const cx = Math.max(0, Math.floor(w*0.25)), cy = Math.max(0, Math.floor(h*0.25));
  const cw = Math.max(1, Math.floor(w*0.5)),  ch = Math.max(1, Math.floor(h*0.5));
  const canvas = document.createElement('canvas'); canvas.width=cw; canvas.height=ch;
  const ctx = canvas.getContext('2d'); if(!ctx) return null;
  ctx.drawImage(video, cx, cy, cw, ch, 0, 0, cw, ch);
  const worker = await ensureWorker();
  try { const { data:{ text } } = await worker.recognize(canvas); return text.trim() ? { text:text.trim(), box:{x:cx,y:cy,w:cw,h:ch} } : null; }
  catch { return null; }
}