/**
 * Flood Zone Manager
 * Handles flood zone overlays on the map
 */

class FloodZoneManager {
    constructor() {
        this.zones = [];
        this.overlays = new Map(); // Map of zone_id -> Leaflet overlay
        this.anchors = new Map(); // Map of zone_id -> anchor marker
        this.borders = new Map(); // Map of zone_id -> border polygon/polyline
        this.baseZoneSizes = new Map(); // Map of zone_id -> base {latSize, lngSize} (never changes)
        this.currentScale = 100; // Current scale percentage (100 = no scaling)
        this.currentRotation = 0; // Current rotation in degrees
        this.selectedZoneId = null; // Currently selected zone for individual controls
        this.isDraggingWindow = false;
        this.windowDragOffset = { x: 0, y: 0 };
        this.showBorders = false; // Whether borders are currently visible
        this.init();
    }

    init() {
        // Load zones from backend
        this.loadZones();
    }

    /**
     * Toggle individual zone visibility
     * @param {number} zoneId - Zone ID to toggle
     * @param {boolean} show - Whether to show or hide the zone
     */
    async toggleZone(zoneId, show) {
        // If zones aren't loaded yet, wait for them
        if (this.zones.length === 0) {
            console.log('Zones not loaded yet, loading now...');
            await this.loadZones();
            console.log(`Loaded ${this.zones.length} zones. Zone IDs:`, this.zones.map(z => z.id));
        }
        
        const zone = this.zones.find(z => z.id === zoneId);
        if (!zone) {
            console.error(`Zone ${zoneId} not found. Available zones:`, this.zones.map(z => `${z.id} (${z.name})`));
            console.error('Zone data:', this.zones);
            return;
        }

        const overlay = this.overlays.get(zoneId);

        if (show) {
            // Show zone if it doesn't exist yet
            if (!overlay) {
                this.addZoneOverlay(zone);
            } else {
                // Zone already exists, just make sure it's visible
                if (window.mapManager && window.mapManager.map) {
                    overlay.addTo(window.mapManager.map);
                }
            }
        } else {
            // Hide zone
            if (overlay && window.mapManager && window.mapManager.map) {
                window.mapManager.map.removeLayer(overlay);
            }
        }
        
        // After toggling, refresh display to ensure zoom and positioning are correct
        // Use a small delay to allow overlay to be added/removed first
        setTimeout(() => {
            this.displayZones();
            
            // Update any existing marker popups to reflect zone visibility changes
            if (window.mapManager && window.mapManager.currentMarker) {
                const marker = window.mapManager.currentMarker;
                const latlng = marker.getLatLng();
                const address = window.mapManager.currentAddress || `${latlng.lat}, ${latlng.lng}`;
                
                // Re-check flood zone with updated zone visibility
                const floodZone = window.mapManager.getFloodZoneAtLocation(latlng.lat, latlng.lng);
                window.mapManager.currentFloodZone = floodZone;
                
                // Update popup content
                const popupContent = window.mapManager.createMarkerPopupContent(address, latlng.lat, latlng.lng, floodZone);
                marker.setPopupContent(popupContent);
                
                // If popup was open, restart auto-close timer (shorter timeout since user already saw it)
                if (marker.isPopupOpen()) {
                    if (marker.popupTimeout) {
                        clearTimeout(marker.popupTimeout);
                    }
                    marker.popupTimeout = setTimeout(() => {
                        if (marker && marker.isPopupOpen()) {
                            marker.closePopup();
                        }
                    }, 3000);
                }
            }
        }, 50);
    }

    /**
     * Initialize the border control window (draggable) - REMOVED
     */
    initBorderControlWindow() {
        const controlWindow = document.getElementById('zone-border-control-window');
        const dragHandle = document.getElementById('zone-border-control-drag-handle');
        const closeBtn = document.getElementById('close-border-control-btn');
        const toggleBtn = document.getElementById('toggle-borders-btn');
        const weightSlider = document.getElementById('border-weight-slider');
        const opacitySlider = document.getElementById('border-opacity-slider');
        const styleSelect = document.getElementById('border-style-select');
        const weightValue = document.getElementById('border-weight-value');
        const opacityValue = document.getElementById('border-opacity-value');

        if (!controlWindow || !dragHandle || !closeBtn || !toggleBtn) {
            console.warn('Border control window elements not found');
            return;
        }

        // Drag functionality
        let isDragging = false;
        let dragOffset = { x: 0, y: 0 };

        dragHandle.addEventListener('mousedown', (e) => {
            isDragging = true;
            const rect = controlWindow.getBoundingClientRect();
            dragOffset.x = e.clientX - rect.left;
            dragOffset.y = e.clientY - rect.top;
            controlWindow.style.cursor = 'move';
            e.preventDefault();
        });

        document.addEventListener('mousemove', (e) => {
            if (!isDragging) return;
            
            const x = e.clientX - dragOffset.x;
            const y = e.clientY - dragOffset.y;
            
            // Keep window within viewport
            const maxX = window.innerWidth - controlWindow.offsetWidth;
            const maxY = window.innerHeight - controlWindow.offsetHeight;
            
            controlWindow.style.left = Math.max(0, Math.min(x, maxX)) + 'px';
            controlWindow.style.top = Math.max(0, Math.min(y, maxY)) + 'px';
        });

        document.addEventListener('mouseup', () => {
            if (isDragging) {
                isDragging = false;
                controlWindow.style.cursor = 'default';
            }
        });

        // Close button
        closeBtn.addEventListener('click', () => {
            controlWindow.style.display = 'none';
        });

        // Toggle borders button
        toggleBtn.addEventListener('click', () => {
            this.toggleBorders();
            toggleBtn.textContent = this.showBorders ? 'Hide Borders' : 'Show Borders';
        });

        // Border weight slider
        if (weightSlider && weightValue) {
            weightSlider.addEventListener('input', (e) => {
                const weight = parseInt(e.target.value);
                weightValue.textContent = weight;
                
                // Update all existing borders
                this.borders.forEach((border, zoneId) => {
                    border.setStyle({ weight: weight });
                });
            });
        }

        // Border opacity slider
        if (opacitySlider && opacityValue) {
            opacitySlider.addEventListener('input', (e) => {
                const opacity = parseFloat(e.target.value);
                opacityValue.textContent = opacity.toFixed(1);
                
                // Update all existing borders
                this.borders.forEach((border, zoneId) => {
                    border.setStyle({ opacity: opacity });
                });
            });
        }

        // Border style select
        if (styleSelect) {
            styleSelect.addEventListener('change', (e) => {
                const style = e.target.value;
                let dashArray = null;
                
                switch (style) {
                    case 'dashed':
                        dashArray = '10, 5';
                        break;
                    case 'dotted':
                        dashArray = '3, 3';
                        break;
                    default:
                        dashArray = null;
                }
                
                // Update all existing borders
                this.borders.forEach((border, zoneId) => {
                    border.setStyle({ dashArray: dashArray });
                });
            });
        }

        // Initialize window position (center-right of screen)
        setTimeout(() => {
            const windowWidth = controlWindow.offsetWidth || 200;
            controlWindow.style.left = (window.innerWidth - windowWidth - 20) + 'px';
            controlWindow.style.top = '20px';
        }, 100);
    }

    /**
     * Show the border control window
     */
    showBorderControlWindow() {
        const controlWindow = document.getElementById('zone-border-control-window');
        if (controlWindow) {
            controlWindow.style.display = 'block';
        }
    }

    /**
     * Hide the border control window
     */
    hideBorderControlWindow() {
        const controlWindow = document.getElementById('zone-border-control-window');
        if (controlWindow) {
            controlWindow.style.display = 'none';
        }
    }

