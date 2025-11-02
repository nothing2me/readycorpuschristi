/**
 * Camera Loader
 * Loads existing cameras from the backend and displays them on the map
 */

class CameraLoader {
    constructor() {
        this.cameras = [];
        this.refreshInterval = null;
        this.refreshIntervalMs = 5 * 60 * 1000; // Check for updates every 5 minutes
    }

    /**
     * Load cameras and compare with existing to detect changes
     */
    async loadCameras() {
        try {
            const response = await fetch('/api/cameras/all');
            const data = await response.json();

            if (data.status === 'success') {
                const newCameras = data.cameras || [];
                
                // Check if cameras have changed
                const camerasChanged = this._camerasChanged(newCameras);
                
                this.cameras = newCameras;
                
                if (camerasChanged) {
                    console.log(`[Camera Loader] Cameras updated, refreshing map display`);
                    this.displayCameras();
                } else {
                    console.log(`[Camera Loader] No camera changes detected`);
                }
                
                console.log(`Loaded ${this.cameras.length} cameras from database`);
            } else {
                console.error('Failed to load cameras:', data.error);
            }
        } catch (error) {
            console.error('Error loading cameras:', error);
        }
    }

    /**
     * Check if cameras have changed
     */
    _camerasChanged(newCameras) {
        if (this.cameras.length !== newCameras.length) {
            return true;
        }
        
        // Compare camera IDs and timestamps
        const existingIds = new Set(this.cameras.map(c => c.id));
        const newIds = new Set(newCameras.map(c => c.id));
        
        if (existingIds.size !== newIds.size) {
            return true;
        }
        
        // Check if any camera has a newer timestamp
        for (const newCamera of newCameras) {
            const existingCamera = this.cameras.find(c => c.id === newCamera.id);
            if (!existingCamera) {
                return true; // New camera found
            }
            if (newCamera.timestamp && existingCamera.timestamp && 
                newCamera.timestamp > existingCamera.timestamp) {
                return true; // Camera has new image
            }
        }
        
        return false;
    }

    /**
     * Display all cameras on the map
     */
    displayCameras() {
        if (!window.mapManager || !window.mapManager.map) {
            console.warn('Map manager not available, cannot display cameras');
            return;
        }

        // Clear existing camera markers if any
        if (window.mapManager.cameraMarkers) {
            window.mapManager.cameraMarkers.forEach(marker => {
                window.mapManager.map.removeLayer(marker);
            });
            window.mapManager.cameraMarkers = [];
        } else {
            window.mapManager.cameraMarkers = [];
        }

        // Display each camera
        this.cameras.forEach(camera => {
            this.displayCameraMarker(camera);
        });
    }

    /**
     * Display a single camera marker on the map
     */
    displayCameraMarker(cameraData) {
        if (!window.mapManager || !window.mapManager.map) {
            return;
        }

        // Create custom icon with camera emoji
        const cameraIcon = L.divIcon({
            className: 'camera-marker-icon',
            html: `<div style="background-color: #4CAF50; width: 40px; height: 40px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3); display: flex; align-items: center; justify-content: center; font-size: 24px;">📷</div>`,
            iconSize: [40, 40],
            iconAnchor: [20, 20]
        });

        const location = cameraData.location || {};
        const lat = location.lat;
        const lng = location.lng;
        const locationName = location.name || `Camera ${cameraData.id || 'Unknown'}`;

        // Create popup content with camera snapshot
        const popupContent = this.createCameraPopupContent(cameraData, locationName);

        // Add camera marker
        const cameraMarker = L.marker(
            [lat, lng],
            { icon: cameraIcon }
        ).addTo(window.mapManager.map);

        // Bind popup with camera info and snapshot
        cameraMarker.bindPopup(popupContent, {
            maxWidth: 400,
            maxHeight: 600,
            className: 'camera-popup'
        });

        // Store reference to camera markers
        if (!window.mapManager.cameraMarkers) {
            window.mapManager.cameraMarkers = [];
        }
        window.mapManager.cameraMarkers.push(cameraMarker);
    }

