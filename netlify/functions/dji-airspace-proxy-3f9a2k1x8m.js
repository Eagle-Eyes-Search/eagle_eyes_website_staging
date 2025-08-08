const fetch = require('node-fetch');

exports.handler = async (event, context) => {
  // Enable CORS
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS'
  };

  // Handle preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers,
      body: ''
    };
  }

  try {
    const { url, export: exportMode } = event.queryStringParameters || {};
    
    if (!url) {
      return {
        statusCode: 400,
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Missing url parameter' })
      };
    }

    // Fetch the target URL
    const response = await fetch(url);
    
    if (!response.ok) {
      return {
        statusCode: response.status,
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: `HTTP ${response.status}: ${response.statusText}` })
      };
    }

    const contentType = response.headers.get('content-type') || '';
    const isJson = contentType.includes('application/json') || contentType.includes('text/json');

    if (exportMode === 'true' && isJson) {
      // Export mode: convert DJI JSON to GeoJSON
      const djiData = await response.json();
      const geojson = convertDjiToGeojson(djiData);
      
      return {
        statusCode: 200,
        headers: { 
          ...headers, 
          'Content-Type': 'application/geo+json',
          'Content-Disposition': 'attachment; filename="dji-geozones.geojson"'
        },
        body: JSON.stringify(geojson)
      };
    } else {
      // Regular proxy mode: return the response with modified headers
      const body = await response.text();
      
      return {
        statusCode: 200,
        headers: {
          ...headers,
          'Content-Type': contentType,
          // Remove problematic headers
          'Content-Security-Policy': undefined,
          'X-Frame-Options': undefined,
          'X-Content-Type-Options': undefined
        },
        body
      };
    }
  } catch (error) {
    console.error('Proxy error:', error);
    return {
      statusCode: 500,
      headers: { ...headers, 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Internal server error', message: error.message })
    };
  }
};

function convertDjiToGeojson(djiData) {
  const features = [];
  
  // Handle different DJI data structures
  if (djiData.data && Array.isArray(djiData.data)) {
    // Standard DJI API response
    djiData.data.forEach(zone => {
      const feature = convertZoneToFeature(zone);
      if (feature) features.push(feature);
    });
  } else if (Array.isArray(djiData)) {
    // Direct array of zones
    djiData.forEach(zone => {
      const feature = convertZoneToFeature(zone);
      if (feature) features.push(feature);
    });
  } else if (djiData.zones && Array.isArray(djiData.zones)) {
    // Alternative structure
    djiData.zones.forEach(zone => {
      const feature = convertZoneToFeature(zone);
      if (feature) features.push(feature);
    });
  }

  return {
    type: 'FeatureCollection',
    features
  };
}

function convertZoneToFeature(zone) {
  try {
    // Extract zone properties
    const properties = {
      id: zone.id || zone.zone_id || zone.zoneId,
      name: zone.name || zone.zone_name || zone.zoneName,
      level: zone.level || zone.zone_level || zone.zoneLevel,
      type: zone.type || zone.zone_type || zone.zoneType,
      description: zone.description || zone.zone_description || zone.zoneDescription,
      altitude: zone.altitude || zone.zone_altitude || zone.zoneAltitude,
      start_time: zone.start_time || zone.startTime,
      end_time: zone.end_time || zone.endTime
    };

    // Clean up undefined properties
    Object.keys(properties).forEach(key => {
      if (properties[key] === undefined) {
        delete properties[key];
      }
    });

    // Extract geometry
    let geometry = null;
    
    if (zone.geometry) {
      geometry = zone.geometry;
    } else if (zone.coordinates) {
      // Convert coordinates array to GeoJSON
      geometry = {
        type: 'Polygon',
        coordinates: [zone.coordinates]
      };
    } else if (zone.boundary) {
      // Handle boundary format
      geometry = {
        type: 'Polygon',
        coordinates: [zone.boundary]
      };
    } else if (zone.polygon) {
      // Handle polygon format
      geometry = {
        type: 'Polygon',
        coordinates: [zone.polygon]
      };
    }

    if (!geometry) {
      console.warn('No geometry found for zone:', zone);
      return null;
    }

    return {
      type: 'Feature',
      properties,
      geometry
    };
  } catch (error) {
    console.error('Error converting zone to feature:', error, zone);
    return null;
  }
} 