    /**
     * Initialize control window UI handlers
     */
    initControlWindow() {
        const controlWindow = document.getElementById('flood-zone-control-window');
        const dragHandle = document.getElementById('flood-zone-control-drag-handle');
        const closeBtn = document.getElementById('close-zone-control-btn');
        const scaleSlider = document.getElementById('zone-scale-slider');
        const scaleValue = document.getElementById('scale-value');
        const rotationSlider = document.getElementById('zone-rotation-slider');
        const rotationValue = document.getElementById('rotation-value');
        const saveBtn = document.getElementById('save-zones-scale-btn');
        const saveAllPositionsBtn = document.getElementById('save-all-positions-btn');

        if (!controlWindow || !dragHandle || !closeBtn || !scaleSlider || !scaleValue || 
            !rotationSlider || !rotationValue || !saveBtn || !saveAllPositionsBtn) {
            console.warn('Control window elements not found');
            return;
        }

        // Make window draggable
        dragHandle.addEventListener('mousedown', (e) => {
            this.isDraggingWindow = true;
            const rect = controlWindow.getBoundingClientRect();
            this.windowDragOffset.x = e.clientX - rect.left;
            this.windowDragOffset.y = e.clientY - rect.top;
            e.preventDefault();
        });

        document.addEventListener('mousemove', (e) => {
            if (this.isDraggingWindow) {
                const x = e.clientX - this.windowDragOffset.x;
                const y = e.clientY - this.windowDragOffset.y;
                
                // Keep window within viewport
                const maxX = window.innerWidth - controlWindow.offsetWidth;
                const maxY = window.innerHeight - controlWindow.offsetHeight;
                
                controlWindow.style.left = Math.max(0, Math.min(x, maxX)) + 'px';
                controlWindow.style.top = Math.max(0, Math.min(y, maxY)) + 'px';
            }
        });

        document.addEventListener('mouseup', () => {
            this.isDraggingWindow = false;
        });

        // Close button
        closeBtn.addEventListener('click', () => {
            controlWindow.style.display = 'none';
        });

        // Scale slider
        scaleSlider.addEventListener('input', (e) => {
            const scale = parseInt(e.target.value);
            scaleValue.textContent = scale;
            this.currentScale = scale;
            
            if (this.selectedZoneId) {
                // Apply to selected zone only
                this.applyScaleToZone(this.selectedZoneId, scale / 100);
            } else {
                // Fallback to all zones if no zone selected
                this.applyScaleToAllZones(scale / 100);
            }
        });

        // Rotation slider
        rotationSlider.addEventListener('input', (e) => {
            const rotation = parseInt(e.target.value);
            rotationValue.textContent = rotation;
            this.currentRotation = rotation;
            
            if (this.selectedZoneId) {
                // Apply to selected zone only
                this.applyRotationToZone(this.selectedZoneId, rotation);
            } else {
                // Fallback to all zones if no zone selected
                this.applyRotationToAllZones(rotation);
            }
        });

        // Save button (for current zone transform)
        saveBtn.addEventListener('click', async () => {
            if (this.selectedZoneId) {
                await this.saveZoneTransform(this.selectedZoneId);
            } else {
                await this.saveAllZonesTransform();
            }
        });

        // Save all positions button
        saveAllPositionsBtn.addEventListener('click', async () => {
            await this.saveAllZonePositions();
        });

        // Initialize window position
        const computedStyle = window.getComputedStyle(controlWindow);
        if (!computedStyle.left || computedStyle.left === 'auto' || computedStyle.left === '0px') {
            controlWindow.style.left = '20px';
        }
        if (!computedStyle.top || computedStyle.top === 'auto' || computedStyle.top === '0px') {
            controlWindow.style.top = '100px';
        }
    }

    /**
     * Load all flood zones from backend
     */
    async loadZones() {
        try {
            const response = await fetch('/api/flood-zones/all');
            const data = await response.json();

            if (data.status === 'success') {
                this.zones = data.zones || [];
                
                // Update zone checkboxes based on loaded zones
                this.updateZoneCheckboxes();
                
                // Display zones that are checked
                this.displayZones();
                console.log(`Loaded ${this.zones.length} flood zones`);
            } else {
                console.error('Failed to load flood zones:', data.error);
            }
        } catch (error) {
            console.error('Error loading flood zones:', error);
        }
    }

    /**
     * Detect the bounding box of colored pixels in an image
     * Returns { minX, minY, maxX, maxY } in image coordinates, or null if detection fails
     */
    detectImageContentBounds(imgElement) {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = imgElement.naturalWidth || imgElement.width;
        canvas.height = imgElement.naturalHeight || imgElement.height;
        
        try {
            ctx.drawImage(imgElement, 0, 0);
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const data = imageData.data;
            
            let minX = canvas.width;
            let minY = canvas.height;
            let maxX = 0;
            let maxY = 0;
            let foundColoredPixel = false;
            
            // Scan all pixels to find the bounding box of non-transparent pixels
            for (let y = 0; y < canvas.height; y++) {
                for (let x = 0; x < canvas.width; x++) {
                    const index = (y * canvas.width + x) * 4;
                    const alpha = data[index + 3];
                    
                    if (alpha >= 10) { // Not transparent
                        foundColoredPixel = true;
                        if (x < minX) minX = x;
                        if (x > maxX) maxX = x;
                        if (y < minY) minY = y;
                        if (y > maxY) maxY = y;
                    }
                }
            }
            
            if (foundColoredPixel) {
                return {
                    minX: minX / canvas.width,
                    minY: minY / canvas.height,
                    maxX: (maxX + 1) / canvas.width,  // +1 to include the pixel
                    maxY: (maxY + 1) / canvas.height,  // +1 to include the pixel
                    imgWidth: canvas.width,
                    imgHeight: canvas.height
                };
            }
            
            return null;
        } catch (error) {
            console.warn('Could not detect image content bounds:', error);
            return null;
        }
    }

    /**
     * Adjust overlay bounds to match only the colored pixel area
     * This calculates new geographic bounds that only cover the colored pixels, not transparent areas
     */
    adjustOverlayBoundsToContent(imageOverlay, contentBounds, originalBounds) {
        if (!contentBounds) return originalBounds;
        
        const [[south, west], [north, east]] = originalBounds;
        const latRange = north - south;
        const lngRange = east - west;
        
        // contentBounds is in normalized coordinates (0-1) representing where colored pixels are
        // For example, if minX=0.1, maxX=0.9, the colored area is in the middle 80% of the image
        
        // Calculate new bounds that map ONLY the colored pixel area to geography
        // Y axis is flipped: in image coordinates, y=0 is top, but in lat, south is smaller
        // So we need to reverse the Y calculation
        
        // The colored pixels start at contentBounds.minX of the image width
        // and end at contentBounds.maxX of the image width
        const newWest = west + (lngRange * contentBounds.minX);
        const newEast = west + (lngRange * contentBounds.maxX);
        
        // For latitude (Y axis is flipped):
        // contentBounds.minY is at the top of the image (which maps to north)
        // contentBounds.maxY is at the bottom of the image (which maps to south)
        const newNorth = north - (latRange * contentBounds.minY);
        const newSouth = north - (latRange * contentBounds.maxY);
        
        return [[newSouth, newWest], [newNorth, newEast]];
    }

