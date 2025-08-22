export type Det = { x:number; y:number; w:number; h:number; label:string; score:number; trackId?: string };
export type Track = Det & { id:number; cx:number; cy:number; age:number; trail:[number,number][] };
export type Insight =
  | { kind:'count'; at:number; counts:Record<string,number> }
  | { kind:'novel'; at:number; label:string; score:number }
  | { kind:'motion'; at:number; zone:'left'|'center'|'right'; intensity:number };

export type Face = {
  x:number; y:number; w:number; h:number;
  name?: string;             // assigned if known
};

export type PoseKeypoint = { x:number; y:number; score:number };
export type Pose = { keypoints: PoseKeypoint[]; score:number };

export type QRHit = { corners:[{x:number;y:number},{x:number;y:number},{x:number;y:number},{x:number;y:number}], text:string };

export type OCRHit = { box:{x:number;y:number;w:number;h:number}; text:string };

export type SceneSense = { label:string; prob:number };