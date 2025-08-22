import React,{useEffect,useRef} from "react";
import "./cosmos.css";
export default function Cosmos(){
  const ref=useRef<HTMLDivElement>(null);
  useEffect(()=>{ let t:any;
    const onPulse=(e:CustomEvent<{strength:number}>)=>{
      const el=ref.current; if(!el) return;
      const s=Math.max(0,Math.min(1,(e.detail?.strength??.9)));
      el.style.setProperty("--pulse",String(s));
      clearTimeout(t); t=setTimeout(()=>el.style.setProperty("--pulse","0"),800);
    };
    window.addEventListener("cosmos:pulse",onPulse as any);
    return()=>window.removeEventListener("cosmos:pulse",onPulse as any);
  },[]);
  return <div className="cosmos" aria-hidden ref={ref}/>;
}