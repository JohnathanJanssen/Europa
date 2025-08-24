import React from "react";

type Line = { in?: string; out?: string };

export function TerminalPanel(){
  const [buf,setBuf] = React.useState<Line[]>([{ out: "Jupiter sandbox terminal. Type 'help'." }]);
  const [line,setLine] = React.useState("");
  const scrollRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [buf]);

  function run(cmd: string){
    const [head,...rest] = cmd.trim().split(/\s+/);
    const arg = rest.join(" ");
    let out = "";
    switch((head||"").toLowerCase()){
      case "help": out = "Commands: help, echo <text>, time, clear"; break;
      case "echo": out = arg; break;
      case "time": out = new Date().toLocaleString(); break;
      case "clear": setBuf([]); return;
      default: out = head ? `Unknown command: ${head}` : ""; break;
    }
    setBuf(b=>[...b, { in: cmd }, { out }]);
  }

  return (
    <div className="h-full flex flex-col">
      <div ref={scrollRef} className="flex-1 rounded-xl bg-black/50 ring-1 ring-white/10 p-3 h-56 overflow-auto font-mono text-sm text-slate-200">
        {buf.map((l,i)=>(
          <div key={i} className="whitespace-pre-wrap">
            {l.in  && <div className="text-sky-300"><span>➜ </span><span>{l.in}</span></div>}
            {l.out && <span className="block text-slate-200/90">{l.out}</span>}
          </div>
        ))}
      </div>
      <div className="mt-3 flex items-center gap-2">
        <input value={line} onChange={e=>setLine(e.target.value)}
          onKeyDown={e=>{ if(e.key==="Enter"){ run(line); setLine(""); }}}
          placeholder="Type a command..."
          className="flex-1 rounded-xl px-4 py-2 text-slate-200 bg-slate-950/60 ring-1 ring-white/10 focus:outline-none"/>
        <button onClick={()=>{ run(line); setLine(""); }}
          className="rounded-xl px-4 py-2 bg-slate-800/70 text-white ring-1 ring-white/10">Run</button>
      </div>
    </div>
  );
}