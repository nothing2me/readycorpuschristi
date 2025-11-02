"""
Map service for geocoding and map-related operations.
Expandable to support multiple map providers (Google Maps, Mapbox, Nominatim, etc.)
"""

import os
from typing import Dict, Any, Optional
import requests

class MapService:
    """Service for handling map and geocoding operations"""
    
    def __init__(self):
        # Initialize with API keys from environment variables
        self.api_key = os.getenv('MAP_API_KEY', '')
        self.provider = os.getenv('MAP_PROVIDER', 'nominatim')  # Default to free Nominatim
        
    def geocode_address(self, address: str) -> Dict[str, Any]:
        """
        Geocode an address to coordinates.
        
        Args:
            address: Address string to geocode
        
        Returns:
            Dictionary with lat, lng, and formatted address
        """
        if not self.api_key and self.provider == 'nominatim':
            # Use free Nominatim service (OpenStreetMap)
            return self._geocode_nominatim(address)
        
        # TODO: Implement other providers (Google Maps, Mapbox, etc.)
        # if self.provider == 'google':
        #     return self._geocode_google(address)
        # elif self.provider == 'mapbox':
        #     return self._geocode_mapbox(address)
        
        return self._geocode_nominatim(address)
    
    def reverse_geocode(self, lat: float, lng: float) -> Dict[str, Any]:
        """
        Reverse geocode coordinates to address.
        
        Args:
            lat: Latitude
            lng: Longitude
        
        Returns:
            Dictionary with address information
        """
        if not self.api_key and self.provider == 'nominatim':
            return self._reverse_geocode_nominatim(lat, lng)
        
        # TODO: Implement other providers
        return self._reverse_geocode_nominatim(lat, lng)
    
    def _geocode_nominatim(self, address: str) -> Dict[str, Any]:
        """Geocode using Nominatim (free, no API key required)"""
        try:
            url = "https://nominatim.openstreetmap.org/search"
            params = {
                'q': address,
                'format': 'json',
                'limit': 1
            }
            headers = {
                'User-Agent': 'FlaskMapApp/1.0'  # Required by Nominatim
            }
            
            response = requests.get(url, params=params, headers=headers, timeout=5)
            response.raise_for_status()
            
            data = response.json()
            
            if data and len(data) > 0:
                result = data[0]
                return {
                    'lat': float(result['lat']),
                    'lng': float(result['lon']),
                    'display_name': result.get('display_name', address),
                    'address': address
                }
            else:
                return {
                    'error': 'Address not found',
                    'address': address
                }
        except Exception as e:
            return {
                'error': str(e),
                'address': address
            }
    
    def _reverse_geocode_nominatim(self, lat: float, lng: float) -> Dict[str, Any]:
        """Reverse geocode using Nominatim"""
        try:
            url = "https://nominatim.openstreetmap.org/reverse"
            params = {
                'lat': lat,
                'lon': lng,
                'format': 'json'
            }
            headers = {
                'User-Agent': 'FlaskMapApp/1.0'
            }
            
            response = requests.get(url, params=params, headers=headers, timeout=5)
            response.raise_for_status()
            
            data = response.json()
            
            if 'address' in data:
                return {
                    'address': data.get('display_name', ''),
                    'components': data.get('address', {}),
                    'lat': lat,
                    'lng': lng
                }
            else:
                return {
                    'error': 'Reverse geocoding failed',
                    'lat': lat,
                    'lng': lng
                }
        except Exception as e:
            return {
                'error': str(e),
                'lat': lat,
                'lng': lng
            }

