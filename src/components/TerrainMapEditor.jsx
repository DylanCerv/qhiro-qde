import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import L from 'leaflet';
import { MapContainer, Marker, Polygon, useMap, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import {
  MapBaseLayers,
  MapCursorTracker,
  MapLayerControls,
  MapResizeFix,
} from './MapHelpers.jsx';
import {
  calculateUsefulAreaHa,
  formatCoordinates,
  polygonCentroid,
  resolveUserLocation,
} from '../utils/geo.js';

const PARCEL_POLYGON_STYLE = {
  color: '#54e98a',
  fillColor: '#54e98a',
  fillOpacity: 0.28,
  weight: 3,
};

function createPointIcon(index, selected, moving) {
  const classes = ['parcel-point-marker'];
  if (selected) classes.push('selected');
  if (moving) classes.push('moving');

  return L.divIcon({
    className: classes.join(' '),
    html: `<span>${index + 1}</span>`,
    iconSize: [32, 32],
    iconAnchor: [16, 16],
  });
}

function DrawHandler({ setPoints, isMoving, onDeselect }) {
  useMapEvents({
    click(event) {
      if (isMoving) return;
      onDeselect();
      setPoints((prev) => [...prev, { lat: event.latlng.lat, lng: event.latlng.lng }]);
    },
  });
  return null;
}

function MapRecenter({ center, points, recenterKey }) {
  const map = useMap();

  useEffect(() => {
    if (points.length >= 3) {
      const bounds = L.latLngBounds(points.map((p) => [p.lat, p.lng]));
      map.fitBounds(bounds, { padding: [48, 48], maxZoom: 20 });
      return;
    }
    if (center) {
      map.setView([center.lat, center.lng], 17);
    }
  }, [recenterKey, center, map, points]);

  return null;
}

export default function TerrainMapEditor({ points, onChange, defaultCenter }) {
  const [layerId, setLayerId] = useState('satellite');
  const [hillshade, setHillshade] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(null);
  const [isMoving, setIsMoving] = useState(false);
  const [cursorPoint, setCursorPoint] = useState(null);
  const [recenterKey, setRecenterKey] = useState(0);
  const [mapCenter, setMapCenter] = useState(defaultCenter ?? { lat: 18.807, lng: -69.784 });
  const prevPointCount = useRef(points.length);

  useEffect(() => {
    if (defaultCenter) {
      setMapCenter(defaultCenter);
      return;
    }
    if (points.length >= 1) {
      setMapCenter(polygonCentroid(points) ?? points[0]);
      return;
    }
    resolveUserLocation().then(setMapCenter);
  }, [defaultCenter, points]);

  useEffect(() => {
    if (points.length >= 3 && prevPointCount.current < 3) {
      setRecenterKey((key) => key + 1);
    }
    prevPointCount.current = points.length;
  }, [points.length]);

  const selectedPoint = selectedIndex !== null ? points[selectedIndex] : null;
  const grossHa = calculateUsefulAreaHa(points, 1);
  const usefulHa = calculateUsefulAreaHa(points, 0.95);

  const pointIcons = useMemo(
    () =>
      points.map((_, index) =>
        createPointIcon(index, selectedIndex === index, isMoving && selectedIndex === index),
      ),
    [points, selectedIndex, isMoving],
  );

  const setPoints = useCallback(
    (updater) => {
      const next = typeof updater === 'function' ? updater(points) : updater;
      onChange(next);
    },
    [onChange, points],
  );

  const deselectPoint = () => {
    setSelectedIndex(null);
    setIsMoving(false);
  };

  const selectPoint = (index) => {
    setSelectedIndex(index);
    setIsMoving(false);
  };

  const updatePoint = (index, lat, lng) => {
    setPoints((prev) => prev.map((point, i) => (i === index ? { lat, lng } : point)));
  };

  const removeLastPoint = () => {
    setPoints((prev) => prev.slice(0, -1));
    if (selectedIndex !== null && selectedIndex >= points.length - 1) {
      deselectPoint();
    }
  };

  const deleteSelected = () => {
    if (selectedIndex === null || points.length <= 3) return;
    setPoints((prev) => prev.filter((_, i) => i !== selectedIndex));
    deselectPoint();
  };

  const startMove = () => {
    if (selectedIndex === null) return;
    setIsMoving(true);
  };

  return (
    <div className="map-editor">
      <div className="map-toolbar">
        <p className="map-toolbar__hint">
          Clic en el mapa para marcar vértices (mínimo 3). Igual que en Symbiotic: selecciona,
          mueve o elimina puntos. Usa zoom con rueda o pellizco.
        </p>
        <div className="map-toolbar-actions">
          <button type="button" className="btn btn-secondary" onClick={removeLastPoint} disabled={points.length === 0}>
            Deshacer último
          </button>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => {
              setPoints([]);
              deselectPoint();
            }}
            disabled={points.length === 0}
          >
            Limpiar
          </button>
        </div>
      </div>

      <MapLayerControls
        layerId={layerId}
        onLayerChange={setLayerId}
        hillshade={hillshade}
        onHillshadeChange={setHillshade}
        canRecenter={points.length >= 1}
        onRecenter={() => setRecenterKey((key) => key + 1)}
      />

      {points.length >= 3 ? (
        <div className="terrain-area-stats">
          <span>
            Área bruta: <strong>{grossHa} ha</strong>
          </span>
          <span>
            Área útil (95%): <strong>{usefulHa} ha</strong>
          </span>
          <span>{points.length} vértices</span>
        </div>
      ) : (
        <p className="map-meta">
          Vértices: {points.length} · Necesitas al menos 3 para cerrar el polígono
        </p>
      )}

      {points.length > 0 ? (
        <div className="point-selector">
          <span className="point-selector-label">Seleccionar punto:</span>
          {points.map((_, index) => (
            <button
              key={`chip-${index}`}
              type="button"
              className={`point-chip${selectedIndex === index ? ' selected' : ''}`}
              onClick={() => selectPoint(index)}
            >
              Punto {index + 1}
            </button>
          ))}
        </div>
      ) : null}

      {selectedPoint ? (
        <div className="point-editor-panel">
          <p>
            <strong>Punto {selectedIndex + 1}</strong> · {formatCoordinates(selectedPoint, 6)}
          </p>
          <div className="map-toolbar-actions">
            <button
              type="button"
              className={`btn btn-secondary${isMoving ? ' active-mode' : ''}`}
              onClick={startMove}
            >
              {isMoving ? 'Arrastrando…' : 'Mover punto'}
            </button>
            <button type="button" className="btn btn-secondary" onClick={deleteSelected} disabled={points.length <= 3}>
              Eliminar
            </button>
            <button type="button" className="btn btn-ghost" onClick={deselectPoint}>
              Deseleccionar
            </button>
          </div>
          {isMoving ? <p className="map-meta">Arrastra el marcador verde en el mapa.</p> : null}
          {points.length <= 3 && selectedIndex !== null ? (
            <p className="map-meta">No puedes eliminar: el polígono requiere mínimo 3 vértices.</p>
          ) : null}
        </div>
      ) : null}

      <div className="map-wrap map-wrap-tall">
        <MapContainer
          center={[mapCenter.lat, mapCenter.lng]}
          zoom={17}
          minZoom={3}
          maxZoom={22}
          scrollWheelZoom
          style={{ height: '100%', width: '100%' }}
        >
          <MapBaseLayers layerId={layerId} hillshade={hillshade} />
          <MapResizeFix />
          <MapRecenter center={mapCenter} points={points} recenterKey={recenterKey} />
          <MapCursorTracker onMove={setCursorPoint} />
          <DrawHandler setPoints={setPoints} isMoving={isMoving} onDeselect={deselectPoint} />
          {points.map((point, index) => (
            <Marker
              key={`point-${index}-${point.lat}-${point.lng}`}
              position={[point.lat, point.lng]}
              icon={pointIcons[index]}
              draggable={isMoving && selectedIndex === index}
              eventHandlers={{
                click: (event) => {
                  event.originalEvent.stopPropagation();
                  selectPoint(index);
                },
                dragend: (event) => {
                  const { lat, lng } = event.target.getLatLng();
                  updatePoint(index, lat, lng);
                  setIsMoving(false);
                },
              }}
            />
          ))}
          {points.length >= 3 ? (
            <Polygon positions={points.map((p) => [p.lat, p.lng])} pathOptions={PARCEL_POLYGON_STYLE} />
          ) : null}
        </MapContainer>
      </div>

      <div className="map-status-bar">
        <span>
          {cursorPoint ? formatCoordinates(cursorPoint, 6) : 'Mueve el cursor sobre el mapa'}
        </span>
        <span>Zoom máx. 22 · Rueda del mouse o +/- para acercar</span>
      </div>

      <p className="map-meta">
        Puntos: {points.length} · Selecciona un vértice para moverlo o eliminarlo
      </p>
    </div>
  );
}
