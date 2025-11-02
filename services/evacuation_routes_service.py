"""
Evacuation Routes Service
Fetches actual evacuation route coordinates from OpenStreetMap using OSRM
"""

import requests
from typing import List, Dict, Any


class EvacuationRoutesService:
    """Service for fetching evacuation routes from OpenStreetMap via OSRM"""
    
    def __init__(self):
        self.osrm_url = "https://router.project-osrm.org/route/v1/driving"
    
    def get_route_coordinates(self, start_lat: float, start_lng: float,
                             end_lat: float, end_lng: float) -> List[List[float]]:
        """
        Get route coordinates using OSRM (Open Source Routing Machine)
        which uses OSM data for routing
        
        Args:
            start_lat: Starting latitude
            start_lng: Starting longitude
            end_lat: Ending latitude
            end_lng: Ending longitude
            
        Returns:
            List of [lat, lng] coordinates following the actual route
        """
        try:
            # Format coordinates for OSRM: longitude,latitude
            coords = f"{start_lng},{start_lat};{end_lng},{end_lat}"
            
            response = requests.get(
                f"{self.osrm_url}/{coords}",
                params={
                    'overview': 'full',
                    'geometries': 'geojson',
                    'steps': 'false',
                    'alternatives': 'false'
                },
                timeout=30
            )
            
            if response.status_code == 200:
                data = response.json()
                if data.get('code') == 'Ok' and data.get('routes'):
                    route = data['routes'][0]
                    geometry = route.get('geometry')
                    
                    if geometry and geometry.get('type') == 'LineString':
                        # Convert GeoJSON coordinates [lng, lat] to [lat, lng]
                        coords_list = [[coord[1], coord[0]] for coord in geometry.get('coordinates', [])]
                        return coords_list
                
                # If no route found, return empty list
                print(f"OSRM returned no route between ({start_lat}, {start_lng}) and ({end_lat}, {end_lng})")
                return [[start_lat, start_lng], [end_lat, end_lng]]
            
            print(f"OSRM request failed with status {response.status_code}")
            return [[start_lat, start_lng], [end_lat, end_lng]]
            
        except Exception as e:
            print(f"Error fetching route from OSRM: {e}")
            # Return fallback straight line
            return [[start_lat, start_lng], [end_lat, end_lng]]
    
    def get_all_evacuation_routes(self) -> List[Dict[str, Any]]:
        """
        Get all evacuation routes for Corpus Christi with actual OSM coordinates
        
        Returns:
            List of evacuation route dictionaries with accurate coordinates from OSM
        """
        routes_config = [
            {
                'id': 1,
                'name': 'North Route - I-37',
                'highway': 'Interstate 37 (I-37)',
                'description': 'Primary northbound evacuation route via Interstate 37',
                'nextCity': 'San Antonio',
                'distance': '150 miles',
                'color': '#e67e22',
                'weight': 5,
                'start': [27.8006, -97.3964],  # Corpus Christi center
                'end': [29.4241, -98.4936]      # San Antonio
            },
            {
                'id': 2,
                'name': 'West Route - US-181',
                'highway': 'US Highway 181',
                'description': 'Westbound evacuation route via US-181 to Victoria',
                'nextCity': 'Victoria',
                'distance': '45 miles',
                'color': '#3498db',
                'weight': 5,
                'start': [27.8006, -97.3964],  # Corpus Christi center
                'end': [28.8053, -97.0036]     # Victoria
            },
            {
                'id': 3,
                'name': 'Northwest Route - SH-44',
                'highway': 'State Highway 44',
                'description': 'Northwest evacuation route via SH-44',
                'nextCity': 'Alice',
                'distance': '35 miles',
                'color': '#2ecc71',
                'weight': 5,
                'start': [27.8006, -97.3964],  # Corpus Christi center
                'end': [27.7522, -98.0700]     # Alice
            },
            {
                'id': 4,
                'name': 'South Route - SH-358',
                'highway': 'State Highway 358 (SPID)',
                'description': 'South evacuation route via SH-358 (South Padre Island Drive)',
                'nextCity': 'Padre Island',
                'distance': '15 miles',
                'color': '#9b59b6',
                'weight': 5,
                'start': [27.7225, -97.3956],  # SPID/I-37 area
                'end': [27.6150, -97.2200]     # Padre Island area
            },
            {
                'id': 5,
                'name': 'East Route - SH-358/Portland',
                'highway': 'SH-358 East to Portland',
                'description': 'Eastbound evacuation route via SH-358 to Portland and beyond',
                'nextCity': 'Portland',
                'distance': '8 miles',
                'color': '#f39c12',
                'weight': 5,
                'start': [27.7225, -97.3956],  # SPID/I-37
                'end': [27.8774, -97.3187]     # Portland
            },
            {
                'id': 6,
                'name': 'SH-43 Evacuation Route',
                'highway': 'State Highway 43',
                'description': 'Evacuation route via State Highway 43 to Mathis and beyond',
                'nextCity': 'Mathis',
                'distance': '30 miles',
                'color': '#d35400',
                'weight': 5,
                'start': [27.8006, -97.3964],  # Corpus Christi center (SH-43 begins here)
                'end': [28.0936, -97.8281]     # Mathis (SH-43 continues north)
            },
            {
                'id': 7,
                'name': 'Coastal Route - SH-357',
                'highway': 'State Highway 357',
                'description': 'Coastal evacuation route via SH-357 along the bay',
                'nextCity': 'Port Aransas',
                'distance': '25 miles',
                'color': '#16a085',
                'weight': 4,
                'start': [27.8006, -97.3964],  # Corpus Christi center
                'end': [27.8339, -97.0614]     # Port Aransas area
            },
            {
                'id': 8,
                'name': 'SH-43 / FM 2444 Route',
                'highway': 'State Highway 43 / FM 2444',
                'description': 'North evacuation route via SH-43 and FM 2444',
                'nextCity': 'Beeville',
                'distance': '40 miles',
                'color': '#8e44ad',
                'weight': 5,
                'start': [27.8006, -97.3964],  # Corpus Christi center (SH-43 begins)
                'end': [28.4009, -97.7481]     # Beeville area (via FM 2444)
            },
            {
                'id': 9,
                'name': 'South Staples St to FM 2444',
                'highway': 'Staples Street / FM 2444',
                'description': 'North evacuation route from South Staples Street to FM 2444',
                'nextCity': 'Beeville',
                'distance': '45 miles',
                'color': '#1abc9c',
                'weight': 5,
                'start': [27.7089, -97.3934],  # SPID at Staples Street (South Staples Street intersection)
                'end': [28.4009, -97.7481]     # FM 2444 / Beeville area
            }
        ]
        
        routes = []
        for config in routes_config:
            # Get actual route coordinates from OSM via OSRM
            coords = self.get_route_coordinates(
                config['start'][0], config['start'][1],
                config['end'][0], config['end'][1]
            )
            
            route = {
                'id': config['id'],
                'name': config['name'],
                'highway': config['highway'],
                'description': config['description'],
                'nextCity': config['nextCity'],
                'distance': config['distance'],
                'color': config['color'],
                'weight': config['weight'],
                'coordinates': coords
            }
            
            routes.append(route)
        
        return routes

