import React, { useEffect, useRef, useState } from "react";

type Entry = { type: "in" | "out"; text: string };

export default function TerminalPanel({
  onClose,
  onOpenVision,
  onOpenFiles,
}: {
  onClose?: () => void;
  onOpenVision?: () => void;
  onOpenFiles?: () => void;
}) {
  const [hist, setHist] = useState<Entry[]>([{ type:"out", text:"Jupiter terminal. Type `help`." }]);
  const [cmd, setCmd] = useState("");
  const ref = useRef<HTMLInputElement>(null);
  const bodyRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (bodyRef.current) {
      bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
    }
  }, [hist]);

  function println(text: string){ setHist(h => [...h, { type:"out", text }]); }
  function run(line: string){
    setHist(h => [...h, { type:"in", text: line }]);
    const t = line.trim().toLowerCase();

    if (t === "help") {
      println("Commands: help, clear, vision, files, echo <text>, whoami");
    } else if (t === "clear") {
      setHist([]);
    } else if (t === "vision") {
      println("Opening Vision…"); onOpenVision?.();
    } else if (t === "files") {
      println("Opening Files…"); onOpenFiles?.();
    } else if (t.startsWith("echo ")) {
      println(line.trim().slice(5));
    } else if (t === "whoami") {
      println("Jupiter");
    } else if (t) {
      println(`Unknown: ${t}`);
    }
  }
  function submit(){
    if (!cmd.trim()) return;
    run(cmd);
    setCmd("");
    ref.current?.focus();
  }

  return (
    <div className="panel-card">
      <div className="panel-head">
        <div className="title">Terminal</div>
        <button className="close" onClick={onClose}>Close</button>
      </div>

      <div ref={bodyRef} className="term-body">
        {hist.map((e,i)=>(
          <div key={i} className={e.type==="in"?"line in":"line"}>
            {e.type==="in" && <span className="mr-2">$</span>}
            {e.text}
          </div>
        ))}
      </div>
      <div className="enroll-row">
        <input
          ref={ref}
          value={cmd}
          onChange={e=>setCmd(e.target.value)}
          onKeyDown={e=>{ if(e.key==="Enter") submit(); }}
          placeholder="Type a command…"
        />
        <button className="send" onClick={submit}>➤</button>
      </div>
    </div>
  );
}