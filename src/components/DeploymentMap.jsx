import { useEffect, useMemo, useState } from 'react';
import L from 'leaflet';
import { Circle, MapContainer, Marker, Polygon, Popup, Polyline, useMap } from 'react-leaflet';
import { roleLabels } from '../data/glossary.js';
import { formatCoordinates, polygonCentroid } from '../utils/geo.js';
import { mergeEnergyConfig } from './EnergyConfigPanel.jsx';
import {
  MapBaseLayers,
  MapCursorTracker,
  MapLayerControls,
  MapResizeFix,
} from './MapHelpers.jsx';
import 'leaflet/dist/leaflet.css';

const PARCEL_POLYGON_STYLE = {
  color: '#f3cc54',
  fillColor: '#c084fc',
  fillOpacity: 0.18,
  weight: 3,
};

function createRoleIcon(role) {
  const meta = roleLabels[role] ?? { color: '#94a3b8', short: '?' };
  return L.divIcon({
    className: 'qde-map-icon',
    html: `<div class="qde-deploy-pin qde-deploy-pin--${role}" style="--pin-color:${meta.color}" title="${meta.label}"><span>${meta.short}</span></div>`,
    iconSize: [26, 26],
    iconAnchor: [13, 13],
  });
}

function FitAllBounds({ coords, nodes, fitKey }) {
  const map = useMap();

  useEffect(() => {
    const points = [...(coords ?? []), ...nodes.map((node) => node.coordinates)];
    if (points.length === 0) return;
    const bounds = L.latLngBounds(points.map((point) => [point.lat, point.lng])).pad(0.12);
    map.fitBounds(bounds, { padding: [48, 48], maxZoom: 20, animate: false });
  }, [fitKey, coords, map, nodes]);

  return null;
}