    /**
     * Setup transparency detection for image overlay to only allow interaction on colored pixels
     */
    setupImageTransparencyDetection(imgElement, overlayElement, imageOverlay) {
        // Create a canvas to detect transparent pixels
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = imgElement.naturalWidth || imgElement.width;
        canvas.height = imgElement.naturalHeight || imgElement.height;
        
        try {
            // Set crossOrigin to allow canvas operations (if needed)
            // Note: For local images, this may not be needed
            if (imgElement.crossOrigin === null && imgElement.src && !imgElement.src.startsWith(window.location.origin)) {
                // Only set if image is from different origin
                // For same-origin images, canvas operations should work
            }
            
            ctx.drawImage(imgElement, 0, 0);
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            
            // Function to check if a pixel is transparent
            const isPixelTransparent = (x, y) => {
                if (x < 0 || x >= canvas.width || y < 0 || y >= canvas.height) {
                    return true;
                }
                const index = (y * canvas.width + x) * 4;
                const alpha = imageData.data[index + 3];
                return alpha < 10; // Consider transparent if alpha < 10
            };
            
            // Store imageData for pixel checking
            const pixelData = imageData;
            const imgWidth = canvas.width;
            const imgHeight = canvas.height;
            
            // Intercept mouse events on the overlay element
            let lastTooltipState = false;
            
            overlayElement.addEventListener('mousemove', (e) => {
                const rect = imgElement.getBoundingClientRect();
                const scaleX = imgWidth / rect.width;
                const scaleY = imgHeight / rect.height;
                const x = Math.floor((e.clientX - rect.left) * scaleX);
                const y = Math.floor((e.clientY - rect.top) * scaleY);
                
                if (x >= 0 && x < imgWidth && y >= 0 && y < imgHeight) {
                    const index = (y * imgWidth + x) * 4;
                    const alpha = pixelData.data[index + 3];
                    const isOverColoredPixel = alpha >= 10;
                    
                    if (isOverColoredPixel && !lastTooltipState) {
                        // Just entered a colored pixel - trigger mouseover
                        // Stop propagation to prevent other zones from handling this event
                        e.stopPropagation();
                        e.stopImmediatePropagation();
                        
                        const bounds = imageOverlay.getBounds();
                        const center = bounds.getCenter();
                        imageOverlay.fire('mouseover', { latlng: center, originalEvent: e });
                        lastTooltipState = true;
                    } else if (!isOverColoredPixel && lastTooltipState) {
                        // Left colored pixel - trigger mouseout
                        imageOverlay.fire('mouseout');
                        lastTooltipState = false;
                    }
                } else if (lastTooltipState) {
                    // Mouse left image bounds
                    imageOverlay.fire('mouseout');
                    lastTooltipState = false;
                }
            });
            
            overlayElement.addEventListener('mouseleave', () => {
                if (lastTooltipState) {
                    imageOverlay.fire('mouseout');
                    lastTooltipState = false;
                }
            });
        } catch (error) {
            // If canvas operations fail (CORS issues or other), just proceed normally
            console.warn('Could not setup transparency detection (images may need CORS headers):', error);
        }
    }

    /**
     * Detect the perimeter/contour of colored pixels in an image using edge tracking
     * Returns array of [x, y] pixel coordinates representing the actual contour
     */
    detectColorPerimeter(imgElement) {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = imgElement.naturalWidth || imgElement.width;
        canvas.height = imgElement.naturalHeight || imgElement.height;
        
        try {
            ctx.drawImage(imgElement, 0, 0);
            const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
            const data = imageData.data;
            const width = canvas.width;
            const height = canvas.height;
            
            // Create a 2D array to track which pixels are colored
            const isColored = Array(height).fill(null).map(() => Array(width).fill(false));
            
            for (let y = 0; y < height; y++) {
                for (let x = 0; x < width; x++) {
                    const index = (y * width + x) * 4;
                    const alpha = data[index + 3];
                    isColored[y][x] = alpha >= 10; // Non-transparent
                }
            }
            
            // Find edge pixels (colored pixels with at least one transparent neighbor)
            const edgePixels = [];
            for (let y = 0; y < height; y++) {
                for (let x = 0; x < width; x++) {
                    if (!isColored[y][x]) continue;
                    
                    // Check if it's on image edge
                    if (x === 0 || x === width - 1 || y === 0 || y === height - 1) {
                        edgePixels.push([x, y]);
                        continue;
                    }
                    
                    // Check 4-connected neighbors (up, right, down, left)
                    const neighbors = [[0, -1], [1, 0], [0, 1], [-1, 0]];
                    for (const [dx, dy] of neighbors) {
                        const nx = x + dx;
                        const ny = y + dy;
                        if (!isColored[ny][nx]) {
                            edgePixels.push([x, y]);
                            break;
                        }
                    }
                }
            }
            
            if (edgePixels.length === 0) return null;
            
            // Simplify by keeping only significant edge points (reduce noise)
            // Use a distance threshold to filter out very close points
            const simplified = [];
            const threshold = 2; // Minimum distance between points
            
            for (let i = 0; i < edgePixels.length; i++) {
                const [x, y] = edgePixels[i];
                let tooClose = false;
                
                for (let j = 0; j < simplified.length; j++) {
                    const [sx, sy] = simplified[j];
                    const dist = Math.sqrt((x - sx) ** 2 + (y - sy) ** 2);
                    if (dist < threshold) {
                        tooClose = true;
                        break;
                    }
                }
                
                if (!tooClose) {
                    simplified.push([x, y]);
                }
            }
            
            // Sort points to create a connected path
            // Start with the first point, then find nearest neighbor repeatedly
            if (simplified.length === 0) return null;
            
            const path = [];
            const remaining = [...simplified];
            let current = remaining.shift();
            path.push(current);
            
            while (remaining.length > 0) {
                let nearestIdx = 0;
                let nearestDist = Infinity;
                
                for (let i = 0; i < remaining.length; i++) {
                    const [x, y] = remaining[i];
                    const dist = Math.sqrt((current[0] - x) ** 2 + (current[1] - y) ** 2);
                    if (dist < nearestDist) {
                        nearestDist = dist;
                        nearestIdx = i;
                    }
                }
                
                // If nearest is too far, we might have multiple disconnected regions
                // In that case, start a new path segment
                if (nearestDist > 50 && path.length > 10) {
                    // Start new segment
                    current = remaining.shift();
                    path.push(current);
                } else {
                    current = remaining.splice(nearestIdx, 1)[0];
                    path.push(current);
                }
            }
            
            // Further simplify using Douglas-Peucker algorithm if too many points
            if (path.length > 500) {
                return this.douglasPeucker(path, 1.0); // 1 pixel tolerance
            }
            
            return path;
        } catch (error) {
            console.warn('Could not detect color perimeter:', error);
            return null;
        }
    }

    /**
     * Douglas-Peucker line simplification algorithm
     */
    douglasPeucker(points, tolerance) {
        if (points.length <= 2) return points;
        
        let maxDist = 0;
        let maxIdx = 0;
        const end = points.length - 1;
        
        for (let i = 1; i < end; i++) {
            const dist = this.pointToLineDistance(points[i], points[0], points[end]);
            if (dist > maxDist) {
                maxDist = dist;
                maxIdx = i;
            }
        }
        
        if (maxDist > tolerance) {
            const left = this.douglasPeucker(points.slice(0, maxIdx + 1), tolerance);
            const right = this.douglasPeucker(points.slice(maxIdx), tolerance);
            return [...left.slice(0, -1), ...right];
        }
        
        return [points[0], points[end]];
    }

    /**
     * Calculate perpendicular distance from point to line segment
     */
    pointToLineDistance(point, lineStart, lineEnd) {
        const [px, py] = point;
        const [x1, y1] = lineStart;
        const [x2, y2] = lineEnd;
        
        const A = px - x1;
        const B = py - y1;
        const C = x2 - x1;
        const D = y2 - y1;
        
        const dot = A * C + B * D;
        const lenSq = C * C + D * D;
        let param = -1;
        
        if (lenSq !== 0) {
            param = dot / lenSq;
        }
        
        let xx, yy;
        if (param < 0) {
            xx = x1;
            yy = y1;
        } else if (param > 1) {
            xx = x2;
            yy = y2;
        } else {
            xx = x1 + param * C;
            yy = y1 + param * D;
        }
        
        const dx = px - xx;
        const dy = py - yy;
        return Math.sqrt(dx * dx + dy * dy);
    }


    /**
     * Convert pixel coordinates to lat/lng coordinates
     */
    pixelsToLatLng(pixels, imageWidth, imageHeight, bounds) {
        const [[south, west], [north, east]] = bounds;
        const latRange = north - south;
        const lngRange = east - west;
        
        return pixels.map(([x, y]) => {
            // Normalize pixel coordinates (0-1)
            const normX = x / imageWidth;
            const normY = y / imageHeight;
            
            // Convert to lat/lng (Y is flipped)
            const lng = west + (lngRange * normX);
            const lat = north - (latRange * normY); // Y axis is flipped
            
            return [lat, lng];
        });
    }

