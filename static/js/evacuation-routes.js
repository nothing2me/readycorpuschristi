/**
 * Evacuation Routes Manager
 * Handles display of evacuation routes on the map
 */

class EvacuationRoutesManager {
    constructor() {
        this.routes = [];
        this.polylines = [];
        this.isEnabled = false;
    }

    /**
     * Initialize evacuation routes with Corpus Christi routes
     * Routes are loaded from the backend which fetches actual OSM data
     */
    async init() {
        try {
            // Fetch routes from backend (which uses OSM data)
            const response = await fetch('/api/evacuation-routes/all');
            
            if (response.ok) {
                const data = await response.json();
                if (data.status === 'success' && data.routes) {
                    this.routes = data.routes;
                    console.log(`Loaded ${data.routes.length} evacuation routes from OSM`);
                    return;
                }
            }
            
            // Fallback to default routes if API fails
            console.warn('Failed to load routes from OSM, using fallback routes');
            this.routes = this.getFallbackRoutes();
            
        } catch (error) {
            console.error('Error loading evacuation routes:', error);
            // Use fallback routes
            this.routes = this.getFallbackRoutes();
        }
    }

    /**
     * Get fallback routes if OSM data is unavailable
     */
    getFallbackRoutes() {
        // Define Corpus Christi evacuation routes based on actual highways
        // These are major highways and routes used for evacuation during hurricanes
        return [
            {
                id: 1,
                name: 'North Route - I-37',
                highway: 'Interstate 37 (I-37)',
                description: 'Primary northbound evacuation route via Interstate 37',
                nextCity: 'San Antonio',
                distance: '150 miles',
                color: '#e67e22', // Orange
                weight: 5,
                coordinates: [
                    [27.7225, -97.3956],  // SPID/I-37 interchange area
                    [27.7564, -97.4042],  // SH-359/I-37
                    [27.7834, -97.4132],  // Weber Road/I-37
                    [27.7912, -97.4215],  // Ayers Street/I-37
                    [27.8500, -97.4400],  // North towards Three Rivers
                    [27.9000, -97.4600],  // Continuing north
                    [28.0500, -97.4800],  // Approaching San Antonio area
                    [28.2000, -97.5000]   // Near San Antonio
                ]
            },
            {
                id: 2,
                name: 'West Route - US-181',
                highway: 'US Highway 181',
                description: 'Westbound evacuation route via US-181 to Victoria',
                nextCity: 'Victoria',
                distance: '45 miles',
                color: '#3498db', // Blue
                weight: 5,
                coordinates: [
                    [27.7134, -97.3718],  // SH-361/US-181 area
                    [27.7345, -97.3829],  // Port Avenue/US-181
                    [27.7650, -97.4100],  // West Corpus Christi
                    [27.8000, -97.4800],  // Continuing west
                    [27.8500, -97.5500],  // Towards Robstown area
                    [27.9000, -97.6200],  // West towards Victoria
                    [28.0500, -97.6800],  // Approaching Victoria
                    [28.8000, -97.0036]   // Victoria
                ]
            },
            {
                id: 3,
                name: 'Northwest Route - SH-44',
                highway: 'State Highway 44',
                description: 'Northwest evacuation route via SH-44',
                nextCity: 'Alice',
                distance: '35 miles',
                color: '#2ecc71', // Green
                weight: 5,
                coordinates: [
                    [27.7089, -97.3934],  // Staples Street area
                    [27.7167, -97.4012],  // Airline Road area
                    [27.7500, -97.4500],  // Northwest towards Robstown
                    [27.8000, -97.5200],  // Robstown area
                    [27.8500, -97.5800],  // Continuing northwest
                    [27.9000, -97.6400],  // Towards Alice
                    [27.7522, -98.0700]   // Alice
                ]
            },
            {
                id: 4,
                name: 'South Route - SH-358',
                highway: 'State Highway 358 (SPID)',
                description: 'South evacuation route via SH-358 (South Padre Island Drive)',
                nextCity: 'Padre Island',
                distance: '15 miles',
                color: '#9b59b6', // Purple
                weight: 5,
                coordinates: [
                    [27.7225, -97.3956],  // SPID/I-37 area
                    [27.7156, -97.3945],  // Padre Island Drive
                    [27.7000, -97.3800],  // South Corpus Christi
                    [27.6800, -97.3700],  // Continuing south
                    [27.6500, -97.3600],  // South towards Padre Island
                    [27.6300, -97.3400],  // Padre Island area
                    [27.6150, -97.3200]   // Padre Island
                ]
            },
            {
                id: 5,
                name: 'East Route - SH-358/Portland',
                highway: 'SH-358 East to Portland',
                description: 'Eastbound evacuation route via SH-358 to Portland and beyond',
                nextCity: 'Portland',
                distance: '8 miles',
                color: '#f39c12', // Orange-Yellow
                weight: 5,
                coordinates: [
                    [27.7225, -97.3956],  // SPID/I-37
                    [27.7500, -97.3500],  // East towards Portland
                    [27.7800, -97.3200],  // Approaching Portland
                    [27.8774, -97.3187]   // Portland
                ]
            },
            {
                id: 6,
                name: 'SH-43 Evacuation Route',
                highway: 'State Highway 43',
                description: 'Evacuation route via State Highway 43 to Mathis and beyond',
                nextCity: 'Mathis',
                distance: '30 miles',
                color: '#d35400', // Dark Orange
                weight: 5,
                coordinates: [
                    [27.8006, -97.3964],  // Corpus Christi center (SH-43 begins here)
                    [27.7850, -97.4100],  // Following SH-43 north
                    [27.7700, -97.4300],  // Continuing on SH-43
                    [27.8000, -97.5500],  // North on SH-43
                    [27.9000, -97.7000],  // Approaching Mathis
                    [28.0936, -97.8281]   // Mathis (SH-43 continues north)
                ]
            },
            {
                id: 7,
                name: 'Coastal Route - SH-357',
                highway: 'State Highway 357',
                description: 'Coastal evacuation route via SH-357 along the bay',
                nextCity: 'Port Aransas',
                distance: '25 miles',
                color: '#16a085', // Teal
                weight: 4,
                coordinates: [
                    [27.8006, -97.3964],  // Corpus Christi center
                    [27.8200, -97.3500],  // East on SH-357
                    [27.8300, -97.2000],  // Continuing east
                    [27.8339, -97.0614]   // Port Aransas area
                ]
            },
            {
                id: 8,
                name: 'SH-43 / FM 2444 Route',
                highway: 'State Highway 43 / FM 2444',
                description: 'North evacuation route via SH-43 and FM 2444',
                nextCity: 'Beeville',
                distance: '40 miles',
                color: '#8e44ad', // Purple
                weight: 5,
                coordinates: [
                    [27.8006, -97.3964],  // Corpus Christi center (SH-43 begins)
                    [27.8500, -97.4500],  // North on SH-43
                    [28.0000, -97.6000],  // Continuing north on SH-43
                    [28.1500, -97.6500],  // Connecting to FM 2444
                    [28.3000, -97.7000],  // North on FM 2444
                    [28.4009, -97.7481]   // Beeville area
                ]
            },
            {
                id: 9,
                name: 'South Staples St to FM 2444',
                highway: 'Staples Street / FM 2444',
                description: 'North evacuation route from South Staples Street to FM 2444',
                nextCity: 'Beeville',
                distance: '45 miles',
                color: '#1abc9c', // Turquoise
                weight: 5,
                coordinates: [
                    [27.7089, -97.3934],  // SPID at Staples Street (South Staples Street intersection)
                    [27.7200, -97.3934],  // North on Staples Street
                    [27.7500, -97.3934],  // Continuing north on Staples
                    [27.7800, -97.3950],  // Connecting to north roads
                    [27.8500, -97.4200],  // Heading toward FM 2444
                    [27.9500, -97.4800],  // Approaching FM 2444 connection
                    [28.0500, -97.5500],  // Connecting to FM 2444
                    [28.2000, -97.6500],  // North on FM 2444
                    [28.4009, -97.7481]   // Beeville area
                ]
            }
        ];
    }