    /**
     * Create popup content for camera with snapshot image
     */
    createCameraPopupContent(cameraData, locationName) {
        const container = document.createElement('div');
        container.className = 'camera-popup-content';
        container.style.padding = '10px';
        
        // Camera location/name
        const nameDiv = document.createElement('div');
        nameDiv.style.fontWeight = '600';
        nameDiv.style.fontSize = '14px';
        nameDiv.style.marginBottom = '10px';
        nameDiv.style.color = '#333';
        nameDiv.textContent = locationName;
        container.appendChild(nameDiv);

        // Camera snapshot image
        const imageDiv = document.createElement('div');
        imageDiv.style.marginBottom = '8px';
        imageDiv.style.textAlign = 'center';
        
        const img = document.createElement('img');
                    // Use placeholder or default image
                    img.src = cameraData.image_path || '/static/images/camera-placeholder.jpg';
                    img.alt = `Camera snapshot: ${locationName}`;
                    img.style.border = '2px solid #4CAF50';
                    img.style.padding = '5px';
                    img.style.backgroundColor = '#f5f5f5';
        img.style.maxWidth = '100%';
        img.style.maxHeight = '400px';
        img.style.borderRadius = '4px';
        img.style.boxShadow = '0 2px 4px rgba(0,0,0,0.2)';
        
        // Add loading state
        img.onload = () => {
            img.style.opacity = '1';
        };
        img.onerror = () => {
            img.style.opacity = '0.5';
            const errorText = document.createElement('div');
            errorText.textContent = 'Image not available';
            errorText.style.color = '#999';
            errorText.style.fontSize = '12px';
            imageDiv.appendChild(errorText);
        };
        img.style.opacity = '0.7';
        img.style.transition = 'opacity 0.3s';
        
        imageDiv.appendChild(img);
        container.appendChild(imageDiv);

        // Timestamp (if available)
        if (cameraData.timestamp) {
            const timestampDiv = document.createElement('div');
            timestampDiv.style.fontSize = '10px';
            timestampDiv.style.color = '#999';
            timestampDiv.style.marginTop = '8px';
            const date = new Date(cameraData.timestamp);
            timestampDiv.textContent = `Updated: ${date.toLocaleString()}`;
            container.appendChild(timestampDiv);
        }

        return container;
    }

    /**
     * Refresh cameras (reload from backend)
     */
    async refreshCameras() {
        await this.loadCameras();
    }

    /**
     * Start automatic refresh interval
     */
    startAutoRefresh() {
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
        }
        
        this.refreshInterval = setInterval(() => {
            this.refreshCameras();
        }, this.refreshIntervalMs);
        
        console.log(`[Camera Loader] Auto-refresh started (checking every ${this.refreshIntervalMs / 1000 / 60} minutes)`);
    }

    /**
     * Stop automatic refresh interval
     */
    stopAutoRefresh() {
        if (this.refreshInterval) {
            clearInterval(this.refreshInterval);
            this.refreshInterval = null;
            console.log('[Camera Loader] Auto-refresh stopped');
        }
    }
}

// Initialize and load cameras on page load
document.addEventListener('DOMContentLoaded', () => {
    window.cameraLoader = new CameraLoader();
    
    // Wait for map to be initialized before loading cameras
    setTimeout(() => {
        if (window.mapManager && window.mapManager.map) {
            window.cameraLoader.loadCameras();
            // Start auto-refresh
            window.cameraLoader.startAutoRefresh();
        } else {
            // Retry if map isn't ready yet
            const checkMap = setInterval(() => {
                if (window.mapManager && window.mapManager.map) {
                    clearInterval(checkMap);
                    window.cameraLoader.loadCameras();
                    // Start auto-refresh
                    window.cameraLoader.startAutoRefresh();
                }
            }, 100);
            
            // Timeout after 5 seconds
            setTimeout(() => clearInterval(checkMap), 5000);
        }
    }, 500);
});

