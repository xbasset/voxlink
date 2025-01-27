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

  // Add instructions state
  const [instructions, setInstructions] = useState<string>(
    user ? config.instructions : "You are an Executive Assistant Software that takes care of the people calling. Unfortunately, we don't have any information about the user, there seems to be an issue with the user data. Politely ask the user to try again later, and tell them that you are sorry for the inconvenience."
  );

  // Helper function for formatting call duration
  const formatCallDuration = (totalSeconds: number) => {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    const secondsString = seconds < 10 ? `0${seconds}` : String(seconds);
    return `${minutes}:${secondsString}`;
  };

  function openCallModal() {
    if (!ringtoneSound) {
      setRingtoneSound(new Howl({ src: ["/audio/ringtone.mp3"] }));
    }
    setIsModalVisible(true);
    setStep(1);
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
      const updatedInstructions = instructions + 
        "\n\n## Context Information\n" + 
        "- The caller's name is: " + userName + ".\n" +
        "- The current time is: " + new Date().toLocaleTimeString() + "\n" +
        "- The user_name is: " + user?.name + "\n" +
        "- The bio is: " + user?.bio;
      
      setInstructions(updatedInstructions);
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
    if (!token) {
      console.error("Token is not available");
      return;
    }

    const EPHEMERAL_KEY = token.client_secret.value;

    // Create a peer connection
    const pc = new RTCPeerConnection();

    // Set up to play remote audio from the model
    audioElement.current = document.createElement("audio");
    if (audioElement.current) {
      audioElement.current.autoplay = true;
      pc.ontrack = (e) => (audioElement.current!.srcObject = e.streams[0]);
    }

    if (micStream) {
      pc.addTrack(micStream.getTracks()[0]);
    }

    // Set up data channel for sending and receiving events
    const dc = pc.createDataChannel("oai-events");
    setDataChannel(dc);

    // Start the session using the Session Description Protocol (SDP)
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);

    const baseUrl = "https://api.openai.com/v1/realtime";
    const model = "gpt-4o-realtime-preview-2024-12-17";
    const sdpResponse = await fetch(`${baseUrl}?model=${model}`, {
      method: "POST",
      body: offer.sdp,
      headers: {
        Authorization: `Bearer ${EPHEMERAL_KEY}`,
        "Content-Type": "application/sdp",
      },
    });

    const answer: RTCSessionDescriptionInit = {
      type: "answer" as RTCSdpType,
      sdp: await sdpResponse.text(),
    };
    await pc.setRemoteDescription(answer);

    peerConnection.current = pc;

    // Add event listeners for data channel
    dc.addEventListener("message", (e) => {
      setEvents((prev) => [JSON.parse(e.data), ...prev]);
    });

    dc.addEventListener("open", () => {
      setIsSessionActive(true);
      setEvents([]);
    });
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

    // Save call data to database
    if (user && userName && transcript.length > 0) {
      try {
        await fetch("/api/calls", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            duration: callDuration,
            userId: user.id,
            details: {
              name: userName,
              reason: showDetailsReason,
              email: showDetailsEmail,
              phone: showDetailsPhone,
            },
            transcript,
          }),
        });
      } catch (err) {
        console.error("Failed to save call:", err);
      }
    }

    setStep(1);
    setCallDuration(0);
    setIsModalVisible(false);
  };

  // Close call function
  const closeCall = () => {
    setClosingCall(true);
    sendTextMessage("Write the transcript of the conversation using the 'write_transcript' function call.");
  };

  // Send a text message to the model
  function sendTextMessage(message: string) {
    const event = {
      type: "conversation.item.create",
      item: {
        type: "message",
        role: "user",
        content: [
          {
            type: "input_text",
            text: message,
          },
        ],
      },
    };

    sendClientEvent(event);
    sendClientEvent({ type: "response.create" });
  }

  // Send a message to the model
  function sendClientEvent(message: any) {
    if (dataChannel) {
      message.event_id = message.event_id || crypto.randomUUID();
      dataChannel.send(JSON.stringify(message));
      setEvents((prev) => [message, ...prev]);
    } else {
      console.error("Failed to send message - no data channel available", message);
    }
  }

  const handleFunctionCall = async (functionCallParams: {
    name: string;
    call_id?: string;
    arguments: string;
  }) => {
    switch (functionCallParams.name) {
      case "show_details_phone":
        const phoneArgs = JSON.parse(functionCallParams.arguments);
        setShowDetailsPhone(phoneArgs.phone);
        sendClientEvent({ type: "response.create" });
        break;
      case "show_details_email":
        const emailArgs = JSON.parse(functionCallParams.arguments);
        setShowDetailsEmail(emailArgs.email);
        sendClientEvent({ type: "response.create" });
        break;
      case "show_details_reason":
        const reasonArgs = JSON.parse(functionCallParams.arguments);
        setShowDetailsReason(reasonArgs.reason);
        sendClientEvent({ type: "response.create" });
        break;
      case "write_transcript":
        let transcriptToSave = JSON.parse(functionCallParams.arguments).transcript;
        await stopCall(transcriptToSave);
        break;
      default:
        console.log("handleFunctionCall > unknown function call: ", functionCallParams);
    }
  };

  useEffect(() => {
    if (!events || events.length === 0) return;
    const firstEvent = events[events.length - 1];
    const currentEvent = events[0];

    if (!agentInitialized && firstEvent.type === "session.created") {
      const initSessionInstructionsEvent = {
        "type": "session.update",
        "session": {
          "instructions": instructions,
          "tools": config.tools,
        }
      }
      sendClientEvent(initSessionInstructionsEvent);
      sendClientEvent({ type: "response.create" });
      setAgentInitialized(true);
    } else if (currentEvent.type === "response.done") {
      if (currentEvent.response?.output) {
        currentEvent.response.output.forEach((outputItem: ServerSideResponseOutputItem) => {
          if (outputItem.type === "function_call" && outputItem.name && outputItem.arguments) {
            handleFunctionCall({
              name: outputItem.name,
              call_id: outputItem.call_id,
              arguments: outputItem.arguments,
            });
          }
        });
      }
    }
  }, [events, instructions]);

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
    setShowDetailsName,
    showDetailsReason,
    setShowDetailsReason,
    showDetailsEmail,
    setShowDetailsEmail,
    showDetailsPhone,
    setShowDetailsPhone,
    closingCall,
    openCallModal,
    goToNextStep,
    stopCall,
    user,
    formatCallDuration,
    closeCall,
  };
}