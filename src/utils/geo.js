export const countryDefaults = {
  DO: { lat: 18.807, lng: -69.784, label: 'República Dominicana' },
  EC: { lat: -0.1807, lng: -78.4678, label: 'Ecuador' },
  AR: { lat: -34.6037, lng: -58.3816, label: 'Argentina' },
  MX: { lat: 19.4326, lng: -99.1332, label: 'México' },
  CO: { lat: 4.711, lng: -74.0721, label: 'Colombia' },
  PE: { lat: -12.0464, lng: -77.0428, label: 'Perú' },
  CL: { lat: -33.4489, lng: -70.6693, label: 'Chile' },
  ES: { lat: 40.4168, lng: -3.7038, label: 'España' },
  US: { lat: 38.9072, lng: -77.0369, label: 'Estados Unidos' },
};

/** Free tile layers for field engineering (Leaflet-compatible). */
export const mapTileOptions = {
  satellite: {
    id: 'satellite',
    label: 'Satélite',
    description: 'Imagen aérea de alta resolución',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Tiles © Esri',
    maxZoom: 20,
  },
  street: {
    id: 'street',
    label: 'Calle',
    description: 'OpenStreetMap — calles y nombres',
    url: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '© OpenStreetMap',
    maxZoom: 19,
  },
  topo: {
    id: 'topo',
    label: 'Topográfico',
    description: 'Curvas de nivel y relieve',
    url: 'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
    attribution: '© OpenTopoMap © OSM',
    maxZoom: 17,
  },
  terrain: {
    id: 'terrain',
    label: 'Terreno Esri',
    description: 'Relieve sombreado con referencias',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Tiles © Esri',
    maxZoom: 19,
  },
  plan: {
    id: 'plan',
    label: 'Plano técnico',
    description: 'Estilo blanco y negro para diseño',
    url: 'https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png',
    attribution: '© CARTO © OSM',
    maxZoom: 20,
  },
  dark: {
    id: 'dark',
    label: 'Oscuro',
    description: 'Contraste alto para presentaciones',
    url: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    attribution: '© CARTO © OSM',
    maxZoom: 20,
  },
};

export const mapOverlays = {
  hillshade: {
    id: 'hillshade',
    label: 'Sombras de relieve',
    url: 'https://server.arcgisonline.com/ArcGIS/rest/services/Elevation/World_Hillshade/MapServer/tile/{z}/{y}/{x}',
    attribution: 'Relieve © Esri',
    maxZoom: 16,
    opacity: 0.55,
  },
};

export const mapTileList = Object.values(mapTileOptions);

/** @deprecated use mapTileOptions */
export const mapTiles = mapTileOptions;

export function getMapTile(id) {
  return mapTileOptions[id] ?? mapTileOptions.satellite;
}

export function getCountryCenter(countryCode) {
  return countryDefaults[countryCode] ?? countryDefaults.DO;
}

export function detectCountryCode() {
  if (typeof navigator === 'undefined') return 'DO';

  const supportedCountries = new Set(Object.keys(countryDefaults));
  const timezoneCountries = {
    'America/Santo_Domingo': 'DO',
    'America/Argentina/Buenos_Aires': 'AR',
    'America/Bogota': 'CO',
    'America/Guayaquil': 'EC',
    'America/Lima': 'PE',
    'America/Mexico_City': 'MX',
    'America/Santiago': 'CL',
    'Europe/Madrid': 'ES',
  };
  const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  if (timezoneCountries[timezone]) return timezoneCountries[timezone];

  const locales = navigator.languages?.length ? navigator.languages : [navigator.language];
  for (const locale of locales) {
    try {
      const countryCode = new Intl.Locale(locale).region;
      if (supportedCountries.has(countryCode)) return countryCode;
    } catch {
      // Ignore malformed browser locales.
    }
  }

  return 'DO';
}

export async function resolveUserLocation(countryCode = detectCountryCode()) {
  const fallback = getCountryCenter(countryCode);

  if (!navigator.geolocation) {
    return { lat: fallback.lat, lng: fallback.lng };
  }

  try {
    const position = await new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: true,
        timeout: 8000,
      });
    });
    return {
      lat: position.coords.latitude,
      lng: position.coords.longitude,
    };
  } catch {
    return { lat: fallback.lat, lng: fallback.lng };
  }
}

export function isPointInPolygon(point, polygon = []) {
  if (!point || polygon.length < 3) return false;

  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i, i += 1) {
    const xi = polygon[i].lng;
    const yi = polygon[i].lat;
    const xj = polygon[j].lng;
    const yj = polygon[j].lat;
    const intersects =
      yi > point.lat !== yj > point.lat &&
      point.lng < ((xj - xi) * (point.lat - yi)) / (yj - yi) + xi;
    if (intersects) inside = !inside;
  }
  return inside;
}

export function formatCoordinates(point, digits = 5) {
  if (!point) return '—';
  return `${point.lat.toFixed(digits)}, ${point.lng.toFixed(digits)}`;
}

export function polygonCentroid(polygon = []) {
  if (polygon.length === 0) return null;
  const sum = polygon.reduce(
    (acc, point) => ({ lat: acc.lat + point.lat, lng: acc.lng + point.lng }),
    { lat: 0, lng: 0 },
  );
  return { lat: sum.lat / polygon.length, lng: sum.lng / polygon.length };
}

export function polygonBounds(polygon = []) {
  if (polygon.length === 0) return null;
  return polygon.reduce(
    (bounds, point) => ({
      minLat: Math.min(bounds.minLat, point.lat),
      maxLat: Math.max(bounds.maxLat, point.lat),
      minLng: Math.min(bounds.minLng, point.lng),
      maxLng: Math.max(bounds.maxLng, point.lng),
    }),
    {
      minLat: polygon[0].lat,
      maxLat: polygon[0].lat,
      minLng: polygon[0].lng,
      maxLng: polygon[0].lng,
    },
  );
}

/** Shoelace area in hectares (matches backend QDE engine). */
export function calculateUsefulAreaHa(coordinates, exclusionFactor = 0.95) {
  if (!coordinates || coordinates.length < 3) return 0;

  const latToMeters = 111_320;
  const avgLat = coordinates.reduce((sum, point) => sum + point.lat, 0) / coordinates.length;
  const lngToMeters = Math.cos((avgLat * Math.PI) / 180) * 111_320;

  const points = coordinates.map((point) => ({
    x: point.lng * lngToMeters,
    y: point.lat * latToMeters,
  }));

  let area = 0;
  for (let index = 0; index < points.length; index += 1) {
    const current = points[index];
    const next = points[(index + 1) % points.length];
    area += current.x * next.y - next.x * current.y;
  }

  const grossHa = Math.abs(area / 2) / 10_000;
  return Number((grossHa * exclusionFactor).toFixed(2));
}

const EARTH_RADIUS_METERS = 6371000;

export function distanceMeters(a, b) {
  if (!a || !b) return Number.POSITIVE_INFINITY;
  const toRad = (deg) => (deg * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const haversine =
    Math.sin(dLat / 2) ** 2 + Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_METERS * Math.asin(Math.min(1, Math.sqrt(haversine)));
}
