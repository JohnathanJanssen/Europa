import React,{useEffect,useState} from 'react';
import { onThoughts, type Thought } from '../vision/thoughts/bus';

export default function ThoughtsBubble(){
  const [open,setOpen]=useState(true);
  const [items,setItems]=useState<Thought[]>([]);
  useEffect(()=>onThoughts(setItems),[]);
  return (
    <div className="absolute -top-14 left-1/2 -translate-x-1/2 z-30 select-none">
      <div className="bg-zinc-900/85 border border-zinc-800 rounded-2xl backdrop-blur px-3 py-2 shadow-lg">
        <div className="flex items-center gap-2">
          <span className="text-[10px] tracking-wide text-zinc-400">THOUGHTS</span>
          <button onClick={()=>setOpen(o=>!o)} className="text-[10px] px-2 py-0.5 rounded hover:bg-zinc-800">
            {open?'Hide':'Show'}
          </button>
        </div>
        {open && (
          <div className="mt-1 max-h-28 overflow-auto space-y-1 w-[300px]">
            {items.length===0 ? (
              <div className="text-xs text-zinc-500">Quiet mind.</div>
            ) : items.slice(0,20).map((t,i)=>
              <div key={i} className="text-[12.5px] leading-5 text-zinc-200 bg-black/40 border border-zinc-800 rounded-lg px-2 py-1">{t.text}</div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}