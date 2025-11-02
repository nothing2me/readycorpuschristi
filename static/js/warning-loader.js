/**
 * Warning Loader
 * Loads existing warnings from the backend and displays them on the map
 */

class WarningLoader {
    constructor() {
        this.warnings = [];
    }

    /**
     * Load all warnings from the backend
     */
    async loadWarnings() {
        try {
            console.log('Loading warnings from /api/warnings/all...');
            const response = await fetch('/api/warnings/all');
            const data = await response.json();

            if (data.status === 'success') {
                this.warnings = data.warnings || [];
                console.log(`Loaded ${this.warnings.length} warnings from database`);
                if (this.warnings.length > 0) {
                    console.log('Sample warning:', this.warnings[0]);
                }
                // Only display warnings if the toggle is active
                const warningsToggle = document.getElementById('top-warnings-toggle');
                const isWarningsActive = warningsToggle ? warningsToggle.classList.contains('active') : false;
                if (isWarningsActive) {
                    this.displayWarnings();
                }
            } else {
                console.error('Failed to load warnings:', data.error);
            }
        } catch (error) {
            console.error('Error loading warnings:', error);
        }
    }

    /**
     * Display all warnings on the map
     */
    displayWarnings() {
        if (!window.mapManager || !window.mapManager.map) {
            console.warn('Map manager not available, cannot display warnings');
            return;
        }

        // Check if warnings toggle is active before displaying
        const warningsToggle = document.getElementById('top-warnings-toggle');
        const isWarningsActive = warningsToggle ? warningsToggle.classList.contains('active') : false;
        if (!isWarningsActive) {
            console.log('Warnings toggle is off, not displaying warnings');
            return;
        }

        console.log(`Displaying ${this.warnings.length} warnings on map...`);

        // Clear existing warning markers if any
        if (window.mapManager.warningMarkers) {
            window.mapManager.warningMarkers.forEach(marker => {
                window.mapManager.map.removeLayer(marker);
            });
            window.mapManager.warningMarkers = [];
        } else {
            window.mapManager.warningMarkers = [];
        }

        // Display each warning
        this.warnings.forEach(warning => {
            this.displayWarningMarker(warning);
        });
        
        console.log(`Successfully displayed ${window.mapManager.warningMarkers.length} warning markers`);
    }

    /**
     * Display a single warning marker on the map
     */
    displayWarningMarker(warningData) {
        if (!window.mapManager || !window.mapManager.map) {
            return;
        }

        // Determine icon and color based on warning type
        // Priority: fire > car-crash > road-closure > flood > weather > other
        let iconEmoji = '⚠️';
        let iconColor = '#888888'; // Default gray
        
        const types = warningData.types || [];
        
        if (types.includes('fire')) {
            iconEmoji = '🔥';
            iconColor = '#ff4444';
        } else if (types.includes('car-crash')) {
            iconEmoji = '🚗';
            iconColor = '#cc0000';
        } else if (types.includes('road-closure')) {
            iconEmoji = '🚧';
            iconColor = '#ff8800';
        } else if (types.includes('flood')) {
            iconEmoji = '💧';
            iconColor = '#0066ff';
        } else if (types.includes('weather')) {
            iconEmoji = '🌩️';
            iconColor = '#ffdd00';
        } else {
            // Check if it's an "other" type with custom text
            const otherType = types.find(type => 
                !['fire', 'car-crash', 'road-closure', 'flood', 'weather'].includes(type)
            );
            if (otherType) {
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

        const location = warningData.location || {};
        const lat = location.lat;
        const lng = location.lng;
        const locationName = location.name || `${lat}, ${lng}`;

        // Add warning marker
        const warningMarker = L.marker(
            [lat, lng],
            { icon: warningIcon }
        ).addTo(window.mapManager.map);

        // Bind popup with warning info
        let expiryText = '';
        if (warningData.expiry_time) {
            const expiryDate = new Date(warningData.expiry_time);
            expiryText = `<div style="font-size: 10px; color: #999; margin-top: 4px;">Expires: ${expiryDate.toLocaleString()}</div>`;
        }
        
        const popupContent = `
            <div style="padding: 5px;">
                <div style="font-weight: 600; margin-bottom: 8px;">${warningData.title || 'Warning'}</div>
                <div style="font-size: 12px; color: #666; margin-bottom: 8px;">${locationName}</div>
                <div style="font-size: 11px; color: #666; margin-bottom: 8px;">
                    Types: ${(warningData.types || []).join(', ')}
                </div>
                <div style="font-size: 10px; color: #999;">
                    Created: ${new Date(warningData.timestamp || warningData.created_at).toLocaleString()}
                </div>
                ${expiryText}
            </div>
        `;
        
        warningMarker.bindPopup(popupContent);

        // Store reference to warning markers
        if (!window.mapManager.warningMarkers) {
            window.mapManager.warningMarkers = [];
        }
        window.mapManager.warningMarkers.push(warningMarker);
    }
}

// Initialize and load warnings on page load
document.addEventListener('DOMContentLoaded', () => {
    window.warningLoader = new WarningLoader();
    
    // Wait for map to be initialized before loading warnings
    setTimeout(() => {
        if (window.mapManager && window.mapManager.map) {
            window.warningLoader.loadWarnings();
        } else {
            // Retry if map isn't ready yet
            const checkMap = setInterval(() => {
                if (window.mapManager && window.mapManager.map) {
                    clearInterval(checkMap);
                    window.warningLoader.loadWarnings();
                }
            }, 100);
            
            // Timeout after 5 seconds
            setTimeout(() => clearInterval(checkMap), 5000);
        }
    }, 500);
});

