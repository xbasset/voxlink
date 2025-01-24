import { useState, useRef, useEffect } from 'react';
import { Howl } from "howler";
import { TokenResponse } from '@/types/api';
import { User } from '@/types/db';
import { config } from '@/lib/config';

const MAX_RINGTONE_DURATION = 5000;

export function useCallFlow() {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [step, setStep] = useState(1);
  const [userName, setUserName] = useState('');
  
  // Microphone
  const [microphones, setMicrophones] = useState<MediaDeviceInfo[]>([]);
  const [selectedMic, setSelectedMic] = useState('');
  const [micStream, setMicStream] = useState<MediaStream | null>(null);

  // Ringtone
  const [ringtoneSound, setRingtoneSound] = useState<Howl | null>(null);
  const [ringtoneTimeoutId, setRingtoneTimeoutId] = useState<NodeJS.Timeout | null>(null);

  // etc., keep as many states and references as you need to replicate your current flow
  // (peerConnection, dataChannel, transcript, show_details_phone, show_details_email, etc.)
  
  // 1) Helper to open the modal.
  function openCallModal() {
    // Initialize or load your ringtone if needed
    if (!ringtoneSound) {
       setRingtoneSound(new Howl({ src: ["/audio/ringtone.mp3"] }));
    }
    setIsModalVisible(true);
    setStep(1);
  }

  // 2) Step transitions
  async function goToNextStep() {
    if (step === 1) {
      // Validate userName if necessary, or gather instructions
      // ...
      setStep(2);
      await requestMicrophoneAccess();
    } else if (step === 2) {
      // fetch token, then set step = 3 for “calling...”
      const tokenResponse = await getToken();
      if (tokenResponse) {
        setStep(3);
        initiateCall(tokenResponse);
      }
    }
  }

  // 3) Request microphone
  async function requestMicrophoneAccess() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setMicStream(stream);
      const devices = await navigator.mediaDevices.enumerateDevices();
      const micDevices = devices.filter((d) => d.kind === "audioinput");
      setMicrophones(micDevices);
      setSelectedMic(micDevices[0]?.deviceId || '');
    } catch (err) {
      console.error("Microphone access denied:", err);
    }
  }

  // 4) Token fetch
  async function getToken(): Promise<TokenResponse | null> {
    try {
      const res = await fetch("/api/token");
      if (!res.ok) throw new Error("Failed to fetch token");
      const data = await res.json();
      return data;
    } catch (e) {
      console.error(e);
      return null;
    }
  }

  // 5) Start the call (ringtone, transitions)
  function initiateCall(token: TokenResponse) {
    if (!ringtoneSound) return;
    ringtoneSound.play();
    const timeout = setTimeout(() => {
      ringtoneSound.fade(1, 0, 1000);
      startActiveCall(token);
    }, MAX_RINGTONE_DURATION);
    setRingtoneTimeoutId(timeout);
  }

  function startActiveCall(token: TokenResponse) {
    // Move to step 4 or “active call”
    setStep(4);
    // set up your peer connection, data channels, etc.
  }

  // 6) Stop call (similar to your “stopCall” logic)
  function stopCall() {
    // cleanup: stop tracks, close connections, clear timeouts, etc.
    setIsModalVisible(false);
    setStep(1);
  }

  // Return all states and functions that your UI components need to consume
  return {
    isModalVisible,
    step,
    userName,
    setUserName,
    microphones,
    selectedMic,
    setSelectedMic,
    openCallModal,
    goToNextStep,
    stopCall,
    // add the other states and methods as needed for your full logic
  };
}