    /**
     * Draw a border for a given zone based on pre-computed perimeter from server
     * @param {Object} zone - Zone object with bounds and perimeter
     * @param {Object} options - Optional styling options { color, weight, opacity, dashArray }
     * @returns {L.polygon|null} - Leaflet polygon representing the border, or null if perimeter not available
     */
    drawZoneBorder(zone, options = {}) {
        if (!window.mapManager || !window.mapManager.map) {
            return null;
        }

        const zoneInfo = this.getZoneInfo(zone.name);
        
        // Default styling based on zone color
        const defaultColor = zoneInfo.color || '#000000';
        const borderOptions = {
            color: options.color || defaultColor,
            weight: options.weight || 3,
            opacity: options.opacity || 1.0,
            fill: false,
            dashArray: options.dashArray || null,
            interactive: false
        };

        // Check if zone has pre-computed perimeter from server
        if (zone.perimeter && Array.isArray(zone.perimeter) && zone.perimeter.length > 0) {
            // Use pre-computed perimeter (already in lat/lng coordinates)
            const perimeter = zone.perimeter;
            
            // Ensure perimeter is closed (first point == last point)
            let latlngs = [...perimeter];
            if (latlngs.length > 0 && 
                (latlngs[0][0] !== latlngs[latlngs.length - 1][0] || 
                 latlngs[0][1] !== latlngs[latlngs.length - 1][1])) {
                latlngs.push(latlngs[0]);
            }
            
            const border = L.polygon(latlngs, borderOptions);
            border.addTo(window.mapManager.map);
            this.borders.set(zone.id, border);
            return border;
        } else {
            // Fallback: perimeter not computed yet, log warning
            console.warn(`Zone ${zone.name} (ID: ${zone.id}) does not have a pre-computed perimeter. ` +
                        `Run the detect_zone_perimeters.py script to generate perimeters.`);
            return null;
        }
    }

    /**
     * Show/hide borders for all zones
     * @param {boolean} show - Whether to show borders
     */
    toggleBorders(show = null) {
        const shouldShow = show !== null ? show : !this.showBorders;
        this.showBorders = shouldShow;

        if (shouldShow) {
            // Draw borders for all zones
            this.zones.forEach(zone => {
                // Remove existing border if any
                if (this.borders.has(zone.id)) {
                    window.mapManager.map.removeLayer(this.borders.get(zone.id));
                }
                // Draw new border
                this.drawZoneBorder(zone);
            });
        } else {
            // Remove all borders
            this.borders.forEach(border => {
                window.mapManager.map.removeLayer(border);
            });
            this.borders.clear();
        }
    }

    /**
     * Get which zone a point (lat/lng) is in
     * Checks bounds first, then optionally checks if point is over colored pixels
     * @param {number} lat - Latitude
     * @param {number} lng - Longitude
     * @param {boolean} checkPixels - Whether to check actual colored pixels (slower but more accurate)
     * @returns {Object|null} - Zone object if point is in a zone, null otherwise
     */
    getZoneAtPoint(lat, lng, checkPixels = false) {
        const point = [lat, lng];
        
        // Check all zones (check in reverse order so highest z-index zones are checked first)
        const zonesToCheck = [...this.zones].reverse();
        
        for (const zone of zonesToCheck) {
            const bounds = zone.bounds;
            
            // Quick bounds check
            if (this.isPointInBounds(point, bounds)) {
                if (!checkPixels) {
                    return zone;
                }
                
                // If checkPixels is true, verify the point is over colored pixels
                // This requires the overlay to be loaded and image data to be available
                const overlay = this.overlays.get(zone.id);
                if (overlay && this.isPointOverColoredPixels(point, overlay, zone)) {
                    return zone;
                } else if (overlay) {
                    // Point is in bounds but not over colored pixels, continue checking
                    continue;
                } else {
                    // Overlay not loaded yet, return based on bounds only
                    return zone;
                }
            }
        }
        
        return null;
    }

    /**
     * Check if a point is within bounds
     * @param {Array} point - [lat, lng]
     * @param {Array} bounds - [[south, west], [north, east]]
     * @returns {boolean}
     */
    isPointInBounds(point, bounds) {
        const [lat, lng] = point;
        const [[south, west], [north, east]] = bounds;
        return lat >= south && lat <= north && lng >= west && lng <= east;
    }

    /**
     * Check if a point is over colored pixels in an image overlay
     * @param {Array} point - [lat, lng]
     * @param {L.imageOverlay} overlay - Leaflet image overlay
     * @param {Object} zone - Zone object
     * @returns {boolean}
     */
    isPointOverColoredPixels(point, overlay, zone) {
        try {
            const overlayElement = overlay.getElement();
            if (!overlayElement) return false;
            
            const imgElement = overlayElement.querySelector('img');
            if (!imgElement) return false;
            
            // Check if we have cached content bounds
            const contentBounds = this.contentBoundsCache?.get(zone.id);
            if (!contentBounds) return true; // No content bounds cached, assume valid
            
            // Convert lat/lng to image coordinates
            const bounds = overlay.getBounds();
            const [[south, west], [north, east]] = bounds;
            const [lat, lng] = point;
            
            // Calculate normalized position in bounds (0-1)
            const normX = (lng - west) / (east - west);
            const normY = (north - lat) / (north - south); // Y is flipped
            
            // Check if point is within content bounds (colored pixels only)
            return normX >= contentBounds.minX && normX <= contentBounds.maxX &&
                   normY >= contentBounds.minY && normY <= contentBounds.maxY;
        } catch (error) {
            console.warn('Error checking pixel color:', error);
            return true; // On error, assume point is valid
        }
    }

    /**
     * Get zone information based on zone name
     */
    getZoneInfo(zoneName) {
        const zoneInfoMap = {
            'pink': {
                title: 'Pink Zone',
                riskLevel: 'High-risk area',
                floodType: '100-yr Flood',
                floodChance: '1% chance',
                insurance: 'Requires flood insurance',
                color: '#ff69b4'
            },
            'yellow': {
                title: 'Yellow Zone',
                riskLevel: 'High-risk area',
                floodType: '100-yr Flood',
                floodChance: '1% chance',
                insurance: 'Requires flood insurance',
                color: '#ffd700'
            },
            'green': {
                title: 'Green Zone',
                riskLevel: 'High-risk area',
                floodType: '100-yr Flood',
                floodChance: '1% chance',
                insurance: 'Requires flood insurance',
                color: '#32cd32'
            },
            'orange': {
                title: 'Orange Zone',
                riskLevel: 'Low-risk area',
                floodType: '500-yr Flood',
                floodChance: '0.2% chance',
                insurance: null,
                color: '#ffa500'
            },
            'purple': {
                title: 'Purple Zone',
                riskLevel: 'Low-risk area',
                floodType: '500-yr Flood',
                floodChance: '0.2% chance',
                insurance: null,
                color: '#9370db'
            }
        };

        const normalizedName = zoneName.toLowerCase().replace('zone', '').trim();
        return zoneInfoMap[normalizedName] || {
            title: `${zoneName} Zone`,
            riskLevel: 'Unknown',
            floodType: 'Unknown',
            floodChance: 'Unknown',
            insurance: null,
            color: '#666'
        };
    }

    /**
     * Update zone checkboxes based on loaded zones
     */
    updateZoneCheckboxes() {
        const zoneCheckboxes = document.querySelectorAll('.zone-checkbox');
        
        zoneCheckboxes.forEach(checkbox => {
            const zoneId = parseInt(checkbox.getAttribute('data-zone-id'));
            const zone = this.zones.find(z => z.id === zoneId);
            
            if (zone) {
                // Zone exists, enable checkbox and keep its checked state
                checkbox.disabled = false;
                // Only update checked state if overlay exists, otherwise maintain checkbox state
                // The checkbox state is the source of truth for visibility
            } else {
                // Zone not found in loaded zones
                checkbox.checked = false;
                checkbox.disabled = true;
            }
        });
    }

