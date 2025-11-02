/**
 * Visibility Menu Manager
 * Handles toggling of different modules (weather, etc.)
 */

class VisibilityMenu {
    constructor() {
        this.menuToggleBtn = document.getElementById('menu-toggle-btn');
        this.menuDropdown = document.getElementById('menu-dropdown');
        
        // Original menu toggles
        this.weatherToggle = document.getElementById('weather-toggle');
        this.trafficToggle = document.getElementById('traffic-toggle');
        this.evacuationRoutesToggle = document.getElementById('evacuation-routes-toggle');
        this.warningsToggle = document.getElementById('warnings-toggle');
        this.camerasToggle = document.getElementById('cameras-toggle');
        this.floodZonesToggle = document.getElementById('flood-zones-toggle');
        
        // Top header toggles
        this.topWeatherToggle = document.getElementById('top-weather-toggle');
        this.topTrafficToggle = document.getElementById('top-traffic-toggle');
        this.topEvacuationRoutesToggle = document.getElementById('top-evacuation-routes-toggle');
        this.topWarningsToggle = document.getElementById('top-warnings-toggle');
        this.topCamerasToggle = document.getElementById('top-cameras-toggle');
        this.topFloodZonesToggle = document.getElementById('top-flood-zones-toggle');
        this.topZoneSelectorToggle = document.getElementById('top-zone-selector-toggle');
        this.topZoneSelectorDropdown = document.getElementById('top-zone-selector-dropdown');
        this.topOpenHotelSearchBtn = document.getElementById('top-open-hotel-search-btn');
        
        this.weatherWindow = document.getElementById('weather-window');
        this.weatherCloseBtn = document.getElementById('weather-close-btn');
        this.weatherContent = document.getElementById('weather-content');
        
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
            this.warningsToggle.checked = false; // Default to hiding warnings
        }
        if (this.camerasToggle) {
            this.camerasToggle.checked = false; // Default to hiding cameras
        }
        if (this.floodZonesToggle) {
            this.floodZonesToggle.checked = true; // Default to showing flood zones
        }
        
