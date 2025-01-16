import React from "react";

interface CallButtonProps {
  onClick: () => void;
}

const CallButton: React.FC<CallButtonProps> = ({ onClick }) => {
  return (
    <button
      onClick={onClick}
      className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
    >
      Call Me Now
    </button>
  );
};

export default CallButton;
