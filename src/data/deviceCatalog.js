import { qdeGlossary, roleLabels } from './glossary.js';

export const deviceRoster = [
  {
    id: 'nido',
    ...roleLabels.nido,
    title: 'El Nido',
    role: 'Cerebro del proyecto',
    description:
      'Estación central única: mezcla, bombeo, comunicación y autorización de misiones. Alimenta eléctrica e hidráulicamente a la red de Centinelas dentro de su radio de control.',
    capexKey: 'nidoUsd',
    radiusKey: 'nidoControlRadiusM',
    radiusLabel: 'Radio de control',
  },
  {
    id: 'cabecilla',
    ...roleLabels.cabecilla,
    title: 'Cabecilla',
    role: 'Percepción + aspersión',
    description:
      'Centinela con cámaras avanzadas y aspersión. Se ubica en puntos críticos del perímetro o sectores lejanos para vigilar solapamiento y detectar anomalías.',
    capexKey: 'cabecillaUsd',
    radiusKey: 'cabecillaEffectiveRadiusM',
    radiusLabel: 'Radio efectivo',
  },
  {
    id: 'peon',
    ...roleLabels.peon,
    title: 'Peón / Aspersor',
    role: 'Ejecución de cobertura',
    description:
      'Centinela de ejecución sin cámaras avanzadas. Amplía la cobertura de aspersión a menor costo en malla hexagonal según R_a y solapamiento F_o.',
    capexKey: 'peonUsd',
    radiusKey: 'peonEffectiveRadiusM',
    radiusLabel: 'Radio efectivo',
  },
  {
    id: 'qdn',
    ...roleLabels.qdn,
    title: 'QDN',
    role: 'Refuerzo hidráulico',
    description:
      'Nodo derivado subordinado al Nido. Acerca presión y dosificación donde la tubería principal no alcanza el terminal crítico.',
    capexKey: 'qdnUsd',
    radiusKey: null,
    radiusLabel: null,
  },
];

export const capexConcepts = [
  { item: 'El Nido', glossary: qdeGlossary.nidoUsd, unit: '1 por proyecto', costKey: 'nidoUsd' },
  { item: 'Cabecilla', glossary: qdeGlossary.cabecillaUsd, unit: 'Por torre de percepción', costKey: 'cabecillaUsd' },
  { item: 'Peón / Aspersor', glossary: qdeGlossary.peonUsd, unit: 'Por torre de ejecución', costKey: 'peonUsd' },
  { item: 'QDN', glossary: qdeGlossary.qdnUsd, unit: 'Por nodo de refuerzo', costKey: 'qdnUsd' },
  { item: 'Tubería principal', glossary: qdeGlossary.pipePerMeterUsd, unit: 'Por metro lineal', costKey: 'pipePerMeterUsd' },
  { item: 'Instalación', glossary: qdeGlossary.installPerNodeUsd, unit: 'Por Centinela instalado', costKey: 'installPerNodeUsd' },
];

export function estimateQuickCapex({ usefulAreaHa, ra, fo, costs }) {
  const spacing = 2 * ra * (1 - fo);
  const baseNodes = Math.max(4, Math.ceil((usefulAreaHa * 10_000) / (Math.PI * ra * ra)));
  const cabecillas = Math.max(1, Math.round(baseNodes * 0.15));
  const peones = Math.max(0, baseNodes - cabecillas);
  const qdnCount = 1;
  const pipeM = 450;

  const total =
    costs.nidoUsd +
    cabecillas * costs.cabecillaUsd +
    peones * costs.peonUsd +
    qdnCount * costs.qdnUsd +
    pipeM * costs.pipePerMeterUsd +
    baseNodes * costs.installPerNodeUsd;

  return {
    spacingM: Number(spacing.toFixed(1)),
    baseNodes,
    cabecillas,
    peones,
    qdnCount,
    totalUsd: Math.round(total),
    costPerHa: usefulAreaHa > 0 ? Math.round(total / usefulAreaHa) : 0,
  };
}
