import React, { useState } from 'react';
import { useCallFlowContext } from './CallFlowProvider';
import { PhoneIcon } from '@heroicons/react/20/solid';
import { User } from '@/types/db';

interface CallFlowButtonProps {
    user: User | null;
    pulse: boolean;
}

export const CallFlowButton: React.FC<CallFlowButtonProps> = ({ user, pulse = false }) => {
  const [isPulsing, setIsPulsing] = useState(pulse);
  const { openCallModal } = useCallFlowContext();

  return (
    <button
      onClick={openCallModal}
      className={`bg-indigo-500 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded shadow-xl inline-flex items-center hover:scale-105 transition-all duration-300 ${isPulsing ? 'animate-pulse' : ''}`}
    >
      <PhoneIcon aria-hidden="true" className="-ml-0.5 mr-1.5 size-5 text-white" />
      Call {user?.name} Now
    </button>
  );
};

export default CallFlowButton;
