import type { Det } from '../types';
import { bump, recordNovel } from '../memory';

// cheap color signature (4x4x3) for novelty
function sigOf(ctx:CanvasRenderingContext2D, x:number,y:number,w:number,h:number) {
  const cvs = ctx.canvas, sx=Math.max(0,x|0), sy=Math.max(0,y|0), sw=Math.max(1,w|0), sh=Math.max(1,h|0);
  const tmp = document.createElement('canvas'); tmp.width=16; tmp.height=16;
  const tctx = tmp.getContext('2d')!; tctx.drawImage(cvs, sx,sy,sw,sh, 0,0,16,16);
  const data = tctx.getImageData(0,0,16,16).data;
  const v:number[]=[]; for (let i=0;i<data.length;i+=16) v.push(data[i],data[i+1],data[i+2]); // sparse sample
  // L2 normalize
  let norm=0; for (const x of v) norm+=x*x; norm=Math.sqrt(norm)||1; return v.map(x=>x/norm);
}
function cos(a:number[], b:number[]) {
  let s=0; for (let i=0;i<a.length;i++) s+=a[i]*b[i]; return s;
}

type Bucket = { label:string, sigs:number[][] };
const DB: Bucket[] = [];

export function learnFromFrame(video: HTMLVideoElement, dets: Det[]): { novel?: {label:string, score:number} } {
  // draw the current video once to sample regions
  const cvs = document.createElement('canvas');
  cvs.width = video.videoWidth || 640; cvs.height = video.videoHeight || 480;
  const ctx = cvs.getContext('2d')!; ctx.drawImage(video, 0,0,cvs.width,cvs.height);
  let flagged: {label:string, score:number} | undefined;

  for (const d of dets) {
    bump(d.label);
    let bucket = DB.find(b=>b.label===d.label);
    if (!bucket) { bucket = { label:d.label, sigs:[] }; DB.push(bucket); }
    const s = sigOf(ctx, d.x, d.y, d.w, d.h);
    let best = -1; for (const old of bucket.sigs) best = Math.max(best, cos(s, old));
    if (best<0.82) { // unfamiliar instance → store few exemplars
      bucket.sigs.push(s); if (bucket.sigs.length>24) bucket.sigs.shift();
      flagged = { label:d.label, score: Math.max(0, Math.min(1, (best+1)/2)) };
      recordNovel(d.label);
    }
  }
  return { novel: flagged };
}