import React,{useEffect,useState} from 'react';
import { uiBus } from '../runtime/uiBus';

export default function FlipTile({front, back}:{front:React.ReactNode; back:React.ReactNode}){
  const [mode,setMode]=useState(uiBus.get());
  useEffect(()=>uiBus.on(setMode),[]);
  const flipped = mode!=='front';
  return (
    <div className="relative [perspective:1200px]">
      <div className={`relative w-[480px] max-w-[92vw] [transform-style:preserve-3d] transition-transform duration-500 ${flipped?'[transform:rotateY(180deg)]':''}`}>
        <div className="relative [backface-visibility:hidden]">{front}</div>
        <div className="absolute inset-0 [backface-visibility:hidden] [transform:rotateY(180deg)]">{back}</div>
      </div>
    </div>
  );
}