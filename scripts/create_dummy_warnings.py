"""
Script to create realistic dummy warnings for Corpus Christi
"""

import json
import random
from datetime import datetime, timedelta
from pathlib import Path
import sys

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

# Corpus Christi area coordinates - land-based only
# Define reasonable bounds for Corpus Christi land area
LAT_MIN = 27.65  # South boundary (avoid water)
LAT_MAX = 27.87  # North boundary
LNG_MIN = -97.55  # West boundary
LNG_MAX = -97.25  # East boundary (avoid bay/ocean)

# Areas to avoid (water/bay)
WATER_AREAS = [
    # Corpus Christi Bay (east)
    {"lat_min": 27.75, "lat_max": 27.85, "lng_min": -97.15, "lng_max": -97.05},
    # Oso Bay (southeast)
    {"lat_min": 27.65, "lat_max": 27.72, "lng_min": -97.35, "lng_max": -97.25},
    # Laguna Madre (south)
    {"lat_min": 27.60, "lat_max": 27.68, "lng_min": -97.35, "lng_max": -97.20},
]

def is_valid_location(lat, lng):
    """Check if coordinates are on land and within reasonable bounds"""
    # Check basic bounds
    if lat < LAT_MIN or lat > LAT_MAX or lng < LNG_MIN or lng > LNG_MAX:
        return False
    
    # Check if in water areas
    for water_area in WATER_AREAS:
        if (water_area["lat_min"] <= lat <= water_area["lat_max"] and
            water_area["lng_min"] <= lng <= water_area["lng_max"]):
            return False
    
    # Additional checks for common water areas
    # Corpus Christi Bay area (east of city)
    if lng > -97.20 and lat > 27.72:
        return False
    
    # Beach/Padre Island area (too far east/south)
    if lng > -97.15 or lat < 27.62:
        return False
    
    return True

