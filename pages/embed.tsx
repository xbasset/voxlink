import React, { useEffect, useRef } from 'react';
import Head from 'next/head';
import { CallFlowButton } from '@/components/call/CallFlowButton';
import { CallFlowModal } from '@/components/call/CallFlowModal';
import { CallFlowProvider } from '@/components/call/CallFlowProvider';
import { User } from '@/types/db';
import { useState } from 'react';

export default function EmbedPage() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const response = await fetch("/api/user");
        if (!response.ok) {
          throw new Error(`Error fetching user data: ${response.statusText}`);
        }
        const data = await response.json();
        setUser(data);
      } catch (err: any) {
        console.error(err);
        setError(err.message || "An unexpected error occurred");
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, []);

  // Send height updates to parent
  useEffect(() => {
    const sendHeightToParent = () => {
      const height = containerRef.current?.offsetHeight || 0;
      window.parent.postMessage({ type: 'voxlink-resize', height }, '*');
    };

    // Create observer to watch for size changes
    const resizeObserver = new ResizeObserver(sendHeightToParent);
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    // Cleanup
    return () => resizeObserver.disconnect();
  }, []);

  if (loading) return null;
  if (error) return null;

  return (
    <CallFlowProvider user={user}>
      <div ref={containerRef} className="voxlink-embed text-gray-800 bg-white min-h-screen">
        <Head>
          <title>Voxlink Call Button</title>
        </Head>
        
        <CallFlowButton user={user} pulse={false} />
        <CallFlowModal />
      </div>
    </CallFlowProvider>
  );
}

// Optionally disable layout for embed page
EmbedPage.getLayout = (page: React.ReactElement) => page;