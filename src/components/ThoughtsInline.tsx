import React,{useEffect,useState} from 'react';
import { onThoughts, type Thought } from '../vision/thoughts/bus';

export default function ThoughtsInline(){
  const [open,setOpen]=useState(true);
  const [items,setItems]=useState<Thought[]>([]);
  useEffect(()=>onThoughts(setItems),[]);
  const latest = items[0]?.text ?? 'Quiet mind.';
  return (
    <button
      onClick={()=>setOpen(o=>!o)}
      className="max-w-[240px] truncate text-[11px] px-2 py-1 rounded-md border border-zinc-800 bg-zinc-900/75 text-zinc-300 hover:bg-zinc-800/80"
      title={open ? 'Hide thoughts' : 'Show thoughts'}
    >
      {latest}
    </button>
  );
}