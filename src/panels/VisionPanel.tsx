import React,{useEffect,useRef} from "react";
type Box={x:number;y:number;w:number;h:number;label?:string;p?:number};
export default function VisionPanel({ className, onClose, stream, boxes=[] }:{
  className?:string; onClose?:()=>void; stream?:MediaStream|null; boxes?:Box[];
}){
  const vref=useRef<HTMLVideoElement>(null);
  const cref=useRef<HTMLCanvasElement>(null);
  useEffect(()=>{ const v=vref.current; if(!v) return;
    v.srcObject = stream ?? null; if(stream) v.play().catch(()=>{});
  },[stream]);
  useEffect(()=>{ const cvs=cref.current, v=vref.current; if(!cvs||!v) return;
    const ctx=cvs.getContext("2d"); if(!ctx) return; let id=0;
    const loop=()=>{ id=requestAnimationFrame(loop);
      const {videoWidth:w,videoHeight:h}=v; if(!w||!h) return;
      if(cvs.width!==w||cvs.height!==h){cvs.width=w;cvs.height=h}
      ctx.clearRect(0,0,w,h);
      for(const b of boxes){
        ctx.strokeStyle="rgba(180,200,255,.9)"; ctx.lineWidth=2; ctx.strokeRect(b.x,b.y,b.w,b.h);
        if(b.label){ const t=`${b.label}${b.p?` ${Math.round(b.p*100)}%`:""}`;
          ctx.font="12px ui-sans-serif, system-ui";
          const mw=ctx.measureText(t).width+10, ty=Math.max(0,b.y-18);
          ctx.fillStyle="rgba(20,26,40,.9)"; ctx.fillRect(b.x,ty,mw,18);
          ctx.fillStyle="rgba(225,235,255,.95)"; ctx.fillText(t,b.x+5,ty+12);
        }
      }
    }; id=requestAnimationFrame(loop); return()=>cancelAnimationFrame(id);
  },[boxes]);
  return (
    <div className={className ?? ""} role="region" aria-label="Vision">
      <div className="panel-head"><div className="title">Vision</div><button className="x" onClick={onClose}>Close</button></div>
      <div className="vision-wrap">
        <video ref={vref} className="vision-video" muted playsInline/>
        <canvas ref={cref} className="vision-overlay"/>
      </div>
    </div>
  );
}