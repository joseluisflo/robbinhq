(function() {
    const scriptTag = document.currentScript;
    const userId = scriptTag.getAttribute('data-user-id');
    const agentId = scriptTag.getAttribute('data-agent-id');

    if (!userId || !agentId) {
        console.error("AgentVerse Widget: data-user-id and data-agent-id attributes are required.");
        return;
    }

    // FIX: URL absoluta a tu dominio
    const iframeSrc = `https://tryrobbin.com/widget/${userId}/${agentId}`;
    let isWidgetOpen = false;

    // Create a container for the widget elements
    const widgetContainer = document.createElement('div');
    widgetContainer.id = 'agentverse-widget-container';
    document.body.appendChild(widgetContainer);

    // --- Create Bubble ---
    const bubble = document.createElement('button');
    bubble.id = 'agentverse-bubble';
    bubble.style.position = 'fixed';
    bubble.style.bottom = '20px';
    bubble.style.right = '20px';
    bubble.style.width = '60px';
    bubble.style.height = '60px';
    bubble.style.borderRadius = '50%';
    bubble.style.backgroundColor = '#16a34a'; // Default color, will be fetched from agent config
    bubble.style.border = 'none';
    bubble.style.cursor = 'pointer';
    bubble.style.boxShadow = '0 4px 16px rgba(0,0,0,0.2)';
    bubble.style.display = 'flex';
    bubble.style.alignItems = 'center';
    bubble.style.justifyContent = 'center';
    bubble.style.transition = 'transform 0.2s ease-out, opacity 0.3s';
    bubble.style.zIndex = '9998';

    // SVG Icon for the bubble
    const bubbleIconSVG = `
        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
        </svg>
    `;
    bubble.innerHTML = bubbleIconSVG;
    widgetContainer.appendChild(bubble);

    // --- Create Iframe ---
    const iframe = document.createElement('iframe');
    iframe.id = 'agentverse-widget-iframe';
    iframe.src = iframeSrc;
    iframe.style.position = 'fixed';
    iframe.style.bottom = '100px';
    iframe.style.right = '20px';
    iframe.style.width = '400px';
    iframe.style.height = '650px';
    iframe.style.border = 'none';
    iframe.style.borderRadius = '16px';
    iframe.style.boxShadow = '0 8px 32px rgba(0,0,0,0.2)';
    iframe.style.display = 'none';
    iframe.style.opacity = '0';
    iframe.style.transform = 'translateY(20px)';
    iframe.style.transition = 'opacity 0.3s ease-out, transform 0.3s ease-out';
    iframe.style.zIndex = '9999';
    
    // FIX: Permisos necesarios para micrófono y autoplay
    iframe.allow = "microphone *; autoplay *";
    
    widgetContainer.appendChild(iframe);

    // --- Toggle Functionality ---
    function toggleWidget() {
        isWidgetOpen = !isWidgetOpen;
        if (isWidgetOpen) {
            iframe.style.display = 'block';
            setTimeout(() => {
                iframe.style.opacity = '1';
                iframe.style.transform = 'translateY(0)';
            }, 10); // Short delay to allow display property to apply for transition
            bubble.style.transform = 'scale(0.9)';
        } else {
            iframe.style.opacity = '0';
            iframe.style.transform = 'translateY(20px)';
            setTimeout(() => {
                iframe.style.display = 'none';
            }, 300); // Wait for transition to finish
            bubble.style.transform = 'scale(1)';
        }
    }

    bubble.addEventListener('click', toggleWidget);

    // --- Communication with Iframe ---
    window.addEventListener('message', (event) => {
        // FIX: Verificar que el mensaje viene de tu dominio para seguridad
        if (event.origin !== 'https://tryrobbin.com') return;
        
        if (event.data?.type === 'AV_WIDGET_CLOSE') {
            if (isWidgetOpen) {
                toggleWidget();
            }
        }
        
        if (event.data?.type === 'AV_WIDGET_READY') {
             // You could fetch agent-specific styles here if needed
        }
    });

})();