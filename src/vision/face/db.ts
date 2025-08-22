const KEY = 'jupiter_face_db_v1';
export type Person = { name:string; vecs:number[][]; lastSeen:number; seen:number };

function load(): Record<string, Person> {
  try { return JSON.parse(localStorage.getItem(KEY) || '{}') } catch { return {}; }
}
function save(db: Record<string, Person>) { try { localStorage.setItem(KEY, JSON.stringify(db)); } catch {} }

export function allPeople() { return load(); }
export function forgetAll() { save({}); }
export function upsert(name:string, vec:number[]) {
  const db = load();
  const p = db[name] || { name, vecs:[], lastSeen:0, seen:0 };
  p.vecs.push(vec); while (p.vecs.length > 20) p.vecs.shift(); // cap
  p.lastSeen = Date.now(); p.seen += 1;
  db[name] = p; save(db);
}
export function match(vec:number[], threshold=0.55): { name:string; distance:number } | null {
  const db = load();
  let best: { name:string; distance:number } | null = null;
  function dist(a:number[], b:number[]) {
    let s=0; for (let i=0;i<a.length;i++) { const d=a[i]-b[i]; s += d*d; } return Math.sqrt(s);
  }
  for (const name of Object.keys(db)) {
    const p = db[name];
    for (const v of p.vecs) {
      const d = dist(vec, v);
      if (!best || d < best.distance) best = { name, distance:d };
    }
  }
  return (best && best.distance <= threshold) ? best : null;
}