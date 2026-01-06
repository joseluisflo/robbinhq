
(function() {
    // --- Configuration ---
    const scriptTag = document.currentScript;
    if (!scriptTag) {
        console.error("AgentVerse Widget: Could not find the script tag. Please ensure the script is loaded correctly.");
        return;
    }
    const userId = scriptTag.getAttribute('data-user-id');
    const agentId = scriptTag.getAttribute('data-agent-id');
    const baseUrl = new URL(scriptTag.src).origin;
    const chatBubbleColor = scriptTag.getAttribute('data-color') || '#16a34a'; 
    const chatBubbleAlignment = scriptTag.getAttribute('data-align') || 'right';

    if (!userId || !agentId) {
        console.error("AgentVerse Widget: 'data-user-id' and 'data-agent-id' are required attributes on the script tag.");
        return;
    }

    // --- State ---
    let iframeVisible = false;

    // --- Create Elements ---
    const widgetContainer = document.createElement('div');
    widgetContainer.id = 'agentverse-widget-container';
    widgetContainer.style.position = 'fixed';
    widgetContainer.style.bottom = '20px';
    widgetContainer.style.zIndex = '9999';
    widgetContainer.style.right = chatBubbleAlignment === 'right' ? '20px' : 'auto';
    widgetContainer.style.left = chatBubbleAlignment === 'left' ? '20px' : 'auto';


    const chatBubble = document.createElement('button');
    chatBubble.id = 'agentverse-chat-bubble';
    chatBubble.setAttribute('aria-label', 'Open Chat');
    chatBubble.style.width = '60px';
    chatBubble.style.height = '60px';
    chatBubble.style.borderRadius = '50%';
    chatBubble.style.backgroundColor = chatBubbleColor;
    chatBubble.style.border = 'none';
    chatBubble.style.cursor = 'pointer';
    chatBubble.style.boxShadow = '0 4px 8px rgba(0,0,0,0.2)';
    chatBubble.style.display = 'flex';
    chatBubble.style.alignItems = 'center';
    chatBubble.style.justifyContent = 'center';
    chatBubble.style.transition = 'transform 0.2s ease-out';
    chatBubble.innerHTML = `
        <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M2 10.5C2 9.72921 2.01346 8.97679 2.03909 8.2503C2.12282 5.87683 2.16469 4.69009 3.13007 3.71745C4.09545 2.74481 5.3157 2.6926 7.7562 2.58819C9.09517 2.5309 10.5209 2.5 12 2.5C13.4791 2.5 14.9048 2.5309 16.2438 2.58819C18.6843 2.6926 19.9046 2.74481 20.8699 3.71745C21.8353 4.69009 21.8772 5.87683 21.9609 8.2503C21.9865 8.97679 22 9.72921 22 10.5C22 11.2708 21.9865 12.0232 21.9609 12.7497C21.8772 15.1232 21.8353 16.3099 20.8699 17.2826C19.9046 18.2552 18.6843 18.3074 16.2437 18.4118C15.5098 18.4432 14.7498 18.4667 13.9693 18.4815C13.2282 18.4955 12.8576 18.5026 12.532 18.6266C12.2064 18.7506 11.9325 18.9855 11.3845 19.4553L9.20503 21.3242C9.07273 21.4376 8.90419 21.5 8.72991 21.5C8.32679 21.5 8 21.1732 8 20.7701V18.4219C7.91842 18.4186 7.83715 18.4153 7.75619 18.4118C5.31569 18.3074 4.09545 18.2552 3.13007 17.2825C2.16469 16.3099 2.12282 15.1232 2.03909 12.7497C2.01346 12.0232 2 11.2708 2 10.5Z"></path>
        </svg>
    `;

    const iframeContainer = document.createElement('div');
    iframeContainer.id = 'agentverse-iframe-container';
    iframeContainer.style.position = 'absolute';
    iframeContainer.style.bottom = '80px';
    iframeContainer.style.width = '400px';
    iframeContainer.style.height = '650px';
    iframeContainer.style.maxHeight = 'calc(100vh - 100px)';
    iframeContainer.style.transition = 'opacity 0.3s ease-in-out, transform 0.3s ease-in-out';
    iframeContainer.style.opacity = '0';
    iframeContainer.style.transform = 'translateY(20px)';
    iframeContainer.style.pointerEvents = 'none';
    iframeContainer.style[chatBubbleAlignment] = '0';

    const iframe = document.createElement('iframe');
    iframe.id = 'agentverse-iframe';
    iframe.src = `${baseUrl}/widget/${userId}/${agentId}`;
    iframe.style.width = '100%';
    iframe.style.height = '100%';
    iframe.style.border = 'none';
    iframe.style.borderRadius = '12px';
    iframe.style.boxShadow = '0 8px 24px rgba(0,0,0,0.15)';
    iframe.allow = "microphone *; autoplay *";

    // --- Append to DOM ---
    iframeContainer.appendChild(iframe);
    widgetContainer.appendChild(iframeContainer);
    widgetContainer.appendChild(chatBubble);
    document.body.appendChild(widgetContainer);

    // --- Event Listeners ---
    function toggleIframe() {
        iframeVisible = !iframeVisible;
        if (iframeVisible) {
            iframeContainer.style.opacity = '1';
            iframeContainer.style.transform = 'translateY(0)';
            iframeContainer.style.pointerEvents = 'auto';
            chatBubble.innerHTML = `
                 <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M18 6 6 18"/><path d="m6 6 12 12"/>
                </svg>
            `;
        } else {
            iframeContainer.style.opacity = '0';
            iframeContainer.style.transform = 'translateY(20px)';
            iframeContainer.style.pointerEvents = 'none';
             chatBubble.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M2 10.5C2 9.72921 2.01346 8.97679 2.03909 8.2503C2.12282 5.87683 2.16469 4.69009 3.13007 3.71745C4.09545 2.74481 5.3157 2.6926 7.7562 2.58819C9.09517 2.5309 10.5209 2.5 12 2.5C13.4791 2.5 14.9048 2.5309 16.2438 2.58819C18.6843 2.6926 19.9046 2.74481 20.8699 3.71745C21.8353 4.69009 21.8772 5.87683 21.9609 8.2503C21.9865 8.97679 22 9.72921 22 10.5C22 11.2708 21.9865 12.0232 21.9609 12.7497C21.8772 15.1232 21.8353 16.3099 20.8699 17.2826C19.9046 18.2552 18.6843 18.3074 16.2437 18.4118C15.5098 18.4432 14.7498 18.4667 13.9693 18.4815C13.2282 18.4955 12.8576 18.5026 12.532 18.6266C12.2064 18.7506 11.9325 18.9855 11.3845 19.4553L9.20503 21.3242C9.07273 21.4376 8.90419 21.5 8.72991 21.5C8.32679 21.5 8 21.1732 8 20.7701V18.4219C7.91842 18.4186 7.83715 18.4153 7.75619 18.4118C5.31569 18.3074 4.09545 18.2552 3.13007 17.2825C2.16469 16.3099 2.12282 15.1232 2.03909 12.7497C2.01346 12.0232 2 11.2708 2 10.5Z"></path>
                </svg>
            `;
        }
    }

    chatBubble.addEventListener('click', toggleIframe);
    
    // Listen for messages from the iframe (e.g., to close)
    window.addEventListener('message', (event) => {
        if (event.data?.type === 'AV_WIDGET_CLOSE' && iframeVisible) {
            toggleIframe();
        }
    });

})();
