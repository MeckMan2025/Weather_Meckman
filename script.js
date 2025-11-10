// Use Cloudflare Workers instead of Netlify Functions
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
        const url = `${WEATHER_FUNCTION_URL}?location=${encodeURIComponent(location)}`;
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
    let displayLocation = `${data.name}`;
    if (data.sys.country === 'US') {
        // For US locations, just show the city name without "US"
        displayLocation = data.name;
    } else {
        // For international locations, show country
        displayLocation = `${data.name}, ${data.sys.country}`;
    }
    
    locationName.textContent = displayLocation;
    temperature.textContent = `${Math.round(data.main.temp)}°F`;
    description.textContent = data.weather[0].description
        .split(' ')
        .map(word => word.charAt(0).toUpperCase() + word.slice(1))
        .join(' ');
    feelsLike.textContent = `${Math.round(data.main.feels_like)}°F`;
    humidity.textContent = `${data.main.humidity}%`;
    windSpeed.textContent = `${Math.round(data.wind.speed)} mph`;
    
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
                const radarUrl = `https://tilecache.rainviewer.com/v2/radar/${latestRadar.time}/256/{z}/{x}/{y}/2/1_1.png`;
                
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
        const url = `${FORECAST_FUNCTION_URL}?location=${encodeURIComponent(location)}`;
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
        
        dayElement.innerHTML = `
            <div class="forecast-day-left">
                <div class="forecast-day-name">${day.dayName}</div>
                <div class="forecast-icon">${weatherIcons[day.icon] || '🌤️'}</div>
                <div class="forecast-desc">${day.description}</div>
            </div>
            <div class="forecast-temps">
                <span class="forecast-high">${day.high}°</span>
                <span class="forecast-low">${day.low}°</span>
            </div>
        `;
        
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