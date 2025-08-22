/** Lightweight, persistent face-name store (per browser). */
export type TrackId = string;

const KEY = "europa.faceDb.v1";
type Store = Record<TrackId, string>;

function read(): Store {
  try { return JSON.parse(typeof localStorage !== "undefined" ? (localStorage.getItem(KEY) || "{}") : "{}"); }
  catch { return {}; }
}
function write(s: Store) {
  try { if (typeof localStorage !== "undefined") localStorage.setItem(KEY, JSON.stringify(s)); } catch {}
}

let cache: Store = read();

export function getFaceName(id: TrackId){ return cache[id]; }
export function setFaceName(id: TrackId, name: string){ cache[id] = name; write(cache); }
export function clearFaces(){ cache = {}; write(cache); }

/** Map-like facade for legacy imports expecting `faceDb`. */
export const faceDb = {
  get: (id: TrackId) => getFaceName(id),
  set: (id: TrackId, name: string) => setFaceName(id, name),
  has: (id: TrackId) => !!getFaceName(id),
};