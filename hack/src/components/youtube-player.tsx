'use client';

import { VolumeX } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

interface YouTubePlayerProps {
  videoId: string;
  startAt?: number | null;
  endAt?: number | null;
}

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady?: () => void;
  }
}

const isMobileDevice = () => {
  if (typeof window === 'undefined') return false;
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent,
  );
};

export function YouTubePlayer({ videoId, startAt, endAt }: YouTubePlayerProps) {
  const playerRef = useRef<HTMLDivElement>(null);
  const ytPlayerRef = useRef<any>(null);
  const [isReady, setIsReady] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [showUnmuteButton, setShowUnmuteButton] = useState(false);
  const hasTriedUnmutedAutoplay = useRef(false);
  const [isMobile] = useState(isMobileDevice);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const loadYouTubeAPI = () => {
      if (window.YT?.Player) {
        setIsReady(true);
        return;
      }

      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);

      window.onYouTubeIframeAPIReady = () => {
        setIsReady(true);
      };
    };

    loadYouTubeAPI();
  }, []);

  useEffect(() => {
    if (!isReady || !playerRef.current) return;

    // Clean up existing player
    if (ytPlayerRef.current) {
      ytPlayerRef.current.destroy();
      ytPlayerRef.current = null;
    }

    const playerVars: any = {
      autoplay: 1,
      mute: 1,
      controls: 1,
      modestbranding: 1,
      rel: 0,
      playsinline: 1,
      origin: window.location.origin,
    };

    if (startAt !== null && startAt !== undefined) {
      playerVars.start = startAt;
    }

    ytPlayerRef.current = new window.YT.Player(playerRef.current, {
      videoId,
      playerVars,
      events: {
        onReady: (event: any) => {
          // Seek to start time when player is ready
          if (startAt !== null && startAt !== undefined) {
            event.target.seekTo(startAt, true);
          }
        },
        onStateChange: (event: any) => {
          if (event.data === window.YT.PlayerState.PLAYING) {
            // Handle unmute logic (only once)
            if (!hasTriedUnmutedAutoplay.current) {
              hasTriedUnmutedAutoplay.current = true;

              if (isMobile) {
                // On mobile: Always show unmute button, don't try auto-unmute
                setShowUnmuteButton(true);
              } else {
                // On desktop: Try unmuting - if there was a recent user gesture, this will work
                event.target.unMute();
                setIsMuted(false);

                // Check after a brief moment if we're still unmuted
                setTimeout(() => {
                  const volume = event.target.getVolume();
                  const muted = event.target.isMuted();

                  if (muted || volume === 0) {
                    // Unmuting failed, show the unmute button
                    event.target.mute();
                    setIsMuted(true);
                    setShowUnmuteButton(true);
                  } else {
                    // Successfully unmuted!
                    setShowUnmuteButton(false);
                  }
                }, 100);
              }
            }
          }
        },
      },
    });

    return () => {
      if (ytPlayerRef.current) {
        ytPlayerRef.current.destroy();
        ytPlayerRef.current = null;
      }
    };
  }, [isReady, videoId, startAt, endAt]);

  const handleUnmute = () => {
    if (ytPlayerRef.current) {
      ytPlayerRef.current.unMute();
      setIsMuted(false);
      setShowUnmuteButton(false);

      // On mobile, explicitly play the video after unmuting
      // as the unmute action can cause playback to pause
      setTimeout(() => {
        ytPlayerRef.current?.playVideo();
      }, 50);
    }
  };

  return (
    <div className="relative aspect-video w-full overflow-hidden border-2 border-primary/20 bg-black">
      <div ref={playerRef} className="h-full w-full" />
      {showUnmuteButton && isMuted && (
        <button
          type="button"
          onClick={handleUnmute}
          className="absolute inset-0 flex items-center justify-center bg-black/60 transition-opacity hover:bg-black/70"
          aria-label="Unmute video"
        >
          <div className="flex flex-col items-center gap-3 rounded-lg bg-primary px-8 py-6 text-background transition-transform hover:scale-105">
            <VolumeX className="h-12 w-12" />
            <span className="font-title text-lg">
              Toca para activar el audio
            </span>
          </div>
        </button>
      )}
    </div>
  );
}
