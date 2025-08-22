import React from "react";
import VisionPanel from "./panels/VisionPanel";
import TerminalPanel from "./panels/TerminalPanel";
import FilesPanel from "./panels/FilesPanel";
import { usePanel, setPanel } from "../runtime/panel"; // Added import for usePanel and setPanel

export default function PanelHost(){
  const p = usePanel();
  if (p === "chat") return null;
  return (
    <div className="absolute inset-0 bg-[#0d0f16] flex flex-col p-4 rounded-[22px] z-20">
      <div className="flex items-center justify-between pb-3 mb-3 border-b border-white/10 flex-shrink-0">
        <div className="text-slate-200/80 text-lg font-medium capitalize">{p}</div>
        <button onClick={()=>setPanel("chat")} className="text-slate-300 hover:text-white text-sm">Close</button>
      </div>
      <div className="flex-1 overflow-y-auto">
        {p==="vision" && <VisionPanel />}
        {p==="terminal" && <TerminalPanel />}
        {p==="files" && <FilesPanel />}
      </div>
    </div>
  );
}