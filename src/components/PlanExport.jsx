import { jsPDF } from 'jspdf';
import { roleLabels } from '../data/glossary.js';
import { polygonBounds } from '../utils/geo.js';

const ROLE_COLORS = { nido: '#169c55', qdn: '#2185d0', cabecilla: '#8b3fb0', peon: '#d19d00' };
const ROLE_DESCRIPTIONS = {
  nido: 'Centro de bombeo, control, alimentación y comunicación.',
  qdn: 'Nodo derivado de refuerzo hidráulico y de control.',
  cabecilla: 'Centinela con percepción avanzada y aspersión.',
  peon: 'Centinela de aspersión para ampliar cobertura.',
};

function projectToCanvas(points, x, y, width, height, padding = 8) {
  const bounds = polygonBounds(points);
  if (!bounds) return { project: () => ({ x: x + width / 2, y: y + height / 2 }) };
  const latSpan = bounds.maxLat - bounds.minLat || 0.0001;
  const lngSpan = bounds.maxLng - bounds.minLng || 0.0001;
  const scale = Math.min((width - padding * 2) / lngSpan, (height - padding * 2) / latSpan);
  return { project: (point) => ({ x: x + padding + (point.lng - bounds.minLng) * scale, y: y + height - padding - (point.lat - bounds.minLat) * scale }) };
}

