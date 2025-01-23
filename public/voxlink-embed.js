(function() {
  function createVoxlinkIframe(options = {}) {
    // Create container if not exists
    let container = document.getElementById(options.containerId);
    if (!container) {
      container = document.createElement('div');
      container.id = 'voxlink-container';
      document.body.appendChild(container);
    }

    // Create and configure iframe
    const iframe = document.createElement('iframe');
    const queryParams = new URLSearchParams(options).toString();
    iframe.src = `${options.host || 'https://yourdomain.com'}/embed?${queryParams}`;
    iframe.style.border = 'none';
    iframe.style.width = options.width || '300px';
    iframe.style.height = options.height || '80px';
    iframe.style.overflow = 'hidden';
    
    // Add iframe to container
    container.appendChild(iframe);

    // Handle messages from iframe
    window.addEventListener('message', function(event) {
      // Verify origin
      if (event.origin !== (options.host || 'https://yourdomain.com')) return;
      
      if (event.data.type === 'RESIZE') {
        iframe.style.height = event.data.height + 'px';
      }
    });
  }

  // Expose global function
  window.VoxlinkEmbed = {
    init: createVoxlinkIframe
  };
})(); 