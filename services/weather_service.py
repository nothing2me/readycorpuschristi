"""
Weather Service
Fetches weather data from National Weather Service API (api.weather.gov)
No API key required - free government service
"""

import requests
from typing import Dict, Any, Optional
import json

class WeatherService:
    """Service for fetching weather forecast data from NWS API"""
    
    def __init__(self):
        # National Weather Service API - no key required
        self.base_url = 'https://api.weather.gov'
        self.user_agent = 'FlaskMapApp/1.0 (hackathon project)'  # Required by NWS API
        
    def get_forecast(self, lat: float, lng: float) -> Dict[str, Any]:
        """
        Get weather forecast for a location using NWS API.
        
        Args:
            lat: Latitude
            lng: Longitude
        
        Returns:
            Dictionary with weather data
        """
        try:
            # Step 1: Get grid point from coordinates
            grid_url = f"{self.base_url}/points/{lat},{lng}"
            headers = {'User-Agent': self.user_agent}
            
            grid_response = requests.get(grid_url, headers=headers, timeout=10)
            grid_response.raise_for_status()
            grid_data = grid_response.json()
            
            if 'properties' not in grid_data:
                raise ValueError("Invalid grid point response")
            
            properties = grid_data['properties']
            forecast_url = properties.get('forecast')
            forecast_hourly_url = properties.get('forecastHourly')
            grid_id = properties.get('gridId')
            grid_x = properties.get('gridX')
            grid_y = properties.get('gridY')
            
            # Step 2: Get forecast
            if not forecast_url:
                raise ValueError("No forecast URL available")
            
            forecast_response = requests.get(forecast_url, headers=headers, timeout=10)
            forecast_response.raise_for_status()
            forecast_data = forecast_response.json()
            
            # Step 3: Get hourly forecast for current conditions
            current_data = None
            if forecast_hourly_url:
                try:
                    hourly_response = requests.get(forecast_hourly_url, headers=headers, timeout=10)
                    hourly_response.raise_for_status()
                    hourly_data = hourly_response.json()
                    if hourly_data.get('properties', {}).get('periods'):
                        current_data = hourly_data['properties']['periods'][0]
                except:
                    pass  # Use daily forecast if hourly fails
            
            # Process and format data
            location_name = properties.get('relativeLocation', {}).get('properties', {}).get('city', '')
            if not location_name:
                location_name = f"Location ({lat:.2f}, {lng:.2f})"
            
            return self._format_nws_weather_data(forecast_data, current_data, location_name, lat, lng)
        
        except Exception as e:
            print(f"Weather API error: {e}")
            # Return mock data on error
            return self._get_mock_forecast(lat, lng)
    
    def _format_nws_weather_data(self, forecast_data: Dict, current_data: Optional[Dict], location_name: str, lat: float, lng: float) -> Dict[str, Any]:
        """Format NWS API response into consistent structure"""
        
        periods = forecast_data.get('properties', {}).get('periods', [])
        
        if not periods:
            return self._get_mock_forecast(lat, lng)
        
        # Get current conditions (first period is current/next)
        current_period = current_data if current_data else periods[0]
        
        current = {
            'temp': current_period.get('temperature', 0),
            'feels_like': current_period.get('temperature', 0),  # NWS doesn't provide feels_like
            'humidity': None,  # Not in daily forecast
            'wind_speed': current_period.get('windSpeed', 'N/A'),
            'wind_direction': current_period.get('windDirection', 'N/A'),
            'visibility': None,  # Not in daily forecast
            'description': current_period.get('shortForecast', ''),
            'detailed_forecast': current_period.get('detailedForecast', ''),
            'is_daytime': current_period.get('isDaytime', True)
        }
        
        # Format forecast - group by day (NWS provides periods, some day some night)
        from datetime import datetime, timezone, timedelta
        
        forecast_items = []
        daily_data = {}
        
        # Get current date in local timezone
        now_local = datetime.now().astimezone()
        today = now_local.date()
        today_str = today.strftime('%Y-%m-%d')
        
        # Calculate maximum date (today + 5 days = 6 days total)
        max_date = today + timedelta(days=5)
        max_date_str = max_date.strftime('%Y-%m-%d')
        
        print(f"[DEBUG] Current date: {today} ({today_str}), Max date (today+5): {max_date} ({max_date_str})")
        
        # Process all periods, but only keep those from today through today+5 days
        for period in periods:
            start_time_str = period.get('startTime', '')
            if not start_time_str:
                continue
            
            # Parse UTC datetime and convert to local time
            try:
                # Handle Z suffix (UTC indicator)
                if start_time_str.endswith('Z'):
                    start_time_str = start_time_str.replace('Z', '+00:00')
                
                # Parse with timezone info
                try:
                    dt_utc = datetime.fromisoformat(start_time_str)
                except ValueError:
                    # If parsing fails, try adding UTC timezone
                    dt_utc = datetime.fromisoformat(start_time_str.replace('Z', '')).replace(tzinfo=timezone.utc)
                
                # Ensure datetime is timezone-aware
                if dt_utc.tzinfo is None:
                    dt_utc = dt_utc.replace(tzinfo=timezone.utc)
                
                # Convert UTC to local time (system timezone)
                dt_local = dt_utc.astimezone()
                # Extract date from local time
                date_obj = dt_local.date()
                date_str = date_obj.strftime('%Y-%m-%d')
                
                # Filter: only include dates from today through today+5 days
                if date_obj < today:
                    # Skip all dates before today
                    continue
                
                if date_obj > max_date:
                    # Skip dates beyond today+5 days
                    continue
                
                # Store this period by date
                if date_str not in daily_data:
                    daily_data[date_str] = {
                        'day': None,
                        'night': None,
                        'date': date_str
                    }
                
                # Assign day or night period
                if period.get('isDaytime', True):
                    daily_data[date_str]['day'] = period
                else:
                    daily_data[date_str]['night'] = period
                    
            except Exception as e:
                print(f"[DEBUG] Error parsing period date: {e}, startTime={start_time_str}")
                continue
        
        # Format into forecast - today through today+5 days (6 days total)
        # Sort dates chronologically
        sorted_dates = sorted([d for d in daily_data.keys() if d >= today_str and d <= max_date_str])
        
        print(f"[DEBUG] Filtered dates (today through today+5): {sorted_dates}")
        
        # Build forecast items for today through today+5 days
        for date_str in sorted_dates:
            data = daily_data[date_str]
            day_period = data['day'] or data['night']
            if day_period:
                # Mark if this is today
                is_today = (date_str == today_str)
                
                forecast_items.append({
                    'date': date_str,
                    'is_today': is_today,
                    'temp_max': day_period.get('temperature', 0) if data['day'] else (data['night'].get('temperature', 0) if data['night'] else 0),
                    'temp_min': data['night'].get('temperature', 0) if data['night'] else day_period.get('temperature', 0),
                    'description': day_period.get('shortForecast', ''),
                    'wind': day_period.get('windSpeed', 'N/A')
                })
        
        print(f"[DEBUG] Current date: {today_str} ({today})")
        print(f"[DEBUG] Final forecast items ({len(forecast_items)} days): {[f['date'] + (' (TODAY)' if f.get('is_today') else '') for f in forecast_items]}")
        
        return {
            'current': current,
            'location': location_name,
            'current_date': today_str,  # Add current date to response
            'forecast': forecast_items
        }
    
    def _get_mock_forecast(self, lat: float, lng: float) -> Dict[str, Any]:
        """Return mock weather data for development/testing"""
        from datetime import datetime, timedelta
        
        today = datetime.now().date()
        today_str = today.strftime('%Y-%m-%d')
        
        mock_current = {
            'temp': 75,
            'feels_like': 78,
            'humidity': 65,
            'wind_speed': 10,
            'visibility': 10 * 1000,  # 10 miles in meters
            'description': 'Partly Cloudy'
        }
        
        mock_forecast = []
        for i in range(5):
            date = today + timedelta(days=i)
            mock_forecast.append({
                'date': date.strftime('%Y-%m-%d'),
                'is_today': (i == 0),
                'temp_max': 75 + (i * 2),
                'temp_min': 65 - (i * 2),
                'description': 'Sunny' if i % 2 == 0 else 'Partly Cloudy'
            })
        
        return {
            'current': mock_current,
            'location': f"Location ({lat:.2f}, {lng:.2f})",
            'current_date': today_str,
            'forecast': mock_forecast,
            'note': 'Mock data - Error fetching from NWS API'
        }

