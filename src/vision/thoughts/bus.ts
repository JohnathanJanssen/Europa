type Sub = (lines:string[]) => void;
const MAX = 40;
let buffer: string[] = [];
const subs = new Set<Sub>();

export function think(line:string) {
  if (!line) return;
  if (buffer[0] === line) return; // de-noise
  buffer = [line, ...buffer].slice(0, MAX);
  subs.forEach(fn => fn(buffer));
}
export function getThoughts() { return buffer.slice(); }
export function onThoughts(fn:Sub) {
  subs.add(fn);
  fn(buffer);
  return () => {
    subs.delete(fn);
    // Explicitly return void to satisfy useEffect's cleanup function type
  };
}