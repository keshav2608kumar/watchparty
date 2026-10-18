import { useState, useEffect, useRef, useCallback } from 'react';
import { RoomMember, VoiceSignalPayload, VoiceStatePayload } from '../../types/room';

interface UseVoiceChatProps {
  currentUserId: string;
  members: RoomMember[];
  registerVoiceSignalListener: (listener: (signal: VoiceSignalPayload) => void) => () => void;
  broadcastVoiceSignal: (signal: VoiceSignalPayload) => void;
  broadcastVoiceState: (state: VoiceStatePayload) => void;
}

const ICE_SERVERS: RTCConfiguration = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
  ],
};

/**
 * Optimizes WebRTC Opus codec parameters:
 * - minptime=10: 10ms frame packets for lowest voice latency
 * - useinbandfec=1: In-Band Forward Error Correction to eliminate mobile packet drop jitter
 * - maxaveragebitrate=48000: Crystal clear HD voice
 */
function optimizeOpusSdp(sdp: string): string {
  if (!sdp) return sdp;
  if (!sdp.includes('useinbandfec=1')) {
    return sdp.replace(
      /a=rtpmap:(\d+) opus\/48000\/2/i,
      'a=rtpmap:$1 opus/48000/2\r\na=fmtp:$1 minptime=10;useinbandfec=1;maxaveragebitrate=48000;stereo=0;cbr=1'
    );
  }
  return sdp;
}

