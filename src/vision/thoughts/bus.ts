export type Thought = { t: number; text: string };
type Sub = (items: Thought[]) => void;

const MAX = 100;
let items: Thought[] = [];
const subs = new Set<Sub>();

export function think(text: string) {
  if (items[0]?.text === text) return; // avoid immediate duplicates
  items.unshift({ t: Date.now(), text });
  if (items.length > MAX) items.length = MAX;
  subs.forEach(fn => { try { fn(items); } catch {} });
}

export function getThoughts() { return items.slice(); } // Export getThoughts
export function onThoughts(fn: Sub) {
  subs.add(fn); fn(items);
  return () => { subs.delete(fn); }; // Ensure void return
}