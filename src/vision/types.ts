export type Det = { x:number; y:number; w:number; h:number; label:string; score:number };
export type Track = Det & { id:number; cx:number; cy:number; age:number; trail:[number,number][] };
export type Insight =
  | { kind:'count'; at:number; counts:Record<string,number> }
  | { kind:'novel'; at:number; label:string; score:number }
  | { kind:'motion'; at:number; zone:'left'|'center'|'right'; intensity:number };

export type Face = {
  x:number; y:number; w:number; h:number;
  name?: string;             // assigned if known
  distance?: number;         // match score (lower better)
  descriptor?: number[];     // 128D embedding when unknown (for naming)
  isNew?: boolean;           // true if we’ve never seen this identity
};