    /**
     * Display all flood zone overlays on the map (only checked zones)
     */
    displayZones() {
        if (!window.mapManager || !window.mapManager.map) {
            console.warn('Map manager not available, cannot display zones');
            return;
        }

        // Get checked zones
        const zoneCheckboxes = document.querySelectorAll('.zone-checkbox');
        const checkedZoneIds = new Set();
        
        zoneCheckboxes.forEach(checkbox => {
            if (checkbox.checked && !checkbox.disabled) {
                checkedZoneIds.add(parseInt(checkbox.getAttribute('data-zone-id')));
            }
        });

        // Remove zones that are unchecked
        this.zones.forEach(zone => {
            if (!checkedZoneIds.has(zone.id)) {
                const overlay = this.overlays.get(zone.id);
                
                if (overlay && window.mapManager && window.mapManager.map) {
                    window.mapManager.map.removeLayer(overlay);
                }
            }
        });

        // Add each checked zone overlay (only if not already displayed)
        const zonesToDisplay = [];
        this.zones.forEach(zone => {
            if (checkedZoneIds.has(zone.id)) {
                const overlay = this.overlays.get(zone.id);
                if (!overlay || overlay._map === null) {
                    this.addZoneOverlay(zone);
                }
                zonesToDisplay.push(zone);
            }
        });

        // If any zones are checked, zoom out to fit all active zones and force update
        if (zonesToDisplay.length > 0) {
            // Calculate bounds that encompass all active zones
            let minLat = Infinity;
            let maxLat = -Infinity;
            let minLng = Infinity;
            let maxLng = -Infinity;

            zonesToDisplay.forEach(zone => {
                const [[south, west], [north, east]] = zone.bounds;
                if (south < minLat) minLat = south;
                if (north > maxLat) maxLat = north;
                if (west < minLng) minLng = west;
                if (east > maxLng) maxLng = east;
            });

            // Add padding around bounds (10% on each side)
            const latPadding = (maxLat - minLat) * 0.1;
            const lngPadding = (maxLng - minLng) * 0.1;
            
            const bounds = [
                [minLat - latPadding, minLng - lngPadding],
                [maxLat + latPadding, maxLng + lngPadding]
            ];

            // Wait a bit for overlays to be added, then fit bounds and force update
            setTimeout(() => {
                window.mapManager.map.fitBounds(bounds, {
                    padding: [20, 20], // Additional padding in pixels
                    maxZoom: 13 // Limit max zoom level
                });
                
                // Force map update after fitting bounds
                window.mapManager.map.invalidateSize();
                
                // Additional update after short delay to ensure everything is positioned
                setTimeout(() => {
                    window.mapManager.map.invalidateSize();
                }, 100);
            }, 150);
        }
        
        // Update any existing marker popups to reflect zone visibility changes
        if (window.mapManager && window.mapManager.currentMarker) {
            const marker = window.mapManager.currentMarker;
            const latlng = marker.getLatLng();
            const address = window.mapManager.currentAddress || `${latlng.lat}, ${latlng.lng}`;
            
            // Re-check flood zone with updated zone visibility
            const floodZone = window.mapManager.getFloodZoneAtLocation(latlng.lat, latlng.lng);
            window.mapManager.currentFloodZone = floodZone;
            
            // Update popup content
            const popupContent = window.mapManager.createMarkerPopupContent(address, latlng.lat, latlng.lng, floodZone);
            marker.setPopupContent(popupContent);
            
            // If popup was open, restart auto-close timer
            if (marker.isPopupOpen()) {
                if (marker.popupTimeout) {
                    clearTimeout(marker.popupTimeout);
                }
                marker.popupTimeout = setTimeout(() => {
                    if (marker && marker.isPopupOpen()) {
                        marker.closePopup();
                    }
                }, 5000);
            }
        }
    }

