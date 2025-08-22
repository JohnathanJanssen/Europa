import React from 'react';

export default function FlipFrame({front, back}:{front:React.ReactNode; back:React.ReactNode}) {
  // The flipping transform will be handled by the parent using a 'flipped' class.
  return (
    <div className="relative w-[480px] max-w-[92vw] [transform-style:preserve-3d] duration-500 transition-transform">
      <div className="[backface-visibility:hidden]">{front}</div>
      <div className="absolute inset-0 [backface-visibility:hidden] [transform:rotateY(180deg)]">
        {back}
      </div>
    </div>
  );
}