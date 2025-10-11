
import { useEffect, useRef } from 'react';
import './App.scss';

function App() {

  const videoRef = useRef<HTMLVideoElement>(null);

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
      }
    } catch (error) {
      console.error("Error accessing selfie camera:", error);
    }
  }

  useEffect(() => {

    const bodyElement = document.getElementsByTagName('body')[0];

    videoRef.current?.addEventListener('click', (event: Event) => {
      document.fullscreenElement === bodyElement ? closeFullscreen(bodyElement) : openFullscreen(bodyElement)
    });

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
