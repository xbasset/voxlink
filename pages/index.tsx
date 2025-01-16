import React, { useState, useEffect, useRef } from "react";
import { Howl } from "howler"; // Import Howler for audio playback
import CallButton from "../components/CallButton";
import Modal from "../components/Modal";

const MAX_RINGTONE_DURATION = 5000;

interface TokenResponse {
  client_secret: {
    value: string;
    expires_at: number;
    tools: any[];
  };
  id: string;
  object: string;
  model: string;
  expires_at: number;
  modalities: string[];
  instructions: string;
  voice: string;
  turn_detection: any;
  input_audio_format: string;
  output_audio_format: string;
  input_audio_transcription: string | null;
  tool_choice: string;
  temperature: number;
  max_response_output_tokens: string;
}

const Home: React.FC = () => {
  const [isModalVisible, setModalVisible] = useState(false);
  const [step, setStep] = useState(1); // Tracks which step we are on
  const [name, setName] = useState("");
  const [microphones, setMicrophones] = useState<MediaDeviceInfo[]>([]); // List of microphones
  const [selectedMic, setSelectedMic] = useState(""); // Selected microphone
  const [callDuration, setCallDuration] = useState(0); // Tracks call duration in seconds
  const [micStream, setMicStream] = useState<MediaStream | null>(null);
  const [ringtoneSound, setRingtoneSound] = useState<Howl>(new Howl({ src: ["/audio/ringtone.mp3"] }));
  const [ringtoneTimeoutId, setRingtoneTimeoutId] = useState<NodeJS.Timeout | null>(null);
  const [token, setToken] = useState<TokenResponse | null>(null);
  const modalRef = useRef<HTMLDivElement>(null);


  const [isSessionActive, setIsSessionActive] = useState(false);
  const [events, setEvents] = useState<any[]>([]);
  const [dataChannel, setDataChannel] = useState<RTCDataChannel | null>(null);
  const peerConnection = useRef<RTCPeerConnection | null>(null);
  const audioElement = useRef<HTMLAudioElement | null>(null);

  const handleCallButtonClick = () => {
    setModalVisible(true);
    setStep(1); // Reset to the first step
  };

  const handleNext = async () => {
    if (step === 1) {
      setStep(2);
      await requestMicrophoneAccess();
    } else if (step === 2) {
      const tokenResponse = await getToken();
      if (tokenResponse) {
        // 1) Set the token in state (React will schedule re-render)
        setToken(tokenResponse);
        // 2) Move forward to step 3
        setStep(3);
        // 3) Play the ringtone, which will eventually call handleStartCall
        playRingtone();
      } else {
        console.error('Failed to get token');
      }
    }
  };

  const getToken = async () => {
    try {
      const response = await fetch('/api/token');
      if (!response.ok) {
        throw new Error(`Failed to get token: ${response.statusText}`);
      }
      const data = await response.json();
      console.log("getToken > response data json: token=" + data.client_secret.value);
      if (!data) {
        throw new Error('Token not found in response');
      }
      return data as TokenResponse; // Return the token instead of setting state
    } catch (error) {
      console.error('Error getting token:', error);
      return null;
    }
  }

  async function startSession() {
    // Get an ephemeral key from the Fastify server
    console.log("Starting session with token:" + token);
    if (!token) {
      console.error("Token is not available");
      return;
    }
    const EPHEMERAL_KEY = token.client_secret;

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
      type: 'answer' as RTCSdpType,
      sdp: await sdpResponse.text(),
    };
    await pc.setRemoteDescription(answer);

    peerConnection.current = pc;
  }

  // Stop current session, clean up peer connection and data channel
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

  // Send a message to the model
  function sendClientEvent(message: any) {
    if (dataChannel) {
      message.event_id = message.event_id || crypto.randomUUID();
      dataChannel.send(JSON.stringify(message));
      setEvents((prev) => [message, ...prev]);
    } else {
      console.error(
        "Failed to send message - no data channel available",
        message,
      );
    }
  }

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

  // Attach event listeners to the data channel when a new one is created
  useEffect(() => {
    if (dataChannel) {
      // Append new server events to the list
      dataChannel.addEventListener("message", (e) => {
        setEvents((prev) => [JSON.parse(e.data), ...prev]);
      });

      // Set session active when the data channel is opened
      dataChannel.addEventListener("open", () => {
        setIsSessionActive(true);
        setEvents([]);
      });
    }
  }, [dataChannel]);

  const requestMicrophoneAccess = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true }); // Request permission
      setMicStream(stream); // ← Store the obtained stream
      const devices = await navigator.mediaDevices.enumerateDevices();
      const micDevices = devices.filter(
        (device) =>
          device.kind === "audioinput" && !device.label.toLowerCase().includes("virtual")
      );
      setMicrophones(micDevices);
      setSelectedMic(micDevices[0]?.deviceId || "");
    } catch (err) {
      console.error("Microphone access denied:", err);
    }
  };

  const playRingtone = () => {
    ringtoneSound.play();

    // Stop the ringtone after MAX_RINGTONE_DURATION seconds
    const timeoutId = setTimeout(async () => {
      ringtoneSound.stop();
      // Use the token from state directly in handleStartCall
      handleStartCall();
    }, MAX_RINGTONE_DURATION);

    setRingtoneTimeoutId(timeoutId);
  };

  const handleMicChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedMic(event.target.value);
  };

  const handleStartCall = async () => {
    // Check token here instead of in playRingtone
    console.log("handleStartCall> token=" + token?.client_secret.value);
    
    if (!token) {
      console.error('No token available for call');
      handleStopCall();
      return;
    }
    
    setStep(4);
    console.log("handleStartCall> Starting session with token:", token);
    await startSession();
  };

  // Stop call explicitly, including stopping media tracks
  const handleStopCall = () => {
    stopSession();
    if (micStream) {
      micStream.getTracks().forEach((track) => track.stop());
      setMicStream(null); // Reset to null if you like
    }
    ringtoneSound.stop();
    if (ringtoneTimeoutId) {
      clearTimeout(ringtoneTimeoutId);
      setRingtoneTimeoutId(null);
    }
    setStep(1);
    setCallDuration(0);
    setModalVisible(false);
  };

  // Keep the timer going while in step 4
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

  const handleKeyPressOnCallerName = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter" && name.trim()) {
      handleNext();
    }
  };

  const handleClickOutside = (event: MouseEvent) => {
    if (modalRef.current && !modalRef.current.contains(event.target as Node)) {
      setModalVisible(false);
    }
  };

  // Auto-focus logic
  useEffect(() => {
    if (isModalVisible && step === 1) {
      const nameInput = document.getElementById("voxlink-caller-name") as HTMLInputElement;
      if (nameInput) {
        nameInput.focus();
      }
    } else if (isModalVisible && step === 2) {
      // Use MutationObserver to detect when the select element is added to DOM
      const observer = new MutationObserver(() => {
        const microphoneSelect = document.getElementById("voxlink-microphone-select");
        if (microphoneSelect) {
          microphoneSelect.focus();
          observer.disconnect();
        }
      });

      observer.observe(document.body, {
        childList: true,
        subtree: true,
      });
    }
  }, [isModalVisible, step]);

  // Add click outside listener
  useEffect(() => {
    // if the state is in step 3 or 4, do nothing the modal is must be stopped by clicking the stop button
    if (step === 3 || step === 4) {
      return;
    }
    if (isModalVisible) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isModalVisible, step]);

  // Helper to format the call duration
  const formatCallDuration = (totalSeconds: number) => {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    const secondsString = seconds < 10 ? `0${seconds}` : String(seconds);
    return `${minutes}:${secondsString}`;
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100 text-gray-800">
      <CallButton onClick={handleCallButtonClick} />

      <Modal isVisible={isModalVisible} onClose={() => setModalVisible(false)}>
        <div ref={modalRef}>
          {step === 1 && (
            <div>
              <h2 className="text-lg font-bold mb-4">Let's prepare the call</h2>
              <input
                id="voxlink-caller-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onKeyDown={handleKeyPressOnCallerName}
                className="w-full p-2 border border-gray-300 rounded mb-4"
                placeholder="Enter your name"
              />
              <button
                id="voxlink-go-to-microphone-button"
                onClick={handleNext}
                className={`text-white font-bold py-2 px-4 rounded float-right ${name.trim() ? "bg-blue-500 hover:bg-blue-700" : "bg-gray-400"
                  }`}
                disabled={!name.trim()}
              >
                Next
              </button>
            </div>
          )}

          {step === 2 && (
            <div>
              <h2 className="text-lg font-bold mb-4">Microphone Access</h2>
              {microphones.length > 0 ? (
                <div>
                  <label className="block mb-2 font-semibold">
                    ✅ You can choose a microphone:
                  </label>
                  <select
                    id="voxlink-microphone-select"
                    value={selectedMic}
                    onChange={handleMicChange}
                    onKeyDown={(e) => {
                      // If user presses Enter, proceed
                      if (e.key === "Enter") handleNext();
                    }}
                    className="w-full p-2 border border-gray-300 rounded mb-4"
                  >
                    {microphones.map((mic) => (
                      <option key={mic.deviceId} value={mic.deviceId}>
                        {mic.label || "Unknown Microphone"}
                      </option>
                    ))}
                  </select>
                  <button
                    id="voxlink-start-call-button"
                    onClick={handleNext}
                    className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded float-right"
                  >
                    Start the Call
                  </button>
                </div>
              ) : (
                <div>
                  <label className="block mb-2 font-semibold">👋 Hey, {name}</label>
                  <p className="mb-4">I need access to the microphone for you to talk to me.</p>
                  <p className="mb-4 text-gray-500">Waiting for microphone permissions...</p>
                </div>
              )}
            </div>
          )}

          {step === 3 && (
            <div>
              <h2 className="text-lg font-bold mb-4">Calling...</h2>
              <p>📞 Hold on, the call is being prepared.</p>
              <button
                id="voxlink-stop-preparing-button"
                onClick={handleStopCall}
                className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded mt-4 float-right"
              >
                Stop Call
              </button>
            </div>
          )}

          {step === 4 && (
            <div>
              <h2 className="text-lg font-bold mb-4">Call in Progress</h2>
              <p>Call Duration: {formatCallDuration(callDuration)}</p>
              <button
                id="voxlink-stop-call-button"
                onClick={handleStopCall}
                className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded mt-4 float-right"
              >
                Stop Call
              </button>
            </div>
          )}
        </div>
      </Modal>
    </div>
  );
};

export default Home;