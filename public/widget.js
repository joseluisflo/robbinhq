
(function() {
    // Use a unique name to avoid conflicts
    const WIDGET_NAMESPACE = 'AgentVerseWidget';

    if (window[WIDGET_NAMESPACE]) {
        console.warn('AgentVerse widget is already loaded.');
        return;
    }

    class AgentVerseWidget {
        constructor() {
            this.iframe = null;
            this.chatButton = null;
            this.isOpen = false;
            this.init();
        }

        init() {
            const scriptTag = document.currentScript;
            if (!scriptTag) {
                console.error('AgentVerse widget: Could not find the script tag.');
                return;
            }

            const agentId = scriptTag.getAttribute('data-agent-id');
            const userId = scriptTag.getAttribute('data-user-id');

            if (!agentId || !userId) {
                console.error('AgentVerse widget: data-agent-id and data-user-id are required.');
                return;
            }
            
            const baseUrl = scriptTag.src.replace('/widget.js', '');

            this.createChatButton();
            this.createIframe(baseUrl, userId, agentId);

            document.body.appendChild(this.chatButton);
            document.body.appendChild(this.iframe);

            window.addEventListener('message', this.handleMessage.bind(this));
        }

        createChatButton() {
            this.chatButton = document.createElement('button');
            this.chatButton.setAttribute('id', 'agentverse-chat-button');
            this.chatButton.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M12.0045 10.5H12.0135M16 10.5H16.009M8.009 10.5H8.01797"></path>
                    <path d="M2 10.5C2 9.72921 2.01346 8.97679 2.03909 8.2503C2.12282 5.87683 2.16469 4.69009 3.13007 3.71745C4.09545 2.74481 5.3157 2.6926 7.7562 2.58819C9.09517 2.5309 10.5209 2.5 12 2.5C13.4791 2.5 14.9048 2.5309 16.2438 2.58819C18.6843 2.6926 19.9046 2.74481 20.8699 3.71745C21.8353 4.69009 21.8772 5.87683 21.9609 8.2503C21.9865 8.97679 22 9.72921 22 10.5C22 11.2708 21.9865 12.0232 21.9609 12.7497C21.8772 15.1232 21.8353 16.3099 20.8699 17.2826C19.9046 18.2552 18.6843 18.3074 16.2437 18.4118C15.5098 18.4432 14.7498 18.4667 13.9693 18.4815C13.2282 18.4955 12.8576 18.5026 12.532 18.6266C12.2064 18.7506 11.9325 18.9855 11.3845 19.4553L9.20503 21.3242C9.07273 21.4376 8.90419 21.5 8.72991 21.5C8.32679 21.5 8 21.1732 8 20.7701V18.4219C7.91842 18.4186 7.83715 18.4153 7.75619 18.4118C5.31569 18.3074 4.09545 18.2552 3.13007 17.2825C2.16469 16.3099 2.12282 15.1232 2.03909 12.7497C2.01346 12.0232 2 11.2708 2 10.5Z" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path>
                </svg>
            `;
            this.chatButton.style.cssText = `
                position: fixed;
                bottom: 20px;
                right: 20px;
                width: 56px;
                height: 56px;
                border-radius: 50%;
                background-color: #16a34a; /* Default color */
                color: white;
                border: none;
                cursor: pointer;
                display: flex;
                align-items: center;
                justify-content: center;
                box-shadow: 0 4px 8px rgba(0,0,0,0.2);
                z-index: 9998;
                transition: transform 0.2s ease-in-out, background-color 0.3s;
            `;
            this.chatButton.addEventListener('click', this.toggleChat.bind(this));
        }

        createIframe(baseUrl, userId, agentId) {
            this.iframe = document.createElement('iframe');
            this.iframe.setAttribute('id', 'agentverse-chat-iframe');
            this.iframe.src = `${baseUrl}/widget/${userId}/${agentId}`;
            this.iframe.style.cssText = `
                position: fixed;
                bottom: 90px;
                right: 20px;
                width: 400px;
                height: 650px;
                border: none;
                border-radius: 1rem;
                box-shadow: 0 8px 24px rgba(0,0,0,0.15);
                display: none;
                z-index: 9999;
                overflow: hidden;
                transition: opacity 0.3s ease, transform 0.3s ease;
                opacity: 0;
                transform: translateY(20px);
            `;
        }

        toggleChat() {
            this.isOpen = !this.isOpen;
            if (this.isOpen) {
                this.iframe.style.display = 'block';
                setTimeout(() => {
                    this.iframe.style.opacity = '1';
                    this.iframe.style.transform = 'translateY(0)';
                }, 10);
            } else {
                this.iframe.style.opacity = '0';
                this.iframe.style.transform = 'translateY(20px)';
                setTimeout(() => {
                    this.iframe.style.display = 'none';
                }, 300);
            }
        }
        
        handleMessage(event) {
            if (!this.iframe || event.source !== this.iframe.contentWindow) {
                return;
            }

            if (event.data.type === 'WIDGET_CONFIG') {
                const { chatButtonColor } = event.data.payload;
                if (chatButtonColor) {
                    this.chatButton.style.backgroundColor = chatButtonColor;
                }
            }
        }
    }

    window[WIDGET_NAMESPACE] = new AgentVerseWidget();
})();
