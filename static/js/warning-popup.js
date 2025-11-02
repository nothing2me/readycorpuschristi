/**
 * Warning Popup Manager
 * Handles warning creation popup for map markers
 */

class WarningPopupManager {
    constructor() {
        this.popup = document.getElementById('warning-popup-modal');
        this.closeBtn = document.getElementById('close-warning-popup-btn');
        this.cancelBtn = document.getElementById('cancel-warning-btn');
        this.submitBtn = document.getElementById('submit-warning-btn');
        this.titleInput = document.getElementById('warning-title');
        this.otherCheckbox = document.getElementById('warning-type-other');
        this.otherInputDiv = document.getElementById('warning-other-input');
        this.otherTextInput = document.getElementById('warning-other-text');
        this.expiryTimeInput = document.getElementById('warning-expiry-time');
        
        this.currentLat = null;
        this.currentLng = null;
        this.currentLocationName = null;
        
        this.init();
    }

    init() {
        // Close button
        if (this.closeBtn) {
            this.closeBtn.addEventListener('click', () => {
                this.closePopup();
            });
        }

        // Cancel button
        if (this.cancelBtn) {
            this.cancelBtn.addEventListener('click', () => {
                this.closePopup();
            });
        }

        // Submit button
        if (this.submitBtn) {
            this.submitBtn.addEventListener('click', () => {
                this.submitWarning();
            });
        }

        // Other checkbox toggle
        if (this.otherCheckbox) {
            this.otherCheckbox.addEventListener('change', () => {
                if (this.otherCheckbox.checked) {
                    this.otherInputDiv.style.display = 'block';
                    this.otherTextInput.focus();
                } else {
                    this.otherInputDiv.style.display = 'none';
                    this.otherTextInput.value = '';
                }
            });
        }

        // Close on background click
        if (this.popup) {
            this.popup.addEventListener('click', (e) => {
                if (e.target === this.popup) {
                    this.closePopup();
                }
            });
        }

        // Enter key in title input
        if (this.titleInput) {
            this.titleInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.submitWarning();
                }
            });
        }
    }

    openWarningPopup(lat, lng, locationName) {
        this.currentLat = lat;
        this.currentLng = lng;
        this.currentLocationName = locationName || `${lat}, ${lng}`;

        // Reset form
        if (this.titleInput) {
            this.titleInput.value = '';
        }
        
        // Uncheck all checkboxes
        const checkboxes = document.querySelectorAll('input[name="warning-type"]');
        checkboxes.forEach(cb => {
            cb.checked = false;
        });
        
        // Hide other input
        if (this.otherInputDiv) {
            this.otherInputDiv.style.display = 'none';
        }
        if (this.otherTextInput) {
            this.otherTextInput.value = '';
        }
        
        // Reset expiry time (default to 24 hours from now)
        if (this.expiryTimeInput) {
            const defaultExpiry = new Date();
            defaultExpiry.setHours(defaultExpiry.getHours() + 24);
            // Format as datetime-local string (YYYY-MM-DDTHH:mm)
            const year = defaultExpiry.getFullYear();
            const month = String(defaultExpiry.getMonth() + 1).padStart(2, '0');
            const day = String(defaultExpiry.getDate()).padStart(2, '0');
            const hours = String(defaultExpiry.getHours()).padStart(2, '0');
            const minutes = String(defaultExpiry.getMinutes()).padStart(2, '0');
            this.expiryTimeInput.value = `${year}-${month}-${day}T${hours}:${minutes}`;
        }

        // Show popup
        if (this.popup) {
            this.popup.classList.add('active');
            if (this.titleInput) {
                this.titleInput.focus();
            }
        }
    }

    closePopup() {
        if (this.popup) {
            this.popup.classList.remove('active');
        }
        this.currentLat = null;
        this.currentLng = null;
        this.currentLocationName = null;
    }

    async submitWarning() {
        // Get title
        const title = this.titleInput ? this.titleInput.value.trim() : '';
        
        if (!title) {
            alert('Please enter a warning title');
            return;
        }

        // Get selected warning types
        const selectedTypes = [];
        const checkboxes = document.querySelectorAll('input[name="warning-type"]:checked');
        
        checkboxes.forEach(cb => {
            if (cb.value === 'other') {
                const otherText = this.otherTextInput ? this.otherTextInput.value.trim() : '';
                if (otherText) {
                    selectedTypes.push(otherText);
                }
            } else {
                selectedTypes.push(cb.value);
            }
        });

        if (selectedTypes.length === 0) {
            alert('Please select at least one warning type');
            return;
        }

        // Get expiry time
        let expiryTime = null;
        if (this.expiryTimeInput && this.expiryTimeInput.value) {
            expiryTime = new Date(this.expiryTimeInput.value).toISOString();
        }

        // Create warning data
        const warningData = {
            title: title,
            types: selectedTypes,
            location: {
                lat: this.currentLat,
                lng: this.currentLng,
                name: this.currentLocationName
            },
            timestamp: new Date().toISOString()
        };
        
        // Add expiry_time if provided
        if (expiryTime) {
            warningData.expiry_time = expiryTime;
        }

        console.log('Warning submitted:', warningData);

        // Send to backend API for storage
        try {
            const response = await fetch('/api/warnings/create', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(warningData)
            });

            const data = await response.json();

            if (data.status === 'success') {
                // Add marker icon to map based on warning type (visual indicator)
                this.addWarningMarkerToMap(data.warning);
                alert(`Warning "${title}" added successfully at ${this.currentLocationName}`);
            } else {
                throw new Error(data.error || 'Failed to save warning');
            }
        } catch (error) {
            console.error('Error saving warning:', error);
            alert(`Failed to save warning: ${error.message}. Showing locally only.`);
            // Still show the marker locally even if save failed
            this.addWarningMarkerToMap(warningData);
        }

        // Close popup
        this.closePopup();
    }

    addWarningMarkerToMap(warningData) {
        if (!window.mapManager || !window.mapManager.map) {
            return;
        }

        // Determine icon and color based on warning type
        // Priority: fire > car-crash > road-closure > flood > weather > other
        let iconEmoji = '⚠️';
        let iconColor = '#888888'; // Default gray
        
        if (warningData.types.includes('fire')) {
            iconEmoji = '🔥';
            iconColor = '#ff4444';
        } else if (warningData.types.includes('car-crash')) {
            iconEmoji = '🚗';
            iconColor = '#cc0000';
        } else if (warningData.types.includes('road-closure')) {
            iconEmoji = '🚧';
            iconColor = '#ff8800';
        } else if (warningData.types.includes('flood')) {
            iconEmoji = '💧';
            iconColor = '#0066ff';
        } else if (warningData.types.includes('weather')) {
            iconEmoji = '🌩️';
            iconColor = '#ffdd00';
        } else {
            // Check if it's an "other" type with custom text
            const otherType = warningData.types.find(type => 
                !['fire', 'car-crash', 'road-closure', 'flood', 'weather'].includes(type)
            );
            if (otherType) {
                // Use first character of custom type or default
                iconEmoji = '⚠️';
                iconColor = '#888888';
            }
        }

        // Create custom icon with specific emoji for warning type
        const warningIcon = L.divIcon({
            className: 'warning-marker-icon',
            html: `<div style="background-color: ${iconColor}; width: 28px; height: 28px; border-radius: 50%; border: 2px solid white; box-shadow: 0 2px 6px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; font-size: 16px;">${iconEmoji}</div>`,
            iconSize: [28, 28],
            iconAnchor: [14, 14]
        });

        // Add warning marker
        const warningMarker = L.marker(
            [warningData.location.lat, warningData.location.lng],
            { icon: warningIcon }
        ).addTo(window.mapManager.map);

        // Bind popup with warning info
        let expiryText = '';
        if (warningData.expiry_time) {
            const expiryDate = new Date(warningData.expiry_time);
            expiryText = `<div style="font-size: 11px; color: #666; margin-top: 4px;">Expires: ${expiryDate.toLocaleString()}</div>`;
        }
        
        const popupContent = `
            <div style="padding: 5px;">
                <div style="font-weight: 600; margin-bottom: 8px;">${warningData.title}</div>
                <div style="font-size: 12px; color: #666; margin-bottom: 8px;">${warningData.location.name}</div>
                <div style="font-size: 11px; color: #666;">
                    Types: ${warningData.types.join(', ')}
                </div>
                ${expiryText}
            </div>
        `;
        
        warningMarker.bindPopup(popupContent).openPopup();

        // Store reference to warning markers
        if (!window.mapManager.warningMarkers) {
            window.mapManager.warningMarkers = [];
        }
        window.mapManager.warningMarkers.push(warningMarker);
        
        // Reload warnings after adding a new one (refresh the map)
        if (window.warningLoader) {
            setTimeout(() => {
                window.warningLoader.loadWarnings();
            }, 500);
        }
    }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    window.warningPopupManager = new WarningPopupManager();
});