export function useVoiceChat({
  currentUserId,
  members,
  registerVoiceSignalListener,
  broadcastVoiceSignal,
  broadcastVoiceState,
}: UseVoiceChatProps) {
  const [isVoiceActive, setIsVoiceActive] = useState<boolean>(false);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isDeafened, setIsDeafened] = useState<boolean>(false);
  const [isSpeaking, setIsSpeaking] = useState<boolean>(false);
  const [audioLevel, setAudioLevel] = useState<number>(0); // 0 to 100
  const [error, setError] = useState<string | null>(null);

  const localStreamRef = useRef<MediaStream | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const lastSpeakingBroadcastRef = useRef<number>(0);
  const isSpeakingRef = useRef<boolean>(false);
  const speakingHangoverRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isMutedRef = useRef<boolean>(isMuted);
  isMutedRef.current = isMuted;
  const isDeafenedRef = useRef<boolean>(isDeafened);
  isDeafenedRef.current = isDeafened;
  const isVoiceActiveRef = useRef<boolean>(isVoiceActive);
  isVoiceActiveRef.current = isVoiceActive;

  const peerConnectionsRef = useRef<Map<string, RTCPeerConnection>>(new Map());
  const remoteAudioElementsRef = useRef<Map<string, HTMLAudioElement>>(new Map());
  const pendingCandidatesRef = useRef<Map<string, RTCIceCandidateInit[]>>(new Map());

  // Cleanly close and remove a single peer connection
  const closePeer = useCallback((peerId: string) => {
    const pc = peerConnectionsRef.current.get(peerId);
    if (pc) {
      try {
        pc.close();
      } catch {}
      peerConnectionsRef.current.delete(peerId);
    }

    const audio = remoteAudioElementsRef.current.get(peerId);
    if (audio) {
      try {
        audio.pause();
        audio.srcObject = null;
        audio.remove();
      } catch {}
      remoteAudioElementsRef.current.delete(peerId);
    }
    pendingCandidatesRef.current.delete(peerId);
  }, []);

  // Flush queued ICE candidates after remote description is set
  const processPendingCandidates = useCallback(async (peerId: string, pc: RTCPeerConnection) => {
    const candidates = pendingCandidatesRef.current.get(peerId) || [];
    for (const c of candidates) {
      try {
        await pc.addIceCandidate(new RTCIceCandidate(c));
      } catch (err) {
        console.warn(`[Voice] Error adding queued ICE candidate for ${peerId}:`, err);
      }
    }
    pendingCandidatesRef.current.delete(peerId);
  }, []);

  // Create and configure RTCPeerConnection for a remote peer
  const getOrCreatePeerConnection = useCallback((peerId: string): RTCPeerConnection => {
    const existing = peerConnectionsRef.current.get(peerId);
    if (existing && existing.connectionState !== 'closed') {
      return existing;
    }

    const pc = new RTCPeerConnection(ICE_SERVERS);
    peerConnectionsRef.current.set(peerId, pc);

    // Add local tracks if we have active microphone
    if (localStreamRef.current) {
      localStreamRef.current.getAudioTracks().forEach((track) => {
        pc.addTrack(track, localStreamRef.current!);
      });
    }

    // ICE Candidate handler
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        broadcastVoiceSignal({
          from: currentUserId,
          to: peerId,
          signal: {
            type: 'candidate',
            candidate: event.candidate.toJSON(),
          },
        });
      }
    };

    // Remote audio track receiver
    pc.ontrack = (event) => {
      console.log(`[Voice] Received remote audio track from ${peerId}`);
      let audio = remoteAudioElementsRef.current.get(peerId);
      if (!audio) {
        audio = new Audio();
        audio.autoplay = true;
        audio.muted = isDeafenedRef.current;
        remoteAudioElementsRef.current.set(peerId, audio);
      }
      audio.srcObject = event.streams[0];
      audio.play().catch((err) => {
        console.warn(`[Voice] Auto-play prevented for ${peerId}:`, err);
      });
    };

    pc.onconnectionstatechange = () => {
      if (pc.connectionState === 'failed') {
        try { (pc as any).restartIce?.(); } catch {}
      } else if (pc.connectionState === 'disconnected' || pc.connectionState === 'closed') {
        closePeer(peerId);
      }
    };

    return pc;
  }, [currentUserId, broadcastVoiceSignal, closePeer]);

  // Initiate WebRTC offer to peer with optimized Opus SDP
  const initiateOfferToPeer = useCallback(async (peerId: string) => {
    try {
      const pc = getOrCreatePeerConnection(peerId);
      if (pc.signalingState !== 'stable') return;

      const offer = await pc.createOffer({
        offerToReceiveAudio: true,
      });

      if (offer.sdp) {
        offer.sdp = optimizeOpusSdp(offer.sdp);
      }
      await pc.setLocalDescription(offer);

      broadcastVoiceSignal({
        from: currentUserId,
        to: peerId,
        signal: {
          type: 'offer',
          sdp: offer,
        },
      });
    } catch (err) {
      console.warn(`[Voice] Error creating offer to ${peerId}:`, err);
    }
  }, [currentUserId, getOrCreatePeerConnection, broadcastVoiceSignal]);

  // Handle incoming signaling packets
  useEffect(() => {
    const unregister = registerVoiceSignalListener(async (payload) => {
      const { from, signal } = payload;
      if (!from || from === currentUserId) return;

      try {
        if (signal.type === 'offer') {
          const pc = getOrCreatePeerConnection(from);
          const isOfferer = currentUserId < from;
          const offerCollision = pc.signalingState !== 'stable';

          if (offerCollision) {
            if (!isOfferer) {
              // Polite peer rolls back local offer to accept remote offer
              try {
                await pc.setLocalDescription({ type: 'rollback' });
              } catch {}
            } else {
              // Impolite peer ignores colliding offer
              return;
            }
          }

          await pc.setRemoteDescription(new RTCSessionDescription(signal.sdp!));
          await processPendingCandidates(from, pc);

          if (pc.signalingState === 'have-remote-offer') {
            const answer = await pc.createAnswer();
            if (answer.sdp) {
              answer.sdp = optimizeOpusSdp(answer.sdp);
            }
            await pc.setLocalDescription(answer);

            broadcastVoiceSignal({
              from: currentUserId,
              to: from,
              signal: {
                type: 'answer',
                sdp: answer,
              },
            });
          }
        } else if (signal.type === 'answer') {
          const pc = peerConnectionsRef.current.get(from);
          if (pc && pc.signalingState === 'have-local-offer') {
            await pc.setRemoteDescription(new RTCSessionDescription(signal.sdp!));
            await processPendingCandidates(from, pc);
          }
        } else if (signal.type === 'candidate') {
          const pc = peerConnectionsRef.current.get(from);
          if (pc && pc.remoteDescription && pc.remoteDescription.type) {
            await pc.addIceCandidate(new RTCIceCandidate(signal.candidate!));
          } else {
            // Queue candidate until remote description is set
            const pending = pendingCandidatesRef.current.get(from) || [];
            pending.push(signal.candidate!);
            pendingCandidatesRef.current.set(from, pending);
          }
        }
      } catch (err) {
        console.warn(`[Voice] Signal handling error from ${from}:`, err);
      }
    });

    return unregister;
  }, [currentUserId, registerVoiceSignalListener, getOrCreatePeerConnection, broadcastVoiceSignal, processPendingCandidates]);

  // Voice Activity Detection (VAD) loop using Web Audio API AnalyserNode
  const startVolumeAnalysis = useCallback((stream: MediaStream) => {
    try {
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      const audioCtx = new AudioCtxClass();
      audioContextRef.current = audioCtx;

      const source = audioCtx.createMediaStreamSource(stream);
      const analyser = audioCtx.createAnalyser();
      analyser.fftSize = 64;
      analyser.smoothingTimeConstant = 0.5;
      source.connect(analyser);
      analyserRef.current = analyser;

      const dataArray = new Uint8Array(analyser.frequencyBinCount);

      const checkVolume = () => {
        if (!analyserRef.current) return;
        analyserRef.current.getByteFrequencyData(dataArray);

        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          sum += dataArray[i];
        }
        const avg = sum / dataArray.length;
        const normalized = Math.min(100, Math.round((avg / 128) * 100));
        setAudioLevel(normalized);

        const speaks = avg > 14 && !isMutedRef.current && isVoiceActiveRef.current;

        if (speaks) {
          if (!isSpeakingRef.current) {
            isSpeakingRef.current = true;
            setIsSpeaking(true);
          }
          if (speakingHangoverRef.current) {
            clearTimeout(speakingHangoverRef.current);
            speakingHangoverRef.current = null;
          }
          // Throttle network broadcast of speaking state (once every 400ms)
          const now = Date.now();
          if (now - lastSpeakingBroadcastRef.current > 400) {
            lastSpeakingBroadcastRef.current = now;
            broadcastVoiceState({
              memberId: currentUserId,
              isVoiceActive: true,
              isMuted: isMutedRef.current,
              isSpeaking: true,
              isDeafened: isDeafenedRef.current,
            });
          }
        } else if (isSpeakingRef.current && !speakingHangoverRef.current) {
          // Hangover 350ms so speaking indicator doesn't jitter
          speakingHangoverRef.current = setTimeout(() => {
            isSpeakingRef.current = false;
            setIsSpeaking(false);
            speakingHangoverRef.current = null;
            broadcastVoiceState({
              memberId: currentUserId,
              isVoiceActive: true,
              isMuted: isMutedRef.current,
              isSpeaking: false,
              isDeafened: isDeafenedRef.current,
            });
          }, 350);
        }

        animFrameRef.current = requestAnimationFrame(checkVolume);
      };

      animFrameRef.current = requestAnimationFrame(checkVolume);
    } catch (e) {
      console.warn('[Voice] Web Audio API init error:', e);
    }
  }, [currentUserId, broadcastVoiceState]);

  // Connect to peers who are voice active
  useEffect(() => {
    if (!isVoiceActive) return;

    members.forEach((member) => {
      if (member.id !== currentUserId && member.isVoiceActive) {
        // Deterministic initiator: the one with lower ID creates the offer
        if (currentUserId < member.id) {
          if (!peerConnectionsRef.current.has(member.id)) {
            initiateOfferToPeer(member.id);
          }
        }
      }
    });

    // Clean up connections for members who left voice
    peerConnectionsRef.current.forEach((_, peerId) => {
      const stillActive = members.some((m) => m.id === peerId && m.isVoiceActive);
      if (!stillActive) {
        closePeer(peerId);
      }
    });
  }, [isVoiceActive, members, currentUserId, initiateOfferToPeer, closePeer]);

  // User Actions: Join Voice
  const joinVoice = useCallback(async () => {
    setError(null);
    try {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Microphone access is not supported in this browser.');
      }

      // Pre-warm & resume AudioContext during user gesture for mobile iOS/Android browsers
      const AudioCtxClass = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtxClass) {
        try {
          const ctx = new AudioCtxClass();
          if (ctx.state === 'suspended') {
            await ctx.resume();
          }
          audioContextRef.current = ctx;
        } catch {}
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          channelCount: 1,
          sampleRate: 48000,
        },
        video: false,
      });

      localStreamRef.current = stream;
      setIsVoiceActive(true);
      isVoiceActiveRef.current = true;
      setIsMuted(false);
      isMutedRef.current = false;
      setIsDeafened(false);
      isDeafenedRef.current = false;

      startVolumeAnalysis(stream);

      // Broadcast active voice state to the room
      broadcastVoiceState({
        memberId: currentUserId,
        isVoiceActive: true,
        isMuted: false,
        isSpeaking: false,
        isDeafened: false,
      });
    } catch (err: any) {
      console.error('[Voice] Error acquiring microphone:', err);
      const msg = err.name === 'NotAllowedError'
        ? 'Microphone permission was denied. Please allow microphone access in your browser settings.'
        : err.message || 'Could not access microphone.';
      setError(msg);
    }
  }, [currentUserId, broadcastVoiceState, startVolumeAnalysis]);

  // User Actions: Leave Voice
  const leaveVoice = useCallback(() => {
    if (animFrameRef.current) {
      cancelAnimationFrame(animFrameRef.current);
      animFrameRef.current = null;
    }
    if (speakingHangoverRef.current) {
      clearTimeout(speakingHangoverRef.current);
      speakingHangoverRef.current = null;
    }
    if (audioContextRef.current) {
      try { audioContextRef.current.close(); } catch {}
      audioContextRef.current = null;
    }

    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach((track) => track.stop());
      localStreamRef.current = null;
    }

    peerConnectionsRef.current.forEach((_, peerId) => closePeer(peerId));
    peerConnectionsRef.current.clear();
    remoteAudioElementsRef.current.clear();

    setIsVoiceActive(false);
    isVoiceActiveRef.current = false;
    setIsSpeaking(false);
    isSpeakingRef.current = false;
    setAudioLevel(0);

    broadcastVoiceState({
      memberId: currentUserId,
      isVoiceActive: false,
      isMuted: false,
      isSpeaking: false,
      isDeafened: false,
    });
  }, [currentUserId, broadcastVoiceState, closePeer]);

  // User Actions: Instant Zero-Lag Mic Mute Toggle
  const toggleMute = useCallback(() => {
    if (!localStreamRef.current) return;
    const track = localStreamRef.current.getAudioTracks()[0];
    if (track) {
      const nextMuted = track.enabled; // If enabled, disabling it means nextMuted = true
      track.enabled = !track.enabled;
      setIsMuted(nextMuted);
      isMutedRef.current = nextMuted;

      if (nextMuted) {
        setIsSpeaking(false);
        isSpeakingRef.current = false;
      }

      broadcastVoiceState({
        memberId: currentUserId,
        isVoiceActive: true,
        isMuted: nextMuted,
        isSpeaking: false,
        isDeafened: isDeafenedRef.current,
      });
    }
  }, [currentUserId, broadcastVoiceState]);

  // User Actions: Deafen Toggle
  const toggleDeafen = useCallback(() => {
    const nextDeafened = !isDeafened;
    setIsDeafened(nextDeafened);
    isDeafenedRef.current = nextDeafened;

    // Mute/unmute all remote audio streams
    remoteAudioElementsRef.current.forEach((audio) => {
      audio.muted = nextDeafened;
    });

    // If deafened, also mute local mic for maximum privacy
    if (nextDeafened && !isMuted) {
      toggleMute();
    } else {
      broadcastVoiceState({
        memberId: currentUserId,
        isVoiceActive: true,
        isMuted: isMutedRef.current,
        isSpeaking: false,
        isDeafened: nextDeafened,
      });
    }
  }, [isDeafened, isMuted, toggleMute, broadcastVoiceState, currentUserId]);

  // Clean up on component unmount
  useEffect(() => {
    return () => {
      leaveVoice();
    };
  }, [leaveVoice]);

  const activeVoiceMembers = members.filter((m) => m.isVoiceActive);

  return {
    isVoiceActive,
    isMuted,
    isDeafened,
    isSpeaking,
    audioLevel,
    error,
    activeVoiceMembers,
    joinVoice,
    leaveVoice,
    toggleMute,
    toggleDeafen,
  };
}
