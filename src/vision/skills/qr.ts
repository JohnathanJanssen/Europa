import jsQR from 'jsqr';
export function scanQR(video: HTMLVideoElement) {
  const w = video.videoWidth || 640, h = video.videoHeight || 480;
  if (!w || !h) return null;
  const cvs = document.createElement('canvas'); cvs.width=w; cvs.height=h;
  const ctx = cvs.getContext('2d')!; ctx.drawImage(video,0,0,w,h);
  const img = ctx.getImageData(0,0,w,h);
  const hit = jsQR(img.data, img.width, img.height, { inversionAttempts: 'dontInvert' });
  if (!hit) return null;
  return {
    corners: [
      { x: hit.location.topLeftCorner.x, y: hit.location.topLeftCorner.y },
      { x: hit.location.topRightCorner.x, y: hit.location.topRightCorner.y },
      { x: hit.location.bottomRightCorner.x, y: hit.location.bottomRightCorner.y },
      { x: hit.location.bottomLeftCorner.x, y: hit.location.bottomLeftCorner.y },
    ] as [{x:number;y:number},{x:number;y:number},{x:number;y:number},{x:number;y:number}], // Explicit cast
    text: hit.data
  };
}