function escapeXml(value) {
  return String(value ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function safeFileName(projectName) {
  return (projectName || 'plano-qde').trim().replace(/[^a-z0-9_-]+/gi, '-').toLowerCase();
}

function svgDeviceMark(node, point) {
  const color = ROLE_COLORS[node.role] ?? '#64748b';
  const label = roleLabels[node.role]?.short ?? '?';
  const { x, y } = point;
  const shapes = {
    nido: `<rect x="${x - 12}" y="${y - 9}" width="24" height="18" rx="3" fill="${color}" stroke="#111827" stroke-width="1.5"/>`,
    qdn: `<path d="M ${x} ${y - 12} L ${x + 12} ${y} L ${x} ${y + 12} L ${x - 12} ${y} Z" fill="${color}" stroke="#111827" stroke-width="1.5"/>`,
    cabecilla: `<path d="M ${x} ${y - 12} L ${x + 12} ${y + 10} L ${x - 12} ${y + 10} Z" fill="${color}" stroke="#111827" stroke-width="1.5"/>`,
    peon: `<circle cx="${x}" cy="${y}" r="10" fill="${color}" stroke="#111827" stroke-width="1.5"/>`,
  };
  return `<g data-role="${escapeXml(node.role)}">${shapes[node.role] ?? shapes.peon}<text x="${x}" y="${y + 4}" text-anchor="middle" font-size="10" font-weight="700" fill="#111827">${escapeXml(label)}</text><text x="${x}" y="${y + 23}" text-anchor="middle" font-size="8" fill="#334155">${escapeXml(node.nodeId)}</text></g>`;
}

export function buildPlanSvg({ projectName, inputs, output, versionLabel }) {
  const coords = inputs?.terrain?.coordinates ?? [];
  const nodes = output?.deploymentNodes ?? [];
  const allPoints = [...coords, ...nodes.map((node) => node.coordinates)];
  const width = 1120;
  const height = 792;
  // Keep the drawing area independent from the document header. A title box
  // over the plot can hide devices located near the upper-left boundary.
  const { project } = projectToCanvas(allPoints.length ? allPoints : [{ lat: 18.807, lng: -69.784 }], 48, 184, width - 96, height - 260, 48);
  const polygonPoints = coords.length >= 3 ? coords.map((point) => { const p = project(point); return `${p.x},${p.y}`; }).join(' ') : '';
  const nido = nodes.find((node) => node.role === 'nido');
  const pipeLines = nido ? nodes.filter((node) => node.role === 'qdn').map((node) => { const a = project(nido.coordinates); const b = project(node.coordinates); return `<line x1="${a.x}" y1="${a.y}" x2="${b.x}" y2="${b.y}" stroke="#2185d0" stroke-width="2" stroke-dasharray="8 5"/>`; }).join('') : '';
  const selected = output?.selectedAlternative;
  return `<?xml version="1.0" encoding="UTF-8"?><svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}"><defs><pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse"><path d="M 40 0 L 0 0 0 40" fill="none" stroke="#e2e8f0" stroke-width="1"/></pattern></defs><rect width="100%" height="100%" fill="#ffffff"/><g transform="translate(48, 30)"><rect width="370" height="112" fill="#ffffff" stroke="#169c55" stroke-width="1.5" rx="4"/><text x="16" y="24" fill="#169c55" font-size="11" font-weight="700" letter-spacing="1.5">QHIRO QDE · PLANO DE DESPLIEGUE</text><text x="16" y="48" fill="#111827" font-size="17" font-weight="700">${escapeXml(projectName || 'Plano sin título')}</text><text x="16" y="69" fill="#475569" font-size="11">${escapeXml(versionLabel ?? 'borrador')} · ${escapeXml(inputs?.terrain?.name ?? 'Terreno')}</text><text x="16" y="88" fill="#475569" font-size="11">Área útil ${inputs?.terrain?.usefulAreaHa ?? 0} ha · bruta ${inputs?.terrain?.grossAreaHa ?? 0} ha</text><text x="16" y="105" fill="#475569" font-size="11">${selected ? `Alt. ${selected.alternativeId} · ${selected.totalNodes} nodos · US$${selected.capexUsd.toLocaleString()}` : 'Sin alternativa seleccionada'}</text></g><rect x="24" y="160" width="${width - 48}" height="${height - 212}" fill="url(#grid)" stroke="#334155" stroke-width="2"/>${polygonPoints ? `<polygon points="${polygonPoints}" fill="#eefbf1" stroke="#169c55" stroke-width="2.5"/>` : ''}${pipeLines}${nodes.map((node) => svgDeviceMark(node, project(node.coordinates))).join('')}<g transform="translate(48, ${height - 30})">${Object.entries(roleLabels).map(([role, meta], i) => `<g transform="translate(${i * 180}, 0)"><rect width="12" height="12" fill="${ROLE_COLORS[role] ?? meta.color}" rx="2"/><text x="18" y="10" fill="#334155" font-size="11">${escapeXml(meta.label)}</text></g>`).join('')}</g></svg>`;
}

function drawSymbol(pdf, role, x, y, size = 3.2) {
  pdf.setDrawColor('#111827'); pdf.setFillColor(ROLE_COLORS[role] ?? '#64748b'); pdf.setLineWidth(0.45);
  if (role === 'nido') pdf.roundedRect(x - size, y - size * 0.72, size * 2, size * 1.44, 0.7, 0.7, 'FD');
  else if (role === 'cabecilla') pdf.triangle(x, y - size, x + size, y + size * 0.85, x - size, y + size * 0.85, 'FD');
  else if (role === 'qdn') pdf.lines([[size, size], [-size, size], [-size, -size], [size, -size]], x, y - size, [1, 1], 'FD', true);
  else pdf.circle(x, y, size * 0.82, 'FD');
  pdf.setTextColor('#111827'); pdf.setFont('helvetica', 'bold'); pdf.setFontSize(5.8);
  pdf.text(roleLabels[role]?.short ?? '?', x, y + 1.8, { align: 'center' });
}

function drawClosedPath(pdf, points, style) {
  if (points.length < 3) return;
  const first = points[0];
  pdf.lines(points.slice(1).map((point, index) => [point.x - points[index].x, point.y - points[index].y]), first.x, first.y, [1, 1], style, true);
}

function drawPlanPage(pdf, payload) {
  const { projectName, inputs, output, versionLabel } = payload;
  const coords = inputs?.terrain?.coordinates ?? [];
  const nodes = output?.deploymentNodes ?? [];
  const allPoints = [...coords, ...nodes.map((node) => node.coordinates)];
  const frame = { x: 10, y: 12, width: 277, height: 186 };
  const plot = { x: 15, y: 47, width: 267, height: 143 };
  const { project } = projectToCanvas(allPoints.length ? allPoints : [{ lat: 18.807, lng: -69.784 }], plot.x, plot.y, plot.width, plot.height, 10);
  pdf.setDrawColor('#334155'); pdf.setLineWidth(0.45); pdf.rect(frame.x, frame.y, frame.width, frame.height);
  pdf.setTextColor('#169c55'); pdf.setFont('helvetica', 'bold'); pdf.setFontSize(9); pdf.text('QHIRO QDE · PLANO DE DESPLIEGUE', 16, 21);
  pdf.setTextColor('#111827'); pdf.setFontSize(14); pdf.text(projectName || 'Plano sin título', 16, 29);
  pdf.setFont('helvetica', 'normal'); pdf.setTextColor('#475569'); pdf.setFontSize(8); pdf.text(`${versionLabel ?? 'Borrador'} · ${inputs?.terrain?.name ?? 'Terreno'}`, 16, 35); pdf.text(`Área útil: ${inputs?.terrain?.usefulAreaHa ?? 0} ha · Área bruta: ${inputs?.terrain?.grossAreaHa ?? 0} ha`, 16, 40);
  pdf.setDrawColor('#cbd5e1'); pdf.rect(plot.x, plot.y, plot.width, plot.height); pdf.setDrawColor('#e2e8f0'); pdf.setLineWidth(0.15);
  for (let x = plot.x + 10; x < plot.x + plot.width; x += 10) pdf.line(x, plot.y, x, plot.y + plot.height);
  for (let y = plot.y + 10; y < plot.y + plot.height; y += 10) pdf.line(plot.x, y, plot.x + plot.width, y);
  const polygon = coords.map(project);
  if (polygon.length >= 3) { pdf.setDrawColor('#169c55'); pdf.setFillColor('#eefbf1'); pdf.setLineWidth(0.65); drawClosedPath(pdf, polygon, 'FD'); }
  const nido = nodes.find((node) => node.role === 'nido');
  if (nido) { const nidoPoint = project(nido.coordinates); pdf.setDrawColor('#2185d0'); pdf.setLineWidth(0.35); pdf.setLineDashPattern([2, 1.5], 0); nodes.filter((node) => node.role === 'qdn').forEach((node) => { const point = project(node.coordinates); pdf.line(nidoPoint.x, nidoPoint.y, point.x, point.y); }); pdf.setLineDashPattern([], 0); }
  nodes.forEach((node) => { const point = project(node.coordinates); drawSymbol(pdf, node.role, point.x, point.y); });
  pdf.setTextColor('#475569'); pdf.setFontSize(6.8); pdf.text('Página 1 de 2 · Distribución calculada por QDE', 282, 195, { align: 'right' });
}

function drawReferencePage(pdf, payload) {
  const { inputs, output, projectName, versionLabel } = payload;
  const selected = output?.selectedAlternative;
  const counts = (output?.deploymentNodes ?? []).reduce((result, node) => ({ ...result, [node.role]: (result[node.role] ?? 0) + 1 }), {});
  pdf.addPage('a4', 'landscape'); pdf.setTextColor('#169c55'); pdf.setFont('helvetica', 'bold'); pdf.setFontSize(14); pdf.text('QHIRO QDE · LEYENDA Y ESPECIFICACIONES', 14, 18); pdf.setTextColor('#475569'); pdf.setFont('helvetica', 'normal'); pdf.setFontSize(8); pdf.text(`${projectName || 'Plano sin título'} · ${versionLabel ?? 'Borrador'}`, 14, 24);
  pdf.setDrawColor('#cbd5e1'); pdf.roundedRect(14, 31, 128, 68, 2, 2, 'S'); pdf.roundedRect(155, 31, 128, 68, 2, 2, 'S'); pdf.setTextColor('#111827'); pdf.setFont('helvetica', 'bold'); pdf.setFontSize(10); pdf.text('Datos del expediente', 20, 40); pdf.text('Resultado calculado', 161, 40); pdf.setFont('helvetica', 'normal'); pdf.setFontSize(8);
  const inputRows = [['Terreno', inputs?.terrain?.name ?? '—'], ['Área útil', `${inputs?.terrain?.usefulAreaHa ?? 0} ha`], ['Cultivo', inputs?.crop?.species ?? '—'], ['Misión', inputs?.crop?.mission ?? '—'], ['Radio agronómico', `${inputs?.sprayProfile?.ra ?? 0} m`], ['Cobertura mínima', `${inputs?.constraints?.minCoveragePct ?? 0}%`]];
  const outputRows = [['Alternativa', selected ? selected.alternativeId : 'No factible'], ['Cobertura', selected ? `${selected.coveragePct}%` : '—'], ['CAPEX', selected ? `US$${selected.capexUsd.toLocaleString()}` : '—'], ['Caudal pico', `${output?.hydraulicSummary?.peakFlowLpm ?? 0} L/min`], ['Presión terminal', `${output?.hydraulicSummary?.terminalPressureBar ?? 0} bar`], ['Voltaje mínimo', output?.energySummary ? `${output.energySummary.worstVoltageV} V` : '—']];
  inputRows.forEach(([label, value], index) => { const y = 49 + index * 7.4; pdf.setTextColor('#64748b'); pdf.text(label, 20, y); pdf.setTextColor('#111827'); pdf.text(String(value), 76, y); });
  outputRows.forEach(([label, value], index) => { const y = 49 + index * 7.4; pdf.setTextColor('#64748b'); pdf.text(label, 161, y); pdf.setTextColor('#111827'); pdf.text(String(value), 217, y); });
  pdf.setTextColor('#111827'); pdf.setFont('helvetica', 'bold'); pdf.setFontSize(10); pdf.text('Leyenda de dispositivos', 14, 112);
  Object.keys(roleLabels).forEach((role, index) => { const y = 124 + index * 15; drawSymbol(pdf, role, 21, y - 2, 4); pdf.setTextColor('#111827'); pdf.setFont('helvetica', 'bold'); pdf.setFontSize(9); pdf.text(`${roleLabels[role].label} · ${counts[role] ?? 0}`, 31, y); pdf.setTextColor('#475569'); pdf.setFont('helvetica', 'normal'); pdf.setFontSize(8); pdf.text(ROLE_DESCRIPTIONS[role], 79, y); });
  pdf.setDrawColor('#cbd5e1'); pdf.roundedRect(155, 111, 128, 72, 2, 2, 'S'); pdf.setTextColor('#111827'); pdf.setFont('helvetica', 'bold'); pdf.setFontSize(10); pdf.text('Presupuesto', 161, 121); pdf.setFont('helvetica', 'normal'); pdf.setFontSize(8);
  (output?.budgetBreakdown?.lines ?? []).slice(0, 6).forEach((line, index) => { const y = 130 + index * 7.5; pdf.setTextColor('#475569'); pdf.text(`${line.item} × ${line.quantity}`, 161, y); pdf.setTextColor('#111827'); pdf.text(`US$${line.subtotalUsd.toLocaleString()}`, 277, y, { align: 'right' }); });
  if (output?.budgetBreakdown) { pdf.setDrawColor('#cbd5e1'); pdf.line(161, 176, 277, 176); pdf.setFont('helvetica', 'bold'); pdf.setTextColor('#111827'); pdf.text('TOTAL CAPEX', 161, 181); pdf.text(`US$${output.budgetBreakdown.totalUsd.toLocaleString()}`, 277, 181, { align: 'right' }); }
  pdf.setTextColor('#475569'); pdf.setFont('helvetica', 'normal'); pdf.setFontSize(6.8); pdf.text('Página 2 de 2 · Símbolos y especificaciones de instalación', 282, 195, { align: 'right' });
}

export function downloadPlanPdf(payload) {
  const pdf = new jsPDF({ orientation: 'landscape', unit: 'mm', format: 'a4', compress: true });
  drawPlanPage(pdf, payload); drawReferencePage(pdf, payload); pdf.save(`${safeFileName(payload.projectName)}.pdf`);
}

export function downloadPlanSvg(payload) {
  const blob = new Blob([buildPlanSvg(payload)], { type: 'image/svg+xml;charset=utf-8' }); const url = URL.createObjectURL(blob); const link = document.createElement('a'); link.href = url; link.download = `${safeFileName(payload.projectName)}.svg`; link.click(); URL.revokeObjectURL(url);
}

export function downloadPlanPng(payload) {
  const url = URL.createObjectURL(new Blob([buildPlanSvg(payload)], { type: 'image/svg+xml;charset=utf-8' })); const image = new Image();
  image.onload = () => { const canvas = document.createElement('canvas'); canvas.width = 2240; canvas.height = 1584; const ctx = canvas.getContext('2d'); ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, canvas.width, canvas.height); ctx.drawImage(image, 0, 0, canvas.width, canvas.height); canvas.toBlob((blob) => { if (!blob) return; const pngUrl = URL.createObjectURL(blob); const link = document.createElement('a'); link.href = pngUrl; link.download = `${safeFileName(payload.projectName)}.png`; link.click(); URL.revokeObjectURL(pngUrl); }, 'image/png'); URL.revokeObjectURL(url); }; image.src = url;
}

export default function PlanExport({ projectName, inputs, output, versionLabel }) {
  if (!output?.deploymentNodes?.length) return null;
  const payload = { projectName, inputs, output, versionLabel };
  return <div className="plan-export"><button type="button" className="btn btn-primary" onClick={() => downloadPlanPdf(payload)}><span className="material-symbols-outlined">picture_as_pdf</span>Descargar PDF</button><button type="button" className="btn btn-secondary" onClick={() => downloadPlanPng(payload)}><span className="material-symbols-outlined">image</span>Descargar imagen</button><button type="button" className="btn btn-secondary" onClick={() => downloadPlanSvg(payload)}><span className="material-symbols-outlined">download</span>SVG vectorial</button></div>;
}
