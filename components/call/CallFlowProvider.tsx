import React, { createContext, useContext } from 'react';
import { useCallFlow } from './useCallFlow';
import { User } from '@/types/db';

const CallFlowContext = createContext<ReturnType<typeof useCallFlow> | null>(null);

interface CallFlowProviderProps {
  children: React.ReactNode;
  user: User | null;
}

export function CallFlowProvider({ children, user }: CallFlowProviderProps) {
  const callFlow = useCallFlow({ user });
  
  return (
    <CallFlowContext.Provider value={callFlow}>
      {children}
    </CallFlowContext.Provider>
  );
}

export function useCallFlowContext() {
  const context = useContext(CallFlowContext);
  if (!context) {
    throw new Error('useCallFlowContext must be used within a CallFlowProvider');
  }
  return context;
} 