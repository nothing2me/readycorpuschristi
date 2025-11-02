/**
 * Main application initialization and coordination
 * Connects map manager and chatbot manager
 */

// Global instances
let mapManager;
let chatbotManager;

/**
 * Initialize the application when DOM is loaded
 */
document.addEventListener('DOMContentLoaded', () => {
    // Initialize Map Manager
    mapManager = new MapManager();
    mapManager.init();
    window.mapManager = mapManager; // Make available globally for chatbot context

    // Initialize Chatbot Manager
    chatbotManager = new ChatbotManager();
    window.chatbotManager = chatbotManager; // Make available globally for popup manager

    // Initialize address input handler
    initAddressInput();

    // Initialize sidebar toggle
    initSidebarToggle();

    // Initialize zone selector
    initZoneSelector();
});

/**
 * Initialize address input and geocoding
 */
function initAddressInput() {
    const addressInput = document.getElementById('address-input');
    const geocodeBtn = document.getElementById('geocode-btn');

    // Geocode button click
    geocodeBtn.addEventListener('click', async () => {
        await handleAddressGeocode();
    });

    // Enter key press
    addressInput.addEventListener('keypress', async (e) => {
        if (e.key === 'Enter') {
            await handleAddressGeocode();
        }
    });
}

/**
 * Handle address geocoding
 */
async function handleAddressGeocode() {
    const addressInput = document.getElementById('address-input');
    const address = addressInput.value.trim();

    if (!address) {
        alert('Please enter an address');
        return;
    }

    try {
        // Show loading state
        const geocodeBtn = document.getElementById('geocode-btn');
        geocodeBtn.disabled = true;
        geocodeBtn.textContent = 'Searching...';

        // Geocode address
        const result = await mapManager.geocodeAddress(address);

        // Note: Removed automatic chatbot message - user should explicitly ask questions
        // The chatbot will still have access to the location context when the user sends a message

        // Reset button
        geocodeBtn.disabled = false;
        geocodeBtn.textContent = 'Search';
    } catch (error) {
        // Reset button
        const geocodeBtn = document.getElementById('geocode-btn');
        geocodeBtn.disabled = false;
        geocodeBtn.textContent = 'Search';

        // Show error
        alert(`Error: ${error.message}`);
        console.error('Geocoding error:', error);
    }
}

/**
 * Initialize zone selector dropdown
 */
function initZoneSelector() {
    const zoneSelectorToggle = document.getElementById('zone-selector-toggle');
    const zoneSelectorDropdown = document.getElementById('zone-selector-dropdown');
    
    if (!zoneSelectorToggle || !zoneSelectorDropdown) {
        return;
    }
    
    // Get checkboxes after confirming dropdown exists
    const zoneCheckboxes = document.querySelectorAll('.zone-checkbox');
    
    // Ensure checkboxes are enabled and stay enabled
    // The flood zone manager might disable them, but we'll re-enable them
    function ensureCheckboxesEnabled() {
        zoneCheckboxes.forEach(checkbox => {
            checkbox.disabled = false;
        });
    }
    
    // Enable checkboxes now
    ensureCheckboxesEnabled();
    
    // Re-enable checkboxes periodically (in case flood zone manager disables them)
    // Also re-enable after a short delay to catch async operations
    setTimeout(ensureCheckboxesEnabled, 100);
    setTimeout(ensureCheckboxesEnabled, 500);
    setTimeout(ensureCheckboxesEnabled, 1000);
    
    // Toggle dropdown on button click
    zoneSelectorToggle.addEventListener('click', (e) => {
        e.stopPropagation();
        zoneSelectorDropdown.classList.toggle('active');
        
        // Rotate arrow
        const arrow = zoneSelectorToggle.querySelector('.dropdown-arrow');
        if (arrow) {
            if (zoneSelectorDropdown.classList.contains('active')) {
                arrow.textContent = '▲';
            } else {
                arrow.textContent = '▼';
            }
        }
    });
    
    // Handle checkbox changes directly on each checkbox
    zoneCheckboxes.forEach(checkbox => {
        // Handle change event (more reliable than click for checkboxes)
        checkbox.addEventListener('change', async function(e) {
            e.stopPropagation();
            const zoneId = parseInt(this.getAttribute('data-zone-id'));
            const isChecked = this.checked;
            
            console.log('Checkbox changed:', zoneId, isChecked);
            
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
        });
        
        // Also handle click event for labels (since clicking label toggles checkbox)
        // Note: Clicking a label automatically toggles the associated checkbox,
        // so we don't need to manually toggle it, but we should ensure the change event fires
        const label = checkbox.closest('.zone-checkbox-label');
        if (label) {
            label.addEventListener('click', function(e) {
                // Stop propagation to keep dropdown open, but don't prevent checkbox toggle
                // The label's association with the checkbox will handle the toggle
                if (e.target !== checkbox && !checkbox.contains(e.target)) {
                    e.stopPropagation();
                }
            });
        }
    });
    
    // Prevent dropdown from closing when clicking inside it
    // But allow checkbox clicks to work properly
    zoneSelectorDropdown.addEventListener('click', function(e) {
        // Don't stop propagation for the toggle button
        if (!zoneSelectorToggle.contains(e.target)) {
            // Only stop propagation for clicks that aren't on checkboxes or labels
            // This prevents the dropdown from closing while allowing checkboxes to toggle
            const isCheckboxOrLabel = e.target.classList.contains('zone-checkbox') || 
                                      e.target.closest('.zone-checkbox-label');
            if (!isCheckboxOrLabel) {
                e.stopPropagation();
            }
        }
    });
    
    // Close dropdown when clicking outside
    document.addEventListener('click', (e) => {
        // Check if click is outside the dropdown
        if (!zoneSelectorToggle.contains(e.target) && !zoneSelectorDropdown.contains(e.target)) {
            zoneSelectorDropdown.classList.remove('active');
            const arrow = zoneSelectorToggle.querySelector('.dropdown-arrow');
            if (arrow) {
                arrow.textContent = '▼';
            }
        }
    });
}

/**
 * Initialize sidebar toggle functionality
 */
function initSidebarToggle() {
    const sidebarTab = document.getElementById('sidebar-tab');
    const sidebar = document.getElementById('sidebar');

    if (!sidebarTab || !sidebar) {
        return;
    }

    // Auto-slide out on page load (start closed, then animate open)
    setTimeout(() => {
        sidebar.classList.add('open');
        // Update tab icon rotation
        const tabIcon = sidebarTab.querySelector('.tab-icon');
        if (tabIcon) {
            tabIcon.style.transform = 'rotate(180deg)';
        }
    }, 100); // Small delay to ensure page is loaded

    // Toggle sidebar on tab click
    sidebarTab.addEventListener('click', () => {
        sidebar.classList.toggle('open');
        // Update tab icon rotation
        const tabIcon = sidebarTab.querySelector('.tab-icon');
        if (tabIcon) {
            if (sidebar.classList.contains('open')) {
                tabIcon.style.transform = 'rotate(180deg)';
            } else {
                tabIcon.style.transform = 'rotate(0deg)';
            }
        }
    });

    // Close sidebar when clicking outside (optional)
    document.addEventListener('click', (e) => {
        if (sidebar.classList.contains('open') && 
            !sidebar.contains(e.target) && 
            !sidebarTab.contains(e.target)) {
            // Uncomment this if you want clicking outside to close the sidebar
            // sidebar.classList.remove('open');
        }
    });
}

