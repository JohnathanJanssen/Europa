import React from 'react';
import { Button } from './ui/button';
import { Camera, X } from 'lucide-react';

interface CameraViewProps {
  videoRef: React.RefObject<HTMLVideoElement>;
  onCapture: () => void;
  onClose: () => void;
}

export const CameraView: React.FC<CameraViewProps> = ({ videoRef, onCapture, onClose }) => {
  return (
    <div className="absolute inset-0 bg-black/80 z-20 flex flex-col items-center justify-center rounded-2xl overflow-hidden">
      <video ref={videoRef} autoPlay playsInline className="w-full h-full object-contain" />
      <div className="absolute bottom-6 flex gap-4">
        <Button onClick={onCapture} size="lg" className="rounded-full p-4 bg-white/20 hover:bg-white/30 backdrop-blur-sm">
          <Camera className="w-8 h-8 text-white" />
        </Button>
      </div>
      <Button onClick={onClose} variant="ghost" size="icon" className="absolute top-4 right-4 text-white bg-black/20 hover:bg-black/40 rounded-full">
        <X className="w-8 h-8" />
      </Button>
    </div>
  );
};