export default function DeploymentMap({ inputs, output }) {
  const [layerId, setLayerId] = useState('satellite');
  const [hillshade, setHillshade] = useState(true);
  const [cursorPoint, setCursorPoint] = useState(null);
  const [fitKey, setFitKey] = useState(0);

  const coords = inputs?.terrain?.coordinates;
  const nodes = output?.deploymentNodes ?? [];
  const energy = mergeEnergyConfig(inputs?.energy, inputs?.sprayProfile?.ra);
  const ra = energy.peonEffectiveRadiusM || inputs?.sprayProfile?.ra || 12;
  const gapPoints = output?.coverageAnalysis?.gapPoints ?? [];
  const center =
    polygonCentroid(coords ?? []) ??
    coords?.[0] ??
    nodes.find((n) => n.role === 'nido')?.coordinates ??
    { lat: 18.807, lng: -69.784 };

  const nido = nodes.find((n) => n.role === 'nido');
  const pipeLines = useMemo(() => {
    if (!nido) return [];
    return nodes
      .filter((node) => node.role === 'qdn')
      .map((node) => [nido.coordinates, node.coordinates]);
  }, [nido, nodes]);

  useEffect(() => {
    if (nodes.length > 0) setFitKey((key) => key + 1);
  }, [nodes.length, output?.computedAt]);

  return (
    <div className="deployment-map-wrap">
      <MapLayerControls
        layerId={layerId}
        onLayerChange={setLayerId}
        hillshade={hillshade}
        onHillshadeChange={setHillshade}
        canRecenter={Boolean(coords?.length || nodes.length)}
        onRecenter={() => setFitKey((key) => key + 1)}
      />

      <div className="map-legend">
        {Object.entries(roleLabels).map(([role, meta]) => (
          <span key={role} className="map-legend-item">
            <i style={{ background: meta.color }} />
            {meta.label}
          </span>
        ))}
        <span className="map-legend-item">
          <i style={{ background: 'rgba(84,233,138,0.35)', border: '1px dashed #54e98a' }} />
          Radio Peón ({ra} m)
        </span>
        {gapPoints.length > 0 ? (
          <span className="map-legend-item">
            <i style={{ background: '#ff8a84' }} />
            Huecos de cobertura ({gapPoints.length})
          </span>
        ) : null}
      </div>

      <div className="map-wrap map-wrap-tall">
        <MapContainer
          center={[center.lat, center.lng]}
          zoom={17}
          minZoom={3}
          maxZoom={22}
          scrollWheelZoom
          style={{ height: '100%', width: '100%' }}
        >
          <MapBaseLayers layerId={layerId} hillshade={hillshade} />
          <MapResizeFix />
          <FitAllBounds coords={coords} nodes={nodes} fitKey={fitKey} />
          <MapCursorTracker onMove={setCursorPoint} />

          {coords?.length >= 3 ? (
            <Polygon positions={coords.map((point) => [point.lat, point.lng])} pathOptions={PARCEL_POLYGON_STYLE} />
          ) : null}

          {pipeLines.map((line, index) => (
            <Polyline
              key={`pipe-${index}`}
              positions={line.map((p) => [p.lat, p.lng])}
              pathOptions={{ color: '#92ccff', weight: 2, opacity: 0.65, dashArray: '8 6' }}
            />
          ))}

          {gapPoints.map((point, index) => (
            <Circle
              key={`gap-${index}`}
              center={[point.lat, point.lng]}
              radius={2}
              pathOptions={{ color: '#ff8a84', fillColor: '#ff8a84', fillOpacity: 0.9, weight: 1 }}
            />
          ))}

          {nodes
            .filter((node) => node.role === 'cabecilla' || node.role === 'peon')
            .map((node) => (
              <Circle
                key={`radius-${node.nodeId}`}
                center={[node.coordinates.lat, node.coordinates.lng]}
                radius={ra}
                pathOptions={{
                  color: roleLabels[node.role]?.color ?? '#54e98a',
                  fillColor: roleLabels[node.role]?.color ?? '#54e98a',
                  fillOpacity: 0.05,
                  weight: 1,
                  opacity: 0.4,
                }}
              />
            ))}

          {nodes.map((node) => (
            <Marker
              key={node.nodeId}
              position={[node.coordinates.lat, node.coordinates.lng]}
              icon={createRoleIcon(node.role)}
            >
              <Popup>
                <div className="map-popup">
                  <strong>{roleLabels[node.role]?.label ?? node.role}</strong>
                  <div>{node.nodeId}</div>
                  <div className="map-popup-coords">{formatCoordinates(node.coordinates, 6)}</div>
                  {node.sectorId ? <div>Sector: {node.sectorId}</div> : null}
                  <p>{node.placementReason ?? 'Ubicación calculada por el motor QDE.'}</p>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>

      <div className="map-status-bar">
        <span>{cursorPoint ? formatCoordinates(cursorPoint, 6) : 'Coordenadas bajo cursor'}</span>
        <span>Acerca con rueda del mouse para ubicar nidos, tuberías y Centinelas</span>
      </div>

      {nodes.length > 0 ? (
        <div className="node-table-wrap">
          <div className="card__label" style={{ padding: '0.75rem 1rem 0' }}>
            <span className="material-symbols-outlined">pin_drop</span>
            Coordenadas y criterio de ubicación
          </div>
          <table className="data-table">
            <thead>
              <tr>
                <th>Equipo</th>
                <th>Coordenadas</th>
                <th>Criterio</th>
              </tr>
            </thead>
            <tbody>
              {nodes.map((node) => (
                <tr key={node.nodeId}>
                  <td>
                    <span className="role-dot" style={{ background: roleLabels[node.role]?.color }} />
                    {roleLabels[node.role]?.label} · {node.nodeId}
                  </td>
                  <td style={{ fontFamily: 'ui-monospace, monospace', fontSize: '0.78rem' }}>
                    {formatCoordinates(node.coordinates, 6)}
                  </td>
                  <td style={{ fontSize: '0.85rem', maxWidth: '36ch' }}>
                    {node.placementReason ?? 'Calculado por QDE'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
    </div>
  );
}
