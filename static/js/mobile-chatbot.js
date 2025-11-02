// Mobile Chatbot JavaScript

class MobileChatbotManager {
    constructor() {
        this.messages = [];
        this.sessionId = 'mobile-' + Date.now();
        this.conversationHistory = [];
    }

    init() {
        const sendBtn = document.getElementById('mobile-send-chat-btn');
        const input = document.getElementById('mobile-chatbot-input');
        
        if (sendBtn) {
            sendBtn.addEventListener('click', () => this.sendMessage());
        }
        
        if (input) {
            input.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.sendMessage();
                }
            });
        }
        
        // Load initial greeting
        this.addMessage('bot', 'Hello! I\'m your AI Disaster Readiness Assistant. How can I help you prepare for emergencies today?');
    }

    async sendMessage() {
        const input = document.getElementById('mobile-chatbot-input');
        if (!input) return;
        
        const message = input.value.trim();
        if (!message) return;
        
        // Clear input
        input.value = '';
        
        // Add user message
        this.addMessage('user', message);
        
        try {
            // Get map context if available
            const context = {};
            if (window.mapManager && window.mapManager.map) {
                const center = window.mapManager.map.getCenter();
                context.map = {
                    lat: center.lat,
                    lng: center.lng,
                    zoom: window.mapManager.map.getZoom()
                };
            }
            
            // Send to chatbot API
            const response = await fetch('/api/chatbot/message', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    message: message,
                    context: context,
                    session_id: this.sessionId
                })
            });
            
            const data = await response.json();
            
            if (data.response) {
                this.addMessage('bot', data.response);
            } else if (data.error) {
                this.addMessage('bot', 'Sorry, I encountered an error: ' + data.error);
            }
        } catch (error) {
            console.error('Chatbot error:', error);
            this.addMessage('bot', 'Sorry, I encountered an error. Please try again.');
        }
    }

    addMessage(role, content) {
        const messagesContainer = document.getElementById('mobile-chatbot-messages');
        if (!messagesContainer) return;
        
        const messageDiv = document.createElement('div');
        messageDiv.className = `mobile-message ${role}`;
        
        const contentDiv = document.createElement('div');
        contentDiv.className = 'mobile-message-content';
        contentDiv.textContent = content;
        
        const timeDiv = document.createElement('div');
        timeDiv.className = 'mobile-message-time';
        timeDiv.textContent = new Date().toLocaleTimeString();
        
        messageDiv.appendChild(contentDiv);
        messageDiv.appendChild(timeDiv);
        messagesContainer.appendChild(messageDiv);
        
        // Scroll to bottom
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
        
        // Store message
        this.messages.push({ role, content, timestamp: new Date() });
    }
}

// Initialize mobile chatbot when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.mobileChatbotManager = new MobileChatbotManager();
    window.mobileChatbotManager.init();
});

