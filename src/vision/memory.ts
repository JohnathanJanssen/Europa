// light-weight local memory (no deps). Small, rotating window.
const KEY = 'jupiter_vision_memory_v1';
type Memory = { seen: Record<string, number>; novel: Array<{t:number,label:string}> };
function load(): Memory {
  try { return JSON.parse(localStorage.getItem(KEY) || '') as Memory } catch { return { seen:{}, novel:[] }; }
}
function save(m: Memory) { try { localStorage.setItem(KEY, JSON.stringify(m)); } catch {} }

export function bump(label:string) {
  const m = load(); m.seen[label] = (m.seen[label]||0)+1; save(m);
}
export function recordNovel(label:string) {
  const m = load(); m.novel.push({ t: Date.now(), label }); if (m.novel.length>200) m.novel.shift(); save(m);
}
export function snapshot() { return load(); }