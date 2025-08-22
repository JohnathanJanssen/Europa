import { createWorker, WorkerOptions } from 'tesseract.js'; // Correctly import WorkerOptions as a named export

let _worker: any;
export async function ensureWorker() {
  if (_worker) return _worker;
  // Pass the language ('eng') as the first argument and the options object as the second.
  // The previous 'undefined' arguments were causing the type mismatch.
  _worker = await createWorker('eng', { logger: ()=>{} } as Partial<WorkerOptions>);
  // The language is already loaded by createWorker('eng', ...) when 'eng' is passed as the first argument,
  // so we only need to initialize it.
  await _worker.initialize('eng');
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