    /**
     * Add a single zone overlay to the map
     */
    addZoneOverlay(zone) {
        if (!window.mapManager || !window.mapManager.map) {
            return;
        }

        const bounds = zone.bounds;
        const imagePath = zone.image_path;
        const opacity = zone.opacity || 0.6;
        const rotation = zone.rotation || 0;
        
        // Store imagePath for CORS check
        this.currentImagePath = imagePath;

        // Calculate center point and base size
        const [[south, west], [north, east]] = bounds;
        const centerLat = (south + north) / 2;
        const centerLng = (west + east) / 2;
        
        // Calculate base size (this is the size stored in JSON, never changes)
        const baseLatSize = north - south;
        const baseLngSize = east - west;
        
        // Store base size (only if not already stored - it should never change)
        if (!this.baseZoneSizes.has(zone.id)) {
            this.baseZoneSizes.set(zone.id, { 
                latSize: baseLatSize, 
                lngSize: baseLngSize 
            });
        }

        // Create image overlay using Leaflet (will adjust bounds after image loads)
        // Use a higher z-index pane so zones rendered later appear on top
        const imageOverlay = L.imageOverlay(imagePath, bounds, {
            opacity: opacity,
            interactive: true,
            pane: 'overlayPane'
        }).addTo(window.mapManager.map);
        
        // Wait for image to load, then invalidate map size to force position recalculation
        // This fixes the issue where overlays appear in the wrong position initially
        imageOverlay.once('load', () => {
            // Force map to recalculate overlay positions
            window.mapManager.map.invalidateSize();
            
            // Additional update after a short delay to ensure everything is positioned correctly
            setTimeout(() => {
                window.mapManager.map.invalidateSize();
            }, 50);
        });
        
        // Also check if image is already loaded (cached) - if so, trigger update immediately
        // Use setTimeout to ensure overlay element is in DOM
        setTimeout(() => {
            const overlayElement = imageOverlay.getElement();
            if (overlayElement) {
                const imgElement = overlayElement.querySelector('img');
                if (imgElement && imgElement.complete && imgElement.naturalHeight !== 0) {
                    // Image is already loaded, force map update
                    window.mapManager.map.invalidateSize();
                    setTimeout(() => {
                        window.mapManager.map.invalidateSize();
                    }, 50);
                }
            }
        }, 100);
        
        // Set z-index based on zone ID so later zones appear on top
        // This ensures when zones overlap, the topmost zone handles the event
        setTimeout(() => {
            const overlayElement = imageOverlay.getElement();
            if (overlayElement) {
                overlayElement.style.zIndex = zone.id * 10; // Higher IDs = higher z-index
            }
        }, 50);

        // Apply rotation and fix transparency handling - wait for overlay to be added to map first
        // Use setTimeout to ensure element is in DOM
        setTimeout(() => {
            const overlayElement = imageOverlay.getElement();
            if (overlayElement) {
                // Note: Rotation is applied to the overlayElement, but content scaling is applied to imgElement
                overlayElement.style.transformOrigin = '50% 50%';
                overlayElement.style.transform = `rotate(${rotation}deg)`;
                overlayElement.style.willChange = 'transform';
                overlayElement.style.overflow = 'hidden'; // Clip content that extends beyond
                
                // Fix transparency handling - only allow interaction on non-transparent pixels
                overlayElement.style.imageRendering = 'crisp-edges';
                overlayElement.style.pointerEvents = 'auto';
                
                // Get the img element inside the overlay
                const imgElement = overlayElement.querySelector('img');
                if (imgElement) {
                    // Ensure the image respects its alpha channel
                    imgElement.style.imageRendering = 'crisp-edges';
                    imgElement.style.objectFit = 'fill';
                    
                    // Function to process image after load
                    const processImage = () => {
                        // Detect colored pixel bounds to clip transparent borders visually
                        const contentBounds = this.detectImageContentBounds(imgElement);
                        
                        if (contentBounds) {
                            // Store content bounds for hover detection
                            this.contentBoundsCache = this.contentBoundsCache || new Map();
                            this.contentBoundsCache.set(zone.id, contentBounds);
                            
                            // Use CSS clip-path to hide transparent borders visually
                            // This keeps the geographic bounds correct but hides transparent areas
                            const topPercent = contentBounds.minY * 100;
                            const rightPercent = (1 - contentBounds.maxX) * 100;
                            const bottomPercent = (1 - contentBounds.maxY) * 100;
                            const leftPercent = contentBounds.minX * 100;
                            
                            // Apply clip-path to overlay element to hide transparent borders
                            overlayElement.style.clipPath = `inset(${topPercent}% ${rightPercent}% ${bottomPercent}% ${leftPercent}%)`;
                            
                            // Scale the image so the colored area fills the visible clipped area
                            const contentWidth = contentBounds.maxX - contentBounds.minX;
                            const contentHeight = contentBounds.maxY - contentBounds.minY;
                            
                            const scaleX = 1 / contentWidth;
                            const scaleY = 1 / contentHeight;
                            
                            // Translate to align the colored area with the clip area
                            const translateX = -contentBounds.minX / contentWidth * 100;
                            const translateY = -contentBounds.minY / contentHeight * 100;
                            
                            // Apply transform to scale and position the image
                            imgElement.style.transform = `translate(${translateX}%, ${translateY}%) scale(${scaleX}, ${scaleY})`;
                            imgElement.style.transformOrigin = 'top left';
                        }
                        
                        // Setup transparency detection for hover
                        this.setupImageTransparencyDetection(imgElement, overlayElement, imageOverlay);
                        
                        // Force map to recalculate overlay position after image processing
                        // This ensures the overlay appears in the correct position
                        if (window.mapManager && window.mapManager.map) {
                            window.mapManager.map.invalidateSize();
                        }
                    };
                    
                    // Check if image is already loaded
                    if (imgElement.complete && imgElement.naturalHeight !== 0) {
                        processImage();
                    } else {
                        // Wait for image to load
                        imgElement.addEventListener('load', processImage, { once: true });
                    }
                }
            }
        }, 50);

        // Store overlay reference
        this.overlays.set(zone.id, imageOverlay);

        // Get zone information for hover tooltip
        const zoneInfo = this.getZoneInfo(zone.name);
        
        // Store zone info with the overlay for reference
        imageOverlay._zoneId = zone.id;
        imageOverlay._zoneName = zone.name;
        imageOverlay._zoneInfo = zoneInfo;

        // Add hover tooltip with zone information
        // Note: Will only trigger on colored pixels due to transparency detection
        // Track the tooltip timeout and popup reference
        let tooltipTimeout = null;
        let currentTooltipPopup = null;
        
        imageOverlay.on('mouseover', (e) => {
            // Stop event propagation to prevent other zones from showing tooltips
            if (e.originalEvent) {
                e.originalEvent.stopPropagation();
            }
            
            // Clear any existing timeout
            if (tooltipTimeout) {
                clearTimeout(tooltipTimeout);
                tooltipTimeout = null;
            }
            
            // Close any existing tooltip first (to handle overlapping zones)
            if (currentTooltipPopup) {
                window.mapManager.map.closePopup();
                currentTooltipPopup = null;
            }
            
            // Small delay to ensure we get the correct zone
            setTimeout(() => {
                // Get mouse position for tooltip placement
                const latlng = e.latlng || imageOverlay.getBounds().getCenter();
                
                // Use the zoneInfo stored with this overlay (not from zone.name which might be stale)
                const currentZoneInfo = imageOverlay._zoneInfo || zoneInfo;
                
                const tooltipContent = `
                    <div style="padding: 10px; max-width: 250px;">
                        <div style="font-weight: bold; font-size: 14px; margin-bottom: 8px; color: ${currentZoneInfo.color || '#000'};">
                            ${currentZoneInfo.title}
                        </div>
                        <div style="font-size: 12px; margin-bottom: 4px;">
                            <strong>Risk Level:</strong> ${currentZoneInfo.riskLevel}
                        </div>
                        <div style="font-size: 12px; margin-bottom: 4px;">
                            <strong>Flood Type:</strong> ${currentZoneInfo.floodType}
                        </div>
                        <div style="font-size: 12px; margin-bottom: 4px;">
                            <strong>Flood Chance:</strong> ${currentZoneInfo.floodChance}
                        </div>
                        ${currentZoneInfo.insurance ? `<div style="font-size: 12px; color: #cc0000; font-weight: bold; margin-top: 6px;">${currentZoneInfo.insurance}</div>` : ''}
                    </div>
                `;

                const popup = L.popup({
                    className: 'zone-info-tooltip',
                    closeButton: false,
                    autoClose: true,
                    autoCloseDelay: 2000,  // Auto-close after 2 seconds if mouse doesn't move
                    closeOnClick: true,     // Close when clicking on map
                    offset: [0, -10]
                })
                .setContent(tooltipContent)
                .setLatLng(latlng)
                .openOn(window.mapManager.map);
                
                currentTooltipPopup = popup;
                
                // Auto-close after 3 seconds as a safety fallback
                tooltipTimeout = setTimeout(() => {
                    if (window.mapManager && window.mapManager.map) {
                        window.mapManager.map.closePopup();
                        currentTooltipPopup = null;
                    }
                }, 3000);
            }, 10);
        });

        imageOverlay.on('mouseout', () => {
            // Clear any pending tooltip timeout
            if (tooltipTimeout) {
                clearTimeout(tooltipTimeout);
                tooltipTimeout = null;
            }
            
            // Close tooltip immediately (reduced delay to make it more responsive)
            setTimeout(() => {
                if (window.mapManager && window.mapManager.map) {
                    window.mapManager.map.closePopup();
                    currentTooltipPopup = null;
                }
            }, 100);  // Small delay to prevent flickering when moving between overlapping zones
        });

        // Anchor points removed - no longer displayed
    }

    /**
     * Update zone position when anchor is dragged (real-time preview)
     */
    updateZonePosition(zoneId, newCenter) {
        const baseSize = this.baseZoneSizes.get(zoneId);
        const overlay = this.overlays.get(zoneId);
        
        if (!baseSize || !overlay) {
            return;
        }

        // Use current scale to calculate size
        const scaleFactor = this.currentScale / 100;
        const latSize = baseSize.latSize * scaleFactor;
        const lngSize = baseSize.lngSize * scaleFactor;

        // Calculate new bounds centered on new position
        const newSouth = newCenter.lat - latSize / 2;
        const newNorth = newCenter.lat + latSize / 2;
        const newWest = newCenter.lng - lngSize / 2;
        const newEast = newCenter.lng + lngSize / 2;

        const newBounds = [[newSouth, newWest], [newNorth, newEast]];

        // Update overlay bounds
        overlay.setBounds(newBounds);
    }

    /**
     * Save zone position after drag ends
     */
    async saveZonePosition(zoneId, newCenter) {
        const zone = this.zones.find(z => z.id === zoneId);
        if (!zone) {
            console.error(`Zone ${zoneId} not found`);
            return;
        }

        const baseSize = this.baseZoneSizes.get(zoneId);
        if (!baseSize) {
            console.error(`Base size not found for zone ${zoneId}`);
            return;
        }

        // Calculate new bounds using base size (current scale is visual only until saved)
        const scaleFactor = this.currentScale / 100;
        const latSize = baseSize.latSize * scaleFactor;
        const lngSize = baseSize.lngSize * scaleFactor;

        const newSouth = newCenter.lat - latSize / 2;
        const newNorth = newCenter.lat + latSize / 2;
        const newWest = newCenter.lng - lngSize / 2;
        const newEast = newCenter.lng + lngSize / 2;

        const newBounds = [[newSouth, newWest], [newNorth, newEast]];

        // Preserve all zone properties
        const updatedZoneData = {
            name: zone.name,
            image_path: zone.image_path,
            bounds: newBounds,
            opacity: zone.opacity || 0.6,
            rotation: zone.rotation || 0  // Preserve rotation
        };

        // Save to server
        try {
            await this.updateZone(zoneId, updatedZoneData);
            console.log(`Zone ${zoneId} position updated`);
        } catch (error) {
            console.error(`Failed to save zone position:`, error);
        }
    }

