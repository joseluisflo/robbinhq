(function() {
    const scriptTag = document.currentScript;
    const userId = scriptTag.getAttribute('data-user-id');
    const agentId = scriptTag.getAttribute('data-agent-id');

    if (!userId || !agentId) {
        console.error('AgentVerse Widget: User ID or Agent ID is missing.');
        return;
    }

    let iframe;
    let chatBubble;
    let widgetContainer;
    let isWidgetOpen = false;
    let widgetConfig = {};

    function createStyles() {
        const style = document.createElement('style');
        style.textContent = `
            .av-widget-container {
                position: fixed;
                bottom: 20px;
                right: 20px;
                z-index: 9999;
                width: 400px;
                height: 650px;
                max-width: 90vw;
                max-height: 80vh;
                display: none;
                flex-direction: column;
                transition: opacity 0.3s ease-in-out, transform 0.3s ease-in-out;
                opacity: 0;
                transform: translateY(20px);
            }
            .av-widget-container.open {
                display: flex;
                opacity: 1;
                transform: translateY(0);
            }
            .av-iframe {
                width: 100%;
                height: 100%;
                border: none;
                border-radius: 1rem;
                box-shadow: 0 10px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04);
            }
            .av-chat-bubble-button {
                position: fixed;
                bottom: 20px;
                right: 20px;
                width: 60px;
                height: 60px;
                border-radius: 50%;
                background-color: #16a34a; /* Default color */
                border: none;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                box-shadow: 0 4px 8px rgba(0,0,0,0.2);
                z-index: 9998;
                transition: transform 0.2s ease-in-out, background-color 0.3s;
            }
            .av-chat-bubble-button:hover {
                transform: scale(1.1);
            }
            .av-chat-bubble-button svg {
                width: 32px;
                height: 32px;
                color: white;
            }
             .av-chat-bubble-button.hidden {
                display: none;
            }
        `;
        document.head.appendChild(style);
    }
    
    function createIframe() {
        widgetContainer = document.createElement('div');
        widgetContainer.className = 'av-widget-container';

        iframe = document.createElement('iframe');
        iframe.src = `${window.location.origin}/widget/${userId}/${agentId}`;
        iframe.className = 'av-iframe';
        iframe.allow = "microphone";
        
        widgetContainer.appendChild(iframe);
        document.body.appendChild(widgetContainer);
    }

    function createChatBubble() {
        chatBubble = document.createElement('button');
        chatBubble.className = 'av-chat-bubble-button';
        chatBubble.innerHTML = `
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M12.0045 10.5H12.0135M16 10.5H16.009M8.009 10.5H8.01797"></path>
                <path d="M2 10.5C2 9.72921 2.01346 8.97679 2.03909 8.2503C2.12282 5.87683 2.16469 4.69009 3.13007 3.71745C4.09545 2.74481 5.3157 2.6926 7.7562 2.58819C9.09517 2.5309 10.5209 2.5 12 2.5C13.4791 2.5 14.9048 2.5309 16.2438 2.58819C18.6843 2.6926 19.9046 2.74481 20.8699 3.71745C21.8353 4.69009 21.8772 5.87683 21.9609 8.2503C21.9865 8.97679 22 9.72921 22 10.5C22 11.2708 21.9865 12.0232 21.9609 12.7497C21.8772 15.1232 21.8353 16.3099 20.8699 17.2826C19.9046 18.2552 18.6843 18.3074 16.2437 18.4118C15.5098 18.4432 14.7498 18.4667 13.9693 18.4815C13.2282 18.4955 12.8576 18.5026 12.532 18.6266C12.2064 18.7506 11.9325 18.9855 11.3845 19.4553L9.20503 21.3242C9.07273 21.4376 8.90419 21.5 8.72991 21.5C8.32679 21.5 8 21.1732 8 20.7701V18.4219C7.91842 18.4186 7.83715 18.4153 7.75619 18.4118C5.31569 18.3074 4.09545 18.2552 3.13007 17.2825C2.16469 16.3099 2.12282 15.1232 2.03909 12.7497C2.01346 12.0232 2 11.2708 2 10.5Z"></path>
            </svg>
        `;
        document.body.appendChild(chatBubble);

        chatBubble.addEventListener('click', toggleWidget);
    }

    function toggleWidget() {
        isWidgetOpen = !isWidgetOpen;
        if (isWidgetOpen) {
            widgetContainer.classList.add('open');
            chatBubble.classList.add('hidden');
            iframe.contentWindow.postMessage({ type: 'AV_WIDGET_OPEN' }, '*');
        } else {
            widgetContainer.classList.remove('open');
            chatBubble.classList.remove('hidden');
        }
    }

    function handleMessage(event) {
        // We only care about messages from our iframe
        if (event.source !== iframe.contentWindow) {
            return;
        }

        if (event.data?.type === 'AV_WIDGET_CLOSE') {
            toggleWidget();
        }
        
        if (event.data?.type === 'AV_WIDGET_CONFIG') {
            widgetConfig = event.data.payload;
            if (chatBubble && widgetConfig.chatButtonColor) {
                chatBubble.style.backgroundColor = widgetConfig.chatButtonColor;
            }
        }
    }

    window.addEventListener('message', handleMessage);

    // Initialize
    createStyles();
    createChatBubble();
    createIframe();
})();
