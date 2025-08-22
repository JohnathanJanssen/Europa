import React, { useEffect, useState } from 'react';
import { onThoughts, getThoughts, type Thought } from '../../vision/thoughts/bus';

export default function Thoughts({compact=false}:{compact?:boolean}) {
  const [lines, setLines] = useState<Thought[]>(getThoughts()); // Use Thought[]
  useEffect(()=>onThoughts(setLines),[]);
  if (compact) return <div className="text-[11px] bg-black/55 rounded-md px-2 py-1">{lines[0]?.text || 'observing'}</div>; // Access .text
  return (
    <div className="absolute top-2 right-2 w-[46%] max-w-[360px] bg-black/50 backdrop-blur rounded-lg p-2 text-[12px] leading-tight space-y-1 pointer-events-none">
      {lines.slice(0,8).map((it,i)=><div key={i} className="text-zinc-100/95">{it.text}</div>)} {/* Access .text */}
    </div>
  );
}