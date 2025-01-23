import React, { useEffect, useState } from 'react';
import Head from 'next/head';

export default function EmbedPage() {
  const [showModal, setShowModal] = useState(false);
  
  // Handle messages from parent window if needed
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // Verify origin for security
      if (event.origin !== process.env.NEXT_PUBLIC_ALLOWED_ORIGIN) return;
      
      if (event.data.type === 'CLOSE_MODAL') {
        setShowModal(false);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  return (
    <div className="voxlink-embed">
      <Head>
        <title>Voxlink Call Button</title>
        <style>{`
          .voxlink-embed {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
          }
          
          .call-button {
            background: #0070f3;
            color: white;
            border: none;
            padding: 8px 16px;
            border-radius: 4px;
            cursor: pointer;
            font-size: 14px;
            transition: background 0.2s;
          }
          
          .call-button:hover {
            background: #0051b3;
          }
          
          .modal {
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.5);
            display: flex;
            align-items: center;
            justify-content: center;
          }
          
          .modal-content {
            background: white;
            padding: 20px;
            border-radius: 8px;
            max-width: 400px;
            width: 100%;
          }
        `}</style>
      </Head>

      <button 
        className="call-button"
        onClick={() => setShowModal(true)}
      >
        Call Now
      </button>

      {showModal && (
        <div className="modal">
          <div className="modal-content">
            <h3>Start Your Call</h3>
            {/* Add your existing call functionality here */}
            <button onClick={() => setShowModal(false)}>Close</button>
          </div>
        </div>
      )}
    </div>
  );
}

// Disable layout for embed page
EmbedPage.getLayout = (page: React.ReactElement) => page; 