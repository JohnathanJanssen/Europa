import React, { useEffect, useState, useCallback } from 'react';
import { useVision } from '@/hooks/use-vision';
import { Button } from './button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './select';
import { Video, VideoOff, ScanText, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

export const VisionPanel: React.FC = () => {
  const {
    videoRef,
    getVideoDevices,
    startCamera,
    stopCamera,
    startVision,
    runOcr,
    detections,
    isCameraActive,
    isVisionActive,
    error,
  } = useVision();

  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string | undefined>();

  useEffect(() => {
    async function loadDevices() {
      const videoDevices = await getVideoDevices();
      setDevices(videoDevices);
      if (videoDevices.length > 0) {
        const defaultDevice = videoDevices.find(d => d.label.toLowerCase().includes('back')) || videoDevices[0];
        setSelectedDeviceId(defaultDevice.deviceId);
      }
    }
    loadDevices();
  }, [getVideoDevices]);

  useEffect(() => {
    if (isCameraActive && !isVisionActive) {
      startVision();
    }
  }, [isCameraActive, isVisionActive, startVision]);

  const handleStart = () => {
    startCamera(selectedDeviceId);
  };

  const handleDeviceChange = (deviceId: string) => {
    setSelectedDeviceId(deviceId);
    if (isCameraActive) {
      // Restart camera with new device
      startCamera(deviceId);
    }
  };

  const handleOcr = async () => {
    toast.info("Running OCR...");
    const text = await runOcr();
    if (text) {
      toast.success("OCR complete. Context updated.");
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
      <div className="p-2 border-t border-gray-700 flex flex-col gap-2">
        <div className="flex gap-2">
          {!isCameraActive ? (
            <Button onClick={handleStart} className="flex-1" disabled={!selectedDeviceId}>
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
        <Select onValueChange={handleDeviceChange} value={selectedDeviceId} disabled={devices.length === 0}>
          <SelectTrigger>
            <SelectValue placeholder="Select a camera..." />
          </SelectTrigger>
          <SelectContent>
            {devices.map(device => (
              <SelectItem key={device.deviceId} value={device.deviceId}>
                {device.label || `Camera ${devices.indexOf(device) + 1}`}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};