def create_dummy_warnings():
    """Create a ton of realistic dummy warnings"""
    
    warnings = []
    
    # Warning templates by type
    fire_warnings = [
        {"title": "Brush Fire Near Residential Area", "desc": "Controlled burn has spread to nearby brush. Fire department on scene."},
        {"title": "Structure Fire at Apartment Complex", "desc": "Multi-unit fire response. Road closures in effect. Avoid area."},
        {"title": "Grass Fire Along Highway Shoulder", "desc": "Quick-spreading grass fire along highway. Smoke affecting visibility."},
        {"title": "Commercial Building Fire", "desc": "Large structure fire. Heavy smoke in area. Multiple units responding."},
        {"title": "Car Fire on Freeway", "desc": "Vehicle fully engulfed. Emergency response blocking lanes."},
        {"title": "Industrial Fire Incident", "desc": "Fire at industrial facility. Hazmat team responding. Shelter in place advised."},
    ]
    
    car_crash_warnings = [
        {"title": "Multi-Vehicle Pileup on IH-37", "desc": "Multiple vehicles involved. Major traffic delays expected."},
        {"title": "Rollover Accident - Multiple Lanes Blocked", "desc": "Vehicle overturned blocking multiple lanes. Emergency services on scene."},
        {"title": "Rear-End Collision at Intersection", "desc": "Two-car accident causing minor injuries. Intersection partially blocked."},
        {"title": "Head-On Collision on Highway", "desc": "Serious accident. Road closed for investigation. Use alternate route."},
        {"title": "Motorcycle Accident", "desc": "Motorcycle vs vehicle collision. Medical helicopter requested."},
        {"title": "Truck Accident - Debris on Roadway", "desc": "Commercial vehicle accident. Debris scattered across lanes. Cleanup in progress."},
        {"title": "Hit and Run Accident", "desc": "Vehicle fled scene. Police investigation ongoing. Avoid area if possible."},
        {"title": "DUI Checkpoint Nearby", "desc": "Police checkpoint active. Expect delays."},
    ]
    
    road_closure_warnings = [
        {"title": "Bridge Repair Work - Lane Closure", "desc": "One lane closed for bridge maintenance. Expected delays of 15+ minutes."},
        {"title": "Road Resurfacing Project", "desc": "Multiple blocks closed for repaving. Detour signs posted."},
        {"title": "Utility Work - Emergency Repair", "desc": "Emergency utility repair blocking one lane. Crews working around the clock."},
        {"title": "Construction Zone Ahead", "desc": "Major road work project. Speed limit reduced to 45 mph. Fines doubled."},
        {"title": "Temporary Road Closure - Event", "desc": "Road closed for community event. Traffic rerouted."},
        {"title": "Sinkhole Repair - Road Closed", "desc": "Emergency sinkhole repair. Road completely closed. Use detour."},
        {"title": "Traffic Signal Installation", "desc": "New traffic signal being installed. Intermittent lane closures."},
        {"title": "Debris Cleanup After Storm", "desc": "Storm debris cleanup blocking lanes. Large trucks in work area."},
    ]
    
    flood_warnings = [
        {"title": "Flash Flood Warning - Low Water Crossing", "desc": "Heavy rain causing water over roadway. Do not attempt to cross."},
        {"title": "Street Flooding - Avoid Area", "desc": "Excessive water pooling on streets. Multiple vehicles stranded."},
        {"title": "Coastal Flood Advisory Active", "desc": "High tide combined with storm surge. Beach access roads flooded."},
        {"title": "Drainage System Overwhelmed", "desc": "Storm drains backing up. Water flowing into streets and yards."},
        {"title": "River Flooding - Bridge Closed", "desc": "River over banks. Bridge closed until water recedes."},
        {"title": "Urban Flooding - Multiple Streets", "desc": "Heavy rainfall causing widespread street flooding throughout area."},
        {"title": "Drainage Canal Overflow", "desc": "Drainage canal overflowed into adjacent roads. Avoid low-lying areas."},
    ]
    
    weather_warnings = [
        {"title": "Severe Thunderstorm Warning", "desc": "Large hail and damaging winds possible. Take shelter immediately."},
        {"title": "Tornado Watch Issued", "desc": "Conditions favorable for tornado development. Stay alert and have shelter ready."},
        {"title": "High Wind Advisory", "desc": "Sustained winds 30-40 mph with higher gusts. Secure loose objects."},
        {"title": "Dense Fog Advisory", "desc": "Visibility less than 1/4 mile. Drive with extreme caution."},
        {"title": "Heavy Rain - Reduced Visibility", "desc": "Torrential rainfall reducing visibility to near zero. Pull over if unsafe."},
        {"title": "Lightning Storm in Area", "desc": "Frequent cloud-to-ground lightning. Avoid open areas and water."},
        {"title": "Hail Storm - Cover Vehicles", "desc": "Large hail reported. Protect vehicles and property if possible."},
        {"title": "Tropical Storm Conditions", "desc": "Tropical storm bringing heavy rain and strong winds. Stay indoors."},
    ]
    
    other_warnings = [
        {"title": "Police Activity - Road Blocked", "desc": "Ongoing police investigation. Road temporarily closed."},
        {"title": "Downed Power Lines", "desc": "Electrical lines down across roadway. Extremely dangerous. Avoid area."},
        {"title": "Gas Leak - Evacuation Ordered", "desc": "Natural gas leak detected. Area being evacuated. Do not use phones or electronics."},
        {"title": "Chemical Spill - Hazmat Response", "desc": "Truck carrying chemicals involved in accident. Hazmat team on scene."},
        {"title": "Wildlife on Roadway", "desc": "Large deer/bird activity on highway. Exercise caution."},
        {"title": "Protest March - Traffic Disruption", "desc": "Large protest march blocking traffic. Expect significant delays."},
        {"title": "Marine Accident - Coast Guard Response", "desc": "Boat accident near shore. Emergency response blocking beach access."},
        {"title": "Aircraft Emergency Landing", "desc": "Small aircraft making emergency landing on roadway. All lanes closed."},
    ]
    
    # Corpus Christi locations - verified land-based locations only
    locations = [
        {"name": "IH-37 at SH-359", "lat": 27.7564, "lng": -97.4042},
        {"name": "IH-37 at Weber Road", "lat": 27.7834, "lng": -97.4132},
        {"name": "IH-37 at SPID", "lat": 27.7225, "lng": -97.3956},
        {"name": "IH-37 at Ayers Street", "lat": 27.7912, "lng": -97.4215},
        {"name": "US-181 at SH-361", "lat": 27.7134, "lng": -97.3718},
        {"name": "US-181 at Port Avenue", "lat": 27.7345, "lng": -97.3829},
        {"name": "SPID at Staples Street", "lat": 27.7089, "lng": -97.3934},
        {"name": "SPID at Airline Road", "lat": 27.7167, "lng": -97.4012},
        {"name": "SPID at Everhart Road", "lat": 27.7398, "lng": -97.3887},
        {"name": "SPID at Rodd Field Road", "lat": 27.7523, "lng": -97.3912},
        {"name": "IH-37 at Navigation Boulevard", "lat": 27.8045, "lng": -97.4298},
        {"name": "IH-37 at Leopard Street", "lat": 27.7987, "lng": -97.4221},
        {"name": "IH-37 at Kostoryz Road", "lat": 27.7765, "lng": -97.4123},
        {"name": "SPID at Padre Island Drive", "lat": 27.7156, "lng": -97.3945},
        {"name": "US-181 at Ocean Drive", "lat": 27.7289, "lng": -97.3776},
        {"name": "Downtown Corpus Christi", "lat": 27.8006, "lng": -97.3964},
        {"name": "Port of Corpus Christi Area", "lat": 27.8167, "lng": -97.4376},
        {"name": "Airport Area", "lat": 27.7734, "lng": -97.5076},
        {"name": "Southside Corpus Christi", "lat": 27.6856, "lng": -97.3456},
        {"name": "North Beach Area", "lat": 27.8123, "lng": -97.3876},
        {"name": "Cole Park Area", "lat": 27.7889, "lng": -97.4012},
        {"name": "Central City Area", "lat": 27.7923, "lng": -97.4023},
        {"name": "Weber Road Area", "lat": 27.7856, "lng": -97.4145},
        {"name": "Saratoga Boulevard Area", "lat": 27.7645, "lng": -97.4089},
        {"name": "McArdle Road Area", "lat": 27.7521, "lng": -97.3956},
        {"name": "Doddridge Street Area", "lat": 27.7432, "lng": -97.3876},
        {"name": "Morgan Avenue Area", "lat": 27.7309, "lng": -97.3789},
        {"name": "Williams Drive Area", "lat": 27.7187, "lng": -97.3891},
        {"name": "Horizon Boulevard Area", "lat": 27.7023, "lng": -97.4012},
        {"name": "Yorktown Boulevard Area", "lat": 27.7654, "lng": -97.4156},
    ]
    
    warning_id = 1
    
    # Create fire warnings (20)
    for i in range(20):
        loc = random.choice(locations)
        warning = random.choice(fire_warnings)
        # Add slight random offset to coordinates, but ensure it's on land
        max_attempts = 10
        lat = None
        lng = None
        for attempt in range(max_attempts):
            lat = loc["lat"] + random.uniform(-0.03, 0.03)
            lng = loc["lng"] + random.uniform(-0.03, 0.03)
            if is_valid_location(lat, lng):
                break
        if not is_valid_location(lat, lng):
            # Use original location if we can't find valid offset
            lat = loc["lat"]
            lng = loc["lng"]
        
        timestamp = datetime.now() - timedelta(hours=random.randint(0, 48))
        expiry = timestamp + timedelta(hours=random.randint(6, 72))
        
        warnings.append({
            "id": warning_id,
            "title": warning["title"],
            "types": ["fire"],
            "location": {
                "lat": round(lat, 6),
                "lng": round(lng, 6),
                "name": loc["name"]
            },
            "timestamp": timestamp.isoformat(),
            "expiry_time": expiry.isoformat(),
            "created_at": timestamp.isoformat()
        })
        warning_id += 1
    
    # Create car crash warnings (25)
    for i in range(25):
        loc = random.choice(locations)
        warning = random.choice(car_crash_warnings)
        max_attempts = 10
        lat = None
        lng = None
        for attempt in range(max_attempts):
            lat = loc["lat"] + random.uniform(-0.03, 0.03)
            lng = loc["lng"] + random.uniform(-0.03, 0.03)
            if is_valid_location(lat, lng):
                break
        if not is_valid_location(lat, lng):
            lat = loc["lat"]
            lng = loc["lng"]
        
        timestamp = datetime.now() - timedelta(hours=random.randint(0, 24))
        expiry = timestamp + timedelta(hours=random.randint(2, 12))
        
        warnings.append({
            "id": warning_id,
            "title": warning["title"],
            "types": ["car-crash"],
            "location": {
                "lat": round(lat, 6),
                "lng": round(lng, 6),
                "name": loc["name"]
            },
            "timestamp": timestamp.isoformat(),
            "expiry_time": expiry.isoformat(),
            "created_at": timestamp.isoformat()
        })
        warning_id += 1
    
    # Create road closure warnings (30)
    for i in range(30):
        loc = random.choice(locations)
        warning = random.choice(road_closure_warnings)
        max_attempts = 10
        lat = None
        lng = None
        for attempt in range(max_attempts):
            lat = loc["lat"] + random.uniform(-0.03, 0.03)
            lng = loc["lng"] + random.uniform(-0.03, 0.03)
            if is_valid_location(lat, lng):
                break
        if not is_valid_location(lat, lng):
            lat = loc["lat"]
            lng = loc["lng"]
        
        timestamp = datetime.now() - timedelta(hours=random.randint(0, 168))  # Last week
        expiry = timestamp + timedelta(hours=random.randint(8, 240))  # Up to 10 days
        
        warnings.append({
            "id": warning_id,
            "title": warning["title"],
            "types": ["road-closure"],
            "location": {
                "lat": round(lat, 6),
                "lng": round(lng, 6),
                "name": loc["name"]
            },
            "timestamp": timestamp.isoformat(),
            "expiry_time": expiry.isoformat(),
            "created_at": timestamp.isoformat()
        })
        warning_id += 1
    
    # Create flood warnings (15)
    for i in range(15):
        loc = random.choice(locations)
        warning = random.choice(flood_warnings)
        max_attempts = 10
        lat = None
        lng = None
        for attempt in range(max_attempts):
            lat = loc["lat"] + random.uniform(-0.03, 0.03)
            lng = loc["lng"] + random.uniform(-0.03, 0.03)
            if is_valid_location(lat, lng):
                break
        if not is_valid_location(lat, lng):
            lat = loc["lat"]
            lng = loc["lng"]
        
        timestamp = datetime.now() - timedelta(hours=random.randint(0, 36))
        expiry = timestamp + timedelta(hours=random.randint(4, 48))
        
        warnings.append({
            "id": warning_id,
            "title": warning["title"],
            "types": ["flood"],
            "location": {
                "lat": round(lat, 6),
                "lng": round(lng, 6),
                "name": loc["name"]
            },
            "timestamp": timestamp.isoformat(),
            "expiry_time": expiry.isoformat(),
            "created_at": timestamp.isoformat()
        })
        warning_id += 1
    
    # Create weather warnings (20)
    for i in range(20):
        loc = random.choice(locations)
        warning = random.choice(weather_warnings)
        max_attempts = 10
        lat = None
        lng = None
        for attempt in range(max_attempts):
            lat = loc["lat"] + random.uniform(-0.05, 0.05)
            lng = loc["lng"] + random.uniform(-0.05, 0.05)
            if is_valid_location(lat, lng):
                break
        if not is_valid_location(lat, lng):
            lat = loc["lat"]
            lng = loc["lng"]
        
        timestamp = datetime.now() - timedelta(hours=random.randint(0, 12))
        expiry = timestamp + timedelta(hours=random.randint(2, 24))
        
        warnings.append({
            "id": warning_id,
            "title": warning["title"],
            "types": ["weather"],
            "location": {
                "lat": round(lat, 6),
                "lng": round(lng, 6),
                "name": loc["name"]
            },
            "timestamp": timestamp.isoformat(),
            "expiry_time": expiry.isoformat(),
            "created_at": timestamp.isoformat()
        })
        warning_id += 1
    
    # Create other warnings (15)
    for i in range(15):
        loc = random.choice(locations)
        warning = random.choice(other_warnings)
        max_attempts = 10
        lat = None
        lng = None
        for attempt in range(max_attempts):
            lat = loc["lat"] + random.uniform(-0.03, 0.03)
            lng = loc["lng"] + random.uniform(-0.03, 0.03)
            if is_valid_location(lat, lng):
                break
        if not is_valid_location(lat, lng):
            lat = loc["lat"]
            lng = loc["lng"]
        
        timestamp = datetime.now() - timedelta(hours=random.randint(0, 24))
        expiry = timestamp + timedelta(hours=random.randint(3, 36))
        
        warnings.append({
            "id": warning_id,
            "title": warning["title"],
            "types": ["other"],
            "location": {
                "lat": round(lat, 6),
                "lng": round(lng, 6),
                "name": loc["name"]
            },
            "timestamp": timestamp.isoformat(),
            "expiry_time": expiry.isoformat(),
            "created_at": timestamp.isoformat()
        })
        warning_id += 1
    
    # Create some multi-type warnings (10)
    multi_type_templates = [
        {"title": "Severe Storm Causing Multiple Hazards", "types": ["weather", "flood"], "desc": "Heavy rain causing flooding and reduced visibility. Multiple accidents reported."},
        {"title": "Accident During Road Work", "types": ["car-crash", "road-closure"], "desc": "Vehicle accident in active construction zone. Both emergency and construction crews on scene."},
        {"title": "Fire Response Blocking Traffic", "types": ["fire", "road-closure"], "desc": "Large fire response blocking major intersection. All lanes closed temporarily."},
        {"title": "Flooding Causes Multiple Accidents", "types": ["flood", "car-crash"], "desc": "Standing water causing hydroplaning accidents. Multiple vehicles involved."},
        {"title": "Downed Power Lines After Storm", "types": ["weather", "other"], "desc": "High winds knocked down power lines. Road closed for repairs."},
        {"title": "Hazardous Material Spill - Multiple Agencies", "types": ["other", "road-closure"], "desc": "Chemical spill requiring hazmat response. Large area evacuated and closed."},
        {"title": "Tropical Storm - Evacuation Routes Blocked", "types": ["weather", "flood", "road-closure"], "desc": "Tropical storm conditions causing flooding and road closures. Evacuation in progress."},
        {"title": "Wildfire Near Highway", "types": ["fire", "weather"], "desc": "Wildfire spreading near major highway. Smoke causing poor visibility."},
        {"title": "Marine Accident - Beach Access Closed", "types": ["other", "road-closure"], "desc": "Boat accident near shore. Coast Guard response blocking beach access roads."},
        {"title": "Multi-Car Pileup in Construction Zone", "types": ["car-crash", "road-closure"], "desc": "Chain reaction accident in active work zone. Multiple injuries. Extended closure expected."},
    ]
    
    for template in multi_type_templates:
        loc = random.choice(locations)
        max_attempts = 10
        lat = None
        lng = None
        for attempt in range(max_attempts):
            lat = loc["lat"] + random.uniform(-0.03, 0.03)
            lng = loc["lng"] + random.uniform(-0.03, 0.03)
            if is_valid_location(lat, lng):
                break
        if not is_valid_location(lat, lng):
            lat = loc["lat"]
            lng = loc["lng"]
        
        timestamp = datetime.now() - timedelta(hours=random.randint(0, 18))
        expiry = timestamp + timedelta(hours=random.randint(6, 48))
        
        warnings.append({
            "id": warning_id,
            "title": template["title"],
            "types": template["types"],
            "location": {
                "lat": round(lat, 6),
                "lng": round(lng, 6),
                "name": loc["name"]
            },
            "timestamp": timestamp.isoformat(),
            "expiry_time": expiry.isoformat(),
            "created_at": timestamp.isoformat()
        })
        warning_id += 1
    
    return warnings

