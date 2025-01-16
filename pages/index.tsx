import React, { useState, useEffect } from "react";
import CallButton from "../components/CallButton";
import Modal from "../components/Modal";

const Home: React.FC = () => {
  const [isModalVisible, setModalVisible] = useState(false);
  const [step, setStep] = useState(1); // Tracks which step we are on
  const [name, setName] = useState("");
  const [microphones, setMicrophones] = useState<MediaDeviceInfo[]>([]); // List of microphones
  const [selectedMic, setSelectedMic] = useState(""); // Selected microphone

  const handleCallButtonClick = () => {
    setModalVisible(true);
    setStep(1); // Reset to the first step
  };

  const handleNext = async () => {
    if (step === 1) {
      // Proceed to Step 2: Microphone Access
      setStep(2);
      await requestMicrophoneAccess();
    }
  };

  const requestMicrophoneAccess = async () => {
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true }); // Request permission
      const devices = await navigator.mediaDevices.enumerateDevices();
      const micDevices = devices.filter((device) => device.kind === "audioinput" && !device.label.toLowerCase().includes("virtual"));
      setMicrophones(micDevices);
      setSelectedMic(micDevices[0]?.deviceId || ""); // Default to the first microphone
    } catch (err) {
      console.error("Microphone access denied:", err);
    }
  };

  const handleMicChange = (event: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedMic(event.target.value);
  };

  const handleStartCall = () => {
    setModalVisible(false);
  };

  const handleKeyPress = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter' && name.trim()) {
      handleNext();
    }
  };

  // Auto-focus the name input when modal becomes visible
  useEffect(() => {
    if (isModalVisible && step === 1) {
      const nameInput = document.getElementById('caller-name') as HTMLInputElement;
      if (nameInput) {
        nameInput.focus();
      }
    }
  }, [isModalVisible, step]);

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100 text-gray-800">
      <CallButton onClick={handleCallButtonClick} />

      <Modal isVisible={isModalVisible} onClose={() => setModalVisible(false)}>
        {step === 1 && (
          <div>
          <h2 className="text-lg font-bold mb-4">Let's prepare the call</h2>
            <input
              id="voxlink-caller-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              onKeyDown={handleKeyPress}
              className="w-full p-2 border border-gray-300 rounded mb-4"
              placeholder="Enter your name"
            />
            <button
              id="voxlink-go-to-microphone-button"
              onClick={handleNext}
              className={`text-white font-bold py-2 px-4 rounded float-right ${
                name.trim() ? 'bg-blue-500 hover:bg-blue-700' : 'bg-gray-400'
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
                <label className="block mb-2 font-semibold">Choose a Microphone:</label>
                <select
                  id="voxlink-microphone-select"
                  value={selectedMic}
                  onChange={handleMicChange}
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
                  onClick={handleStartCall}
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
      </Modal>
    </div>
  );
};

export default Home;
