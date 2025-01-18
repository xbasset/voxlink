import React, { useState, useEffect, useRef } from "react";
import { Howl } from "howler"; // Import Howler for audio playback
import ProfileHeader from "../components/ProfileHeader";
import { PhoneIcon, ChevronRightIcon, XMarkIcon } from '@heroicons/react/20/solid'
import CallButton from "../components/CallButton";
import Modal from "../components/Modal";
import { TokenResponse } from '../types/api';
import { User } from '../types/db'

const MAX_RINGTONE_DURATION = 5000;

const Home: React.FC = () => {
  const [userData, setUser] = useState<User | null>(null);
  const [instructions, setInstructions] = useState<string>("");
  const [isModalVisible, setModalVisible] = useState(false);
  const [step, setStep] = useState(1); // Tracks which step we are on
  const [name, setName] = useState("");
  const [microphones, setMicrophones] = useState<MediaDeviceInfo[]>([]); // List of microphones
  const [selectedMic, setSelectedMic] = useState(""); // Selected microphone
  const [callDuration, setCallDuration] = useState(0); // Tracks call duration in seconds
  const [micStream, setMicStream] = useState<MediaStream | null>(null);
  const [ringtoneSound, setRingtoneSound] = useState<Howl | null>(null);
  const [ringtoneTimeoutId, setRingtoneTimeoutId] = useState<NodeJS.Timeout | null>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const [isSessionActive, setIsSessionActive] = useState(false);
  const [events, setEvents] = useState<any[]>([]);
  const [agentInitialized, setAgentInitialized] = useState(false);
  const [dataChannel, setDataChannel] = useState<RTCDataChannel | null>(null);
  const peerConnection = useRef<RTCPeerConnection | null>(null);
  const audioElement = useRef<HTMLAudioElement | null>(null);

  const handleCallButtonClick = () => {
    if (!ringtoneSound) {
      setRingtoneSound(new Howl({ src: ["/audio/ringtone.mp3"] }));
    }
    setModalVisible(true);
    setStep(1);
  };

  const getUser = async () => {
    try {
      const response = await fetch("/api/user");
      if (!response.ok) {
        throw new Error(`Failed to get user data: ${response.statusText}`);
      }
      const data = await response.json();
      console.log("getUser > response data json: ", data.name);
      if (!data) {
        throw new Error("User data not found in response");
      }
      return data as User; // Return the user data
    } catch (error) {
      console.error("Error getting user data:", error);
      return null;
    }
  };

  const handleNext = async () => {
    if (step === 1) {
      const updatedInstructions = instructions + "\n\nThe caller's name is " + name + ".";
      setInstructions(updatedInstructions);
      console.log("handleNext > updatedInstructions: ", instructions);
      setStep(2);
      await requestMicrophoneAccess();
    } else if (step === 2) {
      const tokenResponse = await getToken();
      if (tokenResponse) {
        setStep(3);
        initiateCall(tokenResponse);
      } else {
        console.error("Failed to get token");
      }
    }
  };

  const getToken = async () => {
    try {
      const response = await fetch("/api/token");
      if (!response.ok) {
        throw new Error(`Failed to get token: ${response.statusText}`);
      }
      const data = await response.json();
      if (!data) {
        throw new Error("Token not found in response");
      }
      return data as TokenResponse; // Return the token
    } catch (error) {
      console.error("Error getting token:", error);
      return null;
    }
  };

  const initiateCall = (token: TokenResponse) => {
    if (ringtoneSound) {
      ringtoneSound.play();
      // Stop the ringtone after MAX_RINGTONE_DURATION
      const timeoutId = setTimeout(() => {
        // ringtoneSound.stop();
        ringtoneSound.fade(1, 0.1, 1000);
        handleStartCall(token);
      }, MAX_RINGTONE_DURATION);

      setRingtoneTimeoutId(timeoutId);
    }
  };


  const handleStartCall = async (token: TokenResponse) => {
    if (!token) {
      console.error("No token available for call");
      handleStopCall();
      return;
    }

    setStep(4);
    await startSession(token);
  };

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
        message
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


  useEffect(() => {
    if (!events || events.length === 0) return;
    const firstEvent = events[events.length - 1];
    if (!agentInitialized && firstEvent.type === "session.created") {

      const initSessionInstructionsEvent = {
        "type": "session.update",
        "session": {
          "instructions": instructions,
        }
      }
      sendClientEvent(initSessionInstructionsEvent);
      sendClientEvent({ type: "response.create" });
      setAgentInitialized(true);
    }
  }, [events]);

  const requestMicrophoneAccess = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true }); // Request permission
      setMicStream(stream); // ← Store the obtained stream
      const devices = await navigator.mediaDevices.enumerateDevices();
      const micDevices = devices.filter(
        (device) =>
          device.kind === "audioinput" &&
          !device.label.toLowerCase().includes("virtual")
      );
      setMicrophones(micDevices);
      setSelectedMic(micDevices[0]?.deviceId || "");
    } catch (err) {
      console.error("Microphone access denied:", err);
    }
  };

  const handleMicChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedMic(event.target.value);
  };

  // No changes here other than removing references to stale token
  const handleStopCall = async () => {
    if (userData && name) {
      try {
        await fetch('/api/calls', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            visitorName: name,
            duration: callDuration,
            userId: userData.id, // Make sure User type includes an id field
          }),
        })
      } catch (error) {
        console.error('Failed to save call:', error)
      }
    }
    
    stopSession()
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
    setModalVisible(false);
  };

  // Timer for step 4
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
        const micSelect = document.getElementById("voxlink-microphone-select");
        if (micSelect) {
          micSelect.focus();
          observer.disconnect();
        }
      });

      observer.observe(document.body, {
        childList: true,
        subtree: true,
      });
    }
  }, [isModalVisible, step]);

  // Close modal if outside click (except during the call)
  useEffect(() => {
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

  // Add this useEffect to fetch user data on page load
  useEffect(() => {
    console.log("mounted");
    getUser().then((userData) => {
      if (userData) {
        setUser(userData);
        setInstructions(userData.instructions);
      } else {
        console.error("Failed to get user data");
        setInstructions("You are an Executive Assistant Software that takes care of the people calling. Unfortunately, we don't have any information about the user, there seems to be an issue with the user data. Politely ask the user to try again later, and tell them that you are sorry for the inconvenience.");
      }
    });
  }, []); // Empty dependency array means this runs once on mount

  return (
      <div className="flex flex-col justify-center items-center min-h-screen bg-gray-100 text-gray-800">
        <ProfileHeader user={userData} />
        <div className="bg-white px-6 py-4 lg:px-8">
        <div className="mx-auto max-w-3xl text-base/7 text-gray-700">
          <p className="text-base/7 font-semibold text-indigo-600">Personal Website</p>
          <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 items-center justify-between">

          <h1 className="mt-2 text-pretty text-4xl font-semibold tracking-tight text-gray-900 sm:text-5xl">
            {userData?.name}
          </h1>
          <CallButton onClick={handleCallButtonClick} user={userData} />
          </div>
          <p className="mt-6 text-xl/8">
            {userData?.bio}
          </p>
          <div className="mt-10 max-w-2xl">
            <p>
              Faucibus commodo massa rhoncus, volutpat. Dignissim sed eget risus enim. Mattis mauris semper sed amet vitae
              sed turpis id. Id dolor praesent donec est. Odio penatibus risus viverra tellus varius sit neque erat velit.
              Faucibus commodo massa rhoncus, volutpat. Dignissim sed eget risus enim. Mattis mauris semper sed amet vitae
              sed turpis id.
            </p>

            <p className="mt-8">
              Et vitae blandit facilisi magna lacus commodo. Vitae sapien duis odio id et. Id blandit molestie auctor
              fermentum dignissim. Lacus diam tincidunt ac cursus in vel. Mauris varius vulputate et ultrices hac
              adipiscing egestas. Iaculis convallis ac tempor et ut. Ac lorem vel integer orci.
            </p>
          </div>
        </div>
      </div>
      

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
                className={`flex items-center space-x-2 text-white font-bold py-2 px-4 rounded float-right ${
                  name.trim() ? "bg-indigo-500 hover:bg-indigo-700" : "bg-gray-400"
                }`}
                disabled={!name.trim()}
              >
                Next
                <ChevronRightIcon aria-hidden="true" className="-ml-0.5 mr-1.5 size-5 text-white" />
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
                    className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded mt-4 mx-auto block hover:scale-105 transition-all duration-300 shadow-xl hover:animate-pulse"
                  >
                    <PhoneIcon aria-hidden="true" className="-ml-0.5 mr-1.5 size-5 text-white" />
                    Start the Call
                  </button>
                </div>
              ) : (
                <div>
                  <label className="block mb-2 font-semibold text-xl text-center">
                    👋 Hey, {name}
                  </label>
                  <p className="mb-4">
                    I need access to the microphone for you to talk to me.
                  </p>
                  <p className="mb-4 text-gray-500">
                    Waiting for microphone permissions...
                  </p>
                </div>
              )}
            </div>
          )}

          {step === 3 && (
            <div>
              <div className="relative">
                <img src={userData?.avatar} alt={userData?.name} className="w-96 h-max rounded-lg mb-4" />
                <div className="absolute bottom-6 left-0 right-0 text-center">
                  <span className="text-gray-800 text-xl font-bold bg-gray-100 bg-opacity-60 rounded-lg p-2">{userData?.name}</span>
                </div>
              </div>
              <h2 className="text-lg font-bold mb-4 text-center">Calling...</h2>
              <p className="text-center text-md">Hold on, the call is being prepared.</p>
              <button
                id="voxlink-stop-preparing-button"
                onClick={handleStopCall}
                className="flex items-center space-x-2 bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded mt-4 mx-auto block hover:scale-105 transition-all duration-300"
              >
                <XMarkIcon aria-hidden="true" className="-ml-0.5 mr-1.5 size-5 text-white" />
                Stop Call
              </button>
            </div>
          )}

          {step === 4 && (
            <div>
              <div className="relative">
                <img src="/images/voxlink-bot.png" alt="User" className="w-96 h-max rounded-lg mb-4" />
                <div className="absolute bottom-6 left-0 right-0 text-center">
                  <span className="text-gray-800 text-xl font-bold bg-gray-100 bg-opacity-60 rounded-lg p-2">{userData?.name}'s Executive Assistant Software</span>
                </div>
              </div>
              <p className="text-center text-md">Call Duration: {formatCallDuration(callDuration)}</p>
              <button
                id="voxlink-stop-call-button"
                onClick={handleStopCall}
                className="flex items-center space-x-2 bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded mt-4 mx-auto block hover:scale-105 transition-all duration-300"
              >
                <XMarkIcon aria-hidden="true" className="-ml-0.5 mr-1.5 size-5 text-white" />
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