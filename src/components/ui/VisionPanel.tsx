import React, { useEffect, useState, useCallback } from 'react';
import { useVision } from '@/hooks/use-vision';
import { Button } from './button';
import { Video, VideoOff, ScanText, AlertCircle, Smartphone, Camera } from 'lucide-react';
import { toast } from 'sonner';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

export const VisionPanel: React.FC = () => {
  const {
    videoRef,
    getVideoDevices,
    startCamera,
    stopCamera,
    runOcr,
    detections,
    isCameraActive,
    isVisionActive,
    error,
  } = useVision();

  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | undefined>();

  const loadDevices = useCallback(async () => {
    const videoDevices = await getVideoDevices();
    setDevices(videoDevices);
    if (!selectedDeviceId && videoDevices.length > 0) {
      const defaultDevice = videoDevices.find(d => d.label.toLowerCase().includes('back')) || videoDevices[0];
      setSelectedDeviceId(defaultDevice.deviceId);
    }
  }, [getVideoDevices, selectedDeviceId]);

  useEffect(() => {
    loadDevices();
  }, [loadDevices]);

  const handleStart = () => {
    if (selectedDeviceId) {
      startCamera(selectedDeviceId);
    } else {
      toast.error("No camera selected.");
    }
  };

  const handleDeviceSelect = (deviceId: string) => {
    setSelectedDeviceId(deviceId);
    if (isCameraActive) {
      startCamera(deviceId);
    }
  };

  const handleOcr = async () => {
    toast.info("Running OCR...");
    const text = await runOcr();
    if (text) {
      toast.success("OCR complete. Context updated.");
    } else {
      toast.error("OCR could not find any text.");
    }
  };

  const getDeviceIcon = (label: string) => {
    const lowerLabel = label.toLowerCase();
    if (lowerLabel.includes('iphone') || lowerLabel.includes('continuity')) {
      return <Smartphone size={16} />;
    }
    return <Camera size={16} />;
  };

  return (
    <div className="flex flex-col h-full bg-gray-900/50 text-white">
      <div className="relative flex-1 bg-black flex items-center justify-center">
        <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-contain" />
        {isVisionActive && detections.map((det, i) => (
          <div
            key={i}
            className="absolute border-2 border-cyan-400/80"
            style={{ left: det.box[0], top: det.box[1], width: det.box[2], height: det.box[3] }}
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
        <div className="p-2 bg-red-900/50 text-red-300 flex items-center gap-2 text-xs">
          <AlertCircle size={16} /> {error}
        </div>
      )}
      <div className="p-2 border-t border-gray-700/50 flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          {!isCameraActive ? (
            <Button onClick={handleStart} size="sm" className="flex-1" disabled={devices.length === 0}>
              <Video className="mr-2" /> Start
            </Button>
          ) : (
            <Button onClick={stopCamera} size="sm" variant="destructive" className="flex-1">
              <VideoOff className="mr-2" /> Stop
            </Button>
          )}
          <Button onClick={handleOcr} size="sm" disabled={!isCameraActive} variant="outline">
            <ScanText className="mr-2" /> OCR
          </Button>
        </div>
        <div className="flex items-center gap-1">
          <TooltipProvider>
            {devices.map(device => (
              <Tooltip key={device.deviceId} delayDuration={100}>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleDeviceSelect(device.deviceId)}
                    className={`h-8 w-8 ${selectedDeviceId === device.deviceId ? 'bg-blue-900/80 text-blue-300' : 'text-gray-400'}`}
                  >
                    {getDeviceIcon(device.label)}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{device.label || `Camera ${devices.indexOf(device) + 1}`}</p>
                </TooltipContent>
              </Tooltip>
            ))}
          </TooltipProvider>
        </div>
      </div>
    </div>
  );
};