import { useEffect, useRef, useState, useCallback } from 'react';
import { MediaType, PlaybackStatus } from '../../types/room';
import { parseYouTubeId } from '../../utils/formatters';

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

export interface UnifiedPlayerState {
  currentTime: number;
  duration: number;
  status: PlaybackStatus;
  volume: number;
  isMuted: boolean;
  playbackRate: number;
  isReady: boolean;
  hasError: boolean;
  errorMessage: string | null;
}

export interface PlayerControls {
  play: () => void;
  pause: () => void;
  seek: (seconds: number) => void;
  setVolume: (volume: number) => void;
  toggleMute: () => void;
  setPlaybackRate: (rate: number) => void;
  toggleFullscreen: () => void;
  applyRemoteAction: (status: PlaybackStatus, positionSeconds: number, rate?: number) => void;
  isSyncingRef: React.RefObject<boolean>;
}

export function useUnifiedPlayer(
  mediaType: MediaType,
  mediaUrl: string,
  onLocalUserAction?: (action: 'play' | 'pause' | 'seek', position: number) => void
) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const ytPlayerRef = useRef<any>(null);
  const isSyncingRef = useRef<boolean>(false);
  const isSeekingUserRef = useRef<boolean>(false);

  const [state, setState] = useState<UnifiedPlayerState>({
    currentTime: 0,
    duration: 0,
    status: 'paused',
    volume: 1,
    isMuted: false,
    playbackRate: 1.0,
    isReady: false,
    hasError: false,
    errorMessage: null,
  });

  // Track YouTube API script loading
  const [ytApiLoaded, setYtApiLoaded] = useState<boolean>(() => Boolean(window.YT && window.YT.Player));

  useEffect(() => {
    if (mediaType !== 'youtube') return;

    if (window.YT && window.YT.Player) {
      setYtApiLoaded(true);
      return;
    }

    const checkInterval = setInterval(() => {
      if (window.YT && window.YT.Player) {
        setYtApiLoaded(true);
        clearInterval(checkInterval);
      }
    }, 100);

    const existingScript = document.getElementById('youtube-iframe-api');
    if (!existingScript) {
      const tag = document.createElement('script');
      tag.id = 'youtube-iframe-api';
      tag.src = 'https://www.youtube.com/iframe_api';
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag?.parentNode?.insertBefore(tag, firstScriptTag);
    }

    const previousOnReady = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      if (previousOnReady) previousOnReady();
      setYtApiLoaded(true);
    };

    return () => clearInterval(checkInterval);
  }, [mediaType]);

  // Initialize YouTube player
  useEffect(() => {
    if (mediaType !== 'youtube' || !ytApiLoaded) return;

    const ytId = parseYouTubeId(mediaUrl);
    if (!ytId) {
      setState(prev => ({ ...prev, hasError: true, errorMessage: 'Invalid YouTube URL provided.' }));
      return;
    }

    let intervalId: any = null;

    try {
      // If player already exists and is healthy, smoothly switch video
      if (ytPlayerRef.current && typeof ytPlayerRef.current.loadVideoById === 'function') {
        try {
          ytPlayerRef.current.loadVideoById(ytId);
          setState(prev => ({ ...prev, hasError: false, errorMessage: null }));
        } catch (e) {
          console.warn('[WatchParty] loadVideoById failed, re-creating player:', e);
          ytPlayerRef.current = null;
        }
      }

      if (!ytPlayerRef.current) {
        // Ensure container has fresh mount target
        const container = document.getElementById('watchparty-yt-container');
        if (container) {
          container.innerHTML = '<div id="watchparty-yt-player" class="w-full h-full pointer-events-auto"></div>';
        }

        const elementId = 'watchparty-yt-player';
        ytPlayerRef.current = new window.YT.Player(elementId, {
          videoId: ytId,
          playerVars: {
            autoplay: 0,
            controls: 1,
            rel: 0,
            modestbranding: 1,
            playsinline: 1,
            enablejsapi: 1,
            origin: window.location.origin,
          },
          events: {
            onReady: (event: any) => {
              setState(prev => ({
                ...prev,
                isReady: true,
                duration: event.target.getDuration() || 0,
                hasError: false,
                errorMessage: null,
              }));
            },
            onStateChange: (event: any) => {
              const playerState = event.data;
              let currentStatus: PlaybackStatus = 'paused';

              if (playerState === window.YT.PlayerState.PLAYING) {
                currentStatus = 'playing';
              } else if (playerState === window.YT.PlayerState.PAUSED) {
                currentStatus = 'paused';
              } else if (playerState === window.YT.PlayerState.BUFFERING) {
                currentStatus = 'buffering';
              } else if (playerState === window.YT.PlayerState.ENDED) {
                currentStatus = 'ended';
              }

              const curTime = ytPlayerRef.current?.getCurrentTime() || 0;

              setState(prev => ({
                ...prev,
                status: currentStatus,
                currentTime: curTime,
              }));

              // Notify local action if not initiated by remote sync
              if (!isSyncingRef.current && onLocalUserAction) {
                if (currentStatus === 'playing') {
                  onLocalUserAction('play', curTime);
                } else if (currentStatus === 'paused') {
                  onLocalUserAction('pause', curTime);
                }
              }
            },
            onError: (event: any) => {
              const code = event?.data;
              let msg = 'Failed to load YouTube video. Video may be private or restricted.';
              if (code === 101 || code === 150) {
                msg = 'The owner of this YouTube video does not allow embedding outside YouTube. Try another video.';
              } else if (code === 100) {
                msg = 'This YouTube video was not found (it may be private or deleted).';
              } else if (code === 2) {
                msg = 'Invalid YouTube video ID or parameter.';
              }
              setState(prev => ({
                ...prev,
                hasError: true,
                errorMessage: msg,
              }));
            },
          },
        });
      }

      // Poll current time for YouTube player
      intervalId = setInterval(() => {
        if (ytPlayerRef.current && typeof ytPlayerRef.current.getCurrentTime === 'function') {
          try {
            const cur = ytPlayerRef.current.getCurrentTime() || 0;
            const dur = ytPlayerRef.current.getDuration() || 0;
            setState(prev => ({ ...prev, currentTime: cur, duration: dur > 0 ? dur : prev.duration }));
          } catch {
            // ignore
          }
        }
      }, 250);
    } catch (err: any) {
      console.error('[WatchParty] YouTube Init Error:', err);
      setState(prev => ({ ...prev, hasError: true, errorMessage: err.message || 'YouTube player error' }));
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [mediaType, mediaUrl, ytApiLoaded, onLocalUserAction]);

  // Clean up YouTube instance when switching away from youtube
  useEffect(() => {
    return () => {
      if (ytPlayerRef.current) {
        try {
          ytPlayerRef.current.destroy();
        } catch {
          // ignore
        }
        ytPlayerRef.current = null;
      }
    };
  }, [mediaType]);

  // HTML5 Video Event Listeners
  useEffect(() => {
    if (mediaType !== 'html5') return;
    const video = videoRef.current;
    if (!video) return;

    setState(prev => ({ ...prev, isReady: false, hasError: false, errorMessage: null }));

    try {
      video.load();
    } catch {
      // ignore
    }

    const handleLoadedMetadata = () => {
      setState(prev => ({
        ...prev,
        isReady: true,
        duration: video.duration || 0,
        hasError: false,
      }));
    };

    const handleTimeUpdate = () => {
      if (!isSeekingUserRef.current) {
        setState(prev => ({
          ...prev,
          currentTime: video.currentTime || 0,
          duration: video.duration || prev.duration,
        }));
      }
    };

    const handlePlay = () => {
      setState(prev => ({ ...prev, status: 'playing' }));
      if (!isSyncingRef.current && onLocalUserAction) {
        onLocalUserAction('play', video.currentTime);
      }
    };

    const handlePause = () => {
      setState(prev => ({ ...prev, status: 'paused' }));
      if (!isSyncingRef.current && onLocalUserAction) {
        onLocalUserAction('pause', video.currentTime);
      }
    };

    const handleWaiting = () => {
      setState(prev => ({ ...prev, status: 'buffering' }));
    };

    const handleEnded = () => {
      setState(prev => ({ ...prev, status: 'ended' }));
    };

    const handleError = () => {
      const err = video.error;
      let msg = 'Unable to stream video file. Format may be unsupported, link expired, or CORS blocked.';
      if (err) {
        if (err.code === MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED) {
          msg = 'Video format not supported or remote server denied access (HTTP 403 / CORS).';
        } else if (err.code === MediaError.MEDIA_ERR_NETWORK) {
          msg = 'Network error while attempting to stream media.';
        } else if (err.code === MediaError.MEDIA_ERR_DECODE) {
          msg = 'Video file is corrupted or cannot be decoded by browser.';
        }
      }
      setState(prev => ({
        ...prev,
        hasError: true,
        errorMessage: msg,
      }));
    };

    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    video.addEventListener('waiting', handleWaiting);
    video.addEventListener('ended', handleEnded);
    video.addEventListener('error', handleError);

    return () => {
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
      video.removeEventListener('waiting', handleWaiting);
      video.removeEventListener('ended', handleEnded);
      video.removeEventListener('error', handleError);
    };
  }, [mediaType, mediaUrl, onLocalUserAction]);

  // Controls API
  const play = useCallback(() => {
    if (mediaType === 'html5') {
      const vid = videoRef.current;
      if (vid) {
        const p = vid.play();
        if (p !== undefined) {
          p.catch(e => {
            console.warn('[WatchParty] HTML5 play blocked:', e);
            vid.muted = true;
            vid.play().catch(err => console.warn('[WatchParty] Muted play blocked:', err));
            setState(prev => ({ ...prev, isMuted: true }));
          });
        }
      }
    } else if (mediaType === 'youtube' && ytPlayerRef.current) {
      try {
        ytPlayerRef.current.playVideo();
        setTimeout(() => {
          if (ytPlayerRef.current && typeof ytPlayerRef.current.getPlayerState === 'function') {
            const st = ytPlayerRef.current.getPlayerState();
            if (st !== window.YT.PlayerState.PLAYING && st !== window.YT.PlayerState.BUFFERING) {
              try {
                ytPlayerRef.current.mute();
                ytPlayerRef.current.playVideo();
                setState(prev => ({ ...prev, isMuted: true }));
              } catch {}
            }
          }
        }, 350);
      } catch (e) {
        console.warn('[WatchParty] YT play error:', e);
      }
    }
  }, [mediaType]);

  const pause = useCallback(() => {
    if (mediaType === 'html5') {
      videoRef.current?.pause();
    } else if (mediaType === 'youtube' && ytPlayerRef.current) {
      try {
        ytPlayerRef.current.pauseVideo();
      } catch (e) {
        console.warn('[WatchParty] YT pause error:', e);
      }
    }
  }, [mediaType]);

  const seek = useCallback((seconds: number) => {
    const clamped = Math.max(0, seconds);
    if (!isSyncingRef.current && onLocalUserAction) {
      onLocalUserAction('seek', clamped);
    }

    if (mediaType === 'html5' && videoRef.current) {
      videoRef.current.currentTime = clamped;
    } else if (mediaType === 'youtube' && ytPlayerRef.current) {
      try {
        ytPlayerRef.current.seekTo(clamped, true);
      } catch (e) {
        console.warn('[WatchParty] YT seek error:', e);
      }
    }

    setState(prev => ({ ...prev, currentTime: clamped }));
  }, [mediaType, onLocalUserAction]);

  const setVolume = useCallback((val: number) => {
    const clamped = Math.max(0, Math.min(1, val));
    if (mediaType === 'html5' && videoRef.current) {
      videoRef.current.volume = clamped;
      videoRef.current.muted = clamped === 0;
    } else if (mediaType === 'youtube' && ytPlayerRef.current) {
      try {
        ytPlayerRef.current.setVolume(clamped * 100);
        if (clamped === 0) ytPlayerRef.current.mute();
        else ytPlayerRef.current.unMute();
      } catch {
        // ignore
      }
    }
    setState(prev => ({ ...prev, volume: clamped, isMuted: clamped === 0 }));
  }, [mediaType]);

  const toggleMute = useCallback(() => {
    if (state.isMuted) {
      setVolume(state.volume > 0 ? state.volume : 0.8);
    } else {
      if (mediaType === 'html5' && videoRef.current) {
        videoRef.current.muted = true;
      } else if (mediaType === 'youtube' && ytPlayerRef.current) {
        ytPlayerRef.current?.mute();
      }
      setState(prev => ({ ...prev, isMuted: true }));
    }
  }, [state.isMuted, state.volume, mediaType, setVolume]);

  const setPlaybackRate = useCallback((rate: number) => {
    if (mediaType === 'html5' && videoRef.current) {
      videoRef.current.playbackRate = rate;
    } else if (mediaType === 'youtube' && ytPlayerRef.current) {
      try {
        ytPlayerRef.current.setPlaybackRate(rate);
      } catch {
        // ignore
      }
    }
    setState(prev => ({ ...prev, playbackRate: rate }));
  }, [mediaType]);

  const toggleFullscreen = useCallback(() => {
    const elem = containerRef.current;
    if (!elem) return;

    if (!document.fullscreenElement) {
      elem.requestFullscreen?.().catch(() => {});
    } else {
      document.exitFullscreen?.().catch(() => {});
    }
  }, []);

  /**
   * Apply remote authoritative action without triggering outbound local events
   */
  const applyRemoteAction = useCallback((
    targetStatus: PlaybackStatus, 
    positionSeconds: number, 
    targetRate: number = 1.0
  ) => {
    isSyncingRef.current = true;

    // Apply seek
    if (mediaType === 'html5' && videoRef.current) {
      videoRef.current.currentTime = positionSeconds;
      videoRef.current.playbackRate = targetRate;
      if (targetStatus === 'playing') {
        const p = videoRef.current.play();
        if (p !== undefined) {
          p.catch(e => {
            console.warn('[WatchParty] HTML5 remote play blocked, trying muted:', e);
            if (videoRef.current) {
              videoRef.current.muted = true;
              videoRef.current.play().catch(err => console.warn('[WatchParty] Muted play blocked:', err));
              setState(prev => ({ ...prev, isMuted: true }));
            }
          });
        }
      } else if (targetStatus === 'paused') {
        videoRef.current.pause();
      }
    } else if (mediaType === 'youtube' && ytPlayerRef.current) {
      try {
        ytPlayerRef.current.seekTo(positionSeconds, true);
        ytPlayerRef.current.setPlaybackRate(targetRate);
        if (targetStatus === 'playing') {
          try {
            ytPlayerRef.current.playVideo();
          } catch {
            ytPlayerRef.current.mute();
            ytPlayerRef.current.playVideo();
            setState(prev => ({ ...prev, isMuted: true }));
          }
        } else if (targetStatus === 'paused') {
          ytPlayerRef.current.pauseVideo();
        }
      } catch (e) {
        console.warn('[WatchParty] YT remote apply error:', e);
      }
    }

    setState(prev => ({
      ...prev,
      currentTime: positionSeconds,
      status: targetStatus,
      playbackRate: targetRate,
    }));

    // Release sync flag shortly after event dispatch
    setTimeout(() => {
      isSyncingRef.current = false;
    }, 150);
  }, [mediaType]);

  return {
    videoRef,
    containerRef,
    state,
    controls: {
      play,
      pause,
      seek,
      setVolume,
      toggleMute,
      setPlaybackRate,
      toggleFullscreen,
      applyRemoteAction,
      isSyncingRef,
    }
  };
}
