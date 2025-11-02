/**
 * Traffic Layer Manager
 * Handles traffic congestion heatmap overlay on the map
 */

class TrafficLayerManager {
    constructor() {
        this.trafficLayer = null;
        this.constructionLayer = null;
        this.isEnabled = false;
        this.constructionEnabled = false;
        this.apiKey = null; // Google Maps API key (if using Google Maps)
        this.trafficMode = 'tiles'; // 'tiles', 'google', or 'heatmap'
        this.trafficEventListeners = []; // Store event listeners for cleanup
        this.lastUpdateTime = null; // Timestamp of last data update
        this.updateInterval = 30000; // 30 seconds between updates
        this.updateTimer = null; // Timer for countdown
        this.countdownTimer = null; // Countdown interval
        this.statusTextBox = null; // UI element for status
    }

    /**
     * Initialize traffic layer manager
     * @param {string} apiKey - Optional Google Maps API key
     */
    init(apiKey = null) {
        this.apiKey = apiKey;
    }

    /**
     * Enable traffic congestion overlay using marker-based heatmap visualization
     * This fetches real-time traffic data from Google Maps API via backend
     */
    async enableTrafficLayer() {
        if (!window.mapManager || !window.mapManager.map) {
            console.warn('Map not initialized, cannot enable traffic layer');
            return;
        }

        if (this.isEnabled && this.trafficLayer && window.mapManager && window.mapManager.map && window.mapManager.map.hasLayer(this.trafficLayer)) {
            return; // Already enabled and visible
        }
        
        // If layer exists but was removed, clean it up first
        if (this.trafficLayer && window.mapManager && window.mapManager.map) {
            if (window.mapManager.map.hasLayer(this.trafficLayer)) {
                window.mapManager.map.removeLayer(this.trafficLayer);
            }
            this.trafficLayer = null;
        }

        try {
            // Get current map center and bounds
            const center = window.mapManager.map.getCenter();
            const bounds = window.mapManager.map.getBounds();
            
            // Calculate radius from bounds (approximate)
            const radiusKm = Math.max(
                bounds.getNorthEast().lat - bounds.getSouthWest().lat,
                bounds.getNorthEast().lng - bounds.getSouthWest().lng
            ) * 111; // Convert degrees to km (approximate)
            
            // Fetch traffic data from backend API
            let trafficData = [];
            try {
                const response = await fetch('/api/traffic/congestion', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        location: {
                            lat: center.lat,
                            lng: center.lng
                        },
                        radius_km: Math.max(radiusKm, 5.0) // Minimum 5km radius
                    })
                });
                
                const data = await response.json();
                
