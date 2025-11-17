
(function () {
  // Check if the script is already running
  if (window.agentVerseWidget) {
    return;
  }
  window.agentVerseWidget = true;

  // --- CONFIGURATION ---
  const scriptTag = document.currentScript;
  const userId = scriptTag.getAttribute('data-user-id');
  const agentId = scriptTag.getAttribute('data-agent-id');
  const chatBubbleAlignment = 'right'; // Default alignment

  if (!agentId || !userId) {
    console.error('AgentVerse Widget: user-id and agent-id are required.');
    return;
  }

  const iframeSrc = `${window.location.origin}/widget/${userId}/${agentId}`;

  // --- STATE ---
  let isChatOpen = false;
  let chatBubbleButton;
  let iframe;

  // --- CREATE STYLES ---
  function createStyles() {
    const style = document.createElement('style');
    style.innerHTML = `
      .av-bubble {
        position: fixed;
        bottom: 20px;
        ${chatBubbleAlignment}: 20px;
        width: 60px;
        height: 60px;
        border-radius: 50%;
        background-color: #16a34a;
        color: white;
        display: flex;
        align-items: center;
        justify-content: center;
        cursor: pointer;
        box-shadow: 0 4px 8px rgba(0,0,0,0.2);
        transition: transform 0.2s ease-in-out;
        z-index: 9998;
      }
      .av-bubble:hover {
        transform: scale(1.1);
      }
      .av-bubble-icon {
        width: 32px;
        height: 32px;
      }
      .av-iframe {
        position: fixed;
        bottom: 90px;
        ${chatBubbleAlignment}: 20px;
        width: 400px;
        height: 650px;
        border: none;
        border-radius: 1rem;
        box-shadow: 0 8px 24px rgba(0,0,0,0.2);
        transform-origin: bottom ${chatBubbleAlignment};
        transition: transform 0.3s ease-out, opacity 0.3s ease-out;
        opacity: 0;
        transform: scale(0.9);
        pointer-events: none;
        z-index: 9999;
      }
      .av-iframe.open {
        opacity: 1;
        transform: scale(1);
        pointer-events: auto;
      }

      @media (max-width: 450px) {
        .av-iframe {
            width: 100%;
            height: calc(100% - 100px);
            bottom: 80px;
            left: 0;
            right: 0;
            border-radius: 0;
        }
      }
    `;
    document.head.appendChild(style);
  }

  // --- CREATE CHAT BUBBLE ---
  function createChatBubble() {
    chatBubbleButton = document.createElement('div');
    chatBubbleButton.className = 'av-bubble';
    chatBubbleButton.innerHTML = `
      <svg class="av-bubble-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none">
        <path d="M12 1.75C13.4892 1.75 14.9255 1.78112 16.2754 1.83887L16.3418 1.8418C17.509 1.89169 18.4719 1.93277 19.2588 2.0918C20.0995 2.26171 20.7921 2.57464 21.4023 3.18945C22.6167 4.41312 22.6298 5.95045 22.71 8.22363C22.7359 8.95905 22.75 9.72053 22.75 10.5C22.75 11.2795 22.7359 12.0409 22.71 12.7764C22.6298 15.0495 22.6167 16.5869 21.4023 17.8105C20.7921 18.4254 20.0995 18.7383 19.2588 18.9082C18.4718 19.0672 17.5091 19.1083 16.3418 19.1582L16.2754 19.1611C15.5355 19.1928 14.7696 19.2165 13.9834 19.2314C13.1863 19.2466 12.9733 19.2607 12.7988 19.3271C12.6239 19.3938 12.4615 19.5198 11.873 20.0244L9.69336 21.8936C9.4251 22.1236 9.08286 22.25 8.72949 22.25C7.91249 22.2498 7.25022 21.5875 7.25 20.7705V19.1396C6.26419 19.0959 5.43456 19.0483 4.74121 18.9082C3.90049 18.7383 3.20788 18.4254 2.59766 17.8105C1.38331 16.5869 1.37023 15.0495 1.29004 12.7764C1.26409 12.0409 1.25 11.2795 1.25 10.5C1.25 9.72053 1.26409 8.95905 1.29004 8.22363C1.37023 5.95046 1.38331 4.41312 2.59766 3.18945C3.20788 2.57464 3.90049 2.26171 4.74121 2.0918C5.52815 1.93277 6.49097 1.89169 7.6582 1.8418L7.72461 1.83887C9.0745 1.78112 10.5108 1.75 12 1.75ZM7.5 11.5C6.94772 11.5 6.5 11.9477 6.5 12.5C6.5 13.0523 6.94772 13.5 7.5 13.5H13C13.5523 13.5 14 13.0523 14 12.5C14 11.9477 13.5523 11.5 13 11.5H7.5ZM7.5 7.5C6.94772 7.5 6.5 7.94772 6.5 8.5C6.5 9.05228 6.94772 9.5 7.5 9.5H16.5C17.0523 9.5 17.5 9.05228 17.5 8.5C17.5 7.94772 17.0523 7.5 16.5 7.5H7.5Z" fill="white"></path>
      </svg>
    `;
    document.body.appendChild(chatBubbleButton);
    chatBubbleButton.addEventListener('click', toggleChat);
  }

  // --- CREATE IFRAME ---
  function createIframe() {
    iframe = document.createElement('iframe');
    iframe.className = 'av-iframe';
    iframe.src = iframeSrc;
    document.body.appendChild(iframe);
  }

  // --- TOGGLE CHAT ---
  function toggleChat() {
    isChatOpen = !isChatOpen;
    if (isChatOpen) {
      iframe.classList.add('open');
      iframe.contentWindow.postMessage({ type: 'AV_WIDGET_OPEN' }, '*');
    } else {
      iframe.classList.remove('open');
    }
  }

  // --- MESSAGE HANDLING ---
  window.addEventListener('message', (event) => {
    if (event.data.type === 'AV_WIDGET_CONFIG') {
      if (event.data.payload.chatButtonColor && chatBubbleButton) {
        chatBubbleButton.style.backgroundColor = event.data.payload.chatButtonColor;
      }
    }
    if (event.data.type === 'AV_WIDGET_CLOSE') {
      if (isChatOpen) {
        toggleChat();
      }
    }
  });


  // --- INITIALIZE WIDGET ---
  function initialize() {
    createStyles();
    createIframe();
    createChatBubble();
  }
  
  if (document.readyState === 'complete') {
    initialize();
  } else {
    window.addEventListener('load', initialize);
  }

})();
