import React from 'react';
import Modal from '@/components/Modal';
import { useCallFlow } from './useCallFlow';
import { PhoneIcon, ChevronRightIcon, XMarkIcon } from '@heroicons/react/20/solid';
import { User, CallTranscriptEntry } from '@/types/db';

interface CallFlowModalProps {
  isVisible: boolean;
  onClose: () => void;
  user: User | null;
  onStopCall: (transcript: CallTranscriptEntry[]) => Promise<void>;
}

export const CallFlowModal: React.FC<CallFlowModalProps> = ({ isVisible, onClose, user, onStopCall }) => {
  const {
    step,
    userName, setUserName,
    microphones, selectedMic, setSelectedMic,
    goToNextStep,
    stopCall
  } = useCallFlow(); // We assume you're calling the same instance. Alternatively, pass in the hook as props.

  // UI for each step
  const renderStep = () => {
    if (step === 1) {
      return (
        <>
          <h2 className="text-lg font-bold mb-4">Let's prepare the call</h2>
          <input
            type="text"
            value={userName}
            onChange={(e) => setUserName(e.target.value)}
            className="w-full p-2 border rounded mb-4"
            placeholder="Enter your name"
          />
          <button
            onClick={goToNextStep}
            disabled={!userName.trim()}
            className="bg-indigo-500 hover:bg-indigo-700 text-white py-2 px-4 rounded"
          >
            Next
            <ChevronRightIcon className="inline w-4 h-4 ml-1" />
          </button>
        </>
      );
    }
    else if (step === 2) {
      return (
        <>
          <h2 className="text-lg font-bold mb-4">Microphone Access</h2>
          <select
            value={selectedMic}
            onChange={(e) => setSelectedMic(e.target.value)}
            className="p-2 border w-full"
          >
            {microphones.map((mic) => (
              <option key={mic.deviceId} value={mic.deviceId}>
                {mic.label || 'Unknown mic'}
              </option>
            ))}
          </select>
          <button onClick={goToNextStep} className="bg-green-600 text-white py-2 px-4 mt-4 rounded">
            <PhoneIcon className="inline w-4 h-4 mr-1" />
            Start the Call
          </button>
        </>
      );
    }
    else if (step === 3) {
      return (
        <>
          <h2 className="text-xl font-bold text-center">Calling...</h2>
          <p className="text-sm text-center">Hold on, preparing the call...</p>
          <button onClick={stopCall} className="bg-red-500 text-white py-2 px-4 mt-4 rounded flex items-center justify-center">
            <XMarkIcon className="inline w-4 h-4 mr-1" /> Stop Call
          </button>
        </>
      );
    }
    else if (step === 4) {
      return (
        <>
          <h2 className="text-xl font-bold text-center">Active Call</h2>
          <p className="text-sm text-center">You are now connected.</p>
          <button onClick={stopCall} className="bg-red-500 text-white py-2 px-4 mt-4 rounded flex items-center justify-center">
            <XMarkIcon className="inline w-4 h-4 mr-1" /> Stop Call
          </button>
        </>
      );
    }
  };

  return (
    <Modal isVisible={isVisible} onClose={onClose}>
      {renderStep()}
    </Modal>
  );
};