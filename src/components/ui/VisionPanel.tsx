import React, { useEffect } from 'react';
import { useVision } from '@/hooks/use-vision';
import { Button } from './button';
import { Video, VideoOff, ScanText, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

export const VisionPanel: React.FC = () => {
  const {
    videoRef,
    startCamera,
    stopCamera,
    startVision,
    stopVision,
    runOcr,
    detections,
    isCameraActive,
    isVisionActive,
    error,
  } = useVision();

  useEffect(() => {
    // Automatically start vision when camera becomes active
    if (isCameraActive && !isVisionActive) {
      startVision();
    }
  }, [isCameraActive, isVisionActive, startVision]);

  const handleOcr = async () => {
    toast.info("Running OCR...");
    const text = await runOcr();
    if (text) {
      toast.success("OCR complete. Context updated.");
      // Here you would pipe the text into the AI context
      console.log("OCR Result:", text);
    } else {
      toast.error("OCR could not find any text.");
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-900/50 text-white">
      <div className="relative flex-1 bg-black flex items-center justify-center">
        <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-contain" />
        {isVisionActive && detections.map((det, i) => (
          <div
            key={i}
            className="absolute border-2 border-cyan-400/80"
            style={{
              left: det.box[0],
              top: det.box[1],
              width: det.box[2],
              height: det.box[3],
            }}
          >
            <span className="absolute -top-6 left-0 bg-cyan-400/80 text-black text-xs px-1 py-0.5 rounded">
              {det.cls} ({Math.round(det.score * 100)}%)
            </span>
          </div>
        ))}
        {!isCameraActive && (
          <div className="text-gray-500 flex flex-col items-center gap-2">
            <VideoOff size={48} />
            <p>Vision is offline</p>
          </div>
        )}
      </div>
      {error && (
        <div className="p-2 bg-red-900/50 text-red-300 flex items-center gap-2">
          <AlertCircle size={16} /> {error}
        </div>
      )}
      <div className="p-2 border-t border-gray-700 flex gap-2">
        {!isCameraActive ? (
          <Button onClick={startCamera} className="flex-1">
            <Video className="mr-2" /> Start Vision
          </Button>
        ) : (
          <Button onClick={stopCamera} variant="destructive" className="flex-1">
            <VideoOff className="mr-2" /> Stop Vision
          </Button>
        )}
        <Button onClick={handleOcr} disabled={!isCameraActive} variant="outline">
          <ScanText className="mr-2" /> Run OCR
        </Button>
      </div>
    </div>
  );
};