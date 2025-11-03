# ReadyCorpusChristi API Documentation

Complete API reference for ReadyCorpusChristi backend services.

---

## Base URL

- **Local Development**: `http://localhost:5000`
- **Production**: Your Vercel deployment URL

---

## Authentication

Most endpoints are public. Admin endpoints require authentication via header:

```
X-Admin-Password: your-admin-password
```

Or query parameter: `?password=your-admin-password`

---

## Chatbot API

### `POST /api/chatbot/message`

Send a message to the AI chatbot.

**Request Body:**
```json
{
  "message": "What should I do during a hurricane?",
  "context": {
    "location": {
      "lat": 27.8006,
      "lng": -97.3964
    },
    "address": "Corpus Christi, TX"
  },
  "session_id": "default"
}
```

**Response:**
```json
{
  "response": "During a hurricane...",
  "status": "success",
  "session_id": "default",
  "conversation_history": [...]
}
```

### `POST /api/chatbot/safety-evaluation`

Submit a safety evaluation questionnaire.

**Request Body:**
```json
{
  "evaluation_data": {
    "zipcode": "78401",
    "answers": {
      "1": "yes",
      "2": "no",
      ...
    },
    "questions": ["question 1", "question 2", ...]
  }
}
```

**Response:**
```json
{
  "response": "Based on your evaluation...",
  "status": "success",
  "stats": {...},
  "zipcode": "78401",
  "session_id": "safety_eval_78401"
}
```

### `POST /api/chatbot/download-pdf`

Generate a PDF from safety evaluation response.

**Request Body:**
```json
{
  "evaluation_response": "AI response text...",
  "zipcode": "78401",
  "stats": {...},
  "evaluation_data": {...}
}
```

**Response:** PDF file download

### `GET /api/chatbot/health`

Health check endpoint.

**Response:**
```json
{
  "status": "healthy",
  "service": "chatbot"
}
```

---

## Warnings API

### `POST /api/warnings/create`

Create a new warning.

**Request Body:**
```json
{
  "title": "Road Closure",
  "types": ["road-closure"],
  "location": {
    "lat": 27.8006,
    "lng": -97.3964,
    "name": "Corpus Christi, TX"
  },
  "expiry_time": "2025-01-15T12:00:00" // Optional
}
```

**Response:**
```json
{
  "status": "success",
  "warning": {
    "id": 1,
    "title": "Road Closure",
    ...
  }
}
```

### `GET /api/warnings/all`

Get all warnings.

**Query Parameters:**
- `include_expired`: true/false (default: false)

**Response:**
```json
{
  "status": "success",
  "warnings": [...],
  "count": 5
}
```

### `POST /api/warnings/nearby`

Get warnings near a location.

**Request Body:**
```json
{
  "location": {
    "lat": 27.8006,
    "lng": -97.3964
  },
  "radius_km": 10.0
}
```

### `DELETE /api/warnings/<id>`

Delete a warning (admin only).

---

## Weather API

### `GET /api/weather/forecast`

Get weather forecast for Corpus Christi.

**Response:**
```json
{
  "status": "success",
  "forecast": {
    "current": {...},
    "location": "Corpus Christi, TX",
    "forecast": [...]
  }
}
```

---

## Traffic API

### `POST /api/traffic/congestion`

Get traffic congestion data.

**Request Body:**
```json
{
  "location": {
    "lat": 27.8006,
    "lng": -97.3964
  },
  "radius_km": 10.0
}
```

### `POST /api/traffic/construction`

Get construction sites data.

---

## Map API

### `POST /api/map/geocode`

Geocode an address.

**Request Body:**
```json
{
  "address": "123 Main St, Corpus Christi, TX"
}
```

**Response:**
```json
{
  "status": "success",
  "result": {
    "lat": 27.8006,
    "lng": -97.3964,
    "address": "123 Main St, Corpus Christi, TX"
  }
}
```

### `POST /api/map/reverse-geocode`

Reverse geocode coordinates.

**Request Body:**
```json
{
  "lat": 27.8006,
  "lng": -97.3964
}
```

---

## Admin API

All admin endpoints require authentication.

### `GET /api/admin/warnings`

Get all warnings (including expired) - Admin only.

### `DELETE /api/admin/warnings/<id>`

Delete a warning - Admin only.

### `GET /api/admin/chatbot-logs`

Get chatbot interaction logs - Admin only.

**Query Parameters:**
- `ip`: Filter by IP address
- `query`: Search query
- `interaction_type`: Filter by type
- `limit`: Maximum results (default: 100)

### `GET /api/admin/system/health`

System health check - Admin only.

---

## Error Responses

All endpoints return errors in the following format:

```json
{
  "error": "Error message here"
}
```

**HTTP Status Codes:**
- `200` - Success
- `400` - Bad Request
- `401` - Unauthorized (Admin endpoints)
- `404` - Not Found
- `500` - Internal Server Error

---

For more information, see the [README.md](../README.md) or open an issue on GitHub.

