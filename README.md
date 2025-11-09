# Weather Dashboard

A simple, responsive weather dashboard that displays current weather conditions for any city or ZIP code.

## Features

- Search by city name or ZIP code
- Current temperature, weather description, and conditions
- Responsive design for desktop and mobile
- Real-time weather data from OpenWeatherMap API

## Setup Instructions

1. **Get a free API key from OpenWeatherMap:**
   - Visit [OpenWeatherMap](https://openweathermap.org/api)
   - Sign up for a free account
   - Go to your API keys section and copy your key

2. **Add your API key:**
   - Open `script.js`
   - Replace `YOUR_API_KEY_HERE` with your actual API key

3. **Run locally:**
   - Open `index.html` in your web browser
   - Or use a local server like: `python3 -m http.server 8000`

## Technologies Used

- HTML5
- CSS3 (with responsive design)
- JavaScript (ES6+)
- OpenWeatherMap API

## Deployment

This static website can be deployed to:
- GitHub Pages
- AWS S3 + CloudFront
- Vercel
- Any static hosting service

## File Structure

```
├── index.html          # Main HTML file
├── style.css           # Styling
├── script.js           # JavaScript functionality
└── README.md           # This file
```