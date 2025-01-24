Below is one possible approach for refactoring the “call” functionality so that both pages/index.tsx (your demo) and pages/embed.tsx (the embedded button) can share the same logic. The core idea is to break out the complex state and the step-by-step logic into a reusable hook (or component) so that each page can “plug in” the same call workflow.

--------------------------------------------------------------------------------
1. Proposed File Structure
--------------------------------------------------------------------------------

You can create a new folder, for example “call/”, inside your “components/” (or “lib/” if you prefer) to house all call-related code:

  └── components/
      ├── call/
      │   ├── useCallFlow.ts        // Encapsulates the state machine & Next.js fetch calls
      │   ├── CallFlowModal.tsx     // Renders the steps (the multi-step UI) as a modal
      │   ├── CallFlowButton.tsx    // Renders a simple button that triggers the modal
      ├── Modal.tsx
      └── ... other components ...

  └── pages/
      ├── index.tsx                 // Uses <CallFlowButton /> and <CallFlowModal />
      ├── embed.tsx                 // Uses the same <CallFlowButton /> + <CallFlowModal />
      └── ...
  
In this structure:
• useCallFlow.ts: Holds all the logic for starting/stopping calls, controlling steps, populating transcripts, etc.  
• CallFlowModal.tsx: A specialized modal component for the 4-step call UI (the same steps you previously had in pages/index.tsx).  
• CallFlowButton.tsx: A small button that toggles the call modal (like your existing CallButton, but you can simplify it further).  

--------------------------------------------------------------------------------
2. Example: useCallFlow.ts
--------------------------------------------------------------------------------

Below is a simplified example of the custom hook that captures the bulk of your existing logic from “index.tsx” (the name, step state, token fetching, call management, microphone access, etc.). You can adapt it to your exact code as needed.

––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––
import { useState, useRef, useEffect } from 'react';
import { Howl } from "howler";
import { TokenResponse } from '@/types/api';
import { User } from '@/types/db';
import { config } from '@/lib/config';

const MAX_RINGTONE_DURATION = 5000;

export function useCallFlow() {
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [step, setStep] = useState(1);
  const [userName, setUserName] = useState('');
  
  // Microphone
  const [microphones, setMicrophones] = useState<MediaDeviceInfo[]>([]);
  const [selectedMic, setSelectedMic] = useState('');
  const [micStream, setMicStream] = useState<MediaStream | null>(null);

  // Ringtone
  const [ringtoneSound, setRingtoneSound] = useState<Howl | null>(null);
  const [ringtoneTimeoutId, setRingtoneTimeoutId] = useState<NodeJS.Timeout | null>(null);

  // etc., keep as many states and references as you need to replicate your current flow
  // (peerConnection, dataChannel, transcript, show_details_phone, show_details_email, etc.)
  
  // 1) Helper to open the modal.
  function openCallModal() {
    // Initialize or load your ringtone if needed
    if (!ringtoneSound) {
       setRingtoneSound(new Howl({ src: ["/audio/ringtone.mp3"] }));
    }
    setIsModalVisible(true);
    setStep(1);
  }

  // 2) Step transitions
  async function goToNextStep() {
    if (step === 1) {
      // Validate userName if necessary, or gather instructions
      // ...
      setStep(2);
      await requestMicrophoneAccess();
    } else if (step === 2) {
      // fetch token, then set step = 3 for “calling...”
      const tokenResponse = await getToken();
      if (tokenResponse) {
        setStep(3);
        initiateCall(tokenResponse);
      }
    }
  }

  // 3) Request microphone
  async function requestMicrophoneAccess() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setMicStream(stream);
      const devices = await navigator.mediaDevices.enumerateDevices();
      const micDevices = devices.filter((d) => d.kind === "audioinput");
      setMicrophones(micDevices);
      setSelectedMic(micDevices[0]?.deviceId || '');
    } catch (err) {
      console.error("Microphone access denied:", err);
    }
  }

  // 4) Token fetch
  async function getToken(): Promise<TokenResponse | null> {
    try {
      const res = await fetch("/api/token");
      if (!res.ok) throw new Error("Failed to fetch token");
      const data = await res.json();
      return data;
    } catch (e) {
      console.error(e);
      return null;
    }
  }

  // 5) Start the call (ringtone, transitions)
  function initiateCall(token: TokenResponse) {
    if (!ringtoneSound) return;
    ringtoneSound.play();
    const timeout = setTimeout(() => {
      ringtoneSound.fade(1, 0, 1000);
      startActiveCall(token);
    }, MAX_RINGTONE_DURATION);
    setRingtoneTimeoutId(timeout);
  }

  function startActiveCall(token: TokenResponse) {
    // Move to step 4 or “active call”
    setStep(4);
    // set up your peer connection, data channels, etc.
  }

  // 6) Stop call (similar to your “stopCall” logic)
  function stopCall() {
    // cleanup: stop tracks, close connections, clear timeouts, etc.
    setIsModalVisible(false);
    setStep(1);
  }

  // Return all states and functions that your UI components need to consume
  return {
    isModalVisible,
    step,
    userName,
    setUserName,
    microphones,
    selectedMic,
    setSelectedMic,
    openCallModal,
    goToNextStep,
    stopCall,
    // add the other states and methods as needed for your full logic
  };
}
––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––

