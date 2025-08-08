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
    // Fetch the URL with proper headers
    const response = await fetch(url, {
      headers: {
        'Accept': '*/*',
        'Accept-Encoding': 'gzip, deflate, br',
        'User-Agent': 'Mozilla/5.0 (compatible; DJI-Geozones-Proxy/1.0)'
      }
    });
    
    // Get the content type to determine how to handle the response
    const contentType = response.headers.get('content-type') || '';
    let body;
    
    if (contentType.includes('application/json')) {
      body = await response.json();
      return {
        statusCode: response.status,
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      };
    } else {
      // For non-JSON responses, return as text
      body = await response.text();
      
      // Get all headers from the original response
      const headers = {};
      response.headers.forEach((value, key) => {
        // Skip security headers and encoding headers that might cause issues
        if (!['content-security-policy', 'x-frame-options', 'content-encoding'].includes(key.toLowerCase())) {
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
    }
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