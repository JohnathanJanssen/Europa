import type { Det, Track } from '../types';

// simple IOU
function iou(a: Det, b: Det) {
  const x1 = Math.max(a.x,b.x), y1 = Math.max(a.y,b.y);
  const x2 = Math.min(a.x+a.w, b.x+b.w), y2 = Math.min(a.y+a.h, b.y+b.h);
  const inter = Math.max(0,x2-x1)*Math.max(0,y2-y1);
  const ua = a.w*a.h + b.w*b.h - inter;
  return ua ? inter/ua : 0;
}

export class Tracker {
  private nextId = 1;
  private tracks: Track[] = [];
  private maxTrail = 18;

  update(dets: Det[]): Track[] {
    // aging
    this.tracks.forEach(t => t.age++);
    const used = new Set<number>();
    // match existing tracks
    for (const t of this.tracks) {
      let best: { j:number, v:number } | null = null;
      for (let j=0; j<dets.length; j++) {
        if (used.has(j)) continue;
        const v = iou(t, dets[j]); if (!best || v>best.v) best = { j, v };
      }
      if (best && best.v >= 0.4) {
        const d = dets[best.j]; used.add(best.j);
        t.x=d.x; t.y=d.y; t.w=d.w; t.h=d.h; t.label=d.label; t.score=d.score;
        t.cx = d.x + d.w/2; t.cy = d.y + d.h/2; t.trail.push([t.cx,t.cy]); if (t.trail.length>this.maxTrail) t.trail.shift();
        t.age = 0;
      }
    }
    // new tracks
    for (let j=0; j<dets.length; j++) if (!used.has(j)) {
      const d = dets[j];
      const t: Track = { ...d, id:this.nextId++, cx:d.x+d.w/2, cy:d.y+d.h/2, age:0, trail:[[d.x+d.w/2,d.y+d.h/2]] };
      this.tracks.push(t);
    }
    // prune stale
    this.tracks = this.tracks.filter(t => t.age < 15);
    return this.tracks.slice();
  }
}