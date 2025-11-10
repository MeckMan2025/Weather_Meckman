export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const pathname = url.pathname;
    
    // CORS headers
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Content-Type',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    };

    // Handle preflight requests
    if (request.method === 'OPTIONS') {
      return new Response('', {
        status: 200,
        headers: corsHeaders,
      });
    }

    try {
      // Route to weather or forecast handler
      if (pathname === '/weather') {
        return await handleWeather(request, env, corsHeaders);
      } else if (pathname === '/forecast') {
        return await handleForecast(request, env, corsHeaders);
      }
      
      // Serve static files
      if (pathname === '/' || pathname === '/index.html') {
        return new Response(indexHTML, {
          headers: { 'Content-Type': 'text/html' }
        });
      }
      
      if (pathname === '/script.js') {
        return new Response(scriptJS, {
          headers: { 'Content-Type': 'application/javascript' }
        });
      }
      
      if (pathname === '/style.css') {
        return new Response(styleCSS, {
          headers: { 'Content-Type': 'text/css' }
        });
      }
      
      return new Response('Not found', { status: 404, headers: corsHeaders });
    } catch (error) {
      console.error('Worker error:', error);
      return new Response(
        JSON.stringify({ error: 'Internal server error' }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }
  },
};

async function handleWeather(request, env, corsHeaders) {
  const url = new URL(request.url);
  const location = url.searchParams.get('location');
  
  if (!location) {
    return new Response(
      JSON.stringify({ error: 'Location parameter is required' }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }

  // Get API key from environment variable
  const API_KEY = env.OPENWEATHER_API_KEY;
  
  if (!API_KEY) {
    return new Response(
      JSON.stringify({ error: 'API key not configured' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }

  const API_URL = 'https://api.openweathermap.org/data/2.5/weather';
  
  // Build the API URL based on location format
  let apiUrl;
  if (/^\d{5}$/.test(location)) {
    // ZIP code format
    apiUrl = `${API_URL}?zip=${location},US&appid=${API_KEY}&units=imperial`;
  } else {
    // Check if location includes state (e.g., "Baxter, IA" or "Baxter, Iowa")
    const cityStatePattern = /^(.+),\s*([A-Za-z]{2,})$/;
    const match = location.match(cityStatePattern);
    
    if (match) {
      const city = match[1].trim();
      const state = match[2].trim();
      apiUrl = `${API_URL}?q=${city},${state},US&appid=${API_KEY}&units=imperial`;
    } else {
      // Just city name - will default to most populous
      apiUrl = `${API_URL}?q=${location},US&appid=${API_KEY}&units=imperial`;
    }
  }

  // Fetch weather data
  const response = await fetch(apiUrl);
  
  if (!response.ok) {
    return new Response(
      JSON.stringify({ error: 'Location not found' }),
      {
        status: response.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }

  const weatherData = await response.json();

  return new Response(JSON.stringify(weatherData), {
    status: 200,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

async function handleForecast(request, env, corsHeaders) {
  const url = new URL(request.url);
  const location = url.searchParams.get('location');
  
  if (!location) {
    return new Response(
      JSON.stringify({ error: 'Location parameter is required' }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }

  // Get API key from environment variable
  const API_KEY = env.OPENWEATHER_API_KEY;
  
  if (!API_KEY) {
    return new Response(
      JSON.stringify({ error: 'API key not configured' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }

  const FORECAST_API_URL = 'https://api.openweathermap.org/data/2.5/forecast';
  
  // Build the API URL based on location format
  let apiUrl;
  if (/^\d{5}$/.test(location)) {
    // ZIP code format
    apiUrl = `${FORECAST_API_URL}?zip=${location},US&appid=${API_KEY}&units=imperial`;
  } else {
    // Check if location includes state (e.g., "Baxter, IA" or "Baxter, Iowa")
    const cityStatePattern = /^(.+),\s*([A-Za-z]{2,})$/;
    const match = location.match(cityStatePattern);
    
    if (match) {
      const city = match[1].trim();
      const state = match[2].trim();
      apiUrl = `${FORECAST_API_URL}?q=${city},${state},US&appid=${API_KEY}&units=imperial`;
    } else {
      // Just city name - will default to most populous
      apiUrl = `${FORECAST_API_URL}?q=${location},US&appid=${API_KEY}&units=imperial`;
    }
  }

  // Fetch forecast data
  const response = await fetch(apiUrl);
  
  if (!response.ok) {
    return new Response(
      JSON.stringify({ error: 'Location not found' }),
      {
        status: response.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }

  const forecastData = await response.json();

  return new Response(JSON.stringify(forecastData), {
    status: 200,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

// Static file contents
const indexHTML = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Weather Dashboard</title>
    <link rel="stylesheet" href="style.css">
    <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
    <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
</head>
<body>
    <div class="app-container">
        <header>
            <h1>🌤️ Weather Dashboard</h1>
        </header>
        
        <!-- Modal 1: Location Search -->
        <div class="modal search-modal">
            <div class="modal-header">
                <h2>📍 Location Search</h2>
            </div>
            <div class="modal-content">
                <div class="input-container">
                    <input type="text" id="locationInput" placeholder="Enter city, state or ZIP code (e.g., Baxter, IA)" />
                    <button id="searchBtn">Go</button>
                </div>
                
                <div id="weatherDisplay" class="weather-display hidden">
                    <div class="location-info">
                        <h3 id="locationName">City Name</h3>
                        <p id="currentDate"></p>
                    </div>
                    
                    <div class="current-weather">
                        <div class="temperature">
                            <span id="temperature">--°</span>
                            <span id="weatherIcon">🌤️</span>
                        </div>
                        <div class="weather-details">
                            <p id="description">Clear sky</p>
                            <p>Feels like: <span id="feelsLike">--°</span></p>
                            <p>Humidity: <span id="humidity">--%</span></p>
                            <p>Wind: <span id="windSpeed">-- mph</span></p>
                        </div>
                    </div>
                </div>
                
                <div id="errorMessage" class="error hidden">
                    Location not found. Please try again.
                </div>
            </div>
        </div>
        
        <!-- Modal 2: Live Radar -->
        <div id="radarModal" class="modal radar-modal hidden">
            <div class="modal-header">
                <h2>🌧️ Live Radar</h2>
            </div>
            <div class="modal-content">
                <div id="radarMap"></div>
            </div>
        </div>
        
        <!-- Modal 3: 5-Day Forecast -->
        <div id="forecastModal" class="modal forecast-modal hidden">
            <div class="modal-header">
                <h2>📅 5-Day Forecast</h2>
            </div>
            <div class="modal-content">
                <div id="forecastContainer" class="forecast-container"></div>
            </div>
        </div>
    </div>
    
    <script src="script.js"></script>
</body>
</html>`;

const styleCSS = \`* {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
}

body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
    background: #000000;
    min-height: 100vh;
    padding: 2rem;
    margin: 0;
}

.app-container {
    max-width: 1200px;
    margin: 0 auto;
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
    gap: 2rem;
    align-items: start;
    justify-items: center;
}

.search-modal {
    grid-column: 1 / -1;
    max-width: 500px;
    width: 100%;
    justify-self: center;
}

.forecast-modal {
    grid-column: 1 / -1;
    max-width: 500px;
    width: 100%;
    justify-self: center;
}

.radar-modal {
    grid-column: 1 / -1;
    max-width: 500px;
    width: 100%;
    justify-self: center;
}

.modal {
    background: #5B5B5B;
    border-radius: 8px;
    border: 2px solid #CC0000;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
    overflow: hidden;
}

.modal-header {
    background: #000000;
    color: #FFFFFF;
    padding: 1.5rem;
    text-align: center;
    border-bottom: 2px solid #FFF2CC;
}

.modal-header h2 {
    margin: 0;
    font-size: 1.5rem;
    font-weight: 700;
}

.modal-content {
    padding: 2rem;
}

header {
    grid-column: 1 / -1;
    text-align: center;
    margin-bottom: 1rem;
}

header h1 {
    color: #FFFFFF;
    margin: 0;
    font-size: 2.5rem;
    font-weight: 700;
}

.input-container {
    display: flex;
    flex-direction: column;
    gap: 1rem;
    margin-bottom: 2rem;
}

#locationInput {
    width: 100%;
    padding: 1rem;
    border: 2px solid #5B5B5B;
    border-radius: 4px;
    font-size: 1rem;
    box-sizing: border-box;
    -webkit-appearance: none;
    background: #FFFFFF;
    color: #000000;
}

#locationInput:focus {
    outline: none;
    border-color: #FFF2CC;
    box-shadow: 0 0 0 2px rgba(255, 242, 204, 0.3);
}

#searchBtn {
    padding: 0.75rem 1.5rem;
    background: #000000;
    color: #FFFFFF;
    border: 2px solid #FFF2CC;
    border-radius: 4px;
    font-size: 1rem;
    cursor: pointer;
    box-sizing: border-box;
    -webkit-appearance: none;
    align-self: center;
}

#searchBtn:hover {
    background: #5B5B5B;
}

.weather-display {
}

.location-info h3 {
    color: #FFFFFF;
    font-size: 1.5rem;
    margin-bottom: 0.5rem;
}

.location-info p {
    color: #FFFFFF;
    margin-bottom: 1.5rem;
}

.current-weather {
    display: flex;
    align-items: center;
    justify-content: space-between;
    background: #5B5B5B;
    color: #FFFFFF;
    padding: 1.5rem;
    border-radius: 4px;
    margin: 1rem 0;
    border: 1px solid #000000;
}

.temperature {
    display: flex;
    align-items: center;
    gap: 1rem;
}

#temperature {
    font-size: 3rem;
    font-weight: bold;
}

#weatherIcon {
    font-size: 3rem;
}

.weather-details {
    text-align: right;
}

.weather-details p {
    margin: 0.5rem 0;
    font-size: 1rem;
}

.hidden {
    display: none;
}

#radarMap {
    height: 400px;
    border-radius: 15px;
    overflow: hidden;
}

.forecast-container {
    background: #FFF2CC;
    border: 1px solid #5B5B5B;
    border-radius: 4px;
    padding: 1rem;
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
    max-height: 400px;
    overflow-y: auto;
}

.forecast-day {
    background: #FFFFFF;
    border: 1px solid #5B5B5B;
    border-radius: 4px;
    padding: 1rem 1.5rem;
    color: #000000;
    display: flex;
    align-items: center;
    justify-content: space-between;
    min-height: 60px;
}

.forecast-day:hover {
    background: #5B5B5B;
    color: #FFFFFF;
}

.forecast-day-left {
    display: flex;
    align-items: center;
    gap: 1rem;
    flex: 1;
}

.forecast-day-name {
    font-weight: bold;
    font-size: 1rem;
    min-width: 50px;
}

.forecast-icon {
    font-size: 1.8rem;
    min-width: 40px;
    text-align: center;
}

.forecast-desc {
    font-size: 0.9rem;
    opacity: 0.95;
    flex: 1;
    text-align: left;
}

.forecast-temps {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-size: 1rem;
    font-weight: bold;
}

.forecast-high {
    font-weight: bold;
}

.forecast-low {
    opacity: 0.8;
    font-weight: normal;
}

.error {
    background: #CC0000;
    color: #FFFFFF;
    padding: 1rem;
    border-radius: 4px;
    margin-top: 1rem;
    border: 1px solid #000000;
}


@media (max-width: 768px) {
    body {
        padding: 1rem;
    }
    
    .app-container {
        grid-template-columns: 1fr;
        gap: 1.5rem;
    }
    
    .modal-content {
        padding: 1.5rem;
    }
    
    .current-weather {
        flex-direction: column;
        text-align: center;
        gap: 1rem;
    }
    
    .weather-details {
        text-align: center;
    }
    
    #radarMap {
        height: 300px;
    }
    
    .forecast-container {
        padding: 0.75rem;
        gap: 0.5rem;
    }
    
    .forecast-day {
        padding: 0.75rem 1rem;
        min-height: 50px;
    }
    
    .forecast-day-left {
        gap: 0.75rem;
    }
    
    .forecast-day-name {
        min-width: 40px;
        font-size: 0.9rem;
    }
    
    .forecast-icon {
        font-size: 1.5rem;
        min-width: 35px;
    }
    
    .forecast-desc {
        font-size: 0.8rem;
    }
    
    .forecast-temps {
        font-size: 0.9rem;
    }
}
\`;

const scriptJS = \`// Use Cloudflare Workers instead of Netlify Functions
const WEATHER_FUNCTION_URL = '/weather';
const FORECAST_FUNCTION_URL = '/forecast';

const locationInput = document.getElementById('locationInput');
const searchBtn = document.getElementById('searchBtn');
const weatherDisplay = document.getElementById('weatherDisplay');
const errorMessage = document.getElementById('errorMessage');

const locationName = document.getElementById('locationName');
const currentDate = document.getElementById('currentDate');
const temperature = document.getElementById('temperature');
const weatherIcon = document.getElementById('weatherIcon');
const description = document.getElementById('description');
const feelsLike = document.getElementById('feelsLike');
const humidity = document.getElementById('humidity');
const windSpeed = document.getElementById('windSpeed');
const radarModal = document.getElementById('radarModal');
const forecastModal = document.getElementById('forecastModal');
const forecastContainer = document.getElementById('forecastContainer');

let radarMap = null;

const weatherIcons = {
    '01d': '☀️', '01n': '🌙', '02d': '⛅', '02n': '☁️',
    '03d': '☁️', '03n': '☁️', '04d': '☁️', '04n': '☁️',
    '09d': '🌧️', '09n': '🌧️', '10d': '🌦️', '10n': '🌧️',
    '11d': '⛈️', '11n': '⛈️', '13d': '❄️', '13n': '❄️',
    '50d': '🌫️', '50n': '🌫️'
};

function displayCurrentDate() {
    const now = new Date();
    const options = { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
    };
    currentDate.textContent = now.toLocaleDateString('en-US', options);
}

async function getWeatherData(location) {
    try {
        showLoading();
        
        // Call our Cloudflare Worker instead of OpenWeatherMap directly
        const url = \\\`\\\${WEATHER_FUNCTION_URL}?location=\\\${encodeURIComponent(location)}\\\`;
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error('Location not found');
        }
        
        const data = await response.json();
        
        if (data.error) {
            throw new Error(data.error);
        }
        
        displayWeatherData(data);
        getForecastData(location);
        
    } catch (error) {
        console.error('Weather API error:', error);
        showError();
    } finally {
        hideLoading();
    }
}

function displayWeatherData(data) {
    hideError();
    
    // Format location display - for US locations, try to show state instead of "US"
    let displayLocation = \\\`\\\${data.name}\\\`;
    if (data.sys.country === 'US') {
        // For US locations, just show the city name without "US"
        displayLocation = data.name;
    } else {
        // For international locations, show country
        displayLocation = \\\`\\\${data.name}, \\\${data.sys.country}\\\`;
    }
    
    locationName.textContent = displayLocation;
    temperature.textContent = \\\`\\\${Math.round(data.main.temp)}°F\\\`;
    description.textContent = data.weather[0].description
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
    feelsLike.textContent = \\\`\\\${Math.round(data.main.feels_like)}°F\\\`;
    humidity.textContent = \\\`\\\${data.main.humidity}%\\\`;
    windSpeed.textContent = \\\`\\\${Math.round(data.wind.speed)} mph\\\`;
    
    const iconCode = data.weather[0].icon;
    weatherIcon.textContent = weatherIcons[iconCode] || '🌤️';
    
    displayCurrentDate();
    weatherDisplay.classList.remove('hidden');
    
    // Initialize radar map
    initializeRadar(data.coord.lat, data.coord.lon);
}

function showLoading() {
    searchBtn.disabled = true;
    hideError();
    weatherDisplay.classList.add('hidden');
}

function hideLoading() {
    searchBtn.disabled = false;
}

function showError() {
    hideLoading();
    weatherDisplay.classList.add('hidden');
    errorMessage.classList.remove('hidden');
}

function hideError() {
    errorMessage.classList.add('hidden');
}

function handleSearch() {
    const location = locationInput.value.trim();
    
    if (!location) {
        alert('Please enter a city name or ZIP code');
        return;
    }
    
    // No API key check needed - handled by Cloudflare Worker
    
    getWeatherData(location);
}

searchBtn.addEventListener('click', handleSearch);

locationInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        handleSearch();
    }
});

locationInput.addEventListener('input', hideError);

function initializeRadar(lat, lon) {
    // Show radar modal
    radarModal.classList.remove('hidden');
    
    // Clear existing map if it exists
    if (radarMap) {
        radarMap.remove();
    }
    
    // Create new map centered on the location
    radarMap = L.map('radarMap').setView([lat, lon], 8);
    
    // Add base map tiles
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors'
    }).addTo(radarMap);
    
    // Add location marker
    L.marker([lat, lon])
        .addTo(radarMap);
    
    // Add RainViewer radar overlay
    fetch('https://api.rainviewer.com/public/weather-maps.json')
        .then(response => response.json())
        .then(data => {
            if (data.radar && data.radar.past && data.radar.past.length > 0) {
                // Get the most recent radar frame
                const latestRadar = data.radar.past[data.radar.past.length - 1];
                const radarUrl = \\\`https://tilecache.rainviewer.com/v2/radar/\\\${latestRadar.time}/256/{z}/{x}/{y}/2/1_1.png\\\`;
                
                // Add radar layer
                L.tileLayer(radarUrl, {
                    opacity: 0.6,
                    attribution: '© RainViewer'
                }).addTo(radarMap);
            }
        })
        .catch(error => {
            console.log('Radar data unavailable:', error);
        });
}

async function getForecastData(location) {
    try {
        // Call our Cloudflare Worker instead of OpenWeatherMap directly
        const url = \\\`\\\${FORECAST_FUNCTION_URL}?location=\\\${encodeURIComponent(location)}\\\`;
        const response = await fetch(url);
        
        if (!response.ok) {
            throw new Error('Forecast not found');
        }
        
        const data = await response.json();
        
        if (data.error) {
            throw new Error(data.error);
        }
        
        displayForecastData(data);
        
    } catch (error) {
        console.error('Forecast API error:', error);
    }
}

function displayForecastData(data) {
    const dailyData = processForecastData(data.list);
    
    forecastContainer.innerHTML = '';
    
    dailyData.forEach(day => {
        const dayElement = document.createElement('div');
        dayElement.className = 'forecast-day';
        
        dayElement.innerHTML = \\\`
            <div class="forecast-day-left">
                <div class="forecast-day-name">\\\${day.dayName}</div>
                <div class="forecast-icon">\\\${weatherIcons[day.icon] || '🌤️'}</div>
                <div class="forecast-desc">\\\${day.description}</div>
            </div>
            <div class="forecast-temps">
                <span class="forecast-high">\\\${day.high}°</span>
                <span class="forecast-low">\\\${day.low}°</span>
            </div>
        \\\`;
        
        forecastContainer.appendChild(dayElement);
    });
    
    forecastModal.classList.remove('hidden');
}

function processForecastData(forecastList) {
    const dailyData = {};
    
    forecastList.forEach(item => {
        const date = new Date(item.dt * 1000);
        const dayKey = date.toDateString();
        
        if (!dailyData[dayKey]) {
            dailyData[dayKey] = {
                dayName: date.toLocaleDateString('en-US', { weekday: 'short' }),
                temps: [],
                descriptions: [],
                icons: []
            };
        }
        
        dailyData[dayKey].temps.push(item.main.temp);
        dailyData[dayKey].descriptions.push(item.weather[0].description);
        dailyData[dayKey].icons.push(item.weather[0].icon);
    });
    
    return Object.values(dailyData)
        .slice(0, 5)
        .map(day => ({
            dayName: day.dayName,
            high: Math.round(Math.max(...day.temps)),
            low: Math.round(Math.min(...day.temps)),
            description: day.descriptions[0]
                .split(' ')
                .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                .join(' '),
            icon: day.icons[0]
        }));
}

displayCurrentDate();
\`;