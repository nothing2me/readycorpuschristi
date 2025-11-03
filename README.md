# ReadyCorpusChristi 🌊

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Python](https://img.shields.io/badge/Python-3.12+-blue.svg)](https://www.python.org/)
[![Flask](https://img.shields.io/badge/Flask-3.0.0-green.svg)](https://flask.palletsprojects.com/)
[![Deployed on Vercel](https://img.shields.io/badge/Deployed-Vercel-black)](https://vercel.com)

**A comprehensive disaster preparedness and emergency response web application for Corpus Christi, Texas.**

---

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#-features)
- [Technologies](#-technologies)
- [Quick Start](#-quick-start) 🎯 **Start Here!**
- [Setup & Deployment](#-setup--deployment)
- [Installation](#-installation)
- [Configuration](#-configuration)
- [API Documentation](#-api-documentation)
- [Project Structure](#-project-structure)
- [Development](#-development)
- [Deployment](#-deployment)
- [Contributing](#-contributing)
- [Team](#-team)
- [License](#-license)

---

## Overview

ReadyCorpusChristi is a collaborative web application developed by **3++** for **Islander Hackathon 2025**. The application addresses critical weather and disaster preparedness awareness gaps by providing a centralized, personalized emergency preparedness and response platform.

### Problem Statement

With recent decreases in funding to National Weather Services and increasing climate extremes, residents of Corpus Christi need accessible, personalized disaster preparedness resources. ReadyCorpusChristi centralizes emergency information and provides AI-powered guidance to help residents prepare for hurricanes, floods, and other emergencies.

### Key Features

- 🗺️ **Interactive Map**: Real-time flood zones, warnings, and evacuation routes
- 🤖 **AI Chatbot**: Context-aware disaster preparedness specialist
- 📹 **Street Cam Integration**: Live traffic and neighborhood monitoring
- ⚠️ **Warning System**: Community-driven hazard reporting
- 📄 **PDF Reports**: Printable disaster preparedness plans
- 📱 **Mobile Responsive**: Works on all devices

---

## ✨ Features

### Core Features

- **Interactive Map** - Leaflet.js with OpenStreetMap displaying flood zones, warnings, and evacuation routes
- **AI Chatbot** - Groq-powered assistant providing personalized disaster preparedness guidance
- **Street Cam Integration** - View live traffic and neighborhood feeds for damage and flooding assessment
- **Warning System** - Create and view community warnings for fires, floods, road closures, and more
- **Safety Evaluation** - Comprehensive questionnaire generating personalized preparedness recommendations
- **PDF Generation** - Downloadable disaster preparedness plans
- **Weather Integration** - Real-time weather data from National Weather Service
- **Traffic Monitoring** - Current traffic and construction conditions
- **Hotel Search** - Find evacuation accommodations
- **News Ticker** - Local disaster-related news updates

---

## 🛠️ Technologies

| **Technology** | **Purpose** |
|---------------|-------------|
| **Python 3.12+** | Backend programming language |
| **Flask 3.0.0** | Web framework |
| **Groq API** | LLM provider (Llama 3.1 8B Instant) |
| **Leaflet.js** | Interactive mapping |
| **OpenStreetMap** | Map data provider |
| **National Weather Service API** | Weather data |
| **Vercel** | Hosting platform |
| **ReportLab** | PDF generation |
| **BeautifulSoup4** | Web scraping |
| **NumPy/Pillow** | Image processing |

---

## 🚀 Quick Start

### 🎯 New Users Start Here!

**Want to deploy in 5 minutes?** See [QUICK_START.md](QUICK_START.md) for the fastest deployment path!

For detailed step-by-step instructions, see [SETUP.md](SETUP.md).

### For Local Development

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/readycorpuschristi.git
   cd readycorpuschristi
   ```

2. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   # Edit .env with your API keys
   ```

4. **Run the application**
   ```bash
   python app.py
   ```

5. **Access the application**
   - Open your browser to `http://localhost:5000`

### Quick Deploy to Vercel

See [SETUP.md](SETUP.md) for complete deployment instructions.

---

## 📋 Setup & Deployment

**New users should start here!** See [SETUP.md](SETUP.md) for complete step-by-step instructions to:
- Clone the repository
- Add to your GitHub repo
- Deploy to Vercel in minutes
- Configure environment variables
- Troubleshoot common issues

**Quick deploy checklist:**
1. Clone the repo
2. Push to your GitHub
3. Connect to Vercel
4. Set environment variables
5. Deploy! 🚀

See [SETUP.md](SETUP.md) for details.

---

## ⚙️ Configuration

### Environment Variables

Create a `.env` file in the root directory (see `.env.example` for template):

```env
# AI Chatbot Configuration
GROQ_API_KEY=your-groq-api-key-here
GROQ_MODEL=llama-3.1-8b-instant
AI_PROVIDER=groq

# Admin Configuration
ADMIN_PASSWORD=your-secure-admin-password

# Flask Configuration
FLASK_ENV=production
SECRET_KEY=your-secret-key-here
```

### API Keys

- **Groq API**: Sign up at [groq.com](https://groq.com) to get an API key
- **Admin Password**: Set a secure password for admin endpoints

---

## 📖 API Documentation

### Chatbot API (`/api/chatbot`)

- `POST /api/chatbot/message` - Send message to AI chatbot
- `POST /api/chatbot/safety-evaluation` - Submit safety evaluation questionnaire
- `POST /api/chatbot/download-pdf` - Generate PDF from evaluation
- `GET /api/chatbot/health` - Health check

### Map API (`/api/map`)

- `POST /api/map/geocode` - Geocode an address
- `POST /api/map/reverse-geocode` - Reverse geocode coordinates
- `GET /api/map/health` - Health check

### Warnings API (`/api/warnings`)

- `POST /api/warnings/create` - Create a warning
- `GET /api/warnings/all` - Get all warnings
- `POST /api/warnings/nearby` - Get warnings near location
- `DELETE /api/warnings/<id>` - Delete a warning

### Other APIs

- `/api/weather/forecast` - Weather data
- `/api/traffic/congestion` - Traffic data
- `/api/flood-zones/all` - Flood zone data
- `/api/admin/*` - Admin endpoints (requires authentication)

See [docs/API.md](docs/API.md) for complete API documentation.

---

## 📁 Project Structure

```
readycorpuschristi/
├── app.py                      # Main Flask application entry point
├── api/                        # Vercel serverless handlers
│   └── index.py               # Vercel entry point
├── routes/                     # API route handlers (blueprints)
│   ├── chatbot.py             # Chatbot API routes
│   ├── warnings.py            # Warning management routes
│   ├── weather.py             # Weather API routes
│   └── ...                    # Other route modules
├── services/                   # Business logic layer
│   ├── chatbot_service.py     # AI chatbot service
│   ├── warning_service.py     # Warning management service
│   └── ...                    # Other service modules
├── static/                     # Static assets
│   ├── css/                   # Stylesheets
│   ├── js/                    # JavaScript modules
│   ├── fonts/                 # Web fonts
│   └── CC.png                 # Logo/assets
├── templates/                  # HTML templates
│   ├── index.html             # Main application page
│   ├── admin.html             # Admin dashboard
│   └── mobile.html            # Mobile version
├── scripts/                    # Utility scripts
├── mapzone/                    # Flood zone overlay images
├── camera_snapshots/           # Traffic camera images
├── requirements.txt            # Python dependencies
├── vercel.json                 # Vercel deployment config
├── .env.example               # Environment variable template
├── LICENSE                     # MIT License
└── README.md                   # This file
```

---

## 💻 Development

### Running Locally

```bash
# Install dependencies
pip install -r requirements.txt

# Set up environment variables
cp .env.example .env
# Edit .env with your configuration

# Run the application
python app.py
```

### Development Dependencies

For development with additional tools:

```bash
pip install -r requirements-dev.txt
```

### Code Style

- **Python**: Follow PEP 8 guidelines
- **JavaScript**: Use ES6+ syntax, consistent formatting
- **HTML/CSS**: Semantic HTML, organized CSS

---

## 🚢 Deployment

### Quick Deploy to Vercel

**For complete step-by-step instructions, see [SETUP.md](SETUP.md)**

1. **Clone and push to your GitHub repository**
2. **Connect to Vercel**
   - Go to [vercel.com](https://vercel.com)
   - Sign in with GitHub
   - Click "New Project"
   - Select your repository

3. **Configure Environment Variables**
   - Add `GROQ_API_KEY` (get from [groq.com](https://console.groq.com/))
   - Add `ADMIN_PASSWORD` (choose a secure password)
   - Add `SECRET_KEY` (generate a random key)
   - Add `FLASK_ENV=production`

4. **Deploy**
   - Click "Deploy"
   - Wait ~2 minutes
   - Your app is live! 🎉

The application automatically detects serverless environments and uses appropriate storage (in-memory or `/tmp` directory).

### Detailed Deployment Guide

See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) for comprehensive deployment instructions.

---

## 🤝 Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

### Quick Contribution Guide

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Make your changes
4. Commit with clear messages
5. Push to your fork
6. Create a Pull Request

---

## 👥 Team

**3++ Team - Islander Hackathon 2025**

- **Noah Wilborn** - Backend Developer
- **Mihail Stegall** - Frontend Developer
- **Grace Williams** - Requirements and Specifications
- **Voss Purkey** - Presenter and Tester

---

## 📹 Demo

[![Watch the Demo Video](https://img.youtube.com/vi/FZ9KeVev494/hqdefault.jpg)](https://www.youtube.com/watch?v=FZ9KeVev494)

---

## 🎯 Challenges Addressed

During development, we overcame several challenges:

1. **Flood Zone Integration** - Sourcing and appropriately placing flood zone layers on the map
2. **PDF Generation** - Converting LLM outputs to readable PDF format
3. **API Integration** - Handling responses from multiple sources for the AI chatbot context
4. **Serverless Deployment** - Adapting file storage for Vercel's read-only filesystem
5. **Vercel Detection** - Ensuring proper Flask framework detection

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- National Weather Service for free weather API
- OpenStreetMap for mapping data
- Groq for AI API services
- Leaflet.js for mapping capabilities
- Corpus Christi emergency services for verified contact information

---

## 📞 Support

For issues, questions, or contributions, please:
- Open an issue on GitHub
- Contact the development team
- Review the [API Documentation](docs/API.md)

---

**Made with ❤️ for Corpus Christi residents**
