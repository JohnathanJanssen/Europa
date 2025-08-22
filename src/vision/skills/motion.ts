import type { Insight } from '../types';

/** Frame differencing heatmap at low-res; returns zones and a 2D grid of intensities 0..1 */
class Motion {
  private prev?: ImageData;
  private cw=96; private ch=54; // ~16:9
  analyze(video: HTMLVideoElement) {
    const cvs = document.createElement('canvas');
    cvs.width=this.cw; cvs.height=this.ch;
    const ctx = cvs.getContext('2d')!;
    ctx.drawImage(video, 0,0, this.cw, this.ch);
    const img = ctx.getImageData(0,0,this.cw,this.ch);
    const grid = new Float32Array(this.cw*this.ch);
    if (this.prev) {
      for (let i=0;i<img.data.length;i+=4) {
        const d = Math.abs(img.data[i]-this.prev.data[i]) + Math.abs(img.data[i+1]-this.prev.data[i+1]) + Math.abs(img.data[i+2]-this.prev.data[i+2]);
        grid[i>>2] = Math.min(1, d/255/3*2); // normalize
      }
    }
    this.prev = img;
    // zones
    const thirds = Math.floor(this.cw/3);
    const zone = (s:number,e:number)=> {
      let sum=0, n=0; for(let y=0;y<this.ch;y++) for(let x=s;x<e;x++){ sum += grid[y*this.cw+x]; n++; }
      return sum/Math.max(1,n);
    };
    return {
      grid, w:this.cw, h:this.ch,
      zones: {
        left: zone(0, thirds),
        center: zone(thirds, thirds*2),
        right: zone(thirds*2, this.cw),
      }
    };
  }
}

const motion = new Motion();
export function detectMotion(video: HTMLVideoElement): Insight | null {
    const m = motion.analyze(video);
    const intensity = (m.zones.left + m.zones.center + m.zones.right) / 3;
    if (intensity < 0.01) return null;
    const maxZone = Object.entries(m.zones).reduce((a, b) => a[1] > b[1] ? a : b)[0] as 'left'|'center'|'right';
    return { kind: 'motion', at: Date.now(), zone: maxZone, intensity };
}