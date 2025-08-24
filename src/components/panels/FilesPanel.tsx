import React from "react";
import { useJupiterFiles } from "@/hooks/use-jupiter-files";
import { toast } from "sonner";
import { Download, Edit, Trash2, UploadCloud } from "lucide-react";

export function FilesPanel(){
  const { files, listFiles, renameFile, deleteFile, writeFile, currentPath } = useJupiterFiles();
  
  React.useEffect(()=>{
    listFiles(".");
  },[listFiles]);

  async function doUpload(e: React.ChangeEvent<HTMLInputElement>){
    const file = e.target.files?.[0]; if(!file) return;
    const content = await file.text(); // Assuming text files for simplicity
    await writeFile(file.name, content);
    toast.success(`Uploaded "${file.name}"`);
    listFiles(".");
    e.target.value = ""; // Reset input
  }

  async function doRename(path: string){
    const oldName = path.split('/').pop() || path;
    const newName = prompt("Enter new name:", oldName);
    if(!newName || newName === oldName) return;
    await renameFile(path, newName);
    toast.success(`Renamed to "${newName}"`);
    listFiles(".");
  }

  async function doDelete(path: string) {
    if (window.confirm(`Are you sure you want to delete "${path}"?`)) {
      await deleteFile(path);
      toast.success(`Deleted "${path}"`);
      listFiles(".");
    }
  }

  return (
    <div className="space-y-3 h-full flex flex-col">
      <div className="flex items-center gap-3">
        <label className="flex-1 flex items-center justify-center gap-2 rounded-xl px-4 py-2 bg-slate-800/70 text-white ring-1 ring-white/10 cursor-pointer">
          <UploadCloud size={16} />
          <span>Upload</span>
          <input type="file" className="hidden" onChange={doUpload}/>
        </label>
      </div>
      <div className="flex-1 rounded-xl bg-slate-950/40 ring-1 ring-white/10 divide-y divide-white/5 overflow-y-auto">
        {files.length===0 && <div className="p-4 text-center text-slate-400">No files yet.</div>}
        {files.map(f=>(
          <div key={f.name} className="p-3 flex items-center justify-between gap-2">
            <div className="text-slate-200 truncate" title={f.name}>{f.name}</div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <button onClick={()=>doRename(f.name)} className="p-2 rounded-md hover:bg-white/10"><Edit size={14} /></button>
              <button onClick={()=>doDelete(f.name)} className="p-2 rounded-md hover:bg-white/10 text-red-400"><Trash2 size={14} /></button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}