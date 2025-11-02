"""
Traffic Service
Fetches traffic congestion and construction data using OpenStreetMap (FREE - No API key required)
"""

import os
import requests
from typing import List, Dict, Any
from math import radians, sin, cos

class TrafficService:
    """Service for fetching traffic congestion and construction data from OpenStreetMap"""
    
    def __init__(self):
        """Initialize traffic service - uses OpenStreetMap (no API key needed)"""
        pass
    
    def get_traffic_data(self, 
                        center_lat: float, 
                        center_lng: float, 
                        radius_km: float = 5.0) -> List[Dict[str, Any]]:
        """
        Get traffic congestion data for an area using OpenStreetMap
        
        Args:
            center_lat: Center latitude
            center_lng: Center longitude
            radius_km: Radius in kilometers to search for traffic data
            
        Returns:
            List of traffic points with lat, lng, and intensity (0-1)
        """
        try:
            return self._get_osm_traffic_data(center_lat, center_lng, radius_km)
        except Exception as e:
            print(f"Error fetching traffic data: {e}")
            return self._generate_sample_traffic_data(center_lat, center_lng, radius_km)
    
    def _get_osm_traffic_data(self, 
                              center_lat: float, 
                              center_lng: float, 
                              radius_km: float) -> List[Dict[str, Any]]:
        """
        Get traffic data based on OpenStreetMap road density
        FREE - No API key required, uses road network data
        """
        try:
            # Use Overpass API to get road data from OpenStreetMap
            # This is completely free and doesn't require an API key
            overpass_url = "https://overpass-api.de/api/interpreter"
            
            # Create bounding box
            lat_offset = radius_km / 111.0
            lng_offset = radius_km / (111.0 * cos(radians(center_lat)))
            
            bbox = f"{center_lat - lat_offset},{center_lng - lng_offset},{center_lat + lat_offset},{center_lng + lng_offset}"
            
            # Query for major roads (highways, primary, secondary)
            query = f"""
            [out:json][timeout:25];
            (
              way["highway"~"^(motorway|trunk|primary|secondary|tertiary)$"]({bbox});
            );
            out body;
            >;
            out skel qt;
            """
            
            response = requests.post(overpass_url, data={'data': query}, timeout=30)
            
            if response.status_code == 200:
                data = response.json()
                return self._parse_osm_response(data, center_lat, center_lng, radius_km)
            else:
                # Fallback to sample data if Overpass API fails
                return self._generate_sample_traffic_data(center_lat, center_lng, radius_km)
        except Exception as e:
            print(f"OSM API error: {e}, using sample data")
            return self._generate_sample_traffic_data(center_lat, center_lng, radius_km)
    
    def _parse_osm_response(self, 
                            data: Dict, 
                            center_lat: float, 
                            center_lng: float, 
                            radius_km: float) -> List[Dict[str, Any]]:
        """Parse OpenStreetMap Overpass API response to generate traffic points"""
        traffic_points = []
        
        # Extract road nodes from response
        if 'elements' in data:
            nodes = {}
            ways = []
            
            for element in data.get('elements', []):
                if element.get('type') == 'node':
                    nodes[element.get('id')] = {
                        'lat': element.get('lat'),
                        'lng': element.get('lon')
                    }
                elif element.get('type') == 'way':
                    ways.append(element)
            
            # Generate traffic points along roads
            for way in ways[:50]:  # Limit to first 50 roads
                nodes_in_way = way.get('nodes', [])
                highway_type = way.get('tags', {}).get('highway', '')
                
                # Assign higher traffic intensity to major roads
                base_intensity = 0.3  # Default
                if highway_type in ['motorway', 'trunk']:
                    base_intensity = 0.7
                elif highway_type in ['primary', 'secondary']:
                    base_intensity = 0.5
                
                # Create points along the road
                for node_id in nodes_in_way[::3]:  # Every 3rd node to reduce density
                    if node_id in nodes:
                        node = nodes[node_id]
                        import random
                        intensity = base_intensity + random.uniform(-0.2, 0.2)
                        intensity = max(0.0, min(1.0, intensity))
                        
                        traffic_points.append({
                            'lat': node['lat'],
                            'lng': node['lng'],
                            'intensity': intensity
                        })
        
        # If we got points, return them; otherwise generate sample data
        return traffic_points if traffic_points else self._generate_sample_traffic_data(center_lat, center_lng, radius_km)
    
    def _generate_sample_traffic_data(self, 
                                     center_lat: float, 
                                     center_lng: float, 
                                     radius_km: float) -> List[Dict[str, Any]]:
        """
        Generate sample traffic data for demonstration (fallback)
        
        Args:
            center_lat: Center latitude
            center_lng: Center longitude
            radius_km: Radius in kilometers
            
        Returns:
            List of traffic points
        """
        import random
        points = []
        num_points = 30
        
        for _ in range(num_points):
            angle = random.uniform(0, 2 * 3.14159)
            distance_km = random.uniform(0, radius_km)
            
            lat_offset = distance_km / 111.0 * sin(angle)
            lng_offset = distance_km / (111.0 * cos(radians(center_lat))) * cos(angle)
            
            # Simulate higher traffic intensity near center
            intensity = max(0.2, 0.8 - (distance_km / radius_km) + random.uniform(-0.2, 0.2))
            intensity = max(0.0, min(1.0, intensity))
            
            points.append({
                'lat': center_lat + lat_offset,
                'lng': center_lng + lng_offset,
                'intensity': intensity
            })
        
        return points
    
    def get_construction_data(self,
                            center_lat: float,
                            center_lng: float,
                            radius_km: float = 5.0) -> List[Dict[str, Any]]:
        """
        Get REAL construction data for an area using OpenStreetMap
        Only returns actual construction sites found in OSM database
        Returns empty list if no construction data exists (no mock/sample data)
        
        Args:
            center_lat: Center latitude
            center_lng: Center longitude
            radius_km: Radius in kilometers to search for construction data
            
        Returns:
            List of construction points with lat, lng, and type (REAL DATA ONLY)
        """
        try:
            # Get real construction data from OSM
            real_data = self._get_osm_construction_data(center_lat, center_lng, radius_km)
            
            # Only return real data - no sample/mock data
            if real_data:
                print(f"Returning {len(real_data)} real construction points from OpenStreetMap")
                return real_data
            else:
                print("No real construction data found in OpenStreetMap for this area")
                return []  # Return empty - no construction in area
        except Exception as e:
            print(f"Error fetching construction data: {e}")
            return []  # Return empty on error - no mock data
    
    def _get_osm_construction_data(self,
                                   center_lat: float,
                                   center_lng: float,
                                   radius_km: float) -> List[Dict[str, Any]]:
        """
        Get construction data from OpenStreetMap
        FREE - No API key required, uses construction/road work tags
        """
        try:
            # Use Overpass API to get construction data from OpenStreetMap
            overpass_url = "https://overpass-api.de/api/interpreter"
            
            # Create bounding box
            lat_offset = radius_km / 111.0
            lng_offset = radius_km / (111.0 * cos(radians(center_lat)))
            
            bbox = f"{center_lat - lat_offset},{center_lng - lng_offset},{center_lat + lat_offset},{center_lng + lng_offset}"
            
            # Query for construction/road work features
            # Look for: highway=construction, construction tags, and construction-related features
            query = f"""
            [out:json][timeout:25];
            (
              way["highway"="construction"]({bbox});
              way["construction"~"."]["highway"~"."]({bbox});
              way["construction"="yes"]["highway"~"."]({bbox});
              way["construction"="major"]["highway"~"."]({bbox});
              way["construction"="minor"]["highway"~"."]({bbox});
              way["construction"="planned"]["highway"~"."]({bbox});
              node["highway"="construction"]({bbox});
              node["construction"~"."]({bbox});
              relation["highway"="construction"]({bbox});
              relation["construction"~"."]({bbox});
            );
            out center;
            >;
            out skel qt;
            """
            
            response = requests.post(overpass_url, data={'data': query}, timeout=30)
            
            if response.status_code == 200:
                data = response.json()
                construction_points = self._parse_construction_response(data, center_lat, center_lng, radius_km)
                
                # Only use real data if we found some, otherwise try alternate query
                if construction_points:
                    print(f"Found {len(construction_points)} real construction points from OSM")
                    return construction_points
                else:
                    print("No construction data found in primary query, trying alternate query")
                    return self._get_alternate_construction_data(center_lat, center_lng, radius_km)
            else:
                # If query failed, try alternate query
                print(f"OSM construction query returned status {response.status_code}, trying alternate query")
                return self._get_alternate_construction_data(center_lat, center_lng, radius_km)
        except Exception as e:
            print(f"OSM construction API error: {e}, returning empty (no mock data)")
            return []  # Return empty on error - only real data
    
    def _get_alternate_construction_data(self,
                                        center_lat: float,
                                        center_lng: float,
                                        radius_km: float) -> List[Dict[str, Any]]:
        """Alternate query for construction data if primary query fails - looks for other construction indicators"""
        try:
            overpass_url = "https://overpass-api.de/api/interpreter"
            
            lat_offset = radius_km / 111.0
            lng_offset = radius_km / (111.0 * cos(radians(center_lat)))
            bbox = f"{center_lat - lat_offset},{center_lng - lng_offset},{center_lat + lat_offset},{center_lng + lng_offset}"
            
            # Try querying for other construction-related features
            # Look for closed/restricted roads that might indicate construction
            query = f"""
            [out:json][timeout:25];
            (
              way["highway"~"."]["access"="no"]({bbox});
              way["highway"~"."]["barrier"="construction"]({bbox});
              node["barrier"="construction"]({bbox});
              way["highway"~"."]["temporary"="yes"]({bbox});
              way["highway"~"."]["note"~"construction"]({bbox});
              way["highway"~"."]["note"~"Construction"]({bbox});
            );
            out center;
            >;
            out skel qt;
            """
            
            response = requests.post(overpass_url, data={'data': query}, timeout=30)
            
            if response.status_code == 200:
                data = response.json()
                construction_points = self._parse_construction_response(data, center_lat, center_lng, radius_km)
                # Return real data if found, otherwise return empty (let caller decide on sample data)
                return construction_points
            else:
                print(f"Alternate query returned status {response.status_code}, no construction data found")
                return []  # Return empty - only real data
        except Exception as e:
            print(f"Alternate construction query error: {e}, no construction data found")
            return []  # Return empty - only real data
    
    def _parse_construction_response(self,
                                    data: Dict,
                                    center_lat: float,
                                    center_lng: float,
                                    radius_km: float) -> List[Dict[str, Any]]:
        """Parse OpenStreetMap construction response"""
        construction_points = []
        
        if 'elements' in data:
            nodes = {}
            ways = []
            
            for element in data.get('elements', []):
                if element.get('type') == 'node':
                    nodes[element.get('id')] = {
                        'lat': element.get('lat'),
                        'lng': element.get('lon')
                    }
                elif element.get('type') == 'way':
                    ways.append(element)
                elif element.get('type') == 'relation':
                    # Relations might have center coordinates
                    if 'center' in element:
                        center = element['center']
                        ways.append({
                            'center': {
                                'lat': center.get('lat'),
                                'lon': center.get('lon')
                            },
                            'tags': element.get('tags', {})
                        })
            
            # Extract construction points from ways
            for way in ways[:30]:  # Limit to 30 construction sites
                tags = way.get('tags', {})
                
                # Only process if it's actually construction-related
                is_construction = (
                    tags.get('highway') == 'construction' or
                    tags.get('construction') or
                    'construction' in str(tags.get('note', '')).lower() or
                    tags.get('barrier') == 'construction'
                )
                
                if not is_construction:
                    continue
                
                construction_type = tags.get('construction', tags.get('barrier', 'yes'))
                
                # Get location
                lat = None
                lng = None
                
                if 'center' in way:
                    center_data = way['center']
                    if isinstance(center_data, dict):
                        lat = center_data.get('lat')
                        lng = center_data.get('lon') or center_data.get('lng')
                    else:
                        continue
                elif 'nodes' in way and len(way['nodes']) > 0:
                    # Use first node if available
                    first_node_id = way['nodes'][0]
                    if first_node_id in nodes:
                        node = nodes[first_node_id]
                        lat = node['lat']
                        lng = node['lng']
                    else:
                        continue
                else:
                    continue
                
                if lat and lng:
                    # Build description from available tags
                    name = tags.get('name') or tags.get('ref') or ''
                    highway_type = tags.get('highway', '')
                    if highway_type == 'construction':
                        highway_type = tags.get('construction', 'road')
                    
                    description = name if name else f"Road Construction ({highway_type})"
                    
                    construction_points.append({
                        'lat': lat,
                        'lng': lng,
                        'type': construction_type,
                        'description': description
                    })
            
            # Also check nodes that might be construction barriers
            for element in data.get('elements', []):
                if element.get('type') == 'node':
                    tags = element.get('tags', {})
                    if tags.get('barrier') == 'construction' or tags.get('construction'):
                        lat = element.get('lat')
                        lng = element.get('lon')
                        if lat and lng:
                            construction_points.append({
                                'lat': lat,
                                'lng': lng,
                                'type': tags.get('construction', 'barrier'),
                                'description': 'Construction Barrier'
                            })
        
        # Return real data if we found any
        if construction_points:
            print(f"Parsed {len(construction_points)} real construction points from OSM")
            return construction_points
        
        # If no real construction data found, return empty list (not sample data)
        # This allows the frontend to know there's no construction in the area
        print("No real construction data found in OSM for this area")
        return []
    
    def _generate_sample_construction_data(self,
                                          center_lat: float,
                                          center_lng: float,
                                          radius_km: float) -> List[Dict[str, Any]]:
        """
        Generate sample construction data for demonstration
        """
        import random
        points = []
        num_points = 5  # Fewer construction sites than traffic points
        
        for _ in range(num_points):
            angle = random.uniform(0, 2 * 3.14159)
            distance_km = random.uniform(0, radius_km * 0.8)  # Keep closer to center
            
            lat_offset = distance_km / 111.0 * sin(angle)
            lng_offset = distance_km / (111.0 * cos(radians(center_lat))) * cos(angle)
            
            construction_types = ['major', 'minor', 'roadwork', 'planned']
            
            points.append({
                'lat': center_lat + lat_offset,
                'lng': center_lng + lng_offset,
                'type': random.choice(construction_types),
                'description': f"Road Construction ({random.choice(['Major', 'Minor', 'Maintenance'])})"
            })
        
        return points
