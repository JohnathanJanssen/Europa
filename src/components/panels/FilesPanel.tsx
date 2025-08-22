import React, { useEffect, useMemo, useState } from "react";

type FileItem = { path: string; load: () => Promise<any> };

export default function FilesPanel({ onClose }: { onClose?: () => void }) {
  const files = useMemo(() => {
    const glob = import.meta.glob(["/src/**/*.*","/public/**/*.*"], { as: "raw", eager: false });
    return Object.keys(glob).sort().map((path) => ({ path, load: (glob as any)[path] as FileItem["load"] }));
  }, []);
  const [active, setActive] = useState<FileItem | null>(null);
  const [content, setContent] = useState<string>("");

  useEffect(() => {
    let ok = true;
    if (active) {
      setContent("Loading...");
      active.load().then((txt: string) => { if (ok) setContent(txt); });
    }
    return () => { ok = false; };
  }, [active]);

  return (
    <div className="panel-card">
      <div className="panel-head">
        <div className="title">Files</div>
        <button className="close" onClick={onClose}>Close</button>
      </div>

      <div className="files-layout">
        <aside className="tree">
          {files.map(f => (
            <button key={f.path} className={`tree-item ${active?.path===f.path?"active":""}`} onClick={()=>setActive(f)}>
              {f.path}
            </button>
          ))}
        </aside>
        <section className="viewer">
          {active ? (
            <pre className="code">{content}</pre>
          ) : (
            <div className="muted">Select a file to preview.</div>
          )}
        </section>
      </div>
    </div>
  );
}