def main():
    """Main function to create and save dummy warnings"""
    print("Creating dummy warnings...")
    print("Validating locations are on land only...")
    
    warnings = create_dummy_warnings()
    
    # Filter out any warnings that are still in invalid locations
    valid_warnings = []
    for warning in warnings:
        lat = warning["location"]["lat"]
        lng = warning["location"]["lng"]
        if is_valid_location(lat, lng):
            valid_warnings.append(warning)
        else:
            print(f"Filtered out warning {warning['id']}: {warning['title']} at ({lat}, {lng}) - in water/invalid area")
    
    warnings = valid_warnings
    
    # Save to warnings.json
    warnings_file = Path('warnings.json')
    
    with open(warnings_file, 'w') as f:
        json.dump(warnings, f, indent=2)
    
    print(f"\nCreated {len(warnings)} dummy warnings!")
    print(f"Saved to: {warnings_file}")
    
    # Print summary
    type_counts = {}
    for warning in warnings:
        for wtype in warning.get('types', []):
            type_counts[wtype] = type_counts.get(wtype, 0) + 1
    
    print("\nWarning type breakdown:")
    for wtype, count in sorted(type_counts.items()):
        print(f"  {wtype}: {count}")
    
    print("\nDone!")

if __name__ == "__main__":
    main()

