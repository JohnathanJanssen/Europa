import type { Det, Insight } from '../types';
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

export function detectNovelty(dets: Det[], frameCount: number): Insight | null {
  // This function seems to be a placeholder or needs a canvas context.
  // For now, returning null to satisfy the type signature.
  // The original learnFromFrame required a video element.
  return null;
}