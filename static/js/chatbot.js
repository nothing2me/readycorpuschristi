/**
 * Chatbot management module
 * Handles AI chatbot interactions and message display
 */

class ChatbotManager {
    constructor() {
        this.messagesContainer = document.getElementById('chatbot-messages');
        this.input = document.getElementById('chatbot-input');
        this.sendButton = document.getElementById('send-chat-btn');
        this.MESSAGE_LENGTH_THRESHOLD = 500; // Characters - messages longer than this will show in popup
        this.messagePopup = null;
        
        this.init();
    }

    /**
     * Initialize chatbot event listeners
     */
    init() {
        // Send button click
        this.sendButton.addEventListener('click', () => {
            this.sendMessage();
        });

        // Enter key press
        this.input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.sendMessage();
            }
        });

        // Add welcome message
        this.addBotMessage('Hello! I\'m your AI assistant. How can I help you today?');
    }

    /**
     * Send a message to the chatbot
     */
    async sendMessage() {
        const message = this.input.value.trim();
        
        if (!message) {
            return;
        }

        // Display user message
        this.addUserMessage(message);
        
        // Clear input
        this.input.value = '';

        // Show loading indicator
        const loadingId = this.addLoadingMessage();

        try {
            // Get map context if available
            const context = this.getMapContext();

            // Send to chatbot API
            const response = await fetch('/api/chatbot/message', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    message: message,
                    context: context
                })
            });

            const data = await response.json();

            // Remove loading indicator
            this.removeMessage(loadingId);

            if (data.status === 'success') {
                // Display bot response
                this.addBotMessage(data.response);
            } else {
                throw new Error(data.error || 'Failed to get response');
            }
        } catch (error) {
            // Remove loading indicator
            this.removeMessage(loadingId);
            
            // Display error message
            this.addBotMessage(`Sorry, I encountered an error: ${error.message}`, true);
            console.error('Chatbot error:', error);
        }
    }

    /**
     * Get map context for chatbot (current location, flood zone, etc.)
     */
    getMapContext() {
        // Get context from map manager if available
        if (window.mapManager) {
            const context = {};
            
            // Use currentLocation if available (most complete data)
            if (window.mapManager.currentLocation) {
                const loc = window.mapManager.currentLocation;
                context.location = {
                    lat: loc.lat,
                    lng: loc.lng
                };
                
                if (loc.address) {
                    context.address = loc.address;
                }
                
                // Include flood zone information if available
                if (loc.floodZone) {
                    context.floodZone = {
                        name: loc.floodZone.name,
                        title: loc.floodZone.title,
                        riskLevel: loc.floodZone.riskLevel,
                        floodType: loc.floodZone.floodType,
                        floodChance: loc.floodZone.floodChance,
                        insurance: loc.floodZone.insurance
                    };
                }
            } else if (window.mapManager.currentMarker) {
                // Fallback to marker if currentLocation not set
                const marker = window.mapManager.currentMarker;
                const latlng = marker.getLatLng();
                
                context.location = {
                    lat: latlng.lat,
                    lng: latlng.lng
                };
                
                // Try to detect flood zone at marker location
                if (window.floodZoneManager) {
                    const zone = window.floodZoneManager.getZoneAtPoint(latlng.lat, latlng.lng, false);
                    if (zone) {
                        const zoneInfo = window.floodZoneManager.getZoneInfo(zone.name);
                        context.floodZone = {
                            name: zone.name,
                            title: zoneInfo.title,
                            riskLevel: zoneInfo.riskLevel,
                            floodType: zoneInfo.floodType,
                            floodChance: zoneInfo.floodChance,
                            insurance: zoneInfo.insurance
                        };
                    }
                }
            }
            
            // Add map center
            const center = window.mapManager.getCenter();
            if (center) {
                context.mapCenter = {
                    lat: center.lat,
                    lng: center.lng
                };
            }
            
            // Include address if available (fallback)
            if (!context.address && window.mapManager.currentAddress) {
                context.address = window.mapManager.currentAddress;
            }
            
            // Also check address input field as fallback
            const addressInput = document.getElementById('address-input');
            if (addressInput && addressInput.value.trim() && !context.address) {
                context.address = addressInput.value.trim();
            }
            
            return context;
        }
        
        // Fallback: check address input field even without marker
        const addressInput = document.getElementById('address-input');
        if (addressInput && addressInput.value.trim()) {
            return {
                address: addressInput.value.trim()
            };
        }
        
        return {};
    }

    /**
     * Add a user message to the chat
     */
    addUserMessage(message) {
        const messageElement = this.createMessageElement(message, 'user');
        this.messagesContainer.appendChild(messageElement);
        this.scrollToBottom();
    }


    /**
     * Add a loading message indicator
     */
    addLoadingMessage() {
        const loadingId = 'loading-' + Date.now();
        const messageElement = document.createElement('div');
        messageElement.id = loadingId;
        messageElement.className = 'message bot loading';
        messageElement.innerHTML = '<div class="message-content">Thinking...</div>';
        this.messagesContainer.appendChild(messageElement);
        this.scrollToBottom();
        return loadingId;
    }

    /**
     * Remove a message by ID
     */
    removeMessage(messageId) {
        const message = document.getElementById(messageId);
        if (message) {
            message.remove();
        }
    }

    /**
     * Check if message is too long for inline display
     */
    isLongMessage(text) {
        return text.length > this.MESSAGE_LENGTH_THRESHOLD;
    }

    /**
     * Create a message element
     */
    createMessageElement(text, type, isError = false, metadata = null) {
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${type}`;
        
        if (isError) {
            messageDiv.classList.add('error');
        }

        // Check if message is too long (only for bot messages)
        const isLong = type === 'bot' && this.isLongMessage(text);
        const messageId = 'msg-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);

        if (isLong) {
            // Show preview and "Show Message" button for long messages
            const previewText = text.substring(0, this.MESSAGE_LENGTH_THRESHOLD) + '...';
            
            const contentDiv = document.createElement('div');
            contentDiv.className = 'message-content';
            contentDiv.textContent = previewText;

            const showButton = document.createElement('button');
            showButton.className = 'show-message-btn';
            showButton.textContent = 'Show Full Message';
            const self = this;
            showButton.onclick = function() {
                const fullText = messageDiv.getAttribute('data-full-message');
                const msgMetadata = messageDiv.getAttribute('data-message-metadata');
                const msgMeta = msgMetadata ? JSON.parse(msgMetadata) : null;
                self.openMessagePopup(fullText, messageId, msgMeta);
            };

            const buttonContainer = document.createElement('div');
            buttonContainer.className = 'message-actions';
            buttonContainer.appendChild(showButton);
            
            messageDiv.appendChild(contentDiv);
            messageDiv.appendChild(buttonContainer);
        } else {
            // Normal message display
            const contentDiv = document.createElement('div');
            contentDiv.className = 'message-content';
            contentDiv.textContent = text;
            messageDiv.appendChild(contentDiv);
        }

        const timeDiv = document.createElement('div');
        timeDiv.className = 'message-time';
        timeDiv.textContent = new Date().toLocaleTimeString();
        messageDiv.appendChild(timeDiv);

        // Add download button for safety evaluation responses
        if (type === 'bot' && metadata && metadata.isSafetyEvaluation) {
            const downloadBtn = document.createElement('button');
            downloadBtn.className = 'download-pdf-btn';
            downloadBtn.textContent = '📥 Download PDF Report';
            const self = this;
            downloadBtn.onclick = function(e) {
                self.downloadSafetyEvaluationPDF(metadata, e);
            };
            
            const buttonContainer = messageDiv.querySelector('.message-actions') || document.createElement('div');
            if (!messageDiv.querySelector('.message-actions')) {
                buttonContainer.className = 'message-actions';
                messageDiv.appendChild(buttonContainer);
            }
            buttonContainer.appendChild(downloadBtn);
        }

        // Store full message text as data attribute for reopening
        messageDiv.setAttribute('data-full-message', text);
        messageDiv.setAttribute('data-message-id', messageId);
        if (metadata) {
            messageDiv.setAttribute('data-message-metadata', JSON.stringify(metadata));
        }

        return messageDiv;
    }

    /**
     * Open message popup for long messages
     */
    openMessagePopup(text, messageId, metadata = null) {
        // Remove existing popup if any
        if (this.messagePopup) {
            this.messagePopup.remove();
        }

        // Create popup
        const popup = document.createElement('div');
        popup.className = 'message-popup';
        popup.id = 'message-popup';

        const popupContent = document.createElement('div');
        popupContent.className = 'message-popup-content';

        const popupHeader = document.createElement('div');
        popupHeader.className = 'message-popup-header';
        popupHeader.innerHTML = `
            <h3>Full Message</h3>
            <button class="close-message-popup" id="close-message-popup">&times;</button>
        `;

        const popupBody = document.createElement('div');
        popupBody.className = 'message-popup-body';
        popupBody.textContent = text; // textContent is safe

        const popupActions = document.createElement('div');
        popupActions.className = 'message-popup-actions';

        // Add download PDF button if it's a safety evaluation
        if (metadata && metadata.isSafetyEvaluation) {
            const downloadBtn = document.createElement('button');
            downloadBtn.className = 'download-pdf-btn';
            downloadBtn.textContent = 'Download PDF Report';
            downloadBtn.onclick = (e) => {
                this.downloadSafetyEvaluationPDF(metadata, e);
            };
            popupActions.appendChild(downloadBtn);
        }

        popupContent.appendChild(popupHeader);
        popupContent.appendChild(popupBody);
        popupContent.appendChild(popupActions);
        popup.appendChild(popupContent);

        document.body.appendChild(popup);
        this.messagePopup = popup;

        // Close button handler
        document.getElementById('close-message-popup').addEventListener('click', () => {
            this.closeMessagePopup();
        });

        // Close on background click
        popup.addEventListener('click', (e) => {
            if (e.target === popup) {
                this.closeMessagePopup();
            }
        });

        // Close on Escape key
        const escapeHandler = (e) => {
            if (e.key === 'Escape') {
                this.closeMessagePopup();
                document.removeEventListener('keydown', escapeHandler);
            }
        };
        document.addEventListener('keydown', escapeHandler);
    }

    /**
     * Close message popup
     */
    closeMessagePopup() {
        if (this.messagePopup) {
            this.messagePopup.remove();
            this.messagePopup = null;
        }
    }

    /**
     * Add a bot message to the chat (with optional metadata)
     */
    addBotMessage(message, isError = false, metadata = null) {
        const messageElement = this.createMessageElement(message, 'bot', isError, metadata);
        this.messagesContainer.appendChild(messageElement);
        this.scrollToBottom();
    }

    /**
     * Download safety evaluation as PDF
     */
    async downloadSafetyEvaluationPDF(metadata, event) {
        try {
            const downloadBtn = event ? event.target : null;
            if (downloadBtn) {
                downloadBtn.disabled = true;
                downloadBtn.textContent = 'Generating PDF...';
            }

            const response = await fetch('/api/chatbot/download-pdf', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    evaluation_response: metadata.response,
                    zipcode: metadata.zipcode || 'Unknown',
                    stats: metadata.stats || {},
                    evaluation_data: metadata.evaluation_data || null
                })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            // Get PDF blob
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            
            // Create download link
            const a = document.createElement('a');
            a.href = url;
            a.download = `safety_evaluation_${metadata.zipcode || 'report'}_${new Date().toISOString().split('T')[0]}.pdf`;
            document.body.appendChild(a);
            a.click();
            
            // Cleanup
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
            
            if (downloadBtn) {
                downloadBtn.disabled = false;
                downloadBtn.textContent = 'Download PDF Report';
            }
            
            // Show success message
            this.addBotMessage('PDF report downloaded successfully!', false);
        } catch (error) {
            console.error('PDF download error:', error);
            this.addBotMessage(`Error downloading PDF: ${error.message}`, true);
            if (downloadBtn) {
                downloadBtn.disabled = false;
                downloadBtn.textContent = 'Download PDF Report';
            }
        }
    }

    /**
     * Scroll to bottom of messages
     */
    scrollToBottom() {
        this.messagesContainer.scrollTop = this.messagesContainer.scrollHeight;
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ChatbotManager;
}

