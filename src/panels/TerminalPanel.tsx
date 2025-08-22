import React, { useRef, useState } from "react";
import "../styles/shell.css";

export default function TerminalPanel({ className, onClose }: { className?: string; onClose?: () => void; }){
  const [out, setOut] = useState<string>("Jupiter terminal. Type `help`.\n");
  const input = useRef<HTMLInputElement>(null);

  function print(s: string){ setOut(prev => prev + s + "\n"); }
  function run(cmd: string){
    const [head, ...rest] = cmd.trim().split(/\s+/);
    switch(head){
      case "help": print("help · clear · echo <text> · time"); break;
      case "clear": setOut(""); break;
      case "echo": print(rest.join(" ")); break;
      case "time": print(new Date().toLocaleString()); break;
      default: print(`unknown: ${cmd}`);
    }
  }
  return (
    <div className={className}>
      <div className="term" aria-label="terminal output">{out}</div>
      <div style={{display:"grid", gridTemplateColumns:"1fr auto", gap:8, marginTop:10}}>
        <input ref={input} className="jupiter-input" placeholder="Type a command..." onKeyDown={(e)=>{ if(e.key==="Enter"){ run((e.target as HTMLInputElement).value); (e.target as HTMLInputElement).value=""; }}}/>
        <button className="jupiter-send" onClick={()=>{ if(!input.current) return; run(input.current.value); input.current.value=""; }}>➤</button>
      </div>
    </div>
  );
}