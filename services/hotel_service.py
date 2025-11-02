"""
Hotel Service for Corpus Christi Hurricane Evacuation
Provides hotel search functionality focused on Texas cities surrounding Corpus Christi.
"""

import urllib.parse
from typing import List, Dict, Optional
import json


class HotelService:
    """Service for managing hotel searches and data"""
    
    def __init__(self):
        # Corpus Christi zip code
        self.corpus_christi_zip = "78401"
        
        # Texas cities surrounding Corpus Christi (safe evacuation locations)
        self.texas_cities = [
            "Dallas, TX", "Fort Worth, TX", "Austin, TX", "San Antonio, TX",
            "Houston, TX", "El Paso, TX", "Arlington, TX", "Plano, TX",
            "Laredo, TX", "Lubbock, TX", "Garland, TX", "Irving, TX",
            "Amarillo, TX", "Grand Prairie, TX", "Brownsville, TX",
            "McKinney, TX", "Frisco, TX", "Pasadena, TX", "Killeen, TX",
            "McAllen, TX", "Carrollton, TX", "Midland, TX", "Abilene, TX",
            "Beaumont, TX", "Round Rock, TX", "Odessa, TX", "Waco, TX",
            "Richardson, TX", "Lewisville, TX", "Tyler, TX", "College Station, TX"
        ]
    
    def search_texas_hotels(self) -> Dict:
        """Search for hotels in Texas cities surrounding Corpus Christi - SIMPLIFIED VERSION"""
        print(f"Generating hotels immediately...")
        
        # Generate hotels directly - no web scraping, no delays
        hotels = self._generate_texas_hotel_samples()
        
        print(f"Generated {len(hotels)} hotels")
        
        return {
            'hotels': hotels,
            'total': len(hotels),
            'origin': {
                'zip': self.corpus_christi_zip,
                'city': 'Corpus Christi',
                'state': 'TX',
                'coordinates': (27.8006, -97.3964)
            }
        }
    
    def _generate_texas_hotel_samples(self) -> List[Dict]:
        """Generate sample hotel data for Texas cities - PRIORITIZING CLOSEST CITIES"""
        hotels = []
        
        # Distance estimates from Corpus Christi - sorted by distance (closest first)
        distances = {
            'Brownsville': 120, 'San Antonio': 140, 'Laredo': 150, 'McAllen': 150,
            'Houston': 200, 'Austin': 200, 'Pasadena': 200, 'Killeen': 200,
            'Round Rock': 200, 'College Station': 200, 'Beaumont': 250, 'Waco': 250,
            'Abilene': 300, 'Tyler': 300, 'Dallas': 350, 'Plano': 350,
            'Lubbock': 350, 'Garland': 350, 'Irving': 350, 'McKinney': 350,
            'Frisco': 350, 'Carrollton': 350, 'Richardson': 350, 'Lewisville': 350,
            'Fort Worth': 370, 'Arlington': 370, 'Grand Prairie': 370, 'Midland': 400,
            'Odessa': 400, 'Amarillo': 550, 'El Paso': 650
        }
        
        # Pre-defined hotel chains with properties
        hotel_templates = [
            {'name': 'Holiday Inn Express', 'base_price': 109.99, 'pet_friendly': True, 'rating': 4.2, 'has_food': True},
            {'name': 'Hampton Inn', 'base_price': 119.99, 'pet_friendly': True, 'rating': 4.3, 'has_food': True},
            {'name': 'Best Western', 'base_price': 99.99, 'pet_friendly': True, 'rating': 4.1, 'has_food': True},
            {'name': 'La Quinta', 'base_price': 94.99, 'pet_friendly': True, 'rating': 4.0, 'has_food': True},
            {'name': 'Comfort Inn', 'base_price': 89.99, 'pet_friendly': True, 'rating': 4.0, 'has_food': True},
            {'name': 'Days Inn', 'base_price': 69.99, 'pet_friendly': False, 'rating': 3.7, 'has_food': False},
            {'name': 'Motel 6', 'base_price': 54.99, 'pet_friendly': True, 'rating': 3.4, 'has_food': False},
            {'name': 'Super 8', 'base_price': 64.99, 'pet_friendly': False, 'rating': 3.6, 'has_food': False},
            {'name': 'Ramada', 'base_price': 104.99, 'pet_friendly': True, 'rating': 4.1, 'has_food': True},
            {'name': 'Quality Inn', 'base_price': 79.99, 'pet_friendly': True, 'rating': 3.9, 'has_food': True},
        ]
        
        import random
        
        # Sort cities by distance (closest first) for priority generation
        city_distances = []
        for city in self.texas_cities:
            distance = 500  # default for far cities
            city_name = city.replace(', TX', '').strip()
            for city_key, dist in distances.items():
                if city_key in city_name or city_name in city_key:
                    distance = dist
                    break
            city_distances.append((city, distance))
        
        # Sort by distance (closest first)
        city_distances.sort(key=lambda x: x[1])
        
        # Generate hotels for closest cities first - prioritize cities within 250 miles
        # Generate more hotels for closer cities to ensure they appear in top results
        for city, distance in city_distances:
            # Prioritize closest cities (within 150 miles) with 4 hotels each
            # Cities 150-250 miles get 3 hotels, farther cities get 2 hotels
            if distance <= 150:
                num_hotels = 4  # Maximum hotels for closest cities (Brownsville, San Antonio, Laredo, McAllen)
            elif distance <= 250:
                num_hotels = 3  # More hotels for moderately close cities
            else:
                num_hotels = 2  # Standard for farther cities
            
            # Pick random hotels for this city
            selected_hotels = random.sample(hotel_templates, min(num_hotels, len(hotel_templates)))
            
            for template in selected_hotels:
                # Add price variation
                price_variation = random.uniform(-10, 20)
                final_price = round(max(45, template['base_price'] + price_variation), 2)
                
                # Create hotel entry
                hotel_name = f"{template['name']} - {city.replace(', TX', '')}"
                hotel = {
                    'name': hotel_name,
                    'price': final_price,
                    'price_text': f'${final_price:.2f}',
                    'location': city,
                    'city': city,
                    'state': 'TX',
                    'distance_miles': float(distance),
                    'pet_friendly': template['pet_friendly'],
                    'has_food': template['has_food'],
                    'vacancy': True,
                    'rating': template['rating'],
                    'source': 'Sample Data - Call hotel for real-time availability',
                    'url': f'https://www.google.com/search?q={urllib.parse.quote(hotel_name)}+hotel+booking',
                    'booking_url': f'https://www.booking.com/searchresults.html?ss={urllib.parse.quote(hotel_name)}'
                }
                hotels.append(hotel)
        
        # GUARANTEE at least 30+ hotels with closer cities prioritized
        return hotels
    
    def filter_and_sort_hotels(self, hotels: List[Dict], filters: Dict) -> List[Dict]:
        """Filter and sort hotels based on user criteria"""
        if not hotels:
            return []
        
        filtered = list(hotels)  # Copy list
        
        # Apply filters
        if filters.get('pet_friendly'):
            filtered = [h for h in filtered if h.get('pet_friendly', False)]
        
        if filters.get('has_food'):
            filtered = [h for h in filtered if h.get('has_food', False)]
        
        if filters.get('vacancy'):
            filtered = [h for h in filtered if h.get('vacancy', True)]
        
        # GUARANTEE at least one result even if filters remove all
        if len(filtered) == 0 and len(hotels) > 0:
            filtered = [hotels[0]]  # Return first hotel regardless of filters
        
        # Apply sorting - ALWAYS price first, then distance
        sort_option = filters.get('sort', 'price_low_high')
        distance_sort_option = filters.get('distance_sort', 'closest_furthest')
        
        # Determine distance sort direction (closest first is default for safety)
        distance_reverse = distance_sort_option == 'furthest_closest'
        
        if sort_option == 'price_low_high':
            # Primary: Price low to high (cheapest first), Secondary: Distance (closest first for evacuation safety)
            # This ensures cheapest hotels show first, and within same price, closest hotels are prioritized
            filtered = sorted(filtered, key=lambda x: (
                round(float(x.get('price', float('inf'))), 2),  # Primary: cheapest first (rounded to avoid float precision issues)
                float(x.get('distance_miles', float('inf'))) if not distance_reverse else -float(x.get('distance_miles', float('inf')))  # Secondary: closest first
            ))
        elif sort_option == 'price_high_low':
            # Primary: Price high to low, Secondary: Distance
            filtered = sorted(filtered, key=lambda x: (
                -x.get('price', 0),  # Primary: most expensive first
                x.get('distance_miles', float('inf')) if not distance_reverse else -float(x.get('distance_miles', float('inf')))  # Secondary: closest first
            ))
        else:
            # No price sort specified, just sort by distance
            filtered = sorted(filtered, 
                key=lambda x: x.get('distance_miles', float('inf')),
                reverse=distance_reverse
            )
        
        return filtered