        // Sync top header toggle buttons with original toggles (set active class)
        if (this.topWeatherToggle) {
            const isActive = this.weatherToggle ? this.weatherToggle.checked : false;
            if (isActive) {
                this.topWeatherToggle.classList.add('active');
            } else {
                this.topWeatherToggle.classList.remove('active');
            }
        }
        if (this.topTrafficToggle) {
            const isActive = this.trafficToggle ? this.trafficToggle.checked : false;
            if (isActive) {
                this.topTrafficToggle.classList.add('active');
            } else {
                this.topTrafficToggle.classList.remove('active');
            }
        }
        if (this.topEvacuationRoutesToggle) {
            const isActive = this.evacuationRoutesToggle ? this.evacuationRoutesToggle.checked : false;
            if (isActive) {
                this.topEvacuationRoutesToggle.classList.add('active');
            } else {
                this.topEvacuationRoutesToggle.classList.remove('active');
            }
        }
        if (this.topWarningsToggle) {
            const isActive = this.warningsToggle ? this.warningsToggle.checked : false;
            if (isActive) {
                this.topWarningsToggle.classList.add('active');
            } else {
                this.topWarningsToggle.classList.remove('active');
            }
        }
        if (this.topCamerasToggle) {
            const isActive = this.camerasToggle ? this.camerasToggle.checked : false;
            if (isActive) {
                this.topCamerasToggle.classList.add('active');
            } else {
                this.topCamerasToggle.classList.remove('active');
            }
        }
        if (this.topFloodZonesToggle) {
            const isActive = this.floodZonesToggle ? this.floodZonesToggle.checked : true;
            if (isActive) {
                this.topFloodZonesToggle.classList.add('active');
            } else {
                this.topFloodZonesToggle.classList.remove('active');
            }
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
                this.syncFloodZonesToggle();
                this.toggleFloodZones();
            });
        }
        
        // Top header toggle buttons - handle clicks
        if (this.topWeatherToggle) {
            this.topWeatherToggle.addEventListener('click', () => {
                this.topWeatherToggle.classList.toggle('active');
                if (this.weatherToggle) {
                    this.weatherToggle.checked = this.topWeatherToggle.classList.contains('active');
                }
                this.toggleWeatherWindow();
            });
        }
        
        if (this.topTrafficToggle) {
            this.topTrafficToggle.addEventListener('click', () => {
                this.topTrafficToggle.classList.toggle('active');
                if (this.trafficToggle) {
                    this.trafficToggle.checked = this.topTrafficToggle.classList.contains('active');
                }
                this.toggleTrafficLayer();
            });
        }
        
        if (this.topEvacuationRoutesToggle) {
            this.topEvacuationRoutesToggle.addEventListener('click', () => {
                this.topEvacuationRoutesToggle.classList.toggle('active');
                if (this.evacuationRoutesToggle) {
                    this.evacuationRoutesToggle.checked = this.topEvacuationRoutesToggle.classList.contains('active');
                }
                this.toggleEvacuationRoutes();
            });
        }
        
        if (this.topWarningsToggle) {
            this.topWarningsToggle.addEventListener('click', () => {
                this.topWarningsToggle.classList.toggle('active');
                if (this.warningsToggle) {
                    this.warningsToggle.checked = this.topWarningsToggle.classList.contains('active');
                }
                this.toggleWarnings();
            });
        }
        
        if (this.topCamerasToggle) {
            this.topCamerasToggle.addEventListener('click', () => {
                this.topCamerasToggle.classList.toggle('active');
                if (this.camerasToggle) {
                    this.camerasToggle.checked = this.topCamerasToggle.classList.contains('active');
                }
                this.toggleCameras();
            });
        }
        
        if (this.topFloodZonesToggle) {
            this.topFloodZonesToggle.addEventListener('click', () => {
                this.topFloodZonesToggle.classList.toggle('active');
                if (this.floodZonesToggle) {
                    this.floodZonesToggle.checked = this.topFloodZonesToggle.classList.contains('active');
                }
                this.toggleFloodZones();
            });
        }
        
        // Sync original toggles to top header toggle buttons
        if (this.weatherToggle) {
            this.weatherToggle.addEventListener('change', () => {
                if (this.topWeatherToggle) {
                    if (this.weatherToggle.checked) {
                        this.topWeatherToggle.classList.add('active');
                    } else {
                        this.topWeatherToggle.classList.remove('active');
                    }
                }
            });
        }
        
        if (this.trafficToggle) {
            this.trafficToggle.addEventListener('change', () => {
                if (this.topTrafficToggle) {
                    if (this.trafficToggle.checked) {
                        this.topTrafficToggle.classList.add('active');
                    } else {
                        this.topTrafficToggle.classList.remove('active');
                    }
                }
            });
        }
        
        if (this.evacuationRoutesToggle) {
            this.evacuationRoutesToggle.addEventListener('change', () => {
                if (this.topEvacuationRoutesToggle) {
                    if (this.evacuationRoutesToggle.checked) {
                        this.topEvacuationRoutesToggle.classList.add('active');
                    } else {
                        this.topEvacuationRoutesToggle.classList.remove('active');
                    }
                }
            });
        }
        
        if (this.warningsToggle) {
            this.warningsToggle.addEventListener('change', () => {
                if (this.topWarningsToggle) {
                    if (this.warningsToggle.checked) {
                        this.topWarningsToggle.classList.add('active');
                    } else {
                        this.topWarningsToggle.classList.remove('active');
                    }
                }
            });
        }
        
        if (this.camerasToggle) {
            this.camerasToggle.addEventListener('change', () => {
                if (this.topCamerasToggle) {
                    if (this.camerasToggle.checked) {
                        this.topCamerasToggle.classList.add('active');
                    } else {
                        this.topCamerasToggle.classList.remove('active');
                    }
                }
            });
        }
        
        if (this.floodZonesToggle) {
            this.floodZonesToggle.addEventListener('change', () => {
                if (this.topFloodZonesToggle) {
                    if (this.floodZonesToggle.checked) {
                        this.topFloodZonesToggle.classList.add('active');
                    } else {
                        this.topFloodZonesToggle.classList.remove('active');
                    }
                }
            });
        }
        
        // Top header zone selector dropdown
        if (this.topZoneSelectorToggle) {
            this.topZoneSelectorToggle.addEventListener('click', (e) => {
                e.stopPropagation();
                if (this.topZoneSelectorDropdown) {
                    this.topZoneSelectorDropdown.classList.toggle('active');
                    
                    // Rotate arrow
                    const arrow = this.topZoneSelectorToggle.querySelector('.dropdown-arrow');
                    if (arrow) {
                        if (this.topZoneSelectorDropdown.classList.contains('active')) {
                            arrow.textContent = '▲';
                        } else {
                            arrow.textContent = '▼';
                        }
                    }
                }
            });
        }
        
        // Close top zone dropdown when clicking outside
        document.addEventListener('click', (e) => {
            if (this.topZoneSelectorDropdown && 
                !this.topZoneSelectorToggle.contains(e.target) && 
                !this.topZoneSelectorDropdown.contains(e.target)) {
                this.topZoneSelectorDropdown.classList.remove('active');
            }
        });
        
        // Sync top zone checkboxes with main zone checkboxes
        const topZoneCheckboxes = document.querySelectorAll('.top-zone-checkbox');
        const mainZoneCheckboxes = document.querySelectorAll('.zone-checkbox:not(.top-zone-checkbox)');
        
        topZoneCheckboxes.forEach((topCheckbox) => {
            topCheckbox.addEventListener('change', async (e) => {
                e.stopPropagation();
                const zoneId = parseInt(topCheckbox.getAttribute('data-zone-id'));
                const isChecked = topCheckbox.checked;
                
                // Wait for floodZoneManager to be available if not yet initialized
                if (window.floodZoneManager) {
                    await window.floodZoneManager.toggleZone(zoneId, isChecked);
                } else {
                    // Wait a bit for floodZoneManager to initialize
                    const checkInterval = setInterval(() => {
                        if (window.floodZoneManager) {
                            clearInterval(checkInterval);
                            window.floodZoneManager.toggleZone(zoneId, isChecked);
                        }
                    }, 100);
                    
                    // Stop checking after 5 seconds
                    setTimeout(() => clearInterval(checkInterval), 5000);
                }
                
                // Sync with main checkboxes
                mainZoneCheckboxes.forEach(mainCheckbox => {
                    if (parseInt(mainCheckbox.getAttribute('data-zone-id')) === zoneId) {
                        mainCheckbox.checked = topCheckbox.checked;
                    }
                });
            });
        });
        
        // Sync main zone checkboxes to top zone checkboxes
        mainZoneCheckboxes.forEach(mainCheckbox => {
            mainCheckbox.addEventListener('change', () => {
                const zoneId = parseInt(mainCheckbox.getAttribute('data-zone-id'));
                topZoneCheckboxes.forEach(topCheckbox => {
                    if (parseInt(topCheckbox.getAttribute('data-zone-id')) === zoneId) {
                        topCheckbox.checked = mainCheckbox.checked;
                    }
                });
            });
        });
        
        // Top header hotel search button
        if (this.topOpenHotelSearchBtn) {
            this.topOpenHotelSearchBtn.addEventListener('click', () => {
                // Try to find the original button first
                const hotelSearchBtn = document.getElementById('open-hotel-search-btn');
                if (hotelSearchBtn) {
                    hotelSearchBtn.click();
                } else if (window.hotelSearchManager && typeof window.hotelSearchManager.openModal === 'function') {
                    // Directly call the hotel search manager's openModal method
                    window.hotelSearchManager.openModal();
                } else {
                    console.error('Hotel search manager not available');
                }
            });
        }
    }
    
    syncFloodZonesToggle() {
        // Sync top header toggle with main toggle (if main toggle exists)
        if (this.floodZonesToggle && this.topFloodZonesToggle) {
            this.topFloodZonesToggle.checked = this.floodZonesToggle.checked;
        }
    }

    toggleMenu() {
        // Menu dropdown no longer exists - this function is kept for compatibility
        if (this.menuDropdown) {
            this.menuDropdown.classList.toggle('active');
        }
    }

    toggleWeatherWindow() {
        const isChecked = this.topWeatherToggle ? this.topWeatherToggle.classList.contains('active') : 
                         (this.weatherToggle ? this.weatherToggle.checked : false);
        if (isChecked) {
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
        if (this.topWeatherToggle) {
            this.topWeatherToggle.classList.remove('active');
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

        const isChecked = this.topTrafficToggle ? this.topTrafficToggle.classList.contains('active') : 
                         (this.trafficToggle ? this.trafficToggle.checked : false);
        if (isChecked) {
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

        const isChecked = this.topEvacuationRoutesToggle ? this.topEvacuationRoutesToggle.classList.contains('active') : 
                         (this.evacuationRoutesToggle ? this.evacuationRoutesToggle.checked : false);
        if (isChecked) {
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

        const isChecked = this.topWarningsToggle ? this.topWarningsToggle.classList.contains('active') : 
                         (this.warningsToggle ? this.warningsToggle.checked : false);
        if (isChecked) {
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

        const isChecked = this.topCamerasToggle ? this.topCamerasToggle.classList.contains('active') : 
                         (this.camerasToggle ? this.camerasToggle.checked : false);
        if (isChecked) {
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

        const isChecked = this.topFloodZonesToggle ? this.topFloodZonesToggle.classList.contains('active') : 
                         (this.floodZonesToggle ? this.floodZonesToggle.checked : false);
        if (isChecked) {
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

