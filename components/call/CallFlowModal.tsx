import React, { useEffect } from 'react';
import Modal from '@/components/Modal';
import { useCallFlowContext } from './CallFlowProvider';
import { PhoneIcon, ChevronRightIcon, XMarkIcon } from '@heroicons/react/20/solid';
import { User, CallTranscriptEntry } from '@/types/db';

export const CallFlowModal: React.FC = () => {
  const {
    isModalVisible,
    step,
    userName,
    setUserName,
    microphones,
    selectedMic,
    setSelectedMic,
    goToNextStep,
    stopCall,
    user,
    showDetailsEmail,
    setShowDetailsEmail,
    showDetailsName,
    setShowDetailsName,
    showDetailsReason,
    setShowDetailsReason,
    showDetailsPhone,
    setShowDetailsPhone,
    formatCallDuration,
    callDuration,
    closingCall,
    closeCall
  } = useCallFlowContext();

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

  // UI for each step
  const renderStep = () => {
    if (step === 1) {
      return (
        <div>
          <h2 className="text-lg font-bold mb-4">Let's prepare the call</h2>
          <input
            id="voxlink-caller-name"
            type="text"
            value={userName}
            onChange={(e) => setUserName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && userName.trim()) {
                goToNextStep();
              }
            }}
            className="w-full p-2 border border-gray-300 rounded mb-4"
            placeholder="Enter your name"
          />
          <button
            id="voxlink-go-to-microphone-button"
            onClick={goToNextStep}
            className={`flex items-center space-x-2 text-white font-bold py-2 px-4 rounded float-right ${
              userName.trim() ? "bg-indigo-500 hover:bg-indigo-700" : "bg-gray-400"
            }`}
            disabled={!userName.trim()}
          >
            Next
            <ChevronRightIcon aria-hidden="true" className="-ml-0.5 mr-1.5 size-5 text-white" />
          </button>
        </div>
      );
    }
    else if (step === 2) {
      return (
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
                onChange={(e) => setSelectedMic(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") goToNextStep();
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
                onClick={goToNextStep}
                className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 text-white font-bold py-2 px-4 rounded mt-4 mx-auto block hover:scale-105 transition-all duration-300 shadow-xl hover:animate-pulse"
              >
                <PhoneIcon aria-hidden="true" className="-ml-0.5 mr-1.5 size-5 text-white" />
                Start the Call
              </button>
            </div>
          ) : (
            <div>
              <label className="block mb-2 font-semibold text-xl text-center">
                👋 Hey, {userName}
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
      );
    }
    else if (step === 3) {
      return (
        <div>
          <div className="relative">
            <img src={user?.avatar} alt={user?.name} className="w-96 h-max rounded-lg mb-4" />
            <div className="absolute bottom-6 left-0 right-0 text-center">
              <span className="text-gray-800 text-xl font-bold bg-gray-100 bg-opacity-60 rounded-lg p-2">{user?.name}</span>
            </div>
          </div>
          <h2 className="text-lg font-bold mb-4 text-center">Calling...</h2>
          <p className="text-center text-md">Hold on, the call is being prepared.</p>
          <button
            id="voxlink-stop-preparing-button"
            onClick={() => stopCall([])}
            className="flex items-center space-x-2 bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded mt-4 mx-auto block hover:scale-105 transition-all duration-300"
          >
            <XMarkIcon aria-hidden="true" className="-ml-0.5 mr-1.5 size-5 text-white" />
            Stop Call
          </button>
        </div>
      );
    }
    else if (step === 4) {
      return (
        <div>
          <div className="relative">
            <img src="/images/voxlink-bot.png" alt="User" className="w-96 h-max rounded-lg mb-4" />
            <div className="absolute top-6 left-0 right-0">
              <span className="text-gray-800 text-sm italic bg-gray-100 shadow-lg p-2">Call transfered to:</span>
            </div>
            <div className="absolute bottom-6 left-0 right-0 text-center">
              <span className="text-gray-800 text-xl font-bold bg-gray-100 bg-opacity-90 rounded-lg p-2">{user?.name}'s<br/></span>
              <span className="text-gray-800 text-xl italic bg-gray-100 bg-opacity-90 rounded-lg p-2"> Executive Assistant Software</span>
            </div>
          </div>
          {(showDetailsEmail !== null || showDetailsName !== null || showDetailsReason !== null) && (
            <div className="bg-gray-100 bg-opacity-90 shadow-md rounded-lg p-4">
              <div className="">
                <h2 className="text-lg font-bold mb-2">Call Details</h2>
              </div>
              {showDetailsName && (
                <div className="mt-4">
                  <p className="text-md"><span className="font-bold">Your name:</span> {showDetailsName}</p>
                </div>
              )}
              {showDetailsReason && (
                <div className="mt-2">
                  <p className="text-md"><span className="font-bold">Reason for Call:</span></p>
                  <textarea
                    rows={4}
                    value={showDetailsReason}
                    onChange={(e) => setShowDetailsReason(e.target.value)}
                    className="mt-1 p-2 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  />
                </div>
              )}
              {showDetailsEmail && (
                <div className="mt-2">
                  <p className="text-md"><span className="font-bold">Email:</span></p>
                  <input
                    type="email"
                    value={showDetailsEmail}
                    onChange={(e) => setShowDetailsEmail(e.target.value)}
                    className="mt-1 p-2 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  />
                </div>
              )}
              {showDetailsPhone && (
                <div className="mt-2">
                  <p className="text-md"><span className="font-bold">Phone Number:</span></p>
                  <input
                    type="tel"
                    value={showDetailsPhone}
                    onChange={(e) => setShowDetailsPhone(e.target.value)}
                    className="mt-1 p-2 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  />
                </div>
              )}
            </div>
          )}

          <p className="mt-4 text-center text-md">Call Duration: {formatCallDuration(callDuration)}</p>
          {closingCall ? (
            <div className="flex items-center justify-center space-x-2 bg-gray-100 p-4 rounded mt-4">
              <svg className="animate-spin h-5 w-5 text-gray-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span className="text-gray-700">Transmitting informations...</span>
            </div>
          ) : (
            <button
              id="voxlink-stop-call-button"
              onClick={closeCall}
              className="flex items-center space-x-2 bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded mt-4 mx-auto block hover:scale-105 transition-all duration-300"
            >
              <XMarkIcon aria-hidden="true" className="-ml-0.5 mr-1.5 size-5 text-white" />
              Stop Call
            </button>
          )}
        </div>
      );
    }
  };

  return (
    <Modal isVisible={isModalVisible} onClose={() => {}}>
      {renderStep()}
    </Modal>
  );
};