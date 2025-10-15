import { useEffect, useRef } from 'react';
import './App.scss';
function App() {

  const videoRef = useRef<HTMLVideoElement>(null);
  let zoomLevel: number = 0;

  const openFullscreen = (htmlElement: any) => {
    if (htmlElement.requestFullscreen) htmlElement.requestFullscreen();
    else if (htmlElement.webkitRequestFullscreen) htmlElement.webkitRequestFullscreen();
    else if (htmlElement.msRequestFullscreen) htmlElement.msRequestFullscreen();
  }
  const closeFullscreen = (htmlElement: any) => {
    if (htmlElement.exitFullscreen) htmlElement.exitFullscreen();
    else if (htmlElement.webkitExitFullscreen) htmlElement.webkitExitFullscreen();
    else if (htmlElement.msExitFullscreen) htmlElement.msExitFullscreen();
  }
  const startSelfieCamera = async () => {
    zoomLevel = 1;
    try {
      if (videoRef.current) {

        videoRef.current.srcObject = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: 'user', //"user" = front camera, "environment" = rear camera
            width: { ideal: 8000 },
            height: { ideal: 8000 },
            frameRate: { ideal: 60 }
          },
          audio: false
        });;

        if (videoRef.current?.srcObject) {
          const track = (videoRef.current.srcObject as MediaStream).getVideoTracks()[0];
          const capabilities: any = track.getCapabilities();
          if (track && capabilities && 'zoom' in capabilities) {
            /*
              const settings: any = track.getSettings();
              cameraSettings = {
                currentLevel: settings.zooom,
                min: capabilities.zoom.min,
                max: capabilities.zoom.max,
                step: capabilities.zoom.step
              }
            */
            await track.applyConstraints({
              advanced: [{ zoom: zoomLevel }] as any // Example: zoom to 2x
            });
          } else { console.warn('Zoom not supported on this device'); }
        }
      }
    } catch (error) { console.error("Error accessing selfie camera:", error); }
  }
  const setZoomLevel = async (zoomLevel: number = 1) => {
    console.log("Zoom level is: " + zoomLevel);
    if (videoRef?.current) {
      const track = (videoRef.current?.srcObject as MediaStream)?.getVideoTracks()[0];
      const capabilities: any = track?.getCapabilities();

      if (track && capabilities && 'zoom' in capabilities) {
        const settings: any = track.getSettings();
        console.log('Current zoom:', settings.zoom);
        console.log('Zoom range:', capabilities.zoom);
        await track.applyConstraints({
          advanced: [{ zoom: zoomLevel }] as any // Example: zoom to 2x
        });
      } else {
        console.warn('Zoom not supported on this device');
      }
    }
  }

  useEffect(() => {

    window.onresize = () => { /* console.log("RESIZING IS HAPPENING"); */ }
    window.onwheel = () => { /* console.log("WHEEL IS ROLLING"); */ }

    /*const bodyElement = document.getElementsByTagName('body')[0];
    (videoRef.current as HTMLElement).onclick = (event: Event) => {
      // document.fullscreenElement === bodyElement ? closeFullscreen(bodyElement) : openFullscreen(bodyElement)
    }*/

    (videoRef.current as HTMLElement).onclick = (event: Event) => {
      zoomLevel = zoomLevel == 1 ? 2 : 1;
      setZoomLevel(zoomLevel);
    }

    navigator.permissions.query(({ name: "camera" } as any)).then(result => {
      console.log("Camera permission state:", result.state);
      if (result.state === "granted" || "prompt") {
        startSelfieCamera();
      }
      result.onchange = (event: Event) => {
        console.log("Camera permission state changed to:", result.state);
        if (result.state === "granted" || "prompt") {
          startSelfieCamera();
        }
      }
    });
  }, []);

  return (
    <video ref={videoRef} autoPlay playsInline className='fade-in'></video>
  );
}

export default App;
