import React from 'react';
import { SettingsPanel } from './panels/SettingsPanel';
import TerminalPanel from './panels/TerminalPanel'; // Changed to default import
import FilesPanel from './panels/FilesPanel';     // Changed to default import
import { uiBus } from '../runtime/uiBus';
export default function SpotlightCard(){
  const [mode,setMode] = React.useState(uiBus.get());
  React.useEffect(()=>uiBus.on(setMode),[]);
  return (
    <div className="rounded-2xl bg-zinc-950/80 border border-zinc-800 p-3">
      {mode==='settings' && <SettingsPanel/>}
      {mode==='terminal' && <TerminalPanel/>}
      {mode==='files'    && <FilesPanel/>}
      {mode==='front'    && <div className="text-xs text-zinc-600 p-6">Flip to a panel.</div>}
    </div>
  );
}