# ReadyCorpusChristi

## Table of Contents
- [Overview and Problem Statement](#overview-and-problem-statement)
- [Features](#features)
- [Video Walkthrough](#video-walkthrough).
- [Technologies Used](#technologies-used)
- [Developer Set-Up Guide](#developer-set-up-guide)
- [Team Members](#team-members)
- [Challenges](#challenges)
- [License](#license)
- [Acknowledgements](#acknowledgements)

---

## Overview and Problem Statement
With recent decreases in funding to the National Weather Services, the need for resources on critical weather and disaster preparedness has increased. This, along with increased climate extremes and variable factors such as the upcoming multipe-year hurricane season of the El Nino Southern Oscillation weather pattern mean that new or even long standing Corpus Christi residents may get caught off guard. This applications mitigates awareness and preparedness centralization issues in a free open source manner with personalized information relevant to users. 

ReadyCorpusChristi is a collaborative web application devloped by **3++**, a team for **Islander Hackathon 2025**. Our application includes an interactive map and AI chatbot functionality to provide a personalized and interactive emergency disaster preparedness and response for users to help them get relevant personal guidance for increasing safety and security. 

---

## Features

- **Interactive Map**: Uses Leaflet.js with OpenStreetMap for displaying map data.
- **Street Cam Integration**: View recent feeds in your area to check traffic and neighborhoods for damage and flooding.
- **Warning Updates and Creation**: View and contribute icons and warnings of flooding, fires, or other hazards in your area.
- **AI Chatbot**: Interactive chatbot that uses user inputs for generation. 
- **Disastery Plan Creation**: Export a printable PDF document for reference adding to the fridge. 

## Video Walkthrough
[![Watch the video](https://img.youtube.com/vi/FZ9KeVev494/maxresdefault.jpg)](https://www.youtube.com/watch?v=FZ9KeVev494)



## Technologies Used

| **Tech/Framework** | **Role**                    |
|--------------------|-----------------------------|
| Python             | Main programming language   |
| Flask              | Framework                   |
| Groq               | API calls                   |  
| NGrok and Versel   | Hosting                     |
| LLamam 3           | LLM Used                    |
| Open Street Map    | Interactive Map             |
| Git                | Distributed version control |
| GitHub             | Git hosting platform        |


## Developer Set-Up Guide

### 1. Install Python
### 2. Install IDE of choice
### 3. Run setup script

      pip install -r requirements.txt


### 2. Create Environment File (Optional)

The application comes with Groq API integration pre-configured. Create a `.env` file in the root directory to customize:

```env
# AI Chatbot Configuration (Groq API is pre-configured)
GROQ_API_KEY=your-groq-api-key-here
GROQ_MODEL=llama-3.1-8b-instant
AI_PROVIDER=groq
```

**Note**: The Groq API key is already configured in the code as a default fallback, so the application will work immediately after installation.

### 3. Run the Application

```bash
python app.py
```

The application will be available at `http://localhost:5000`

## Usage

1. **Enter an Address**: Type an address in the input field and click "Search" to geocode it and display on the map
2. **Click on Map**: Click anywhere on the map to reverse geocode the coordinates and get the address
3. **Chat with AI**: Use the chatbot section to interact with the AI assistant. The chatbot can use map context (current location) when available

## API Endpoints

### Chatbot API (`/api/chatbot`)

- `POST /api/chatbot/message` - Send a message to the chatbot
- `GET /api/chatbot/health` - Health check

### Map Data API (`/api/map`)

- `POST /api/map/geocode` - Geocode an address
- `POST /api/map/reverse-geocode` - Reverse geocode coordinates
- `GET /api/map/health` - Health check

## Extending the Application

### Adding a New AI Provider

1. Update `services/chatbot_service.py`:
   - Add a method for your provider (e.g., `_call_openai_api`)
   - Update the `get_response` method to use your provider

### Adding a New Map Provider

1. Update `services/map_service.py`:
   - Add methods for your provider (e.g., `_geocode_google`)
   - Update the `geocode_address` and `reverse_geocode` methods

### Adding New Routes

1. Create a new blueprint in `routes/`
2. Register it in `app.py` using `app.register_blueprint()`

### Adding New Features

- Add new services in `services/`
- Add new routes in `routes/`
- Update frontend JavaScript in `static/js/`
- Update styles in `static/css/style.css`

## Current Map Provider

The application currently uses **Nominatim** (OpenStreetMap) for geocoding, which is free and doesn't require an API key.

## Current Chatbot Provider

The application uses **Groq API** with the **llama-3.1-8b-instant** model by default. The API key is pre-configured, so it works immediately.

To customize:
1. Set `GROQ_API_KEY` in `.env` (or it uses the default)
2. Set `GROQ_MODEL` to change the model (default: `llama-3.1-8b-instant`)
3. Set `AI_PROVIDER=groq` (default)

To integrate other AI providers:
1. Update `services/chatbot_service.py` to add provider methods
2. Set `AI_API_KEY` and `AI_PROVIDER` in `.env`

## Team Members
  ### Noah Wilborn - BackEnd Developer
  ### Mihail Stegall - FrontEnd Developer
  ### Grace Williams - Requirements and Specifications
  ### Voss Purkey - Presenter and Tester

## Challenges
  ### Sourcing information and appropriately placing flood zone layers into the app. 
  ### Generating appropriately readable outputs from the LLM to pdf format. 
  ### Handling API request responses from multiple sources in a usable manner for the LLM "Disaster Specialist" generated content. 

## License

This project is open source and available for modification.

# ReadyCorpusChristi





