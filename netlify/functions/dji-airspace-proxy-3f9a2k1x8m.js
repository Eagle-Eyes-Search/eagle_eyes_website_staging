exports.handler = async function(event, context) {
  // Only allow GET requests
  if (event.httpMethod !== 'GET') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  // Get the URL from query parameters
  const url = event.queryStringParameters?.url;
  
  if (!url) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Missing url parameter' })
    };
  }

  try {
    // Fetch the URL
    const response = await fetch(url);
    const body = await response.text();
    
    // Get all headers from the original response
    const headers = {};
    response.headers.forEach((value, key) => {
      // Skip security headers that might block the response
      if (!['content-security-policy', 'x-frame-options'].includes(key.toLowerCase())) {
        headers[key] = value;
      }
    });
    
    // Add CORS headers
    headers['Access-Control-Allow-Origin'] = '*';
    headers['Access-Control-Allow-Methods'] = 'GET, OPTIONS';
    headers['Access-Control-Allow-Headers'] = 'Content-Type';
    
    return {
      statusCode: response.status,
      headers: headers,
      body: body
    };
  } catch (error) {
    return {
      statusCode: 500,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ error: 'Failed to fetch URL', details: error.message })
    };
  }
}; 