By abstracting everything into a hook like this, you can easily share the logic between different UIs (index.tsx vs. embed.tsx). Each page can import the hook and use exactly the same state transitions.

--------------------------------------------------------------------------------
3. Example: CallFlowModal.tsx
--------------------------------------------------------------------------------

This component focuses on displaying the multi-step UI. It relies on the values and methods returned by “useCallFlow()” but doesn’t contain the actual logic for fetching tokens or enumerating devices. In the snippet below, we demonstrate how the steps might be broken out:

––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––
import React from 'react';
import Modal from '@/components/Modal';
import { useCallFlow } from './useCallFlow';
import { PhoneIcon, ChevronRightIcon, XMarkIcon } from '@heroicons/react/20/solid';

export const CallFlowModal: React.FC = () => {
  const {
    isModalVisible,
    step,
    userName, setUserName,
    microphones, selectedMic, setSelectedMic,
    goToNextStep,
    stopCall
  } = useCallFlow(); // We assume you’re calling the same instance. Alternatively, pass in the hook as props.

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
    <Modal isVisible={isModalVisible} onClose={stopCall}>
      {renderStep()}
    </Modal>
  );
};
––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––

Notice that this component is mostly presentational. It calls hooks (e.g., goToNextStep()) that actually do the logic. You might also pass your “useCallFlow” hook state as props from a parent if you prefer one single shared call state.

--------------------------------------------------------------------------------
4. Example: CallFlowButton.tsx
--------------------------------------------------------------------------------

A simple button that triggers the call modal. This could replace or wrap your existing “CallButton.tsx”. The key difference is that, instead of containing a bunch of local state, it just calls openCallModal from the hook.

––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––
import React from 'react';
import { useCallFlow } from './useCallFlow';
import { PhoneIcon } from '@heroicons/react/20/solid';

interface CallFlowButtonProps {
  // optional: include props for customizing the button text or style
}

export const CallFlowButton: React.FC<CallFlowButtonProps> = () => {
  const { openCallModal } = useCallFlow();

  return (
    <button
      onClick={openCallModal}
      className="bg-indigo-500hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded"
    >
      <PhoneIcon className="inline w-4 h-4 mr-1"/>  
      Call Now
    </button>
  );
};
––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––

--------------------------------------------------------------------------------
5. Using the Components in pages/index.tsx
--------------------------------------------------------------------------------

Now your “index.tsx” can look like:

––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––
import React from 'react';
import { CallFlowButton } from '@/components/call/CallFlowButton';
import { CallFlowModal } from '@/components/call/CallFlowModal';
import ProfileHeader from '@/components/ProfileHeader';

export default function Home() {
  return (
    <div>
      <ProfileHeader user={/* fetch or pass user data here */} />
      
      {/* The refactored button */}
      <CallFlowButton />

      {/* Renders the multi-step modal when triggered */}
      <CallFlowModal />
    </div>
  );
}
––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––

--------------------------------------------------------------------------------
6. Using the Same Components (or Hook) in pages/embed.tsx
--------------------------------------------------------------------------------

The “embed.tsx” page can import exactly the same pieces:

––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––
import React from 'react';
import Head from 'next/head';
import { CallFlowButton } from '@/components/call/CallFlowButton';
import { CallFlowModal } from '@/components/call/CallFlowModal';

export default function EmbedPage() {
  return (
    <div className="voxlink-embed">
      <Head>
        <title>Voxlink Call Button</title>
      </Head>
      
      {/* Reuse the same button + modal */}
      <CallFlowButton />
      <CallFlowModal />
    </div>
  );
}

// Optionally disable layout for embed page
EmbedPage.getLayout = (page) => page;
––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––––

Your “embed.tsx” will display the same “CallFlowButton,” which toggles the same “CallFlowModal,” giving you the identical call experience, but wrapped in an iframe for third-party sites.

--------------------------------------------------------------------------------
7. Notes and Variations
--------------------------------------------------------------------------------

• Single or Multiple Instances of the Hook:
  You might choose to create a single context provider (CallFlowProvider) around your entire app so that there's only one global call state. Or, you can create “useCallFlow()” inside each page so each instance is separate. This depends on whether you want multiple calls at once or a single call state.

• Combined Approach:
  Instead of separate <CallFlowButton> and <CallFlowModal>, you can do one “CallFlow” component that includes button + modal. But splitting them up like above makes it easier to place the button anywhere you want.

• Shared or Distinct “Modal” Component:
  You can reuse your existing components/Modal.tsx or use a new one specifically for the call flow. As long as it’s generic enough, it should work fine.

• API calls:
  Some details (like how you save calls, or the “stopCall” logic) will remain in your custom hook or in separate utility functions. The main goal is to keep the complicated logic somewhere you only have to maintain once, instead of copying it into both index.tsx and embed.tsx.

--------------------------------------------------------------------------------
Summary
--------------------------------------------------------------------------------

By refactoring into a dedicated “useCallFlow” hook (for logic) plus presentational components (“CallFlowModal” for the steps UI, “CallFlowButton” for opening it), you streamline the code and make it easy for any page—such as /index or /embed—to share the identical call workflow with minimal duplication.  