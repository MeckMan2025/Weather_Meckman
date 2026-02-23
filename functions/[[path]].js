export async function onRequest(context) {
  const { request, env } = context;
  const url = new URL(request.url);
  const pathname = url.pathname;
  
  // CORS headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': 'https://weather.meckman.org',
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
    
    // Let Pages try to serve static files
    return context.next();
  } catch (error) {
    console.error('Function error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
}

async function handleWeather(request, env, corsHeaders) {
  const url = new URL(request.url);
  const location = url.searchParams.get('location');

  if (!location || location.length > 100) {
    return new Response(
      JSON.stringify({ error: 'Invalid location' }),
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
    apiUrl = `${API_URL}?zip=${encodeURIComponent(location)},US&appid=${API_KEY}&units=imperial`;
  } else {
    // Check if location includes state (e.g., "Baxter, IA" or "Baxter, Iowa")
    const cityStatePattern = /^(.+),\s*([A-Za-z]{2,})$/;
    const match = location.match(cityStatePattern);

    if (match) {
      const city = match[1].trim();
      const state = match[2].trim();
      apiUrl = `${API_URL}?q=${encodeURIComponent(city)},${encodeURIComponent(state)},US&appid=${API_KEY}&units=imperial`;
    } else {
      // Just city name - will default to most populous
      apiUrl = `${API_URL}?q=${encodeURIComponent(location)},US&appid=${API_KEY}&units=imperial`;
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

  if (!location || location.length > 100) {
    return new Response(
      JSON.stringify({ error: 'Invalid location' }),
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
    apiUrl = `${FORECAST_API_URL}?zip=${encodeURIComponent(location)},US&appid=${API_KEY}&units=imperial`;
  } else {
    // Check if location includes state (e.g., "Baxter, IA" or "Baxter, Iowa")
    const cityStatePattern = /^(.+),\s*([A-Za-z]{2,})$/;
    const match = location.match(cityStatePattern);

    if (match) {
      const city = match[1].trim();
      const state = match[2].trim();
      apiUrl = `${FORECAST_API_URL}?q=${encodeURIComponent(city)},${encodeURIComponent(state)},US&appid=${API_KEY}&units=imperial`;
    } else {
      // Just city name - will default to most populous
      apiUrl = `${FORECAST_API_URL}?q=${encodeURIComponent(location)},US&appid=${API_KEY}&units=imperial`;
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