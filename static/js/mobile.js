// Mobile-specific JavaScript for Ready Corpus Christi

// Mobile Map Manager
let mobileMapManager = null;

// Initialize mobile app
document.addEventListener('DOMContentLoaded', () => {
    console.log('Mobile app initializing...');
    
    // Initialize mobile map
    if (window.MapManager) {
        mobileMapManager = new MapManager();
        mobileMapManager.init();
        window.mapManager = mobileMapManager; // Make available globally
    }
    
    // Initialize mobile UI components
    initMobileMenu();
    initMobileAddressBar();
    initMobileLegend();
    initMobileBottomNav();
    initMobileChatbotSheet();
    
    // Initialize other managers
    if (window.EvacuationRoutesManager) {
        window.evacuationRoutesManager = new EvacuationRoutesManager();
        window.evacuationRoutesManager.init();
    }
    
    if (window.WarningLoader) {
        window.warningLoader = new WarningLoader();
        window.warningLoader.loadWarnings();
    }
    
    if (window.CameraLoader) {
        window.cameraLoader = new CameraLoader();
        window.cameraLoader.loadCameras();
    }
    
    // Adjust map container position based on address bar state
    adjustMapPosition();
});

// Mobile Menu Functions
function initMobileMenu() {
    const menuBtn = document.getElementById('mobile-menu-btn');
    const menuOverlay = document.getElementById('mobile-menu-overlay');
    const menuClose = document.getElementById('mobile-menu-close');
    
    if (menuBtn) {
        menuBtn.addEventListener('click', () => {
            menuOverlay.classList.add('active');
        });
    }
    
    if (menuClose) {
        menuClose.addEventListener('click', () => {
            menuOverlay.classList.remove('active');
        });
    }
    
    if (menuOverlay) {
        menuOverlay.addEventListener('click', (e) => {
            if (e.target === menuOverlay) {
                menuOverlay.classList.remove('active');
            }
        });
    }
    
    // Initialize toggle switches
    const weatherToggle = document.getElementById('mobile-weather-toggle');
    const trafficToggle = document.getElementById('mobile-traffic-toggle');
    const evacuationToggle = document.getElementById('mobile-evacuation-routes-toggle');
    const warningsToggle = document.getElementById('mobile-warnings-toggle');
    const camerasToggle = document.getElementById('mobile-cameras-toggle');
    
    if (weatherToggle) {
        weatherToggle.addEventListener('change', () => {
            // Toggle weather layer
            console.log('Weather toggle:', weatherToggle.checked);
        });
    }
    
    if (trafficToggle) {
        trafficToggle.addEventListener('change', () => {
            // Toggle traffic layer
            if (window.trafficLayerManager) {
                if (trafficToggle.checked) {
                    window.trafficLayerManager.enableTrafficLayer();
                } else {
                    window.trafficLayerManager.disableTrafficLayer();
                }
            }
        });
    }
    
    if (evacuationToggle) {
        evacuationToggle.addEventListener('change', () => {
            // Toggle evacuation routes
            if (window.evacuationRoutesManager) {
                if (evacuationToggle.checked) {
                    window.evacuationRoutesManager.enableRoutes();
                } else {
                    window.evacuationRoutesManager.disableRoutes();
                }
            }
        });
    }

    if (warningsToggle) {
        warningsToggle.addEventListener('change', () => {
            // Toggle warnings visibility
            if (!window.mapManager || !window.mapManager.map) {
                console.warn('Map manager not available');
                return;
            }

            if (warningsToggle.checked) {
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
        });
    }

    if (camerasToggle) {
        camerasToggle.addEventListener('change', () => {
            // Toggle cameras visibility
            if (!window.mapManager || !window.mapManager.map) {
                console.warn('Map manager not available');
                return;
            }

            if (camerasToggle.checked) {
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
        });
    }
    
    // Menu button handlers
    const hotelSearchBtn = document.getElementById('mobile-hotel-search-btn');
    const safetyEvalBtn = document.getElementById('mobile-safety-eval-btn');
    
    if (hotelSearchBtn) {
        hotelSearchBtn.addEventListener('click', () => {
            // Open hotel search
            alert('Hotel search feature coming soon!');
            menuOverlay.classList.remove('active');
        });
    }
    
    if (safetyEvalBtn) {
        safetyEvalBtn.addEventListener('click', () => {
            // Open safety evaluation
            const popup = document.getElementById('mobile-safety-popup-modal');
            if (popup) {
                popup.classList.add('active');
            }
            menuOverlay.classList.remove('active');
        });
    }
}

// Mobile Address Bar Functions
function initMobileAddressBar() {
    const addressBar = document.getElementById('mobile-address-bar');
    const addressToggle = document.getElementById('mobile-address-toggle');
    const addressContent = document.getElementById('mobile-address-content');
    
    if (addressToggle) {
        addressToggle.addEventListener('click', () => {
            const isExpanded = addressBar.classList.contains('expanded');
            
            if (isExpanded) {
                addressBar.classList.remove('expanded');
                addressContent.style.display = 'none';
            } else {
                addressBar.classList.add('expanded');
                addressContent.style.display = 'block';
            }
            
            adjustMapPosition();
        });
    }
    
    // Address search
    const geocodeBtn = document.getElementById('mobile-geocode-btn');
    const addressInput = document.getElementById('mobile-address-input');
    
    if (geocodeBtn && addressInput) {
        geocodeBtn.addEventListener('click', async () => {
            const address = addressInput.value.trim();
            if (!address) return;
            
            try {
                // Use existing geocoding function or create new one
                const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1`);
                const data = await response.json();
                
                if (data && data.length > 0) {
                    const lat = parseFloat(data[0].lat);
                    const lng = parseFloat(data[0].lon);
                    
                    if (mobileMapManager && mobileMapManager.map) {
                        mobileMapManager.map.setView([lat, lng], 15);
                        L.marker([lat, lng]).addTo(mobileMapManager.map)
                            .bindPopup(address)
                            .openPopup();
                    }
                }
            } catch (error) {
                console.error('Geocoding error:', error);
                alert('Could not find that address. Please try again.');
            }
        });
        
        // Enter key support
        addressInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                geocodeBtn.click();
            }
        });
    }
}

// Mobile Legend Functions
function initMobileLegend() {
    const legend = document.getElementById('mobile-legend');
    const legendToggle = document.getElementById('mobile-legend-toggle');
    const legendContent = document.getElementById('mobile-legend-content');
    
    if (legendToggle) {
        legendToggle.addEventListener('click', () => {
            const isExpanded = legend.classList.contains('expanded');
            
            if (isExpanded) {
                legend.classList.remove('expanded');
                legendContent.style.display = 'none';
            } else {
                legend.classList.add('expanded');
                legendContent.style.display = 'block';
            }
        });
    }
}

// Mobile Bottom Navigation Functions
function initMobileBottomNav() {
    const navItems = document.querySelectorAll('.mobile-nav-item');
    
    navItems.forEach(item => {
        item.addEventListener('click', () => {
            // Remove active class from all items
            navItems.forEach(nav => nav.classList.remove('active'));
            
            // Add active class to clicked item
            item.classList.add('active');
            
            const view = item.getAttribute('data-view');
            
            switch(view) {
                case 'map':
                    // Show map (already visible)
                    break;
                case 'warnings':
                    // Show warnings list or filter
                    alert('Warnings view coming soon!');
                    break;
                case 'menu':
                    // Open menu
                    document.getElementById('mobile-menu-overlay').classList.add('active');
                    break;
                case 'chat':
                    // Open chatbot
                    const chatbotSheet = document.getElementById('mobile-chatbot-sheet');
                    if (chatbotSheet) {
                        chatbotSheet.classList.add('active');
                    }
                    break;
            }
        });
    });
}

// Mobile Chatbot Sheet Functions
function initMobileChatbotSheet() {
    const chatbotFAB = document.getElementById('mobile-chatbot-fab');
    const chatbotSheet = document.getElementById('mobile-chatbot-sheet');
    const chatbotClose = document.getElementById('mobile-chatbot-close');
    const chatbotHandle = document.getElementById('mobile-chatbot-handle');
    
    // Open chatbot
    if (chatbotFAB) {
        chatbotFAB.addEventListener('click', () => {
            if (chatbotSheet) {
                chatbotSheet.classList.add('active');
                chatbotFAB.style.display = 'none';
            }
        });
    }
    
    // Close chatbot
    if (chatbotClose) {
        chatbotClose.addEventListener('click', () => {
            if (chatbotSheet) {
                chatbotSheet.classList.remove('active');
                if (chatbotFAB) {
                    chatbotFAB.style.display = 'flex';
                }
            }
        });
    }
    
    // Swipe down to close (simplified - full implementation would need touch event handlers)
    if (chatbotHandle) {
        let startY = 0;
        let currentY = 0;
        let isDragging = false;
        
        chatbotHandle.addEventListener('touchstart', (e) => {
            startY = e.touches[0].clientY;
            isDragging = true;
        });
        
        chatbotHandle.addEventListener('touchmove', (e) => {
            if (!isDragging) return;
            currentY = e.touches[0].clientY;
            const diff = currentY - startY;
            
            if (diff > 50 && chatbotSheet.classList.contains('active')) {
                chatbotSheet.classList.remove('active');
                if (chatbotFAB) {
                    chatbotFAB.style.display = 'flex';
                }
                isDragging = false;
            }
        });
        
        chatbotHandle.addEventListener('touchend', () => {
            isDragging = false;
        });
    }
}

// Adjust map position based on UI state
function adjustMapPosition() {
    const mapContainer = document.getElementById('map-area');
    if (!mapContainer) return;
    
    const addressBar = document.getElementById('mobile-address-bar');
    const isAddressExpanded = addressBar && addressBar.classList.contains('expanded');
    
    // Adjust top position based on address bar state
    if (isAddressExpanded) {
        // Map starts below expanded address bar
        // This is already handled by CSS, but we can add logic here if needed
    }
}

// Prevent scrolling when interacting with map
document.addEventListener('touchmove', (e) => {
    if (e.target.closest('#map-area')) {
        // Allow map panning
        return;
    }
    
    // Prevent body scroll
    if (!e.target.closest('.mobile-chatbot-messages') && 
        !e.target.closest('.mobile-menu-content')) {
        // Allow scrolling in specific containers
        return;
    }
}, { passive: false });

