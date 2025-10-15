import { useEffect, useRef } from 'react';
import './App.scss';
function App() {

  const videoRef = useRef<HTMLVideoElement>(null);
  //let cameraSettings: any = null;

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
              advanced: [{ zoom: 1 }] as any // Example: zoom to 2x
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

    let onylOnce = true;
    let startPoint: any = null;
    let increasingStep: number = 0;
    let decreasingStep: number = 0;

    // Horizontal -> 0; Vertical -> 1;
    let initialDirection: number = 1;
    let diagonalDistance: number = 0;

    let previousEndPoint: any = null;
    let directionChangePoint: any = null;

    if (window.PointerEvent && ('ontouchstart' in window || navigator.maxTouchPoints > 0 || window.matchMedia('(pointer: coarse)').matches)) {

      (videoRef.current as HTMLElement).onpointerdown = (event: PointerEvent) => {
        onylOnce = true;
        initialDirection = 1;
        diagonalDistance = increasingStep = decreasingStep = 0;
        previousEndPoint = directionChangePoint = null;
        startPoint = { x: event.clientX, y: event.clientY, time: Date.now() };
      }

      (videoRef.current as HTMLElement).onpointermove = (event: PointerEvent) => {

        let endPoint = { x: event.clientX, y: event.clientY, time: Date.now() };

        const isZooming = (distance: number = 0, increaseOrDecrease: 'INCREASE' | 'DECREASE' = 'INCREASE') => {
          distance = Math.trunc(distance);

          if (decreasingStep >= 0 && increasingStep >= 0 && distance > 0 && increasingStep <= 2) {
            if (increaseOrDecrease === 'INCREASE') {
              directionChangePoint = (initialDirection ? endPoint.y : endPoint.x);
              decreasingStep = 0;
              if ((Math.abs(distance) / (initialDirection ? window.innerHeight : window.innerWidth)) > (increasingStep) * 0.1) {
                increasingStep += 0.01;
                //setZoomLevel(Number(increasingStep.toFixed(1)));
              }
            } else if (increaseOrDecrease === 'DECREASE') {
              increasingStep = 0;
              if (Number(directionChangePoint) && (Math.abs(directionChangePoint - (initialDirection ? endPoint.y : endPoint.x)) / (initialDirection ? window.innerHeight : window.innerWidth)) > decreasingStep * 0.1) {
                decreasingStep += 1;
                //setZoomLevel(decreasingStep);
              }
            }
          }
        }

        let chatetusHorizontal = Math.abs(endPoint?.x - startPoint?.x);
        let chatetusVertical = Math.abs(endPoint?.y - startPoint?.y);
        diagonalDistance = Math.pow(Math.pow(chatetusHorizontal, 2) + Math.pow(chatetusVertical, 2), 0.5);

        /*
          //Calculating angle
          let angle_in_degrees = Math.atan2((endPoint.y - startPoint.y), (endPoint.x - startPoint.x)) * (180 / Math.PI);
          if (angle_in_degrees < 0) {
            angle_in_degrees = 360 + angle_in_degrees;
          }
        */

        if (onylOnce && diagonalDistance > 10 * Math.trunc(window.devicePixelRatio)) {
          initialDirection = chatetusHorizontal > chatetusVertical ? 0 : 1;
          onylOnce = false;
        }
        if (onylOnce === false) {
          initialDirection ? isZooming(startPoint.y - endPoint.y, (Number(previousEndPoint) > endPoint.y) ? 'INCREASE' : 'DECREASE') : isZooming(endPoint.x - startPoint.x, (endPoint.x > Number(previousEndPoint)) ? 'INCREASE' : 'DECREASE');
          initialDirection ? previousEndPoint = endPoint.y : previousEndPoint = endPoint.x;
        }
      }
      (videoRef.current as HTMLElement).onpointerup = (event: PointerEvent) => {
        //console.log("Razlika je: " + diagonalDistance);
      }
      (videoRef.current as HTMLElement).onpointercancel = (event: PointerEvent) => {
        //console.log("Razlika je: " + diagonalDistance);
      }
    }

    (videoRef.current as HTMLElement).onclick = (event: Event) => {
      setZoomLevel(1);
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
