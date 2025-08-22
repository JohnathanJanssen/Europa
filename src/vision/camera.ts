export async function listCameras(): Promise<MediaDeviceInfo[]> {
  try {
    // Request a temp stream once so labels populate on macOS
    const tmp = await navigator.mediaDevices.getUserMedia({ audio:false, video:true });
    tmp.getTracks().forEach(t=>t.stop());
  } catch {}
  const devices = await navigator.mediaDevices.enumerateDevices();
  return devices.filter(d => d.kind === 'videoinput');
}

export async function startCamera(deviceId?: string): Promise<MediaStream> {
  const constraints: MediaStreamConstraints = {
    audio: false,
    video: deviceId ? { deviceId: { exact: deviceId } } : { facingMode: 'user' }
  };
  return navigator.mediaDevices.getUserMedia(constraints);
}

export function stopStream(stream?: MediaStream|null) {
  try { stream?.getTracks().forEach(t => t.stop()); } catch {}
}