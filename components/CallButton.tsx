import { PhoneIcon } from '@heroicons/react/20/solid'
import React, { useState } from "react";
import { User } from "../types/user";

interface CallButtonProps {
  onClick: () => void;
  user: User | null;
}

const CallButton: React.FC<CallButtonProps> = ({ onClick, user }) => {
  const [isPulsing, setIsPulsing] = useState(true);
  
  const handleClick = () => {
    setIsPulsing(false);
    onClick();
  };

  return (
    <button
      onClick={handleClick}
      className={`bg-indigo-500 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded shadow-xl inline-flex items-center hover:scale-105 transition-all duration-300 ${isPulsing ? 'animate-pulse' : ''}`}
    >
      <PhoneIcon aria-hidden="true" className="-ml-0.5 mr-1.5 size-5 text-white" />
      Call {user?.name} Now
    </button>
  );
};

export default CallButton;
