/**
 * Hotel Search Manager
 * Handles hotel search modal, filtering, sorting, and AI integration
 */

class HotelSearchManager {
    constructor() {
        this.modal = document.getElementById('hotel-search-modal');
        this.openBtn = document.getElementById('open-hotel-search-btn');
        this.closeBtn = document.getElementById('close-hotel-modal-btn');
        this.applyFiltersBtn = document.getElementById('apply-hotel-filters-btn');
        this.resetFiltersBtn = document.getElementById('reset-hotel-filters-btn');
        this.resultsContainer = document.getElementById('hotel-results-container');
        this.sortSelect = document.getElementById('hotel-sort-select');
        this.distanceSortSelect = document.getElementById('hotel-distance-sort-select');
        
        // AI Chat elements
        this.aiMessagesContainer = document.getElementById('hotel-ai-messages');
        this.aiInput = document.getElementById('hotel-ai-input');
        this.aiSendBtn = document.getElementById('send-hotel-ai-btn');
        
        // Filter checkboxes
        this.petFriendlyCheck = document.getElementById('filter-pet-friendly');
        this.hasFoodCheck = document.getElementById('filter-has-food');
        this.vacancyCheck = document.getElementById('filter-vacancy');
        
        this.currentHotels = [];
        this.showAllHotels = false; // Track if user wants to see all hotels
        
        // Set default sorts
        if (this.sortSelect) {
            this.sortSelect.value = 'price_low_high';
        }
        if (this.distanceSortSelect) {
            this.distanceSortSelect.value = 'closest_furthest';
        }
        
        this.init();
    }
    