    /**
     * Save current positions of all zones
     */
    async saveAllZonePositions() {
        const saveBtn = document.getElementById('save-all-positions-btn');
        if (!saveBtn) {
            console.error('Save all positions button not found');
            return;
        }
        
        const originalText = saveBtn.textContent;
        saveBtn.disabled = true;
        saveBtn.textContent = 'Saving...';

        try {
            // Update all zones with their current anchor positions
            const updatePromises = this.zones.map(async (zone) => {
                const anchor = this.anchors.get(zone.id);
                if (!anchor) {
                    console.warn(`Anchor not found for zone ${zone.id}`);
                    return;
                }

                const center = anchor.getLatLng();
                const baseSize = this.baseZoneSizes.get(zone.id);
                if (!baseSize) {
                    console.warn(`Base size not found for zone ${zone.id}`);
                    return;
                }

                // Calculate bounds from current position and base size
                const newSouth = center.lat - baseSize.latSize / 2;
                const newNorth = center.lat + baseSize.latSize / 2;
                const newWest = center.lng - baseSize.lngSize / 2;
                const newEast = center.lng + baseSize.lngSize / 2;

                const newBounds = [[newSouth, newWest], [newNorth, newEast]];

                // Update zone data preserving all properties
                const updatedZoneData = {
                    name: zone.name,
                    image_path: zone.image_path,
                    bounds: newBounds,
                    opacity: zone.opacity || 0.6,
                    rotation: zone.rotation || 0
                };

                return await this.updateZone(zone.id, updatedZoneData);
            });

            await Promise.all(updatePromises);

            // Reload zones to refresh display
            await this.loadZones();

            alert(`All zone positions saved successfully!`);

        } catch (error) {
            console.error('Error saving all zone positions:', error);
            alert(`Failed to save positions: ${error.message}`);
        } finally {
            saveBtn.disabled = false;
            saveBtn.textContent = originalText;
        }
    }

    /**
     * Show control window for a specific zone
     */
    showControlWindowForZone(zoneId, latLng) {
        const zone = this.zones.find(z => z.id === zoneId);
        if (!zone) {
            console.error(`Zone ${zoneId} not found`);
            return;
        }

        const controlWindow = document.getElementById('flood-zone-control-window');
        const scaleSlider = document.getElementById('zone-scale-slider');
        const scaleValue = document.getElementById('scale-value');
        const rotationSlider = document.getElementById('zone-rotation-slider');
        const rotationValue = document.getElementById('rotation-value');

        if (!controlWindow || !scaleSlider || !scaleValue || !rotationSlider || !rotationValue) {
            return;
        }

        // Update window title to show which zone
        const headerTitle = document.querySelector('#flood-zone-control-drag-handle span');
        if (headerTitle) {
            headerTitle.textContent = `${zone.name.toUpperCase()} Zone Controls`;
        }

        // Set current scale (default to 100%)
        this.currentScale = 100;
        scaleSlider.value = 100;
        scaleValue.textContent = '100';

        // Set current rotation from this zone
        const currentRot = zone.rotation || 0;
        this.currentRotation = currentRot;
        rotationSlider.value = currentRot;
        rotationValue.textContent = currentRot;

        // Show window
        controlWindow.style.display = 'block';
    }

    /**
     * Apply scale to all zones
     */
    applyScaleToAllZones(scaleFactor) {
        this.zones.forEach(zone => {
            this.applyScaleToZone(zone.id, scaleFactor);
        });
    }

    /**
     * Apply rotation to all zones
     */
    applyRotationToAllZones(rotationDegrees) {
        // Store anchor positions before rotation to prevent position changes
        const anchorPositions = new Map();
        this.zones.forEach(zone => {
            const anchor = this.anchors.get(zone.id);
            if (anchor) {
                anchorPositions.set(zone.id, anchor.getLatLng());
            }
        });

        // Apply rotation to all zones
        this.zones.forEach(zone => {
            this.applyRotationToZone(zone.id, rotationDegrees);
        });

        // Ensure anchors stay in place after rotation
        anchorPositions.forEach((position, zoneId) => {
            const anchor = this.anchors.get(zoneId);
            if (anchor) {
                const currentPos = anchor.getLatLng();
                // If anchor moved, restore it
                if (Math.abs(currentPos.lat - position.lat) > 0.0001 ||
                    Math.abs(currentPos.lng - position.lng) > 0.0001) {
                    anchor.setLatLng(position);
                }
            }
        });
    }

    /**
     * Apply rotation to a single zone
     */
    applyRotationToZone(zoneId, rotationDegrees) {
        const overlay = this.overlays.get(zoneId);
        
        if (!overlay) {
            return;
        }

        const overlayElement = overlay.getElement();
        if (overlayElement) {
            // Apply rotation as pure CSS transform
            // Rotation should not affect Leaflet's internal bounds calculation
            overlayElement.style.transformOrigin = '50% 50%';
            overlayElement.style.transform = `rotate(${rotationDegrees}deg)`;
        }
    }

    /**
     * Apply scale to a single zone
     */
    applyScaleToZone(zoneId, scaleFactor) {
        const overlay = this.overlays.get(zoneId);
        const anchor = this.anchors.get(zoneId);
        const baseSize = this.baseZoneSizes.get(zoneId);

        if (!overlay || !anchor || !baseSize) {
            return;
        }

        // Get current center position
        const center = anchor.getLatLng();

        // Calculate scaled size from base
        const scaledLatSize = baseSize.latSize * scaleFactor;
        const scaledLngSize = baseSize.lngSize * scaleFactor;

        // Calculate new bounds centered on anchor position
        const newSouth = center.lat - scaledLatSize / 2;
        const newNorth = center.lat + scaledLatSize / 2;
        const newWest = center.lng - scaledLngSize / 2;
        const newEast = center.lng + scaledLngSize / 2;

        const newBounds = [[newSouth, newWest], [newNorth, newEast]];

        // Update overlay bounds
        overlay.setBounds(newBounds);
    }

    /**
     * Save scale and rotation for a single zone permanently
     */
    async saveZoneTransform(zoneId) {
        const zone = this.zones.find(z => z.id === zoneId);
        if (!zone) {
            console.error(`Zone ${zoneId} not found`);
            return;
        }

        const scaleFactor = this.currentScale / 100;
        
        // Show loading state
        const saveBtn = document.getElementById('save-zones-scale-btn');
        if (!saveBtn) {
            console.error('Save button not found');
            return;
        }
        
        const originalText = saveBtn.textContent;
        saveBtn.disabled = true;
        saveBtn.textContent = 'Saving...';

        try {
            const anchor = this.anchors.get(zoneId);
            if (!anchor) {
                throw new Error('Anchor not found for zone');
            }

            const center = anchor.getLatLng();
            const baseSize = this.baseZoneSizes.get(zoneId);
            if (!baseSize) {
                throw new Error('Base size not found for zone');
            }

            // Calculate new bounds with scale applied (this becomes the new base)
            const scaledLatSize = baseSize.latSize * scaleFactor;
            const scaledLngSize = baseSize.lngSize * scaleFactor;

            const newSouth = center.lat - scaledLatSize / 2;
            const newNorth = center.lat + scaledLatSize / 2;
            const newWest = center.lng - scaledLngSize / 2;
            const newEast = center.lng + scaledLngSize / 2;

            const newBounds = [[newSouth, newWest], [newNorth, newEast]];

            // Update zone data - save the scaled bounds as new base, with rotation
            const updatedZoneData = {
                name: zone.name,
                image_path: zone.image_path,
                bounds: newBounds,  // New base bounds
                opacity: zone.opacity || 0.6,
                rotation: this.currentRotation  // Save rotation
            };

            await this.updateZone(zoneId, updatedZoneData);

            // Update base size for this zone
            this.baseZoneSizes.set(zoneId, {
                latSize: scaledLatSize,
                lngSize: scaledLngSize
            });

            // Reload zones to update display
            await this.loadZones();

            // Reset scale to 100% (rotation stays at saved value)
            this.currentScale = 100;
            
            const scaleSlider = document.getElementById('zone-scale-slider');
            const scaleValue = document.getElementById('scale-value');
            const rotationSlider = document.getElementById('zone-rotation-slider');
            const rotationValue = document.getElementById('rotation-value');
            
            if (scaleSlider) scaleSlider.value = 100;
            if (scaleValue) scaleValue.textContent = '100';
            if (rotationSlider) rotationSlider.value = this.currentRotation;
            if (rotationValue) rotationValue.textContent = this.currentRotation;

            // Update selected zone to refresh rotation display
            this.selectedZoneId = zoneId;

            alert(`${zone.name.toUpperCase()} zone saved successfully!`);

        } catch (error) {
            console.error('Error saving zone transform:', error);
            alert(`Failed to save: ${error.message}`);
        } finally {
            saveBtn.disabled = false;
            saveBtn.textContent = originalText;
        }
    }

