import React, { useState } from "react";
import CallButton from "../components/CallButton";
import Modal from "../components/Modal";

const Home: React.FC = () => {
  const [isModalVisible, setModalVisible] = useState(false);
  const [name, setName] = useState("");

  const handleCallButtonClick = () => {
    setModalVisible(true);
  };

  const handleNext = () => {
    alert(`Hello, ${name}! Moving to the next step.`);
    setModalVisible(false); // Close the modal
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100 text-gray-800">
      <CallButton onClick={handleCallButtonClick} />

      <Modal isVisible={isModalVisible} onClose={() => setModalVisible(false)}>
        <div>
          <h2 className="text-lg font-bold mb-4">Let's prepare the call</h2>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="w-full p-2 border border-gray-300 rounded mb-4"
            placeholder="Enter your name"
          />
          <button
            onClick={handleNext}
            className={`text-white font-bold py-2 px-4 rounded float-right ${
              name.trim() ? 'bg-blue-500 hover:bg-blue-700' : 'bg-gray-400'
            }`}
            disabled={!name.trim()}
          >
            Next
          </button>
        </div>
      </Modal>
    </div>
  );
};

export default Home;
