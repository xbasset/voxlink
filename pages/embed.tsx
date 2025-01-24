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