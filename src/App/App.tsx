import { useEffect, useRef } from 'react';
import './App.scss';
function App() {

  const videoRef = useRef<HTMLVideoElement>(null);
  let cameraSettings: any = null;
  let stream: any = null;

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
    try {
      if (videoRef.current) {

        stream =   await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: 'user', //"user" = front camera, "environment" = rear camera
            width: { ideal: 8000 },
            height: { ideal: 8000 },
            frameRate: { ideal: 60 }
          },
          audio: false
        });
        videoRef.current.srcObject = stream;

        if (videoRef.current?.srcObject) {
          const track = (videoRef.current.srcObject as MediaStream).getVideoTracks()[0];
          const capabilities: any = track.getCapabilities();
          if (track && capabilities && 'zoom' in capabilities) {
            const settings: any = track.getSettings();
            cameraSettings = {
              currentLevel: settings.zooom,
              min: capabilities.zoom.min,
              max: capabilities.zoom.max,
              step: capabilities.zoom.step
            }
            await track.applyConstraints({
              advanced: [{ zoom: 1 }] as any // Example: zoom to 2x
            });
          } else { console.warn('Zoom not supported on this device'); }
        }
      }
    } catch (error) { console.error("Error accessing selfie camera:", error); }
  }
  const setZoomLevel = async (zoomLevel: number = 1) => {
    if (stream) {
      const track = stream.getVideoTracks()[0];
      const capabilities: any = track.getCapabilities();

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
  const getZoomLevel = (): any => {
    if (videoRef.current?.srcObject) {
      const track = (videoRef.current.srcObject as MediaStream).getVideoTracks()[0];
      const capabilities: any = track.getCapabilities();

      if (track && capabilities && 'zoom' in capabilities) {
        const settings: any = track.getSettings();
        return settings.zooom;
      } else {
        console.warn('Zoom not supported on this device');
        return null;
      }
    } else {
      return null;
    }
  }

  useEffect(() => {

    window.onresize = () => { /* console.log("RESIZING IS HAPPENING"); */ }
    window.onwheel = () => { /* console.log("WHEEL IS ROLLING"); */ }

    /*const bodyElement = document.getElementsByTagName('body')[0];
    (videoRef.current as HTMLElement).onclick = (event: Event) => {
      // document.fullscreenElement === bodyElement ? closeFullscreen(bodyElement) : openFullscreen(bodyElement)
    }*/

  
      let onylOnce = true;
    let startPoint: any = null;

    // Horizontal -> 0; Vertical -> 1;
    let initialDirection: number = 1;
    let previousDistance: number = 0;
    let diagonalDistance: number = 0;

    if (window.PointerEvent && ('ontouchstart' in window || navigator.maxTouchPoints > 0 || window.matchMedia('(pointer: coarse)').matches)) {

      (videoRef.current as HTMLElement).onpointerdown = (event: PointerEvent) => {
        onylOnce = true;
        initialDirection = 1;
        diagonalDistance = previousDistance = 0;
        startPoint = { x: event.clientX, y: event.clientY, time: Date.now() };
      }

      (videoRef.current as HTMLElement).onpointermove = (event: PointerEvent) => {

        const getDirection = (distanceA: number, distanceB: number): number => {
          // Value 0 represents HORIZONTAL direction, value 1 VERTICAL direction
          return distanceA > distanceB ? 0 : 1;
        }
        const isZooming = (distance: number = 0, newDirection: number = 1) => {

          let zoomLevel: number = getZoomLevel() ? getZoomLevel() : 1;

          if (Number(zoomLevel)) {
            const step = cameraSettings?.step ? cameraSettings.step : 0.01;
            if (initialDirection === newDirection) {
              if (distance < previousDistance) {
                //console.log("Decreasing");
                zoomLevel = zoomLevel - step;
              } else {
                //console.log('Increasing');
                zoomLevel = zoomLevel + step;
              }
              previousDistance = distance;
              if (Number(zoomLevel)) {
                setZoomLevel(zoomLevel);
              }
            } else {
              initialDirection = newDirection;
              startPoint = endPoint;
              previousDistance = 0;
            }
          }
        }

        let endPoint = { x: event.clientX, y: event.clientY, time: Date.now() };

        let chatetusHorizontal = Math.abs(endPoint?.x - startPoint?.x);
        let chatetusVertical = Math.abs(endPoint?.y - startPoint?.y);
        diagonalDistance = Math.pow(Math.pow(chatetusHorizontal, 2) + Math.pow(chatetusVertical, 2), 0.5);

        if (onylOnce && diagonalDistance > 0) {
          initialDirection = getDirection(Math.pow(chatetusHorizontal, 0.7), Math.pow(chatetusVertical, 0.7));
          onylOnce = false;
        }

        if (onylOnce === false) {
          if (initialDirection) {
            isZooming((startPoint.y - endPoint.y), getDirection(Math.pow(chatetusHorizontal, 0.7), Math.pow(chatetusVertical, 0.7)));
          } else {
            isZooming((endPoint.x - startPoint.x), getDirection(Math.pow(chatetusHorizontal, 0.7), Math.pow(chatetusVertical, 0.7)));
          }
        }
      }
      (videoRef.current as HTMLElement).onpointerup = (event: PointerEvent) => {
        //console.log("Razlika je: " + hypotenuse);
      }
      (videoRef.current as HTMLElement).onpointercancel = (event: PointerEvent) => {
        //console.log("Razlika je: " + hypotenuse);
      }
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
