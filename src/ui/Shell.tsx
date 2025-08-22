import React, { useMemo, useState } from "react";
import "../styles/shell.css";
import { useUIController, Face } from "../state/ui";
import FilesPanel from "../panels/FilesPanel";
import TerminalPanel from "../panels/TerminalPanel";
import VisionPanel from "../panels/VisionPanel";
import { speak } from "../runtime/voice";

/** Icon chips (Vision, Terminal, Files, Refresh) */
function Icon({label, active, onClick, children}:{label:string; active?:boolean; onClick:()=>void; children:React.ReactNode}){
  return <button title={label} aria-label={label} className={`jupiter-icon ${active ? "active":""}`} onClick={onClick}>{children}</button>;
}

export default function Shell({ ChatBody }:{ ChatBody: React.FC }){
  const ui = useUIController();
  const [refreshNonce, setRefreshNonce] = useState(0);

  const Body = useMemo<React.FC>(() => {
    switch (ui.face){
      case "vision": return VisionPanel as any;
      case "terminal": return TerminalPanel as any;
      case "files": return FilesPanel as any;
      default: return ChatBody;
    }
  }, [ui.face, ChatBody]);

  return (
    <div className="jupiter-card" role="group" aria-label="Jupiter widget">
      {/* Header */}
      <div className="jupiter-header">
        <div className="jupiter-title" onClick={()=> ui.setFace("chat")}>JUPITER</div>
        <div className="jupiter-thoughts" title="Thoughts">{ui.thinking || "Quiet mind."}</div>
      </div>

      {/* Body (swaps) */}
      <div className="jupiter-body">
        <div key={ui.face + ":" + refreshNonce} className="jupiter-body-inner">
          <Body />
        </div>
        {/* Footer icons (pinned) */}
        <div className="jupiter-toolbar" role="toolbar" aria-label="feature bar">
          <Icon label="Vision"   active={ui.face==="vision"}   onClick={()=> ui.setFace("vision")}>👁️</Icon>
          <Icon label="Terminal" active={ui.face==="terminal"} onClick={()=> ui.setFace("terminal")}>⌥_</Icon>
          <Icon label="Files"    active={ui.face==="files"}    onClick={()=> ui.setFace("files")}   >🗂️</Icon>
          <Icon label="Refresh"  onClick={()=> setRefreshNonce(n=>n+1)}                             >↻</Icon>
        </div>
      </div>

      {/* Footer (chat input is always visible & used by Chat face; other faces may repurpose it) */}
      <FooterProxy isChat={ui.face==="chat"} />
    </div>
  );
}

/** Footer input delegates to ChatBody via a DOM CustomEvent so footer stays constant on all faces. */
function FooterProxy({isChat}:{isChat:boolean}){
  const [value, setValue] = useState("");
  function send(){
    const detail = { value };
    window.dispatchEvent(new CustomEvent("jupiter:send", { detail }));
    setValue("");
  }
  return (
    <div className="jupiter-footer">
      <input
        className="jupiter-input"
        placeholder={isChat ? "Type a message..." : "Type… (JUPITER to return to chat)"}
        value={value}
        onChange={e=> setValue(e.target.value)}
        onKeyDown={e=>{ if(e.key==="Enter") send(); }}
      />
      <button className="jupiter-send" onClick={send}>➤</button>
    </div>
  );
}

export function announceThought(t: string){
  speak(t);
  // Thoughts text is handled via state binding in your Chat body (see below).
}