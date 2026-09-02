import { roleLabels } from '../data/glossary.js';
import { polygonBounds, polygonCentroid } from '../utils/geo.js';

const ROLE_COLORS = {
  nido: '#54e98a',
  qdn: '#92ccff',
  cabecilla: '#f3cc54',
  peon: '#c084fc',
};

function projectToSvg(points, width, height, padding = 80) {
  const bounds = polygonBounds(points);
  if (!bounds) {
    return { project: () => ({ x: width / 2, y: height / 2 }), scale: 1 };
  }

  const latSpan = bounds.maxLat - bounds.minLat || 0.0001;
  const lngSpan = bounds.maxLng - bounds.minLng || 0.0001;
  const innerW = width - padding * 2;
  const innerH = height - padding * 2;
  const scale = Math.min(innerW / lngSpan, innerH / latSpan);

  const project = (point) => ({
    x: padding + (point.lng - bounds.minLng) * scale,
    y: height - padding - (point.lat - bounds.minLat) * scale,
  });

  return { project, scale, bounds };
}

function escapeXml(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function buildPlanSvg({ projectName, inputs, output, versionLabel }) {
  const coords = inputs?.terrain?.coordinates ?? [];
  const nodes = output?.deploymentNodes ?? [];
  const allPoints = [...coords, ...nodes.map((node) => node.coordinates)];

  const width = 1120;
  const height = 792;
  const { project, scale } = projectToSvg(allPoints.length >= 3 ? allPoints : [{ lat: 18.807, lng: -69.784 }], width, height);

  const polygonPoints =
    coords.length >= 3
      ? coords.map((point) => {
          const { x, y } = project(point);
          return `${x},${y}`;
        }).join(' ')
      : '';

  const nodeMarks = nodes
    .map((node) => {
      const { x, y } = project(node.coordinates);
      const color = ROLE_COLORS[node.role] ?? '#94a3b8';
      const label = roleLabels[node.role]?.short ?? node.role[0].toUpperCase();
      return `
        <g class="node" data-role="${escapeXml(node.role)}">
          <circle cx="${x}" cy="${y}" r="14" fill="${color}" stroke="#111315" stroke-width="2"/>
          <text x="${x}" y="${y + 4}" text-anchor="middle" font-size="10" font-weight="700" fill="#111315">${escapeXml(label)}</text>
          <text x="${x}" y="${y + 26}" text-anchor="middle" font-size="9" fill="#aebbae">${escapeXml(node.nodeId)}</text>
        </g>`;
    })
    .join('');

  const pipeLines = nodes
    .filter((node) => node.role === 'qdn')
    .map((node) => {
      const nido = nodes.find((n) => n.role === 'nido');
      if (!nido) return '';
      const a = project(nido.coordinates);
      const b = project(node.coordinates);
      return `<line x1="${a.x}" y1="${a.y}" x2="${b.x}" y2="${b.y}" stroke="#92ccff" stroke-width="1.5" stroke-dasharray="6 4" opacity="0.7"/>`;
    })
    .join('');

  const centroid = polygonCentroid(coords);
  const scaleBarM = Math.max(10, Math.round((100 / scale) / 10) * 10);
  const scaleBarPx = scaleBarM * scale;
  const scaleX = width - 120;
  const scaleY = height - 48;

  const selected = output?.selectedAlternative;
  const usefulHa = inputs?.terrain?.usefulAreaHa ?? 0;
  const grossHa = inputs?.terrain?.grossAreaHa ?? 0;

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">
  <defs>
    <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
      <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#25282b" stroke-width="1"/>
    </pattern>
  </defs>
  <rect width="100%" height="100%" fill="#111315"/>
  <rect x="24" y="24" width="${width - 48}" height="${height - 48}" fill="url(#grid)" stroke="#2c3034" stroke-width="2"/>
  ${polygonPoints ? `<polygon points="${polygonPoints}" fill="rgba(192,132,252,0.12)" stroke="#c084fc" stroke-width="2"/>` : ''}
  ${pipeLines}
  ${nodeMarks}
  <g class="title-block" transform="translate(48, 48)">
    <rect width="320" height="120" fill="#17191c" stroke="#54e98a" stroke-width="1.5" rx="6"/>
    <text x="16" y="28" fill="#54e98a" font-size="11" font-weight="700" letter-spacing="2">QHIRO QDE · PLANO DE DESPLIEGUE</text>
    <text x="16" y="52" fill="#e2e2e5" font-size="16" font-weight="700">${escapeXml(projectName || 'Plano sin título')}</text>
    <text x="16" y="72" fill="#aebbae" font-size="11">${escapeXml(versionLabel ?? 'borrador')} · ${escapeXml(inputs?.terrain?.name ?? 'Terreno')}</text>
    <text x="16" y="92" fill="#aebbae" font-size="11">Área útil ${usefulHa} ha · bruta ${grossHa} ha</text>
    <text x="16" y="110" fill="#aebbae" font-size="11">${selected ? `Alt. ${selected.alternativeId} · ${selected.totalNodes} nodos · US$${selected.capexUsd.toLocaleString()}` : 'Sin alternativa seleccionada'}</text>
  </g>
  <g transform="translate(${scaleX}, ${scaleY})">
    <line x1="0" y1="0" x2="${scaleBarPx}" y2="0" stroke="#e2e2e5" stroke-width="3"/>
    <line x1="0" y1="-6" x2="0" y2="6" stroke="#e2e2e5" stroke-width="2"/>
    <line x1="${scaleBarPx}" y1="-6" x2="${scaleBarPx}" y2="6" stroke="#e2e2e5" stroke-width="2"/>
    <text x="${scaleBarPx / 2}" y="18" text-anchor="middle" fill="#aebbae" font-size="10">${scaleBarM} m</text>
  </g>
  <g transform="translate(48, ${height - 80})">
    ${Object.entries(roleLabels)
      .map(([role, meta], index) => {
        const x = index * 140;
        const color = ROLE_COLORS[role] ?? meta.color;
        return `<g transform="translate(${x}, 0)"><rect width="12" height="12" fill="${color}" rx="2"/><text x="18" y="10" fill="#aebbae" font-size="10">${escapeXml(meta.label)}</text></g>`;
      })
      .join('')}
  </g>
  ${centroid ? `<text x="${width - 48}" y="48" text-anchor="end" fill="#7f8b80" font-size="10">Generado ${new Date().toLocaleString('es-DO')}</text>` : ''}
</svg>`;
}

export function downloadPlanSvg(payload) {
  const svg = buildPlanSvg(payload);
  const blob = new Blob([svg], { type: 'image/svg+xml;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${(payload.projectName || 'plano-qde').replace(/\s+/g, '-').toLowerCase()}.svg`;
  link.click();
  URL.revokeObjectURL(url);
}

export function downloadPlanPng(payload) {
  const svg = buildPlanSvg(payload);
  const url = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml;charset=utf-8' }));
  const image = new Image();
  image.onload = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 1120;
    canvas.height = 792;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#111315';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(image, 0, 0);
    canvas.toBlob((blob) => {
      if (!blob) return;
      const pngUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = pngUrl;
      link.download = `${(payload.projectName || 'plano-qde').replace(/\s+/g, '-').toLowerCase()}.png`;
      link.click();
      URL.revokeObjectURL(pngUrl);
    });
    URL.revokeObjectURL(url);
  };
  image.src = url;
}

export default function PlanExport({ projectName, inputs, output, versionLabel }) {
  if (!output?.deploymentNodes?.length) return null;

  const handlePrint = () => {
    const svg = buildPlanSvg({ projectName, inputs, output, versionLabel });
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;
    printWindow.document.write(`
      <!DOCTYPE html><html><head><title>Plano QDE</title>
      <style>body{margin:0;background:#fff;display:flex;justify-content:center}svg{max-width:100%;height:auto}</style>
      </head><body>${svg}</body></html>`);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
  };

  return (
    <div className="plan-export">
      <button type="button" className="btn btn-secondary" onClick={() => downloadPlanSvg({ projectName, inputs, output, versionLabel })}>
        <span className="material-symbols-outlined">download</span>
        Descargar SVG
      </button>
      <button type="button" className="btn btn-secondary" onClick={() => downloadPlanPng({ projectName, inputs, output, versionLabel })}>
        <span className="material-symbols-outlined">image</span>
        Descargar PNG
      </button>
      <button type="button" className="btn btn-secondary" onClick={handlePrint}>
        <span className="material-symbols-outlined">print</span>
        Imprimir / PDF
      </button>
    </div>
  );
}
