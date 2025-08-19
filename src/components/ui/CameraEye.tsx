import React, { useState } from 'react';
import { useCamera, CameraConstraints } from '@/hooks/use-camera';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Camera, Video, VideoOff, AlertCircle, Eye } from 'lucide-react';

interface CameraEyeProps {
  onFileCaptured: (file: File) => void;
}

export const CameraEye: React.FC<CameraEyeProps> = ({ onFileCaptured }) => {
  const { start, stop, takeSnapshot, isActive, error, videoRef, devices } = useCamera();
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');

  const handleStart = () => {
    const constraints: CameraConstraints = {
      video: {
        width: { ideal: 1280 },
        height: { ideal: 720 },
      },
      audio: false,
    };
    if (selectedDeviceId) {
      constraints.video.deviceId = { exact: selectedDeviceId };
    }
    start(constraints);
  };

  const handleCapture = async () => {
    const blob = await takeSnapshot();
    if (blob) {
      const file = new File([blob], 'snapshot.png', { type: 'image/png' });
      onFileCaptured(file);
      toast.success("Snapshot captured.");
    }
  };

  const isCameraSupported = !!navigator.mediaDevices?.getUserMedia;

  return (
    <Card className="w-full max-w-xl mx-auto bg-black/30 border-gray-700">
      <CardHeader>
        <CardTitle className="text-white flex items-center gap-2">
          <Eye className="text-blue-400" /> Jupiter Vision
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="aspect-video bg-gray-900 rounded-md overflow-hidden flex items-center justify-center">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className={`w-full h-full object-contain ${!isActive ? 'hidden' : ''}`}
            />
            {!isActive && (
              <div className="text-gray-500 flex flex-col items-center">
                <VideoOff size={48} />
                <p>Camera is off</p>
              </div>
            )}
          </div>

          {error && (
            <div className="text-red-400 flex items-center gap-2 p-2 bg-red-900/50 rounded-md">
              <AlertCircle size={20} />
              <span>{error}</span>
            </div>
          )}

          <div className="flex flex-wrap gap-2 items-center">
            <Button onClick={handleStart} disabled={!isCameraSupported || isActive} aria-label="Start Camera">
              <Video className="mr-2" /> Start
            </Button>
            <Button onClick={stop} disabled={!isActive} variant="outline" aria-label="Stop Camera">
              <VideoOff className="mr-2" /> Stop
            </Button>
            <Button onClick={handleCapture} disabled={!isActive} variant="secondary" aria-label="Capture Snapshot">
              <Camera className="mr-2" /> Capture
            </Button>
            <div className="flex-1 min-w-[150px]">
              <Select
                value={selectedDeviceId}
                onValueChange={setSelectedDeviceId}
                disabled={!isCameraSupported || isActive || devices.length === 0}
              >
                <SelectTrigger className="bg-gray-800 border-gray-600 text-white">
                  <SelectValue placeholder="Default Camera" />
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
          {!isCameraSupported && <p className="text-sm text-yellow-400">Camera not supported on this device.</p>}
        </div>
      </CardContent>
    </Card>
  );
};