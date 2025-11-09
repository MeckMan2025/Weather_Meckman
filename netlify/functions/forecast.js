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

    const FORECAST_API_URL = 'https://api.openweathermap.org/data/2.5/forecast';
    
    // Build the API URL based on location format
    let url;
    if (/^\d{5}$/.test(location)) {
      // ZIP code format
      url = `${FORECAST_API_URL}?zip=${location},US&appid=${API_KEY}&units=imperial`;
    } else {
      // Check if location includes state (e.g., "Baxter, IA" or "Baxter, Iowa")
      const cityStatePattern = /^(.+),\s*([A-Za-z]{2,})$/;
      const match = location.match(cityStatePattern);
      
      if (match) {
        const city = match[1].trim();
        const state = match[2].trim();
        url = `${FORECAST_API_URL}?q=${city},${state},US&appid=${API_KEY}&units=imperial`;
      } else {
        // Just city name - will default to most populous
        url = `${FORECAST_API_URL}?q=${location},US&appid=${API_KEY}&units=imperial`;
      }
    }

    // Fetch forecast data
    const response = await fetch(url);
    
    if (!response.ok) {
      return {
        statusCode: response.status,
        headers,
        body: JSON.stringify({ error: 'Location not found' }),
      };
    }

    const forecastData = await response.json();

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(forecastData),
    };

  } catch (error) {
    console.error('Forecast API error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  }
};