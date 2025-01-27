import { useState, useRef, useEffect } from 'react';
import { Howl } from "howler";
import { TokenResponse } from '@/types/api';
import { User } from '@/types/db';
import { config } from '@/lib/config';
import { ServerSideResponseOutputItem } from '@/types/rtc';
import { CallTranscriptEntry } from '@/types/db';

const MAX_RINGTONE_DURATION = 5000;

interface UseCallFlowProps {
  user: User | null;
}

export function useCallFlow({ user }: UseCallFlowProps) {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [step, setStep] = useState(1);
  const [userName, setUserName] = useState('');
  const [closingCall, setClosingCall] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  
  // Microphone states
  const [microphones, setMicrophones] = useState<MediaDeviceInfo[]>([]);
  const [selectedMic, setSelectedMic] = useState('');
  const [micStream, setMicStream] = useState<MediaStream | null>(null);

  // Audio states
  const [ringtoneSound, setRingtoneSound] = useState<Howl | null>(null);
  const [ringtoneTimeoutId, setRingtoneTimeoutId] = useState<NodeJS.Timeout | null>(null);
  const audioElement = useRef<HTMLAudioElement | null>(null);

  // WebRTC states
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [events, setEvents] = useState<any[]>([]);
  const [agentInitialized, setAgentInitialized] = useState(false);
  const [dataChannel, setDataChannel] = useState<RTCDataChannel | null>(null);
  const peerConnection = useRef<RTCPeerConnection | null>(null);

  // Call details states
  const [showDetailsName, setShowDetailsName] = useState<string | null>(null);
  const [showDetailsReason, setShowDetailsReason] = useState<string | null>(null);
  const [showDetailsEmail, setShowDetailsEmail] = useState<string | null>(null);
  const [showDetailsPhone, setShowDetailsPhone] = useState<string | null>(null);


  function openCallModal() {
    console.log('🎯 Call button clicked - opening modal...');
    if (!ringtoneSound) {
      console.log('Ringtone sound not found - creating new...');
      setRingtoneSound(new Howl({ src: ["/audio/ringtone.mp3"] }));
    }
    setIsModalVisible(true);
    setStep(1);
    console.log('step is', step);
  }

  // Request microphone access
  async function requestMicrophoneAccess() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setMicStream(stream);
      const devices = await navigator.mediaDevices.enumerateDevices();
      const micDevices = devices.filter(d => d.kind === "audioinput");
      setMicrophones(micDevices);
      setSelectedMic(micDevices[0]?.deviceId || '');
    } catch (err) {
      console.error("Microphone access denied:", err);
    }
  }

  // Step transitions
  async function goToNextStep() {
    if (step === 1) {
      setStep(2);
      await requestMicrophoneAccess();
    } else if (step === 2) {
      const tokenResponse = await getToken();
      if (tokenResponse) {
        setStep(3);
        initiateCall(tokenResponse);
      }
    }
  }

  // Token fetch
  async function getToken(): Promise<TokenResponse | null> {
    try {
      const response = await fetch("/api/token");
      if (!response.ok) throw new Error("Failed to fetch token");
      return await response.json();
    } catch (e) {
      console.error(e);
      return null;
    }
  }

  // Start the call
  function initiateCall(token: TokenResponse) {
    if (!ringtoneSound) return;
    ringtoneSound.play();
    const timeout = setTimeout(() => {
      ringtoneSound.fade(1, 0, 1000);
      handleStartCall(token);
    }, MAX_RINGTONE_DURATION);
    setRingtoneTimeoutId(timeout);
  }

  async function handleStartCall(token: TokenResponse) {
    if (!token) {
      console.error("No token available for call");
      stopCall();
      return;
    }
    setStep(4);
    await startSession(token);
  }

  // WebRTC session management
  async function startSession(token: TokenResponse) {
    // ... (keep the existing WebRTC setup code)
  }

  function stopSession() {
    if (dataChannel) {
      dataChannel.close();
    }
    if (peerConnection.current) {
      peerConnection.current.close();
    }
    setIsSessionActive(false);
    setDataChannel(null);
    peerConnection.current = null;
  }

  // Call duration timer
  useEffect(() => {
    let intervalId: NodeJS.Timeout | null = null;
    if (step === 4) {
      intervalId = setInterval(() => {
        setCallDuration((prev) => prev + 1);
      }, 1000);
    }
    return () => {
      if (intervalId) {
        clearInterval(intervalId);
      }
    };
  }, [step]);

  // Stop call
  const stopCall = async (transcript: CallTranscriptEntry[] = []) => {
    stopSession();
    if (micStream) {
      micStream.getTracks().forEach((track) => track.stop());
      setMicStream(null);
    }
    if (ringtoneSound) {
      ringtoneSound.stop();
    }
    if (ringtoneTimeoutId) {
      clearTimeout(ringtoneTimeoutId);
      setRingtoneTimeoutId(null);
    }
    setStep(1);
    setCallDuration(0);
    setIsModalVisible(false);
  };

  return {
    isModalVisible,
    step,
    userName,
    setUserName,
    microphones,
    selectedMic,
    setSelectedMic,
    callDuration,
    showDetailsName,
    showDetailsReason,
    showDetailsEmail,
    showDetailsPhone,
    closingCall,
    openCallModal,
    goToNextStep,
    stopCall,
    user,
  };
}