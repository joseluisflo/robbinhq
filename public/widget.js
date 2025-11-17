
document.addEventListener('DOMContentLoaded', function() {
    const scriptTag = document.currentScript;
    if (!scriptTag) {
        console.error("AgentVerse Widget: Script tag not found.");
        return;
    }

    const agentId = scriptTag.getAttribute('data-agent-id');
    const userId = scriptTag.getAttribute('data-user-id');
    const themeColor = scriptTag.getAttribute('data-theme-color') || '#16a34a';

    if (!agentId || !userId) {
        console.error("AgentVerse Widget: 'data-agent-id' and 'data-user-id' are required.");
        return;
    }

    // Create a container for our widget elements
    const widgetContainer = document.createElement('div');
    widgetContainer.id = 'agentverse-widget-container';
    document.body.appendChild(widgetContainer);

    // Create the iframe
    const iframe = document.createElement('iframe');
    iframe.id = 'agentverse-iframe';
    iframe.src = `${scriptTag.src.substring(0, scriptTag.src.indexOf('/widget.js'))}/widget/${userId}/${agentId}`;
    iframe.style.display = 'none';
    iframe.style.position = 'fixed';
    iframe.style.bottom = '100px';
    iframe.style.right = '20px';
    iframe.style.width = '400px';
    iframe.style.height = '650px';
    iframe.style.border = 'none';
    iframe.style.borderRadius = '16px';
    iframe.style.boxShadow = '0 10px 25px -5px rgba(0, 0, 0, 0.2), 0 8px 10px -6px rgba(0, 0, 0, 0.2)';
    iframe.style.zIndex = '9998';
    iframe.style.opacity = '0';
    iframe.style.transform = 'translateY(20px)';
    iframe.style.transition = 'opacity 0.3s ease, transform 0.3s ease';

    // Create the chat button
    const chatButton = document.createElement('button');
    chatButton.id = 'agentverse-chat-button';
    chatButton.style.position = 'fixed';
    chatButton.style.bottom = '20px';
    chatButton.style.right = '20px';
    chatButton.style.width = '60px';
    chatButton.style.height = '60px';
    chatButton.style.borderRadius = '50%';
    chatButton.style.backgroundColor = themeColor;
    chatButton.style.border = 'none';
    chatButton.style.color = 'white';
    chatButton.style.cursor = 'pointer';
    chatButton.style.boxShadow = '0 4px 8px rgba(0,0,0,0.2)';
    chatButton.style.display = 'flex';
    chatButton.style.alignItems = 'center';
    chatButton.style.justifyContent = 'center';
    chatButton.style.zIndex = '9999';
    chatButton.style.transition = 'transform 0.2s ease';

    const chatIconSVG = `
        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <path d="M12 1.75C13.4892 1.75 14.9255 1.78112 16.2754 1.83887L16.3418 1.8418C17.509 1.89169 18.4719 1.93277 19.2588 2.0918C20.0995 2.26171 20.7921 2.57464 21.4023 3.18945C22.6167 4.41312 22.6298 5.95045 22.71 8.22363C22.7359 8.95905 22.75 9.72053 22.75 10.5C22.75 11.2795 22.7359 12.0409 22.71 12.7764C22.6298 15.0495 22.6167 16.5869 21.4023 17.8105C20.7921 18.4254 20.0995 18.7383 19.2588 18.9082C18.4718 19.0672 17.5091 19.1083 16.3418 19.1582L16.2754 19.1611C15.5355 19.1928 14.7696 19.2165 13.9834 19.2314C13.1863 19.2466 12.9733 19.2607 12.7988 19.3271C12.6239 19.3938 12.4615 19.5198 11.873 20.0244L9.69336 21.8936C9.4251 22.1236 9.08286 22.25 8.72949 22.25C7.91249 22.2498 7.25022 21.5875 7.25 20.7705V19.1396C6.26419 19.0959 5.43456 19.0483 4.74121 18.9082C3.90049 18.7383 3.20788 18.4254 2.59766 17.8105C1.38331 16.5869 1.37023 15.0495 1.29004 12.7764C1.26409 12.0409 1.25 11.2795 1.25 10.5C1.25 9.72053 1.26409 8.95905 1.29004 8.22363C1.37023 5.95046 1.38331 4.41312 2.59766 3.18945C3.20788 2.57464 3.90049 2.26171 4.74121 2.0918C5.52815 1.93277 6.49097 1.89169 7.6582 1.8418L7.72461 1.83887C9.0745 1.78112 10.5108 1.75 12 1.75Z" fill="currentColor"></path>
        </svg>
    `;
    const closeIconSVG = `
        <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
        </svg>
    `;
    chatButton.innerHTML = chatIconSVG;

    // Append to container
    widgetContainer.appendChild(iframe);
    widgetContainer.appendChild(chatButton);

    let isOpen = false;

    function toggleChat() {
        isOpen = !isOpen;
        if (isOpen) {
            iframe.style.display = 'block';
            setTimeout(() => {
                iframe.style.opacity = '1';
                iframe.style.transform = 'translateY(0)';
            }, 10);
            chatButton.innerHTML = closeIconSVG;
            chatButton.style.transform = 'rotate(90deg)';
        } else {
            iframe.style.opacity = '0';
            iframe.style.transform = 'translateY(20px)';
            setTimeout(() => {
                iframe.style.display = 'none';
            }, 300);
            chatButton.innerHTML = chatIconSVG;
            chatButton.style.transform = 'rotate(0deg)';
        }
    }

    chatButton.addEventListener('click', toggleChat);
});