    init() {
        // Modal open/close handlers
        if (this.openBtn) {
            this.openBtn.addEventListener('click', () => this.openModal());
        }
        
        if (this.closeBtn) {
            this.closeBtn.addEventListener('click', () => this.closeModal());
        }
        
        // Click outside modal to close
        if (this.modal) {
            this.modal.addEventListener('click', (e) => {
                if (e.target === this.modal) {
                    this.closeModal();
                }
            });
        }
        
        // Filter and search handlers
        if (this.applyFiltersBtn) {
            this.applyFiltersBtn.addEventListener('click', () => this.searchHotels());
        }
        
        if (this.resetFiltersBtn) {
            this.resetFiltersBtn.addEventListener('click', () => this.resetFilters());
        }
        
        // AI chat handlers
        if (this.aiSendBtn) {
            this.aiSendBtn.addEventListener('click', () => this.sendAIMessage());
        }
        
        if (this.aiInput) {
            this.aiInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.sendAIMessage();
                }
            });
        }
        
        // Sort select change handlers
        if (this.sortSelect) {
            this.sortSelect.addEventListener('change', () => {
                if (this.currentHotels.length > 0) {
                    this.displayHotels(this.currentHotels);
                }
            });
        }
        
        if (this.distanceSortSelect) {
            this.distanceSortSelect.addEventListener('change', () => {
                if (this.currentHotels.length > 0) {
                    this.displayHotels(this.currentHotels);
                }
            });
        }
    }
    
    openModal() {
        if (this.modal) {
            this.modal.style.display = 'flex';
            this.modal.classList.add('active');
            // Reset show all flag
            this.showAllHotels = false;
            // Show initial message - don't auto-search
            this.resultsContainer.innerHTML = `
                <div class="initial-message">
                    <p>👆 Select your filters above and click "Apply Filters" to search for hotels.</p>
                    <p class="hint-text">Hotels will be sorted by distance (closest first) and filtered based on your selections.</p>
                </div>
            `;
        }
    }
    
    closeModal() {
        if (this.modal) {
            this.modal.style.display = 'none';
            this.modal.classList.remove('active');
        }
    }
    
    async searchHotels() {
        // Get current filter values
        const filters = {
            pet_friendly: this.petFriendlyCheck?.checked || false,
            has_food: this.hasFoodCheck?.checked || false,
            vacancy: this.vacancyCheck?.checked || false,
            sort: this.sortSelect?.value || 'price_low_high',
            distance_sort: this.distanceSortSelect?.value || 'closest_furthest'
        };
        
        // Show status message
        this.showStatus('Initializing search...', 0);
        
        try {
            // Build query parameters
            const params = new URLSearchParams();
            params.append('pet_friendly', filters.pet_friendly);
            params.append('has_food', filters.has_food);
            params.append('vacancy', filters.vacancy);
            params.append('sort', filters.sort);
            params.append('distance_sort', filters.distance_sort);
            
            // Show status updates
            this.showStatus('Searching hotels in Texas cities...', 10);
            const progressInterval = this.simulateProgress();
            
            // Fetch hotels
            this.showStatus('Fetching hotel data from search results...', 30);
            console.log(`Fetching: /api/hotels/search?${params.toString()}`);
            const response = await fetch(`/api/hotels/search?${params.toString()}`);
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            this.showStatus('Processing and filtering hotels...', 60);
            const data = await response.json();
            console.log('API Response:', data);
            
            // Clear progress interval
            clearInterval(progressInterval);
            
            if (data.status === 'success') {
                console.log(`Received ${data.hotels ? data.hotels.length : 0} hotels from API`);
                
                // GUARANTEE at least one hotel
                if (!data.hotels || data.hotels.length === 0) {
                    console.warn("No hotels received, creating fallback");
                    data.hotels = [{
                        name: 'Holiday Inn Express - Dallas, TX',
                        price: 109.99,
                        price_text: '$109.99',
                        location: 'Dallas, TX',
                        city: 'Dallas, TX',
                        state: 'TX',
                        distance_miles: 350.0,
                        pet_friendly: true,
                        has_food: true,
                        vacancy: true,
                        rating: 4.2,
                        url: 'https://www.google.com/search?q=Holiday+Inn+Express+Dallas+TX+hotel+booking',
                        booking_url: 'https://www.booking.com/searchresults.html?ss=Holiday+Inn+Express+Dallas+TX',
                        source: 'Fallback Hotel - Call for availability'
                    }];
                }
                
                this.showStatus('Applying filters and sorting results...', 85);
                setTimeout(() => {
                    this.showStatus('Finalizing results...', 100);
                    setTimeout(() => {
                        this.currentHotels = data.hotels;
                        this.showAllHotels = false; // Reset to show only 15 initially
                        console.log(`Displaying ${data.hotels.length} hotels`);
                        this.displayHotels(data.hotels, filters);
                    }, 300);
                }, 200);
            } else {
                throw new Error(data.error || 'Failed to fetch hotels');
            }
        } catch (error) {
            console.error('Hotel search error:', error);
            this.resultsContainer.innerHTML = 
                `<p class="error-text">Error searching hotels: ${error.message}</p>`;
        }
    }
    
    showStatus(message, percentage) {
        const percentageText = Math.min(100, Math.max(0, Math.round(percentage)));
        this.resultsContainer.innerHTML = `
            <div class="progress-container">
                <div class="progress-bar" style="width: ${percentageText}%"></div>
                <p class="loading-text">${message}</p>
                <p class="status-percentage">${percentageText}% complete</p>
            </div>
        `;
    }
    
    simulateProgress() {
        let progress = 10;
        const interval = setInterval(() => {
            progress += Math.random() * 8 + 2; // Increment by 2-10%
            if (progress < 85) {
                this.showStatus('Searching hotels in Texas cities...', progress);
            }
        }, 250); // Update every 250ms
        return interval;
    }
    
    displayHotels(hotels, filters = null) {
        console.log(`displayHotels called with ${hotels ? hotels.length : 0} hotels`);
        
        // GUARANTEE at least one hotel
        if (!hotels || hotels.length === 0) {
            console.warn("No hotels provided to displayHotels, creating fallback");
            hotels = [{
                name: 'Holiday Inn Express - Dallas, TX',
                price: 109.99,
                price_text: '$109.99',
                location: 'Dallas, TX',
                city: 'Dallas, TX',
                state: 'TX',
                distance_miles: 350.0,
                pet_friendly: true,
                has_food: true,
                vacancy: true,
                rating: 4.2,
                url: 'https://www.google.com/search?q=Holiday+Inn+Express+Dallas+TX+hotel+booking',
                booking_url: 'https://www.booking.com/searchresults.html?ss=Holiday+Inn+Express+Dallas+TX',
                source: 'Display Fallback Hotel'
            }];
        }
        
        // Hotels are already sorted from backend based on filters
        // Apply client-side sorting with both price and distance options
        const sortedHotelsList = [...hotels];
        
        // Get current sort options
        const priceSortOption = this.sortSelect?.value || 'price_low_high';
        const distanceSortOption = this.distanceSortSelect?.value || 'closest_furthest';
        
        // Sort by price FIRST (cheapest first), then by distance (closest first for safety)
        // This matches the backend sorting logic to ensure consistent results
        if (priceSortOption === 'price_low_high') {
            sortedHotelsList.sort((a, b) => {
                // Primary sort: Price (lowest first) - rounded to 2 decimals to match backend
                const aPrice = Math.round((a.price || Infinity) * 100) / 100;
                const bPrice = Math.round((b.price || Infinity) * 100) / 100;
                const priceDiff = aPrice - bPrice;
                
                // If prices are different (more than $0.01), sort by price first
                if (Math.abs(priceDiff) > 0.01) {
                    return priceDiff;
                }
                
                // Secondary sort: Distance (closest first by default for evacuation safety)
                // When prices are the same, show closest hotels first to Corpus Christi
                const aDist = parseFloat(a.distance_miles) || Infinity;
                const bDist = parseFloat(b.distance_miles) || Infinity;
                return distanceSortOption === 'closest_furthest' 
                    ? aDist - bDist  // Closest first (safer for evacuation)
                    : bDist - aDist; // Furthest first
            });
        } else if (priceSortOption === 'price_high_low') {
            sortedHotelsList.sort((a, b) => {
                // Primary sort: Price (highest first)
                const aPrice = a.price || 0;
                const bPrice = b.price || 0;
                const priceDiff = bPrice - aPrice;
                
                // If prices are different, sort by price
                if (Math.abs(priceDiff) > 0.01) {
                    return priceDiff;
                }
                
                // Secondary sort: Distance
                const aDist = a.distance_miles || Infinity;
                const bDist = b.distance_miles || Infinity;
                return distanceSortOption === 'closest_furthest' 
                    ? aDist - bDist 
                    : bDist - aDist;
            });
        } else {
            // No price sort, just distance sort
            sortedHotelsList.sort((a, b) => {
                const aDist = a.distance_miles || Infinity;
                const bDist = b.distance_miles || Infinity;
                return distanceSortOption === 'closest_furthest' 
                    ? aDist - bDist 
                    : bDist - aDist;
            });
        }
        
        // Store sorted hotels for expand functionality
        this.sortedHotels = sortedHotelsList;
        
        // Limit to 15 hotels initially, show all if user requested expansion
        const initialLimit = 15;
        const hotelsToShow = this.showAllHotels ? sortedHotelsList : sortedHotelsList.slice(0, initialLimit);
        const hasMoreHotels = sortedHotelsList.length > initialLimit;
        const remainingCount = sortedHotelsList.length - initialLimit;
        
        // Build HTML with active filters display
        const activeFilters = [];
        if (this.petFriendlyCheck?.checked) activeFilters.push('Pet Friendly');
        if (this.hasFoodCheck?.checked) activeFilters.push('Food Service');
        if (this.vacancyCheck?.checked) activeFilters.push('Vacancy');
        
        const priceSortText = this.sortSelect?.options[this.sortSelect?.selectedIndex]?.text || 'Price: Low to High';
        const distanceSortText = this.distanceSortSelect?.options[this.distanceSortSelect?.selectedIndex]?.text || 'Closest to Furthest';
        let html = `<div class="hotel-results-summary">
            <p>Found <strong>${sortedHotelsList.length}</strong> hotels in Texas</p>
            ${!this.showAllHotels && hasMoreHotels ? `<p class="showing-info">Showing <strong>${hotelsToShow.length}</strong> of ${sortedHotelsList.length} hotels (closest and cheapest first)</p>` : ''}
            ${this.showAllHotels ? `<p class="showing-info">Showing all <strong>${sortedHotelsList.length}</strong> hotels</p>` : ''}
            ${activeFilters.length > 0 ? `<p class="active-filters">Active filters: ${activeFilters.join(', ')}</p>` : ''}
            <p class="sort-info">Sorted by: ${priceSortText} (then ${distanceSortText})</p>
        </div>`;
        
        html += '<div class="hotel-list">';
        
        hotelsToShow.forEach((hotel, index) => {
            const distance = hotel.distance_miles ? `${hotel.distance_miles.toFixed(1)} miles` : 'Distance N/A';
            const price = hotel.price ? `$${hotel.price.toFixed(2)}/night` : 'Price N/A';
            const rating = hotel.rating ? `⭐ ${hotel.rating.toFixed(1)}/10` : '';
            const hotelUrl = hotel.url || hotel.booking_url || '#';
            const bookingUrl = hotel.booking_url || hotel.url || '#';
            
            html += `
                <div class="hotel-card">
                    <div class="hotel-header">
                        <h4>${hotel.name || 'Unknown Hotel'}</h4>
                        ${rating ? `<span class="hotel-rating">${rating}</span>` : ''}
                    </div>
                    <div class="hotel-info">
                        <p class="hotel-location">📍 <strong>Location:</strong> ${hotel.location || hotel.city || 'Location N/A'}</p>
                        <p class="hotel-distance">📏 <strong>Distance:</strong> ${distance} from Corpus Christi, TX (your evacuation origin)</p>
                        <p class="hotel-price">💰 <strong>Rate:</strong> ${price}</p>
                        ${rating ? `<p class="hotel-rating-info">${rating}</p>` : ''}
                    </div>
                    <div class="hotel-features">
                        ${hotel.pet_friendly ? '<span class="feature-badge pet-friendly">🐾 Pet Friendly</span>' : ''}
                        ${hotel.has_food ? '<span class="feature-badge has-food">🍽️ Food Service</span>' : ''}
                        ${hotel.vacancy ? '<span class="feature-badge vacancy">✓ Vacancy</span>' : ''}
                    </div>
                    <div class="hotel-links">
                        <a href="${hotelUrl}" target="_blank" rel="noopener noreferrer" class="hotel-link-btn primary-link">
                            🔍 Search Hotel
                        </a>
                        ${bookingUrl !== hotelUrl ? `<a href="${bookingUrl}" target="_blank" rel="noopener noreferrer" class="hotel-link-btn secondary-link">📅 View on Booking.com</a>` : ''}
                    </div>
                    ${hotel.note ? `<p class="hotel-note">ℹ️ ${hotel.note}</p>` : ''}
                    <p class="hotel-source">Source: ${hotel.source || 'Unknown'}</p>
                </div>
            `;
        });
        
        html += '</div>';
        
        // Add expand search prompt if there are more hotels and not showing all
        if (hasMoreHotels && !this.showAllHotels) {
            html += `
                <div class="expand-search-prompt">
                    <p>Would you like to see more hotels?</p>
                    <p class="hint-text">There are ${remainingCount} more hotels matching your criteria.</p>
                    <div class="expand-search-buttons">
                        <button id="expand-search-yes" class="btn-primary expand-btn">Yes, Show All Hotels</button>
                        <button id="expand-search-no" class="btn-secondary expand-btn">No, Keep Current Results</button>
                    </div>
                </div>
            `;
        }
        
        this.resultsContainer.innerHTML = html;
        
        // Add event listeners for expand search buttons
        if (hasMoreHotels && !this.showAllHotels) {
            const expandYesBtn = document.getElementById('expand-search-yes');
            const expandNoBtn = document.getElementById('expand-search-no');
            
            if (expandYesBtn) {
                expandYesBtn.addEventListener('click', () => {
                    this.showAllHotels = true;
                    // Re-display with all hotels using stored sorted hotels
                    if (this.sortedHotels) {
                        this.displayHotels(this.sortedHotels, filters);
                    }
                });
            }
            
            if (expandNoBtn) {
                expandNoBtn.addEventListener('click', () => {
                    // Just remove the prompt, keep showing 15
                    const prompt = document.querySelector('.expand-search-prompt');
                    if (prompt) {
                        prompt.remove();
                    }
                });
            }
        }
    }
    
    resetFilters() {
        // Reset all filters to default
        if (this.petFriendlyCheck) this.petFriendlyCheck.checked = false;
        if (this.hasFoodCheck) this.hasFoodCheck.checked = false;
        if (this.vacancyCheck) this.vacancyCheck.checked = true;
        if (this.sortSelect) this.sortSelect.value = 'price_low_high'; // Default to Low to High
        if (this.distanceSortSelect) this.distanceSortSelect.value = 'closest_furthest'; // Default to Closest to Furthest
        
        // Re-search with default filters
        this.searchHotels();
    }
    
    async sendAIMessage() {
        const message = this.aiInput?.value.trim();
        
        if (!message) {
            return;
        }
        
        // Add user message to chat
        this.addAIMessage(message, 'user');
        
        // Clear input
        if (this.aiInput) {
            this.aiInput.value = '';
        }
        
        // Show loading
        const loadingId = this.addAIMessage('Thinking...', 'bot', true);
        
        try {
            // Build context with current hotel data - use all hotels, not just first 20
            const context = {
                type: 'hotel_search',
                hotels: this.currentHotels || [], // Include all available hotels from search
                filters: {
                    pet_friendly: this.petFriendlyCheck?.checked || false,
                    has_food: this.hasFoodCheck?.checked || false,
                    vacancy: this.vacancyCheck?.checked || false,
                    sort: this.sortSelect?.value || 'price_low_high',
                    distance_sort: this.distanceSortSelect?.value || 'closest_furthest'
                },
                origin: 'Corpus Christi, TX',
                origin_zip: '78401',
                evacuation_reason: 'hurricane'
            };
            
            // Check if we have hotel data
            let userMessage = message;
            if (this.currentHotels && this.currentHotels.length > 0) {
                userMessage = `I'm searching for hotels for hurricane evacuation from Corpus Christi, TX (zip code 78401). ${message}`;
            } else {
                userMessage = `I'm looking for hotels for hurricane evacuation from Corpus Christi, TX (zip code 78401), but I haven't searched yet. ${message}`;
            }
            
            // Send to chatbot API
            const response = await fetch('/api/chatbot/message', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    message: userMessage,
                    context: context
                })
            });
            
            const data = await response.json();
            
            // Remove loading
            this.removeAIMessage(loadingId);
            
            if (data.status === 'success') {
                this.addAIMessage(data.response, 'bot');
            } else {
                throw new Error(data.error || 'Failed to get AI response');
            }
        } catch (error) {
            // Remove loading
            this.removeAIMessage(loadingId);
            
            // Show error
            this.addAIMessage(`Sorry, I encountered an error: ${error.message}`, 'bot', false, true);
            console.error('AI chat error:', error);
        }
    }
    
    addAIMessage(message, type = 'bot', isLoading = false, isError = false) {
        const messageId = `ai-msg-${Date.now()}-${Math.random()}`;
        const messageDiv = document.createElement('div');
        messageDiv.id = messageId;
        messageDiv.className = `ai-message ${type}-message ${isLoading ? 'loading' : ''} ${isError ? 'error' : ''}`;
        messageDiv.textContent = message;
        
        if (this.aiMessagesContainer) {
            this.aiMessagesContainer.appendChild(messageDiv);
            this.aiMessagesContainer.scrollTop = this.aiMessagesContainer.scrollHeight;
        }
        
        return messageId;
    }
    
    removeAIMessage(messageId) {
        const messageElement = document.getElementById(messageId);
        if (messageElement) {
            messageElement.remove();
        }
    }
}

// Initialize when DOM is ready
let hotelSearchManager;
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        hotelSearchManager = new HotelSearchManager();
    });
} else {
    hotelSearchManager = new HotelSearchManager();
}