    /**
     * Enable evacuation routes layer
     */
    enableRoutes() {
        if (!window.mapManager || !window.mapManager.map) {
            console.warn('Map manager not initialized');
            return;
        }

        if (this.isEnabled) {
            return; // Already enabled
        }

        this.routes.forEach(route => {
            this.displayRoute(route);
        });

        this.isEnabled = true;
    }

    /**
     * Disable evacuation routes layer
     */
    disableRoutes() {
        if (!window.mapManager || !window.mapManager.map) {
            return;
        }

        // Remove all polylines from map
        this.polylines.forEach(polyline => {
            window.mapManager.map.removeLayer(polyline);
        });

        this.polylines = [];
        this.isEnabled = false;
    }

    /**
     * Display a single evacuation route on the map
     */
    displayRoute(route) {
        if (!window.mapManager || !window.mapManager.map) {
            return;
        }

        // Create thicker outline polyline (white/black background for visibility)
        const outlineWeight = (route.weight || 5) * 2 + 4; // Much thicker outline
        const outlinePolyline = L.polyline(route.coordinates, {
            color: '#ffffff', // White outline
            weight: outlineWeight,
            opacity: 0.9,
            dashArray: '10, 10',
            lineJoin: 'round',
            lineCap: 'round',
            interactive: false // Don't make outline interactive
        }).addTo(window.mapManager.map);

        // Create main colored polyline on top (thicker than before)
        const mainWeight = (route.weight || 5) * 2; // Double the thickness
        const polyline = L.polyline(route.coordinates, {
            color: route.color,
            weight: mainWeight,
            opacity: 0.95,
            dashArray: '10, 10', // Dashed line pattern
            lineJoin: 'round',
            lineCap: 'round',
            interactive: true
        }).addTo(window.mapManager.map);

        // Add popup with detailed route information
        const popupContent = `
            <div style="padding: 10px; min-width: 250px;">
                <div style="font-weight: 600; margin-bottom: 8px; color: ${route.color}; font-size: 14px; border-bottom: 2px solid ${route.color}; padding-bottom: 5px;">
                    🚗 ${route.name}
                </div>
                <div style="margin-bottom: 8px;">
                    <div style="font-weight: 600; color: #333; margin-bottom: 4px;">Route Highway:</div>
                    <div style="font-size: 13px; color: #555; padding-left: 8px;">
                        ${route.highway}
                    </div>
                </div>
                <div style="margin-bottom: 8px;">
                    <div style="font-weight: 600; color: #333; margin-bottom: 4px;">Next City:</div>
                    <div style="font-size: 13px; color: #555; padding-left: 8px;">
                        📍 ${route.nextCity} - <strong>${route.distance}</strong>
                    </div>
                </div>
                <div style="margin-bottom: 4px;">
                    <div style="font-size: 11px; color: #777; font-style: italic;">
                        ${route.description}
                    </div>
                </div>
                <div style="font-size: 10px; color: #999; margin-top: 8px; padding-top: 5px; border-top: 1px solid #ddd;">
                    Route ID: ${route.id} • Evacuation Route
                </div>
            </div>
        `;

        polyline.bindPopup(popupContent);

        // Store both polyline references (outline and main)
        this.polylines.push(outlinePolyline);
        this.polylines.push(polyline);
    }

    /**
     * Toggle evacuation routes on/off
     */
    toggle() {
        if (this.isEnabled) {
            this.disableRoutes();
        } else {
            this.enableRoutes();
        }
        return this.isEnabled;
    }

    /**
     * Check if routes are enabled
     */
    getEnabled() {
        return this.isEnabled;
    }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    window.evacuationRoutesManager = new EvacuationRoutesManager();
    window.evacuationRoutesManager.init();
});

