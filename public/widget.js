
(function () {
  const scriptTag = document.currentScript;
  const userId = scriptTag.getAttribute('data-user-id');
  const agentId = scriptTag.getAttribute('data-agent-id');

  if (!userId || !agentId) {
    console.error('AgentVerse Widget: User ID or Agent ID is missing.');
    return;
  }

  let iframe;
  let chatButton;
  let isChatOpen = false;

  function createWidget() {
    // 1. Create the Chat Bubble Button
    chatButton = document.createElement('button');
    chatButton.id = 'agentverse-chat-bubble-button';
    chatButton.setAttribute('aria-label', 'Open chat');
    
    // SVG Icon for the button
    const iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="width: 28px; height: 28px; color: white;"><path d="M12 1.75C13.4892 1.75 14.9255 1.78112 16.2754 1.83887L16.3418 1.8418C17.509 1.89169 18.4719 1.93277 19.2588 2.0918C20.0995 2.26171 20.7921 2.57464 21.4023 3.18945C22.6167 4.41312 22.6298 5.95045 22.71 8.22363C22.7359 8.95905 22.75 9.72053 22.75 10.5C22.75 11.2795 22.7359 12.0409 22.71 12.7764C22.6298 15.0495 22.6167 16.5869 21.4023 17.8105C20.7921 18.4254 20.0995 18.7383 19.2588 18.9082C18.4718 19.0672 17.5091 19.1083 16.3418 19.1582L16.2754 19.1611C15.5355 19.1928 14.7696 19.2165 13.9834 19.2314C13.1863 19.2466 12.9733 19.2607 12.7988 19.3271C12.6239 19.3938 12.4615 19.5198 11.873 20.0244L9.69336 21.8936C9.4251 22.1236 9.08286 22.25 8.72949 22.25C7.91249 22.2498 7.25022 21.5875 7.25 20.7705V19.1396C6.26419 19.0959 5.43456 19.0483 4.74121 18.9082C3.90049 18.7383 3.20788 18.4254 2.59766 17.8105C1.38331 16.5869 1.37023 15.0495 1.29004 12.7764C1.26409 12.0409 1.25 11.2795 1.25 10.5C1.25 9.72053 1.26409 8.95905 1.29004 8.22363C1.37023 5.95046 1.38331 4.41312 2.59766 3.18945C3.20788 2.57464 3.90049 2.26171 4.74121 2.0918C5.52815 1.93277 6.49097 1.89169 7.6582 1.8418L7.72461 1.83887C9.0745 1.78112 10.5108 1.75 12 1.75Z" fill="currentColor"></path></svg>`;
    chatButton.innerHTML = iconSvg;
    
    // CRITICAL FIX: Apply styles to the button
    Object.assign(chatButton.style, {
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        width: '56px',
        height: '56px',
        borderRadius: '50%',
        backgroundColor: '#16a34a', // Default color, will be updated
        color: 'white',
        border: 'none',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
        zIndex: '999998',
        transition: 'transform 0.2s ease-in-out'
    });


    // 2. Create the Iframe
    iframe = document.createElement('iframe');
    iframe.id = 'agentverse-chat-iframe';
    const baseUrl = scriptTag.src.replace('/widget.js', '');
    iframe.src = `${baseUrl}/widget/${userId}/${agentId}`;
    
    Object.assign(iframe.style, {
      position: 'fixed',
      bottom: '90px',
      right: '20px',
      width: '400px',
      height: '650px',
      border: 'none',
      borderRadius: '16px',
      boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
      display: 'none',
      zIndex: '999999',
      transition: 'opacity 0.3s, transform 0.3s',
      transform: 'translateY(20px)',
      opacity: '0'
    });

    // 3. Append to body
    document.body.appendChild(chatButton);
    document.body.appendChild(iframe);

    // 4. Add event listeners
    chatButton.addEventListener('click', toggleChat);

    window.addEventListener('message', (event) => {
        if (event.source !== iframe.contentWindow) return;

        if (event.data.type === 'AV_WIDGET_CLOSE') {
            toggleChat();
        }
        if (event.data.type === 'AV_WIDGET_CONFIG' && event.data.payload.chatButtonColor) {
            chatButton.style.backgroundColor = event.data.payload.chatButtonColor;
        }
    });
  }

  function toggleChat() {
    isChatOpen = !isChatOpen;
    if (isChatOpen) {
      iframe.style.display = 'block';
      setTimeout(() => {
        iframe.style.opacity = '1';
        iframe.style.transform = 'translateY(0)';
      }, 10);
      iframe.contentWindow?.postMessage({ type: 'AV_WIDGET_OPEN' }, '*');
    } else {
      iframe.style.opacity = '0';
      iframe.style.transform = 'translateY(20px)';
      setTimeout(() => {
         iframe.style.display = 'none';
      }, 300);
    }
  }
  
  if (document.readyState === 'complete' || document.readyState === 'interactive') {
    createWidget();
  } else {
    document.addEventListener('DOMContentLoaded', createWidget);
  }
})();
