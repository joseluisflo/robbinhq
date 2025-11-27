
(function() {
    // Check if the script is already running
    if (window.agentVerseWidget) {
        return;
    }
    window.agentVerseWidget = true;

    // --- Get user and agent IDs from the script tag ---
    const scriptTag = document.currentScript;
    const userId = scriptTag.getAttribute('data-user-id');
    const agentId = scriptTag.getAttribute('data-agent-id');
    const sessionId = `session-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;

    if (!userId || !agentId) {
        console.error("AgentVerse Widget: User ID or Agent ID is missing from the script tag.");
        return;
    }
    
    // Use the script's src to determine the base URL dynamically
    const scriptSrc = new URL(scriptTag.src);
    const baseUrl = scriptSrc.origin;

    // --- Create the main elements ---
    const bubbleButton = document.createElement('div');
    const iframeContainer = document.createElement('div');
    const iframe = document.createElement('iframe');

    // --- State ---
    let isOpen = false;

    // --- Styling ---
    const bubbleSize = '60px';
    const bubbleIcon = `
        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="color: white;">
            <path d="M12.0045 10.5H12.0135M16 10.5H16.009M8.009 10.5H8.01797"></path>
            <path d="M2 10.5C2 9.72921 2.01346 8.97679 2.03909 8.2503C2.12282 5.87683 2.16469 4.69009 3.13007 3.71745C4.09545 2.74481 5.3157 2.6926 7.7562 2.58819C9.09517 2.5309 10.5209 2.5 12 2.5C13.4791 2.5 14.9048 2.5309 16.2438 2.58819C18.6843 2.6926 19.9046 2.74481 20.8699 3.71745C21.8353 4.69009 21.8772 5.87683 21.9609 8.2503C21.9865 8.97679 22 9.72921 22 10.5C22 11.2708 21.9865 12.0232 21.9609 12.7497C21.8772 15.1232 21.8353 16.3099 20.8699 17.2826C19.9046 18.2552 18.6843 18.3074 16.2437 18.4118C15.5098 18.4432 14.7498 18.4667 13.9693 18.4815C13.2282 18.4955 12.8576 18.5026 12.532 18.6266C12.2064 18.7506 11.9325 18.9855 11.3845 19.4553L9.20503 21.3242C9.07273 21.4376 8.90419 21.5 8.72991 21.5C8.32679 21.5 8 21.1732 8 20.7701V18.4219C7.91842 18.4186 7.83715 18.4153 7.75619 18.4118C5.31569 18.3074 4.09545 18.2552 3.13007 17.2825C2.16469 16.3099 2.12282 15.1232 2.03909 12.7497C2.01346 12.0232 2 11.2708 2 10.5Z"></path>
        </svg>
    `;

    Object.assign(bubbleButton.style, {
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        width: bubbleSize,
        height: bubbleSize,
        backgroundColor: '#16a34a', // Default color, will be updated
        borderRadius: '50%',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
        transition: 'transform 0.2s ease',
        zIndex: '999998',
    });
    bubbleButton.innerHTML = bubbleIcon;
    
    Object.assign(iframeContainer.style, {
        position: 'fixed',
        bottom: '100px',
        right: '20px',
        width: '400px',
        height: '650px',
        boxShadow: '0 8px 24px rgba(0,0,0,0.2)',
        borderRadius: '16px',
        overflow: 'hidden',
        display: 'none',
        zIndex: '999999',
    });

    Object.assign(iframe.style, {
        width: '100%',
        height: '100%',
        border: 'none',
    });
    iframe.src = `${baseUrl}/widget/${userId}/${agentId}?sessionId=${sessionId}`;

    // --- Append to body ---
    iframeContainer.appendChild(iframe);
    document.body.appendChild(bubbleButton);
    document.body.appendChild(iframeContainer);
    
    // --- Fetch agent details to get theme ---
    fetch(`${baseUrl}/widget/${userId}/${agentId}/config`)
        .then(res => res.json())
        .then(data => {
            if (data.themeColor) {
                bubbleButton.style.backgroundColor = data.themeColor;
            }
        }).catch(err => console.error("Could not fetch agent config:", err));


    // --- Event Listeners ---
    const toggleWidget = () => {
        isOpen = !isOpen;
        iframeContainer.style.display = isOpen ? 'block' : 'none';
        if (isOpen) {
             iframe.contentWindow.postMessage({ type: 'AV_WIDGET_OPEN' }, '*');
        }
    };

    bubbleButton.addEventListener('click', toggleWidget);

    window.addEventListener('message', (event) => {
        // Close from within the iframe
        if (event.data?.type === 'AV_WIDGET_CLOSE') {
            if (isOpen) {
                toggleWidget();
            }
        }
    });

})();

