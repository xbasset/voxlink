import React, { useState, useEffect, useRef } from "react";
import { Howl } from "howler"; // Import Howler for audio playback
import CallButton from "../components/CallButton";
import Modal from "../components/Modal";

const MAX_RINGTONE_DURATION = 10000;

const Home: React.FC = () => {
  const [isModalVisible, setModalVisible] = useState(false);
  const [step, setStep] = useState(1); // Tracks which step we are on
  const [name, setName] = useState("");
  const [microphones, setMicrophones] = useState<MediaDeviceInfo[]>([]); // List of microphones
  const [selectedMic, setSelectedMic] = useState(""); // Selected microphone
  const [callDuration, setCallDuration] = useState(0); // Tracks call duration in seconds
  const [micStream, setMicStream] = useState<MediaStream | null>(null);
  const modalRef = useRef<HTMLDivElement>(null);

  const handleCallButtonClick = () => {
    setModalVisible(true);
    setStep(1); // Reset to the first step
  };

  const handleNext = async () => {
    if (step === 1) {
      // Proceed to Step 2: Microphone Access
      setStep(2);
      await requestMicrophoneAccess();
    } else if (step === 2) {
      // Proceed to Step 3: Simulate ringtone
      playRingtone();
      setStep(3);
    }
  };

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
    const sound = new Howl({
      src: ["/audio/ringtone.mp3"], // Path to your ringtone file
      loop: true, // Loop the ringtone until manually stopped
    });

    sound.play();

    // Stop the ringtone after 1 second (adjust as needed)
    setTimeout(() => {
      sound.stop();
      handleStartCall();
    }, MAX_RINGTONE_DURATION);
  };

  const handleMicChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedMic(event.target.value);
  };

  const handleStartCall = () => {
    // Move to the "call in progress" step
    setStep(4);
  };

  // Stop call explicitly, including stopping media tracks
  const handleStopCall = () => {
    if (micStream) {
      micStream.getTracks().forEach((track) => track.stop());
      setMicStream(null); // Reset to null if you like
    }
    setModalVisible(false);
    setStep(1);
    setCallDuration(0);
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
    if (isModalVisible) {
      document.addEventListener("mousedown", handleClickOutside);
    }
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isModalVisible]);

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
                className={`text-white font-bold py-2 px-4 rounded float-right ${
                  name.trim() ? "bg-blue-500 hover:bg-blue-700" : "bg-gray-400"
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
            </div>
          )}

          {step === 4 && (
            <div>
              <h2 className="text-lg font-bold mb-4">Call in Progress</h2>
              <p>Call Duration: {formatCallDuration(callDuration)}</p>
              <button
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