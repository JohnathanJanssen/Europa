import { useEffect, useState } from "react";

export type PanelKind = "chat" | "vision" | "terminal" | "files";

let listeners: Array<(k: PanelKind)=>void> = [];
let active: PanelKind = "chat";

export function getPanel(){ return active; }
export function setPanel(k: PanelKind){
  if (active === k) return;
  active = k; listeners.forEach(fn=>fn(k));
}
export function usePanel(){
  const [k,setK] = useState<PanelKind>(active);
  useEffect(()=>{
    const fn = (nk: PanelKind)=>setK(nk);
    listeners.push(fn);
    return ()=>{ listeners = listeners.filter(x=>x!==fn); };
  },[]);
  return k;
}

export function goHome(){ setPanel("chat"); }