# Eagle Eyes DJI Proxy

A simple Netlify-based proxy for DJI airspace data with CORS support.

## Files

- `dji-airspace-proxy.html` - Minimal test page with OpenLayers map and DJI geozones
- `netlify/functions/dji-airspace-proxy-3f9a2k1x8m.js` - Netlify function that proxies requests
- `netlify.toml` - Netlify configuration

## Usage

- **Test Page**: `https://<site>.netlify.app/dji-airspace-proxy.html`
- **Proxy Base**: `https://<site>.netlify.app/.netlify/functions/dji-airspace-proxy-3f9a2k1x8m?url=`

## Features

- Strips problematic headers (Content-Security-Policy, X-Frame-Options)
- Adds CORS headers for cross-origin requests
- Simple passthrough proxy for DJI API data 