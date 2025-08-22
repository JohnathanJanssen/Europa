import React,{useEffect,useState} from 'react';
import LiveCamera from './vision/LiveCamera';
import { SettingsPanel } from './panels/SettingsPanel';
import { TerminalPanel } from './panels/TerminalPanel';
import { uiBus } from '../runtime/uiBus';

export default function SpotlightCard(){
  const [mode,setMode]=useState<'front'|'vision'|'settings'|'terminal'>(uiBus.get());
  useEffect(()=>uiBus.on(setMode),[]);
  // This component now just renders the "back face" content:
  return (
    <div className="rounded-2xl bg-zinc-950/80 border border-zinc-800 p-3">
      {mode==='vision'   && <LiveCamera/>}
      {mode==='settings' && <SettingsPanel/>}
      {mode==='terminal' && <TerminalPanel/>}
      {mode==='front'    && <div className="text-xs text-zinc-500 p-6">…</div>}
    </div>
  );
}