    /**
     * Save scale and rotation for all zones permanently
     */
    async saveAllZonesTransform() {
        const scaleFactor = this.currentScale / 100;
        
        // Show loading state
        const saveBtn = document.getElementById('save-zones-scale-btn');
        if (!saveBtn) {
            console.error('Save button not found');
            return;
        }
        
        const originalText = saveBtn.textContent;
        saveBtn.disabled = true;
        saveBtn.textContent = 'Saving...';

        try {
            // Update all zones with the scale and rotation
            const updatePromises = this.zones.map(async (zone) => {
                const anchor = this.anchors.get(zone.id);
                if (!anchor) return;

                const center = anchor.getLatLng();
                const baseSize = this.baseZoneSizes.get(zone.id);
                if (!baseSize) return;

                // Calculate new bounds with scale applied (this becomes the new base)
                const scaledLatSize = baseSize.latSize * scaleFactor;
                const scaledLngSize = baseSize.lngSize * scaleFactor;

                const newSouth = center.lat - scaledLatSize / 2;
                const newNorth = center.lat + scaledLatSize / 2;
                const newWest = center.lng - scaledLngSize / 2;
                const newEast = center.lng + scaledLngSize / 2;

                const newBounds = [[newSouth, newWest], [newNorth, newEast]];

                // Update zone data - save the scaled bounds as new base, with rotation
                const updatedZoneData = {
                    name: zone.name,
                    image_path: zone.image_path,
                    bounds: newBounds,  // New base bounds
                    opacity: zone.opacity || 0.6,
                    rotation: this.currentRotation  // Save rotation
                };

                return await this.updateZone(zone.id, updatedZoneData);
            });

            await Promise.all(updatePromises);

            // Update base sizes to reflect the new scaled state
            // (the scaled bounds are now the new base)
            this.zones.forEach(zone => {
                const overlay = this.overlays.get(zone.id);
                if (overlay) {
                    const bounds = overlay.getBounds();
                    this.baseZoneSizes.set(zone.id, {
                        latSize: bounds.getNorth() - bounds.getSouth(),
                        lngSize: bounds.getEast() - bounds.getWest()
                    });
                }
            });

            // Reload zones to update display with new bounds
            await this.loadZones();

            // Reset scale to 100% and rotation to saved value
            this.currentScale = 100;
            
            const scaleSlider = document.getElementById('zone-scale-slider');
            const scaleValue = document.getElementById('scale-value');
            const rotationSlider = document.getElementById('zone-rotation-slider');
            const rotationValue = document.getElementById('rotation-value');
            
            if (scaleSlider) scaleSlider.value = 100;
            if (scaleValue) scaleValue.textContent = '100';
            if (rotationSlider) rotationSlider.value = this.currentRotation;
            if (rotationValue) rotationValue.textContent = this.currentRotation;

            // Close window
            const controlWindow = document.getElementById('flood-zone-control-window');
            if (controlWindow) {
                controlWindow.style.display = 'none';
            }

            alert('Zone scale and rotation saved successfully!');

        } catch (error) {
            console.error('Error saving zone transform:', error);
            alert(`Failed to save: ${error.message}`);
        } finally {
            saveBtn.disabled = false;
            saveBtn.textContent = originalText;
        }
    }

    /**
     * Clear all zone overlays from map
     */
    clearZones() {
        // Remove overlays
        this.overlays.forEach((overlay, zoneId) => {
            if (window.mapManager && window.mapManager.map) {
                window.mapManager.map.removeLayer(overlay);
            }
        });
        this.overlays.clear();

        // Anchors removed - no longer displayed
        this.anchors.clear();

        // Remove borders
        this.borders.forEach((border, zoneId) => {
            if (window.mapManager && window.mapManager.map) {
                window.mapManager.map.removeLayer(border);
            }
        });
        this.borders.clear();
        
        // Note: We keep baseZoneSizes - they get updated when zones are reloaded
    }

    /**
     * Update zone overlay after editing
     */
    async updateZone(zoneId, zoneData) {
        try {
            const response = await fetch(`/api/flood-zones/update/${zoneId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(zoneData)
            });

            const data = await response.json();

            if (data.status === 'success') {
                // Update local zone data
                const zoneIndex = this.zones.findIndex(z => z.id === zoneId);
                if (zoneIndex !== -1) {
                    this.zones[zoneIndex] = { ...zoneData, id: zoneId };
                }
                return true;
            } else {
                throw new Error(data.error || 'Failed to update zone');
            }
        } catch (error) {
            console.error('Error updating zone:', error);
            throw error;
        }
    }

    /**
     * Create a new zone overlay
     */
    async createZone(zoneData) {
        try {
            const response = await fetch('/api/flood-zones/create', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(zoneData)
            });

            const data = await response.json();

            if (data.status === 'success') {
                await this.loadZones();
                return data.zone;
            } else {
                throw new Error(data.error || 'Failed to create zone');
            }
        } catch (error) {
            console.error('Error creating zone:', error);
            alert(`Failed to create zone: ${error.message}`);
            return null;
        }
    }

    /**
     * Delete a zone
     */
    async deleteZone(zoneId) {
        if (!confirm('Are you sure you want to delete this flood zone?')) {
            return;
        }

        try {
            const response = await fetch(`/api/flood-zones/${zoneId}`, {
                method: 'DELETE'
            });

            const data = await response.json();

            if (data.status === 'success') {
                // Remove from maps
                const overlay = this.overlays.get(zoneId);
                if (overlay && window.mapManager && window.mapManager.map) {
                    window.mapManager.map.removeLayer(overlay);
                }
                this.overlays.delete(zoneId);

                // Anchors removed - no longer displayed
                this.anchors.delete(zoneId);
                this.baseZoneSizes.delete(zoneId);

                // Reload zones
                await this.loadZones();
                return true;
            } else {
                throw new Error(data.error || 'Failed to delete zone');
            }
        } catch (error) {
            console.error('Error deleting zone:', error);
            alert(`Failed to delete zone: ${error.message}`);
            return false;
        }
    }
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    window.floodZoneManager = new FloodZoneManager();
    
    // Wait for map to be initialized
    setTimeout(() => {
        if (window.mapManager && window.mapManager.map) {
            window.floodZoneManager.displayZones();
        } else {
            const checkMap = setInterval(() => {
                if (window.mapManager && window.mapManager.map) {
                    clearInterval(checkMap);
                    window.floodZoneManager.displayZones();
                }
            }, 100);
            
            setTimeout(() => clearInterval(checkMap), 5000);
        }
    }, 500);
});
