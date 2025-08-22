/* This file wraps your existing chat logic inside the fixed Shell and re-enables voice. */
/* If this file already defines a component, keep its core message logic but mount through <Shell/>. */

import React, { useEffect, useState } from "react";
import Shell from "../ui/Shell";
import { postThought, _bindSetThinking } from "../state/ui";
import { speak, setVoicePace } from "../runtime/voice";

setVoicePace(0.88, 0.95);  // Frieren-like pace

type Msg = { role:"user"|"assistant"; text:string };

function ChatCore(){
  const [messages, setMessages] = useState<Msg[]>([
    { role:"assistant", text:"Hi! How can I help?" }
  ]);

  // Bind thoughts setter so other modules can surface live thoughts
  const [, setTick] = useState(0);
  useEffect(()=>{ _bindSetThinking(()=> setTick(x=>x+1)); },[]);

  useEffect(()=>{
    // Listen for footer sends
    function onSend(e: any){
      const val = e.detail?.value ?? "";
      if(!val.trim()) return;
      setMessages(m => [...m, {role:"user", text: val}]);
      // Your real brain can replace this stub response:
      const reply = routeCommand(val.trim());
      setMessages(m => {
        const next = [...m, {role:"assistant", text: reply} as Msg];
        // voice
        speak(reply);
        return next;
      });
    }
    window.addEventListener("jupiter:send", onSend);
    return ()=> window.removeEventListener("jupiter:send", onSend);
  },[]);

  return (
    <div style={{display:"grid", gap:12}}>
      {messages.map((m,i)=>(
        <div key={i} style={{
          alignSelf: m.role==="user" ? "end" : "start",
          maxWidth:"85%",
          background: m.role==="user" ? "rgba(64,92,255,0.22)" : "rgba(255,255,255,0.06)",
          border:"1px solid rgba(255,255,255,0.06)",
          padding:"12px 14px",
          borderRadius:14,
          color:"#e8eeff"
        }}>{m.text}</div>
      ))}
      <div style={{height:8}}/>
    </div>
  );
}

/* Tiny router for quick demo – replace with your existing command handlers if you have them. */
function routeCommand(s: string): string{
  const L = s.toLowerCase();
  if (L.includes("open vision")) { postThought("Opening Vision…"); window.dispatchEvent(new CustomEvent("jupiter:face",{detail:"vision"})); return "Opening Vision…"; }
  if (L.includes("open terminal")) { postThought("Opening Terminal…"); window.dispatchEvent(new CustomEvent("jupiter:face",{detail:"terminal"})); return "Opening Terminal…"; }
  if (L.includes("open files")) { postThought("Opening Files…"); window.dispatchEvent(CustomEvent("jupiter:face",{detail:"files"})); return "Opening Files…"; }
  return "Hello! What do you need?";
}

/* Bridge Shell <-> Chat footer + face switching */
function ChatBody(){
  useEffect(()=>{
    function onFace(e:any){
      const face = e.detail;
      // no-op here: Shell owns the face; this stub exists for compatibility.
    }
    window.addEventListener("jupiter:face", onFace);
    return ()=> window.removeEventListener("jupiter:face", onFace);
  },[]);
  return <ChatCore/>;
}

/* Default export used by your page */
export default function JupiterChat(){
  return <Shell ChatBody={ChatBody} />;
}