                if (data.status === 'success' && data.traffic_points) {
                    trafficData = data.traffic_points;
                    console.log(`Fetched ${trafficData.length} traffic points from API`);
                } else {
                    console.warn('Failed to fetch traffic data, using sample data');
                    trafficData = this.getSampleTrafficData();
                }
            } catch (error) {
                console.warn('Error fetching traffic data from API:', error);
                console.log('Falling back to sample data');
                trafficData = this.getSampleTrafficData();
            }
            
            // Store traffic markers in a layer group
            this.trafficLayer = L.layerGroup();
            
            // Create circle markers for each traffic point
            trafficData.forEach(point => {
                const intensity = point.intensity || 0.5;
                
                // Determine color and radius based on intensity
                let color = '#00ff00'; // Green - low congestion
                let radius = 200; // meters
                
                if (intensity > 0.7) {
                    color = '#ff0000'; // Red - high congestion
                    radius = 400;
                } else if (intensity > 0.5) {
                    color = '#ff8800'; // Orange - medium-high congestion
                    radius = 300;
                } else if (intensity > 0.3) {
                    color = '#ffff00'; // Yellow - medium congestion
                    radius = 250;
                }
                
                // Create circle marker for traffic point
                const circle = L.circleMarker([point.lat, point.lng], {
                    radius: 8,
                    fillColor: color,
                    color: color,
                    weight: 2,
                    opacity: 0.8,
                    fillOpacity: 0.6
                });
                
                // Create larger heat circle (semi-transparent)
                const heatCircle = L.circle([point.lat, point.lng], {
                    radius: radius,
                    fillColor: color,
                    color: 'transparent',
                    weight: 0,
                    opacity: 0,
                    fillOpacity: 0.3
                });
                
                // Add to layer group
                this.trafficLayer.addLayer(circle);
                this.trafficLayer.addLayer(heatCircle);
            });
            
            // Store event listeners for cleanup
            this.trafficEventListeners = [];
            
            const updateHandler = () => {
                this.updateTrafficOverlay();
            };
            
            window.mapManager.map.on('moveend', updateHandler);
            window.mapManager.map.on('zoomend', updateHandler);
            
            this.trafficEventListeners = [
                { event: 'moveend', handler: updateHandler },
                { event: 'zoomend', handler: updateHandler }
            ];
            
            // Add traffic overlay to map
            this.trafficLayer.addTo(window.mapManager.map);
            this.isEnabled = true;
            
            // Also fetch and display construction data
            await this.enableConstructionLayer();
            
            // Record update time and start auto-refresh
            this.lastUpdateTime = new Date();
            this.createStatusBox();
            this.startAutoRefresh();
            
            console.log('Traffic layer enabled');
        } catch (error) {
            console.error('Error enabling traffic layer:', error);
        }
    }
    
    /**
     * Update traffic overlay when map moves/zooms
     * Note: Circles and markers are fixed to lat/lng coordinates, so they stay in position automatically
     * We only update if user moves significantly to fetch new data for new area
     */
    updateTrafficOverlay() {
        if (!this.isEnabled || !this.trafficLayer) {
            return;
        }
        
        // Ensure traffic layer is still on the map (Leaflet should handle this automatically)
        if (window.mapManager && window.mapManager.map && !window.mapManager.map.hasLayer(this.trafficLayer)) {
            // Re-add if somehow removed
            this.trafficLayer.addTo(window.mapManager.map);
        }
        
        // Ensure construction layer is still on the map
        if (this.constructionLayer && window.mapManager && window.mapManager.map && !window.mapManager.map.hasLayer(this.constructionLayer)) {
            this.constructionLayer.addTo(window.mapManager.map);
        }
        
        // Traffic circles and construction markers are fixed to lat/lng coordinates, so they automatically
        // stay in the correct position relative to the map when zooming/panning
        // No need to remove and recreate - Leaflet handles this
    }

    /**
     * Disable traffic congestion overlay
     */
    disableTrafficLayer() {
        // Remove event listeners
        if (this.trafficEventListeners && window.mapManager && window.mapManager.map) {
            this.trafficEventListeners.forEach(({ event, handler }) => {
                window.mapManager.map.off(event, handler);
            });
            this.trafficEventListeners = [];
        }
        
        // Remove layer from map
        if (this.trafficLayer && window.mapManager && window.mapManager.map) {
            if (window.mapManager.map.hasLayer(this.trafficLayer)) {
                window.mapManager.map.removeLayer(this.trafficLayer);
            }
            // Clear all layers from the layer group
            this.trafficLayer.clearLayers();
            this.trafficLayer = null;
        }
        
        this.isEnabled = false;
        
        // Disable construction layer too
        this.disableConstructionLayer();
        
        // Clear timers
        this.stopAutoRefresh();
        this.removeStatusBox();
        
        console.log('Traffic layer disabled');
    }
    
    /**
     * Enable construction layer overlay
     */
    async enableConstructionLayer() {
        if (!window.mapManager || !window.mapManager.map) {
            return;
        }
        
        if (this.constructionEnabled && this.constructionLayer) {
            return; // Already enabled
        }
        
        try {
            // Get current map center and bounds
            const center = window.mapManager.map.getCenter();
            const bounds = window.mapManager.map.getBounds();
            
            // Calculate radius from bounds (approximate)
            const radiusKm = Math.max(
                bounds.getNorthEast().lat - bounds.getSouthWest().lat,
                bounds.getNorthEast().lng - bounds.getSouthWest().lng
            ) * 111; // Convert degrees to km (approximate)
            
            // Fetch construction data from backend API
            let constructionData = [];
            try {
                const response = await fetch('/api/traffic/construction', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        location: {
                            lat: center.lat,
                            lng: center.lng
                        },
                        radius_km: Math.max(radiusKm, 5.0) // Minimum 5km radius
                    })
                });
                
                const data = await response.json();
                
                if (data.status === 'success' && data.construction_points) {
                    constructionData = data.construction_points;
                    console.log(`Fetched ${constructionData.length} construction points from API`);
                }
            } catch (error) {
                console.warn('Error fetching construction data from API:', error);
            }
            
            // Store construction markers in a layer group
            this.constructionLayer = L.layerGroup();
            
            // Create markers for each construction point
            constructionData.forEach(point => {
                const lat = point.lat;
                const lng = point.lng;
                const description = point.description || 'Construction';
                
                // Create construction marker icon with 🚧 symbol
                const constructionIcon = L.divIcon({
                    className: 'construction-marker-icon',
                    html: `<div style="background-color: #ff8800; width: 32px; height: 32px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; font-size: 20px;">🚧</div>`,
                    iconSize: [32, 32],
                    iconAnchor: [16, 16]
                });
                
                // Create marker
                const marker = L.marker([lat, lng], {
                    icon: constructionIcon
                });
                
                // Add popup with construction info
                const popupContent = `
                    <div style="padding: 5px;">
                        <div style="font-weight: 600; margin-bottom: 5px;">🚧 Construction</div>
                        <div style="font-size: 11px; color: #666;">${description}</div>
                    </div>
                `;
                
                marker.bindPopup(popupContent);
                
                // Add to layer group
                this.constructionLayer.addLayer(marker);
            });
            
            // Add construction overlay to map
            if (constructionData.length > 0) {
                this.constructionLayer.addTo(window.mapManager.map);
                this.constructionEnabled = true;
                console.log('Construction layer enabled');
            }
        } catch (error) {
            console.error('Error enabling construction layer:', error);
        }
    }
    
    /**
     * Disable construction layer
     */
    disableConstructionLayer() {
        if (this.constructionLayer && window.mapManager && window.mapManager.map) {
            if (window.mapManager.map.hasLayer(this.constructionLayer)) {
                window.mapManager.map.removeLayer(this.constructionLayer);
            }
            this.constructionLayer.clearLayers();
            this.constructionLayer = null;
            this.constructionEnabled = false;
        }
    }

    /**
     * Toggle traffic layer on/off
     */
    toggle() {
        if (this.isEnabled) {
            this.disableTrafficLayer();
        } else {
            this.enableTrafficLayer();
        }
        return this.isEnabled;
    }

    /**
     * Enable traffic heatmap using Leaflet.heat plugin
     * Requires: https://github.com/Leaflet/Leaflet.heat
     * This creates a custom heatmap from traffic data points
     */
    enableTrafficHeatmap(trafficData = null) {
        if (!window.mapManager || !window.mapManager.map) {
            console.warn('Map not initialized, cannot enable traffic heatmap');
            return;
        }

        // Check if Leaflet.heat is available
        if (typeof L.heatLayer === 'undefined') {
            console.warn('Leaflet.heat plugin not loaded. Add script: https://cdn.jsdelivr.net/gh/Leaflet/Leaflet.heat@gh-pages/dist/leaflet-heat.js');
            return;
        }

        // If no data provided, use sample data or fetch from API
        if (!trafficData) {
            // Sample traffic data format: [{lat, lng, intensity}]
            // In production, fetch from traffic API
            trafficData = this.getSampleTrafficData();
        }

        // Create heat layer
        const heatPoints = trafficData.map(point => [point.lat, point.lng, point.intensity || 0.5]);
        
        this.trafficLayer = L.heatLayer(heatPoints, {
            radius: 25,
            blur: 15,
            maxZoom: 17,
            gradient: {
                0.0: 'blue',    // Low congestion
                0.3: 'cyan',
                0.5: 'yellow', // Medium congestion
                0.7: 'orange', // High congestion
                1.0: 'red'      // Very high congestion
            },
            opacity: 0.6
        });

        this.trafficLayer.addTo(window.mapManager.map);
        this.isEnabled = true;
        console.log('Traffic heatmap enabled');
    }

    /**
     * Get sample traffic data for demonstration
     * In production, replace with real-time traffic API
     */
    getSampleTrafficData() {
        const center = window.mapManager.map.getCenter();
        const lat = center.lat;
        const lng = center.lng;

        // Generate sample traffic points around map center
        const points = [];
        for (let i = 0; i < 50; i++) {
            const offsetLat = (Math.random() - 0.5) * 0.1;
            const offsetLng = (Math.random() - 0.5) * 0.1;
            points.push({
                lat: lat + offsetLat,
                lng: lng + offsetLng,
                intensity: Math.random() // 0-1, where 1 is high congestion
            });
        }
        return points;
    }

    /**
     * Fetch real-time traffic data from API
     * Replace with your preferred traffic data provider
     */
    async fetchTrafficData(bounds) {
        // Example: Fetch from a traffic API
        // const response = await fetch(`/api/traffic?bounds=${bounds.toBBoxString()}`);
        // const data = await response.json();
        // return data.points;
        
        // For now, return sample data
        return this.getSampleTrafficData();
    }

    /**
     * Update traffic layer based on current map view
     */
    async updateTrafficData() {
        if (!this.isEnabled || !this.trafficLayer) {
            return;
        }

        if (this.trafficMode === 'heatmap') {
            const bounds = window.mapManager.map.getBounds();
            const trafficData = await this.fetchTrafficData(bounds);
            this.disableTrafficLayer();
            this.enableTrafficHeatmap(trafficData);
        }
    }
    
    /**
     * Create status textbox to show update time and countdown
     */
    createStatusBox() {
        // Remove existing status box if any
        this.removeStatusBox();
        
        // Create status box element
        const statusBox = document.createElement('div');
        statusBox.id = 'traffic-status-box';
        statusBox.style.cssText = `
            position: fixed;
            bottom: 75px;
            right: 190px;
            background-color: rgba(255, 255, 255, 0.95);
            border: 2px solid #000;
            border-radius: 5px;
            padding: 10px 15px;
            font-size: 12px;
            font-family: 'Space Mono', monospace;
            z-index: 1000;
            box-shadow: 0 2px 8px rgba(0,0,0,0.2);
            min-width: 250px;
        `;
        
        statusBox.innerHTML = '<div id="traffic-status-text">Loading...</div>';
        
        // Add to body instead of map container
        document.body.appendChild(statusBox);
        this.statusTextBox = statusBox;
        
        // Update status immediately
        this.updateStatusDisplay();
    }
    
    /**
     * Remove status textbox
     */
    removeStatusBox() {
        if (this.statusTextBox) {
            if (this.statusTextBox.parentNode) {
                this.statusTextBox.parentNode.removeChild(this.statusTextBox);
            }
            this.statusTextBox = null;
        }
    }
    
    /**
     * Update status display with last update time and countdown
     */
    updateStatusDisplay() {
        if (!this.statusTextBox || !this.lastUpdateTime) {
            return;
        }
        
        const statusText = document.getElementById('traffic-status-text');
        if (!statusText) return;
        
        const now = new Date();
        const timeSinceUpdate = Math.floor((now - this.lastUpdateTime) / 1000); // seconds
        const timeUntilUpdate = Math.max(0, Math.floor((this.updateInterval / 1000) - timeSinceUpdate));
        
        // Format last update time
        const updateTimeStr = this.lastUpdateTime.toLocaleTimeString();
        
        // Format countdown
        const minutes = Math.floor(timeUntilUpdate / 60);
        const seconds = timeUntilUpdate % 60;
        const countdownStr = `${minutes}:${seconds.toString().padStart(2, '0')}`;
        
        statusText.innerHTML = `
            <div style="margin-bottom: 5px;"><strong>Traffic Data Status</strong></div>
            <div>Last updated: ${updateTimeStr}</div>
            <div>Next update in: ${countdownStr}</div>
        `;
    }
    
    /**
     * Start auto-refresh timer
     */
    startAutoRefresh() {
        // Stop any existing timer
        this.stopAutoRefresh();
        
        // Update countdown every second
        this.countdownTimer = setInterval(() => {
            if (this.isEnabled) {
                this.updateStatusDisplay();
            }
        }, 1000);
        
        // Refresh data every updateInterval
        this.updateTimer = setTimeout(() => {
            if (this.isEnabled) {
                this.refreshTrafficData();
            }
        }, this.updateInterval);
    }
    
    /**
     * Stop auto-refresh timer
     */
    stopAutoRefresh() {
        if (this.countdownTimer) {
            clearInterval(this.countdownTimer);
            this.countdownTimer = null;
        }
        if (this.updateTimer) {
            clearTimeout(this.updateTimer);
            this.updateTimer = null;
        }
    }
    
    /**
     * Refresh traffic data
     */
    async refreshTrafficData() {
        if (!this.isEnabled) {
            return;
        }
        
        console.log('Refreshing traffic data...');
        
        // Store old layers
        const oldTrafficLayer = this.trafficLayer;
        const oldConstructionLayer = this.constructionLayer;
        const wasEnabled = this.isEnabled;
        
        // Temporarily mark as not enabled to prevent early returns
        this.isEnabled = false;
        
        // Remove old layers
        if (oldTrafficLayer && window.mapManager && window.mapManager.map) {
            window.mapManager.map.removeLayer(oldTrafficLayer);
            oldTrafficLayer.clearLayers();
        }
        
        if (oldConstructionLayer && window.mapManager && window.mapManager.map) {
            window.mapManager.map.removeLayer(oldConstructionLayer);
            oldConstructionLayer.clearLayers();
        }
        
        // Re-enable to fetch new data
        this.isEnabled = wasEnabled;
        await this.enableTrafficLayer();
    }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    window.trafficLayerManager = new TrafficLayerManager();
    window.trafficLayerManager.init();
});

