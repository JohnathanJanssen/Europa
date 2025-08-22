import React from "react";
export default function TerminalPanel({ className, onClose, lines }:{
  className?: string; onClose?: ()=>void; lines: string[];
}){
  return (
    <div className={className ?? ""} role="region" aria-label="Terminal">
      <div className="panel-head"><div className="title">Terminal</div><button className="x" onClick={onClose}>Close</button></div>
      <pre className="term-screen" aria-live="polite">{lines.join("\n")}</pre>
    </div>
  );
}