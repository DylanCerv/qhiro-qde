import { useEffect } from 'react';
import { TileLayer, useMap, useMapEvents } from 'react-leaflet';
import { getMapTile, mapOverlays, mapTileList } from '../utils/geo.js';

export function MapResizeFix() {
  const map = useMap();

  useEffect(() => {
    const fix = () => {
      map.invalidateSize({ animate: false });
    };
    fix();
    const timer = window.setTimeout(fix, 150);
    window.addEventListener('resize', fix);
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener('resize', fix);
    };
  }, [map]);

  return null;
}

export function MapCursorTracker({ onMove }) {
  useMapEvents({
    mousemove(event) {
      onMove?.({ lat: event.latlng.lat, lng: event.latlng.lng });
    },
    mouseout() {
      onMove?.(null);
    },
  });
  return null;
}

export function MapBaseLayers({ layerId, hillshade = false }) {
  const base = getMapTile(layerId);

  return (
    <>
      <TileLayer
        key={`base-${base.id}`}
        url={base.url}
        attribution={base.attribution}
        maxNativeZoom={base.maxZoom}
        maxZoom={22}
      />
      {hillshade ? (
        <TileLayer
          key="overlay-hillshade"
          url={mapOverlays.hillshade.url}
          attribution={mapOverlays.hillshade.attribution}
          maxNativeZoom={mapOverlays.hillshade.maxZoom}
          maxZoom={22}
          opacity={mapOverlays.hillshade.opacity}
        />
      ) : null}
    </>
  );
}

export function MapLayerControls({
  layerId,
  onLayerChange,
  hillshade,
  onHillshadeChange,
  onRecenter,
  canRecenter = false,
}) {
  const current = getMapTile(layerId);

  return (
    <div className="map-layer-controls">
      <label className="map-layer-controls__select field">
        <span>Capa base</span>
        <select value={layerId} onChange={(e) => onLayerChange(e.target.value)}>
          {mapTileList.map((tile) => (
            <option key={tile.id} value={tile.id}>
              {tile.label}
            </option>
          ))}
        </select>
      </label>
      <label className="map-layer-controls__toggle">
        <input
          type="checkbox"
          checked={hillshade}
          onChange={(e) => onHillshadeChange(e.target.checked)}
        />
        <span>Sombras relieve</span>
      </label>
      {canRecenter ? (
        <button type="button" className="btn btn-secondary" onClick={onRecenter}>
          <span className="material-symbols-outlined">my_location</span>
          Centrar
        </button>
      ) : null}
      <span className="map-layer-controls__hint">{current.description}</span>
    </div>
  );
}
