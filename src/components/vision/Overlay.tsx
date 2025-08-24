import React from 'react';
import type { Det } from '../../vision/engine';

type Props = {
  dets: Det[];
  width: number;
  height: number;
};

export default function Overlay({ dets, width, height }: Props) {
  return (
    <div className="absolute inset-0 pointer-events-none">
      {dets.map((d, i) => {
        const [x, y, w, h] = d.bbox;
        const left = (x / width) * 100;
        const top  = (y / height) * 100;
        const boxW = (w / width) * 100;
        const boxH = (h / height) * 100;
        return (
          <div key={i}
            className="absolute border border-white/70 rounded-md"
            style={{ left: `${left}%`, top: `${top}%`, width: `${boxW}%`, height: `${boxH}%` }}
          >
            <div className="absolute -top-6 left-0 px-2 py-0.5 rounded-md text-xs
                            bg-black/70 text-white shadow">
              {d.label} {Math.round(d.score * 100)}%
            </div>
          </div>
        );
      })}
    </div>
  );
}