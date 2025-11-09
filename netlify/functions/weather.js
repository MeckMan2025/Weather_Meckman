exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  };

  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: '',
    };
  }

  try {
    const { location } = event.queryStringParameters || {};
    
    if (!location) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'Location parameter is required' }),
      };
    }

    // Get API key from environment variable
    const API_KEY = process.env.OPENWEATHER_API_KEY;
    
    if (!API_KEY) {
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: 'API key not configured' }),
      };
    }

    const API_URL = 'https://api.openweathermap.org/data/2.5/weather';
    
    // Build the API URL based on location format
    let url;
    if (/^\d{5}$/.test(location)) {
      // ZIP code format
      url = `${API_URL}?zip=${location},US&appid=${API_KEY}&units=imperial`;
    } else {
      // Check if location includes state (e.g., "Baxter, IA" or "Baxter, Iowa")
      const cityStatePattern = /^(.+),\s*([A-Za-z]{2,})$/;
      const match = location.match(cityStatePattern);
      
      if (match) {
        const city = match[1].trim();
        const state = match[2].trim();
        url = `${API_URL}?q=${city},${state},US&appid=${API_KEY}&units=imperial`;
      } else {
        // Just city name - will default to most populous
        url = `${API_URL}?q=${location},US&appid=${API_KEY}&units=imperial`;
      }
    }

    // Fetch weather data
    const response = await fetch(url);
    
    if (!response.ok) {
      return {
        statusCode: response.status,
        headers,
        body: JSON.stringify({ error: 'Location not found' }),
      };
    }

    const weatherData = await response.json();

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(weatherData),
    };

  } catch (error) {
    console.error('Weather API error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  }
};