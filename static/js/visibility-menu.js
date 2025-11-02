/**
 * Visibility Menu Manager
 * Handles toggling of different modules (weather, etc.)
 */

class VisibilityMenu {
    constructor() {
        this.menuToggleBtn = document.getElementById('menu-toggle-btn');
        this.menuDropdown = document.getElementById('menu-dropdown');
        this.weatherToggle = document.getElementById('weather-toggle');
        this.weatherWindow = document.getElementById('weather-window');
        this.weatherCloseBtn = document.getElementById('weather-close-btn');
        this.weatherContent = document.getElementById('weather-content');
        this.trafficToggle = document.getElementById('traffic-toggle');
        this.evacuationRoutesToggle = document.getElementById('evacuation-routes-toggle');
        this.warningsToggle = document.getElementById('warnings-toggle');
        this.camerasToggle = document.getElementById('cameras-toggle');
        this.floodZonesToggle = document.getElementById('flood-zones-toggle');
        
        this.init();
    }

    init() {
        // Ensure checkboxes start unchecked
        if (this.weatherToggle) {
            this.weatherToggle.checked = false;
        }
        if (this.trafficToggle) {
            this.trafficToggle.checked = false;
        }
        if (this.evacuationRoutesToggle) {
            this.evacuationRoutesToggle.checked = false;
        }
        if (this.warningsToggle) {
            this.warningsToggle.checked = true; // Default to showing warnings
        }
        if (this.camerasToggle) {
            this.camerasToggle.checked = true; // Default to showing cameras
        }
        if (this.floodZonesToggle) {
            this.floodZonesToggle.checked = true; // Default to showing flood zones
        }
        
        // Menu toggle button
        if (this.menuToggleBtn) {
            this.menuToggleBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                this.toggleMenu();
            });
        }

        // Close menu when clicking outside
        document.addEventListener('click', (e) => {
            if (!this.menuToggleBtn.contains(e.target) && 
                !this.menuDropdown.contains(e.target)) {
                this.menuDropdown.classList.remove('active');
            }
        });

        // Weather toggle
        if (this.weatherToggle) {
            this.weatherToggle.addEventListener('change', () => {
                this.toggleWeatherWindow();
            });
        }

        // Weather close button
        if (this.weatherCloseBtn) {
            this.weatherCloseBtn.addEventListener('click', () => {
                this.hideWeatherWindow();
            });
        }


        // Traffic toggle
        if (this.trafficToggle) {
            this.trafficToggle.addEventListener('change', () => {
                this.toggleTrafficLayer();
            });
        }

        // Evacuation routes toggle
        if (this.evacuationRoutesToggle) {
            this.evacuationRoutesToggle.addEventListener('change', () => {
                this.toggleEvacuationRoutes();
            });
        }

        // Warnings toggle
        if (this.warningsToggle) {
            this.warningsToggle.addEventListener('change', () => {
                this.toggleWarnings();
            });
        }

        // Cameras toggle
        if (this.camerasToggle) {
            this.camerasToggle.addEventListener('change', () => {
                this.toggleCameras();
            });
        }

        // Flood zones toggle
        if (this.floodZonesToggle) {
            this.floodZonesToggle.addEventListener('change', () => {
                this.toggleFloodZones();
            });
        }
    }

    toggleMenu() {
        this.menuDropdown.classList.toggle('active');
    }

    toggleWeatherWindow() {
        if (this.weatherToggle.checked) {
            this.showWeatherWindow();
        } else {
            this.hideWeatherWindow();
        }
    }

    showWeatherWindow() {
        if (this.weatherWindow) {
            this.weatherWindow.style.display = 'flex';
            this.loadWeatherData();
        }
    }

    hideWeatherWindow() {
        if (this.weatherWindow) {
            this.weatherWindow.style.display = 'none';
        }
        if (this.weatherToggle) {
            this.weatherToggle.checked = false;
        }
    }

    async loadWeatherData() {
        // Show loading state
        this.weatherContent.innerHTML = '<div class="weather-loading">Loading weather data...</div>';

        try {
            // Get user's location (zipcode, address, or coordinates)
            const location = this.getLocation();
            
            // If we have zipcode or address, we need to geocode it first
            if (location.type === 'zipcode' || location.type === 'address') {
                await this.loadWeatherWithGeocode(location);
                return;
            }
            
            // Direct coordinates - use them immediately
            const response = await fetch('/api/weather/forecast', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ location: location })
            });

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();

            if (data.status === 'success') {
                this.renderWeatherData(data.weather);
            } else {
                throw new Error(data.error || 'Failed to load weather data');
            }
        } catch (error) {
            console.error('Weather loading error:', error);
            this.weatherContent.innerHTML = `
                <div class="weather-loading" style="color: #cc0000;">
                    Error loading weather: ${error.message}<br/>
                    <button onclick="window.visibilityMenu.loadWeatherData()" style="margin-top: 10px; padding: 5px 10px; background: #000; color: #fff; border: none; cursor: pointer;">Retry</button>
                </div>
            `;
        }
    }

    async loadWeatherWithGeocode(location) {
        try {
            let geocodeQuery = '';
            
            if (location.type === 'zipcode') {
                geocodeQuery = location.zipcode;
            } else if (location.type === 'address') {
                geocodeQuery = location.address;
            }
            
            // Geocode the zipcode or address
            const geocodeResponse = await fetch('/api/map/geocode', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({ address: geocodeQuery })
            });
            
            if (!geocodeResponse.ok) {
                throw new Error('Failed to geocode location');
            }
            
            const geocodeData = await geocodeResponse.json();
            
            if (geocodeData.status === 'success' && geocodeData.result.lat && geocodeData.result.lng) {
                // Now get weather with coordinates
                const coords = {
                    lat: geocodeData.result.lat,
                    lng: geocodeData.result.lng,
                    type: 'coordinates'
                };
                
                const weatherResponse = await fetch('/api/weather/forecast', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ location: coords })
                });
                
                if (!weatherResponse.ok) {
                    throw new Error(`HTTP error! status: ${weatherResponse.status}`);
                }
                
                const weatherData = await weatherResponse.json();
                
                if (weatherData.status === 'success') {
                    // Update location name in weather data with geocoded location
                    if (geocodeData.result.display_name) {
                        weatherData.weather.location = geocodeData.result.display_name;
                    }
                    this.renderWeatherData(weatherData.weather);
                } else {
                    throw new Error(weatherData.error || 'Failed to load weather data');
                }
            } else {
                throw new Error('Could not geocode location');
            }
        } catch (error) {
            console.error('Weather geocode error:', error);
            this.weatherContent.innerHTML = `
                <div class="weather-loading" style="color: #cc0000;">
                    Error loading weather: ${error.message}<br/>
                    <button onclick="window.visibilityMenu.loadWeatherData()" style="margin-top: 10px; padding: 5px 10px; background: #000; color: #fff; border: none; cursor: pointer;">Retry</button>
                </div>
            `;
        }
    }

    getLocation() {
        // Priority 1: Get zipcode from safety popup
        if (window.safetyPopupManager && window.safetyPopupManager.zipcode) {
            const zipcode = window.safetyPopupManager.zipcode;
            console.log('Using zipcode from safety popup:', zipcode);
            return {
                zipcode: zipcode,
                type: 'zipcode'
            };
        }
        
        // Priority 2: Get address from address input field
        const addressInput = document.getElementById('address-input');
        if (addressInput && addressInput.value.trim()) {
            const address = addressInput.value.trim();
            console.log('Using address from input field:', address);
            return {
                address: address,
                type: 'address'
            };
        }
        
        // Priority 3: Try to get location from map if available
        if (window.mapManager && window.mapManager.currentMarker) {
            const marker = window.mapManager.currentMarker;
            const latlng = marker.getLatLng();
            console.log('Using map location:', latlng);
            return {
                lat: latlng.lat,
                lng: latlng.lng,
                type: 'coordinates'
            };
        }
        
        // Default to Corpus Christi coordinates
        console.log('Using default location');
        return {
            lat: 27.8006,
            lng: -97.3964,
            type: 'coordinates'
        };
    }

    renderWeatherData(weather) {
        if (!weather || !weather.current) {
            this.weatherContent.innerHTML = '<div class="weather-loading">No weather data available</div>';
            return;
        }

        let html = '';

        // Current weather
        if (weather.current) {
            const current = weather.current;
            html += `
                <div class="weather-current">
                    <div class="weather-location">${weather.location || 'Current Location'}</div>
                    <div class="weather-temp">${Math.round(current.temp)}°F</div>
                    <div class="weather-description">${current.description || ''}</div>
                    <div class="weather-details">
                        <div class="weather-detail-item">
                            <span class="weather-detail-label">Feels Like</span>
                            <span>${Math.round(current.feels_like || current.temp)}°F</span>
                        </div>
                        <div class="weather-detail-item">
                            <span class="weather-detail-label">Humidity</span>
                            <span>${current.humidity || 'N/A'}%</span>
                        </div>
                        <div class="weather-detail-item">
                            <span class="weather-detail-label">Wind Speed</span>
                            <span>${current.wind_speed || 'N/A'} mph</span>
                        </div>
                        <div class="weather-detail-item">
                            <span class="weather-detail-label">Visibility</span>
                            <span>${current.visibility ? (current.visibility / 1000).toFixed(1) + ' mi' : 'N/A'}</span>
                        </div>
                    </div>
                </div>
            `;
        }

        // Forecast
        if (weather.forecast && weather.forecast.length > 0) {
            html += '<div class="weather-forecast">';
            html += '<div class="weather-forecast-title">5-Day Forecast</div>';
            
            // Get current date from weather data or use system date
            const currentDateStr = weather.current_date || new Date().toISOString().split('T')[0];
            
            weather.forecast.forEach((day, index) => {
                const date = new Date(day.date + 'T00:00:00'); // Add time to avoid timezone issues
                const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
                const monthDay = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
                
                // Show "Today" for the current day
                let dateDisplay;
                if (day.date === currentDateStr || day.is_today) {
                    dateDisplay = 'Today';
                } else {
                    dateDisplay = `${dayName}, ${monthDay}`;
                }
                
                html += `
                    <div class="weather-forecast-item">
                        <div>
                            <div class="forecast-date">${dateDisplay}</div>
                            <div class="forecast-desc">${day.description || ''}</div>
                        </div>
                        <div class="forecast-temp">${Math.round(day.temp_max)}° / ${Math.round(day.temp_min)}°</div>
                    </div>
                `;
            });
            
            html += '</div>';
        }

        this.weatherContent.innerHTML = html;
    }

    toggleTrafficLayer() {
        if (!window.trafficLayerManager) {
            console.warn('Traffic layer manager not initialized');
            return;
        }

        if (this.trafficToggle.checked) {
            window.trafficLayerManager.enableTrafficLayer();
        } else {
            window.trafficLayerManager.disableTrafficLayer();
        }
    }

    toggleEvacuationRoutes() {
        if (!window.evacuationRoutesManager) {
            console.warn('Evacuation routes manager not initialized');
            return;
        }

        if (this.evacuationRoutesToggle.checked) {
            window.evacuationRoutesManager.enableRoutes();
        } else {
            window.evacuationRoutesManager.disableRoutes();
        }
    }

    toggleWarnings() {
        if (!window.mapManager || !window.mapManager.map) {
            console.warn('Map manager not available');
            return;
        }

        if (this.warningsToggle.checked) {
            // Show warnings - re-display them if warning loader exists
            if (window.warningLoader && window.warningLoader.warnings) {
                window.warningLoader.displayWarnings();
            }
        } else {
            // Hide warnings - remove all warning markers
            if (window.mapManager.warningMarkers && window.mapManager.warningMarkers.length > 0) {
                window.mapManager.warningMarkers.forEach(marker => {
                    window.mapManager.map.removeLayer(marker);
                });
                window.mapManager.warningMarkers = [];
            }
        }
    }

    toggleCameras() {
        if (!window.mapManager || !window.mapManager.map) {
            console.warn('Map manager not available');
            return;
        }

        if (this.camerasToggle.checked) {
            // Show cameras - re-display them if camera loader exists
            if (window.cameraLoader && window.cameraLoader.cameras) {
                window.cameraLoader.displayCameras();
            }
        } else {
            // Hide cameras - remove all camera markers
            if (window.mapManager.cameraMarkers && window.mapManager.cameraMarkers.length > 0) {
                window.mapManager.cameraMarkers.forEach(marker => {
                    window.mapManager.map.removeLayer(marker);
                });
                window.mapManager.cameraMarkers = [];
            }
        }
    }

    toggleFloodZones() {
        if (!window.floodZoneManager) {
            console.warn('Flood zone manager not available');
            return;
        }

        if (this.floodZonesToggle.checked) {
            // Show flood zones - use displayZones which respects individual checkboxes
            window.floodZoneManager.displayZones();
            
            // Also update all zone checkboxes to match the master toggle state
            const zoneCheckboxes = document.querySelectorAll('.zone-checkbox');
            zoneCheckboxes.forEach(checkbox => {
                checkbox.checked = true;
                const zoneId = parseInt(checkbox.getAttribute('data-zone-id'));
                window.floodZoneManager.toggleZone(zoneId, true);
            });
        } else {
            // Hide all flood zones
            window.floodZoneManager.clearZones();
            
            // Uncheck all zone checkboxes
            const zoneCheckboxes = document.querySelectorAll('.zone-checkbox');
            zoneCheckboxes.forEach(checkbox => {
                checkbox.checked = false;
            });
        }
    }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    window.visibilityMenu = new VisibilityMenu();
});

