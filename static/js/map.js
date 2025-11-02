/**
 * Map management module using Leaflet
 * Handles map initialization, geocoding, and location display
 */

class MapManager {
    constructor() {
        this.map = null;
        this.markers = [];
        this.currentMarker = null;
        this.currentAddress = null; // Store current selected address
        this.currentLocation = null; // Store current location data {lat, lng, address, floodZone}
        this.currentFloodZone = null; // Store current flood zone info
    }

    /**
     * Initialize the map
     */
    init() {
        // Initialize map centered on a default location (e.g., Corpus Christi)
        this.map = L.map('map-area').setView([27.8006, -97.3964], 13);

        // Add OpenStreetMap tile layer
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '© OpenStreetMap contributors',
            maxZoom: 19
        }).addTo(this.map);

        // Handle map clicks for reverse geocoding
        this.map.on('click', (e) => {
            this.handleMapClick(e.latlng.lat, e.latlng.lng);
        });
    }

    /**
     * Geocode an address and display it on the map
     */
    async geocodeAddress(address) {
        try {
            const response = await fetch('/api/map/geocode', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ address: address })
            });

            const data = await response.json();

            if (data.status === 'success' && data.result.lat && data.result.lng) {
                const { lat, lng, display_name } = data.result;
                
                // Store the address
                this.currentAddress = display_name || address;
                
                // Detect flood zone at this location
                const floodZone = this.getFloodZoneAtLocation(lat, lng);
                this.currentFloodZone = floodZone;
                
                // Store current location data
                this.currentLocation = {
                    lat: lat,
                    lng: lng,
                    address: this.currentAddress,
                    floodZone: floodZone
                };
                
                // Remove existing marker
                if (this.currentMarker) {
                    this.map.removeLayer(this.currentMarker);
                }

                // Create popup content with address, flood zone, and "Add Warning" button
                const popupContent = this.createMarkerPopupContent(this.currentAddress, lat, lng, floodZone);
                
                // Add new marker
                this.currentMarker = L.marker([lat, lng])
                    .addTo(this.map)
                    .bindPopup(popupContent, {
                        maxWidth: 350,
                        className: 'custom-popup'
                    })
                    .openPopup();

                // Auto-close popup after 10 seconds (enough time to read address/interact)
                if (this.currentMarker.popupTimeout) {
                    clearTimeout(this.currentMarker.popupTimeout);
                }
                this.currentMarker.popupTimeout = setTimeout(() => {
                    if (this.currentMarker && this.currentMarker.isPopupOpen()) {
                        this.currentMarker.closePopup();
                    }
                }, 10000);

                // Clear timeout if popup is manually closed
                this.currentMarker.on('popupclose', () => {
                    if (this.currentMarker && this.currentMarker.popupTimeout) {
                        clearTimeout(this.currentMarker.popupTimeout);
                        this.currentMarker.popupTimeout = null;
                    }
                });

                // Center map on the location
                this.map.setView([lat, lng], 15);

                return { lat, lng, display_name: this.currentAddress, floodZone: floodZone };
            } else {
                throw new Error(data.result?.error || 'Geocoding failed');
            }
        } catch (error) {
            console.error('Geocoding error:', error);
            throw error;
        }
    }

    /**
     * Detect flood zone at a given location (only if zones are active)
     */
    getFloodZoneAtLocation(lat, lng) {
        if (window.floodZoneManager) {
            // First check if any zones are actually displayed/active
            const zoneCheckboxes = document.querySelectorAll('.zone-checkbox');
            const hasActiveZones = Array.from(zoneCheckboxes).some(checkbox => checkbox.checked && !checkbox.disabled);
            
            // Only check for zones if zones are active
            if (!hasActiveZones) {
                return null;
            }
            
            const zone = window.floodZoneManager.getZoneAtPoint(lat, lng, false);
            if (zone) {
                // Double-check that this zone's overlay is actually on the map
                const overlay = window.floodZoneManager.overlays.get(zone.id);
                if (!overlay || overlay._map === null) {
                    // Zone exists but overlay is not displayed
                    return null;
                }
                
                const zoneInfo = window.floodZoneManager.getZoneInfo(zone.name);
                return {
                    id: zone.id,
                    name: zone.name,
                    title: zoneInfo.title,
                    riskLevel: zoneInfo.riskLevel,
                    floodType: zoneInfo.floodType,
                    floodChance: zoneInfo.floodChance,
                    insurance: zoneInfo.insurance,
                    color: zoneInfo.color
                };
            }
        }
        return null;
    }

    /**
     * Create popup content for marker with "Add Warning" button
     */
    createMarkerPopupContent(displayName, lat, lng, floodZone = null) {
        const container = document.createElement('div');
        container.className = 'marker-popup-content';
        
        const addressDiv = document.createElement('div');
        addressDiv.className = 'marker-address';
        addressDiv.textContent = displayName;
        container.appendChild(addressDiv);
        
        // Add flood zone information if available
        if (floodZone) {
            const zoneDiv = document.createElement('div');
            zoneDiv.className = 'marker-flood-zone';
            zoneDiv.style.marginTop = '8px';
            zoneDiv.style.padding = '8px';
            zoneDiv.style.backgroundColor = floodZone.color + '20'; // Add transparency
            zoneDiv.style.borderLeft = `3px solid ${floodZone.color}`;
            zoneDiv.style.borderRadius = '4px';
            
            const zoneTitle = document.createElement('div');
            zoneTitle.style.fontWeight = 'bold';
            zoneTitle.style.color = floodZone.color;
            zoneTitle.textContent = `📍 ${floodZone.title}`;
            zoneDiv.appendChild(zoneTitle);
            
            const zoneDetails = document.createElement('div');
            zoneDetails.style.fontSize = '12px';
            zoneDetails.style.marginTop = '4px';
            zoneDetails.style.color = '#666';
            zoneDetails.innerHTML = `
                <div><strong>Risk Level:</strong> ${floodZone.riskLevel}</div>
                <div><strong>Flood Type:</strong> ${floodZone.floodType}</div>
                <div><strong>Chance:</strong> ${floodZone.floodChance}</div>
                ${floodZone.insurance ? `<div style="color: #cc0000; font-weight: bold; margin-top: 4px;">${floodZone.insurance}</div>` : ''}
            `;
            zoneDiv.appendChild(zoneDetails);
            
            container.appendChild(zoneDiv);
        }
        
        const buttonDiv = document.createElement('div');
        buttonDiv.className = 'marker-actions';
        buttonDiv.style.marginTop = '8px';
        
        const addWarningBtn = document.createElement('button');
        addWarningBtn.className = 'add-warning-btn';
        addWarningBtn.textContent = 'Add Warning';
        addWarningBtn.onclick = (e) => {
            e.stopPropagation();
            this.openWarningPopup(lat, lng, displayName);
        };
        
        buttonDiv.appendChild(addWarningBtn);
        container.appendChild(buttonDiv);
        
        return container;
    }

    /**
     * Open warning popup for a location
     */
    openWarningPopup(lat, lng, locationName) {
        if (window.warningPopupManager) {
            window.warningPopupManager.openWarningPopup(lat, lng, locationName);
        }
    }

    /**
     * Reverse geocode coordinates to address
     */
    async reverseGeocode(lat, lng) {
        try {
            const response = await fetch('/api/map/reverse-geocode', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ lat: lat, lng: lng })
            });

            const data = await response.json();

            if (data.status === 'success' && data.result.address) {
                return data.result;
            } else {
                throw new Error(data.result?.error || 'Reverse geocoding failed');
            }
        } catch (error) {
            console.error('Reverse geocoding error:', error);
            throw error;
        }
    }

    /**
     * Handle map click for reverse geocoding
     */
    async handleMapClick(lat, lng) {
        try {
            const result = await this.reverseGeocode(lat, lng);
            
            // Store the address
            this.currentAddress = result.address || `${lat}, ${lng}`;
            
            // Detect flood zone at this location
            const floodZone = this.getFloodZoneAtLocation(lat, lng);
            this.currentFloodZone = floodZone;
            
            // Store current location data
            this.currentLocation = {
                lat: lat,
                lng: lng,
                address: this.currentAddress,
                floodZone: floodZone
            };
            
            // Update address input if available
            const addressInput = document.getElementById('address-input');
            if (addressInput && result.address) {
                addressInput.value = result.address;
            }

            // Add marker at clicked location
            if (this.currentMarker) {
                this.map.removeLayer(this.currentMarker);
            }

            // Create popup content with address, flood zone, and "Add Warning" button
            const popupContent = this.createMarkerPopupContent(this.currentAddress, lat, lng, floodZone);

            this.currentMarker = L.marker([lat, lng])
                .addTo(this.map)
                .bindPopup(popupContent, {
                    maxWidth: 350,
                    className: 'custom-popup'
                })
                .openPopup();

            // Auto-close popup after 10 seconds (enough time to read address/interact)
            if (this.currentMarker.popupTimeout) {
                clearTimeout(this.currentMarker.popupTimeout);
            }
            this.currentMarker.popupTimeout = setTimeout(() => {
                if (this.currentMarker && this.currentMarker.isPopupOpen()) {
                    this.currentMarker.closePopup();
                }
            }, 10000);

            // Clear timeout if popup is manually closed
            this.currentMarker.on('popupclose', () => {
                if (this.currentMarker && this.currentMarker.popupTimeout) {
                    clearTimeout(this.currentMarker.popupTimeout);
                    this.currentMarker.popupTimeout = null;
                }
            });
        } catch (error) {
            console.error('Map click handling error:', error);
        }
    }

    /**
     * Add a custom marker to the map
     */
    addMarker(lat, lng, popupText = '') {
        const marker = L.marker([lat, lng])
            .addTo(this.map)
            .bindPopup(popupText);
        
        this.markers.push(marker);
        return marker;
    }

    /**
     * Clear all markers except the current one
     */
    clearMarkers() {
        this.markers.forEach(marker => {
            this.map.removeLayer(marker);
        });
        this.markers = [];
    }

    /**
     * Get current map center
     */
    getCenter() {
        const center = this.map.getCenter();
        return {
            lat: center.lat,
            lng: center.lng
        };
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MapManager;
}

