import React,{useEffect,useState} from 'react';
import { uiBus } from '../runtime/uiBus';
import ThoughtsInline from './ThoughtsInline';

export default function WidgetShell({front, back}:{front:React.ReactNode; back:React.ReactNode}){
  const [mode,setMode]=useState(uiBus.get());
  useEffect(()=>uiBus.on(setMode),[]);
  const flipped = mode!=='front';
  return (
    <div className="relative">
      {/* Header — always inside widget */}
      <div className="absolute -top-6 left-1/2 -translate-x-1/2 z-30 flex items-center gap-2">
        <span className="text-[11px] tracking-wide text-zinc-400">JUPITER</span>
        <ThoughtsInline/>
        <div className="ml-2 flex items-center gap-2">
          <button onClick={()=>uiBus.openVision()}   className="text-[11px] px-2 py-1 rounded bg-zinc-900/80 border border-zinc-800">👁</button>
          <button onClick={()=>uiBus.openSettings()} className="text-[11px] px-2 py-1 rounded bg-zinc-900/80 border border-zinc-800">⚙︎</button>
          <button onClick={()=>uiBus.openTerminal()} className="text-[11px] px-2 py-1 rounded bg-zinc-900/80 border border-zinc-800">⌥</button>
          {flipped && <button onClick={()=>uiBus.back()} className="text-[11px] px-2 py-1 rounded bg-zinc-900/80 border border-zinc-800">↩︎</button>}
        </div>
      </div>

      {/* Flip area */}
      <div className="relative [perspective:1200px] pt-5">
        <div className={`relative w-[480px] max-w-[92vw] [transform-style:preserve-3d] transition-transform duration-500 ${flipped?'[transform:rotateY(180deg)]':''}`}>
          <div className="[backface-visibility:hidden]">{front}</div>
          <div className="absolute inset-0 [backface-visibility:hidden] [transform:rotateY(180deg)]">{back}</div>
        </div>
      </div>
    </div>
  );
}