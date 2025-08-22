export type Thought = { t:number; text:string };
type Sub = (xs:Thought[])=>void;
const MAX=80; let xs:Thought[]=[]; const S=new Set<Sub>();
export function think(text:string){ if(!text) return; if(xs[0]?.text===text) return;
  xs=[{t:Date.now(),text},...xs].slice(0,MAX); S.forEach(f=>{try{f(xs);}catch{}});}
export function getThoughts() { return xs.slice(); }
export function onThoughts(f:Sub){ S.add(f); f(xs); return ()=>{S.delete(f);}; } // Ensure void return