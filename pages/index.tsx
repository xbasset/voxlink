import React from "react";
import CallButton from "../components/CallButton";

const Home: React.FC = () => {
  const handleCallButtonClick = () => {
    alert("Call button clicked!");
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100">
      <CallButton onClick={handleCallButtonClick} />
    </div>
  );
};

export default Home;
