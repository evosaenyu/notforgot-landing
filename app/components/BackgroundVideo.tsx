import React, { useEffect } from 'react';

const BackgroundVideo: React.FC = () => {
  const video = {
    src: '/assets/nfg.webm', // Use relative path from the public directory
    type: 'video/webm',
  };

  useEffect(() => {
    const videoElement = document.querySelector('video');
    if (videoElement) {
      videoElement.playbackRate = 0.6;
    }
  }, []);

  return (
    <div
      style={{
        position: 'absolute',
        top: 0,
        left: 0,
        width: '100%',
        height: '100%',
        zIndex: 0,
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundImage: 'linear-gradient(to bottom, rgba(68, 22, 115, 0.9),rgba(68, 22, 115, 1))',
          zIndex: 1,
          pointerEvents: 'none',
        }}
      >
        {/* <div style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          backgroundImage: 'linear-gradient(to bottom, rgba(68, 22, 115, 0.9),rgba(68, 22, 115, 1))',
          zIndex: 1,
          pointerEvents: 'none',
        }}></div> */}
      </div>
      <video
        autoPlay
        loop
        muted
        playsInline
        webkit-playsinline="true"
        x5-playsinline="true"
        x5-video-player-type="h5"
        x5-video-player-fullscreen="false"
        x5-video-orientation="portraint"
        style={{
          minWidth: '100vw',
          minHeight: '100vh',
          objectFit: 'cover',
          position: 'absolute',
          top: 0,
          left: 0,
          zIndex: 0,
        }}
      >
        <source src={video.src} type={video.type} />
      </video>
    </div>
  );
};

export default BackgroundVideo;