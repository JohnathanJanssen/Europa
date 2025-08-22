import React, { useMemo, useState } from "react";
import "../styles/shell.css";

type Dict = Record<string,string>;

function useCodebase(){
  // @ts-ignore
  const srcFiles: Dict = import.meta.glob("/src/**/*", { as: "raw", eager:true });
  // @ts-ignore
  const pubFiles: Dict = import.meta.glob("/public/**/*", { as: "raw", eager:true });
  return useMemo(()=> ({...srcFiles, ...pubFiles}) as Dict, []);
}

export default function FilesPanel({ className, onClose }: { className?: string; onClose?: () => void; }){
  const files = useCodebase();
  const [current, setCurrent] = useState<string | null>(null);

  const list = useMemo(()=> Object.keys(files).sort((a,b)=> a.localeCompare(b)), [files]);
  const code = current ? files[current] : "";

  return (
    <div className={className} aria-label="Files">
      <div style={{display:"grid", gridTemplateColumns:"240px 1fr", gap:12}}>
        <div style={{maxHeight:440, overflow:"auto", borderRight:"1px solid var(--stroke)", paddingRight:8}}>
          <div className="file-list">
            {list.map(p => (
              <div key={p} style={{display:"contents"}}>
                <div className="file-item" onClick={()=>setCurrent(p)} title={p}>{p}</div>
                <button className="file-item" onClick={()=>navigator.clipboard.writeText(files[p])}>Copy</button>
              </div>
            ))}
          </div>
        </div>
        <div className="code-view jupiter-panel" aria-live="polite">
          {current ? code : "Select a file to preview."}
        </div>
      </div>
    </div>
  );
}