export const qdeGlossary = {
  terrainName: {
    label: 'Nombre del terreno',
    help: 'Identificador legible de la finca o lote que aparecerá en el plano y reportes.',
  },
  grossAreaHa: {
    label: 'Área bruta (ha)',
    help: 'Superficie total del polígono antes de restar caminos, drenajes o zonas prohibidas.',
  },
  usefulAreaHa: {
    label: 'Área útil (ha)',
    help: 'Hectáreas donde sí se puede instalar y asperjar. Es la base del dimensionamiento.',
  },
  species: {
    label: 'Cultivo',
    help: 'Especie agrícola. Condiciona altura del dosel, misión y perfil de aspersión compatible.',
  },
  stage: {
    label: 'Etapa',
    help: 'Fase del cultivo (plántula, desarrollo, adulto). Afecta oclusión y altura de aplicación.',
  },
  canopyHeightM: {
    label: 'Altura dosel (m)',
    help: 'Altura de referencia del cultivo para calcular alcance y obstáculos.',
  },
  mission: {
    label: 'Misión',
    help: 'Objetivo de la aplicación (preventiva, correctiva, fertirrigación, etc.).',
  },
  ra: {
    label: 'R_a — Radio agronómico (m)',
    help: 'Distancia efectiva de aspersión bajo ensayo. No es la última gota visible: incluye dosis y uniformidad.',
  },
  fo: {
    label: 'F_o — Solapamiento (0–1)',
    help: 'Fracción de solapamiento entre círculos de cobertura. Ej.: 0.25 = 25%. Evita huecos.',
  },
  pa: {
    label: 'P_a — Presión en boquilla (bar)',
    help: 'Presión dinámica calificada en la boquilla según el perfil de ensayo.',
  },
  qa: {
    label: 'Q_a — Caudal (L/min)',
    help: 'Litros por minuto por cabezal. Limita cuántos nodos pueden operar a la vez.',
  },
  minCoveragePct: {
    label: 'Cobertura mínima (%)',
    help: 'Restricción dura: el diseño se descarta si queda por debajo de este porcentaje.',
  },
  maxSimultaneousHeads: {
    label: 'Máx. cabezales simultáneos',
    help: 'Cuántos Centinelas pueden asperjar al mismo tiempo sin perder presión ni caudal.',
  },
  minTerminalPressureBar: {
    label: 'Presión terminal mínima (bar)',
    help: 'Presión mínima que debe llegar al punto hidráulico más desfavorable.',
  },
  nidoUsd: {
    label: 'El Nido (US$)',
    help: 'Estación central: mezcla, bombeo, comunicación y autorización. Uno por proyecto.',
  },
  cabecillaUsd: {
    label: 'Cabecilla (US$)',
    help: 'Centinela con percepción avanzada y aspersión. Vigila y ejecuta en puntos críticos.',
  },
  peonUsd: {
    label: 'Peón / Aspersor (US$)',
    help: 'Centinela de ejecución sin cámaras avanzadas. Amplía cobertura a menor costo.',
  },
  qdnUsd: {
    label: 'QDN (US$)',
    help: 'Nodo derivado subordinado para presión o dosificación. No es un segundo cerebro.',
  },
  pipePerMeterUsd: {
    label: 'Tubería (US$/m)',
    help: 'Costo estimado por metro de tubería principal del trazado hidráulico.',
  },
  installPerNodeUsd: {
    label: 'Instalación por Centinela (US$)',
    help: 'Mano de obra y puesta en campo por cada torre instalada.',
  },
  peonEffectiveRadiusM: {
    label: 'Radio efectivo Peón (m)',
    help: 'Alcance real de aspersión del Peón. Debe solaparse con vecinos para cubrir todo el polígono.',
  },
  cabecillaEffectiveRadiusM: {
    label: 'Radio efectivo Cabecilla (m)',
    help: 'Alcance de percepción y aspersión de la Cabecilla. Suele ser igual o mayor que el Peón.',
  },
  nidoPumpMaxFlowLpm: {
    label: 'Caudal máximo Nido (L/min)',
    help: 'Capacidad de bombeo del Nido. Limita cuántos cabezales pueden operar simultáneamente.',
  },
  nidoControlRadiusM: {
    label: 'Radio de control del Nido (m)',
    help: 'Distancia máxima a la que el Nido puede alimentar y coordinar Centinelas sin QDN.',
  },
  nidoSupplyVoltageV: {
    label: 'Voltaje de salida Nido (V)',
    help: 'Tensión eléctrica nominal que entrega el Nido a la red de Centinelas.',
  },
  minVoltageAtSentinelV: {
    label: 'Voltaje mínimo en Centinela (V)',
    help: 'Umbral bajo el cual un Centinela no opera de forma confiable por caída de tensión.',
  },
  electricalLossPctPer100m: {
    label: 'Pérdida eléctrica (%/100 m)',
    help: 'Caída de tensión estimada por cada 100 m de cableado desde el Nido.',
  },
  pipePressureLossBarPer100m: {
    label: 'Pérdida presión tubería (bar/100 m)',
    help: 'Caída de presión hidráulica por cada 100 m de tubería principal.',
  },
  maxHydraulicReachM: {
    label: 'Alcance hidráulico máximo (m)',
    help: 'Distancia máxima de tubería antes de requerir un QDN de refuerzo.',
  },
  maxSentinelsPerNido: {
    label: 'Máx. Centinelas por Nido',
    help: 'Límite total de Cabecillas y Peones que el único Nido del proyecto puede alimentar y coordinar.',
  },
  maxCabecillasPerNido: {
    label: 'Máx. Cabecillas por Nido',
    help: 'Límite de Centinelas con percepción avanzada que puede atender el Nido.',
  },
  maxPeonesPerNido: {
    label: 'Máx. Peones por Nido',
    help: 'Límite de Centinelas de ejecución que puede atender el Nido.',
  },
};

export const roleLabels = {
  nido: { label: 'El Nido', color: '#f59e0b', short: 'N' },
  qdn: { label: 'QDN', color: '#3b82f6', short: 'Q' },
  cabecilla: { label: 'Cabecilla', color: '#c084fc', short: 'C' },
  peon: { label: 'Peón', color: '#22c55e', short: 'P' },
};
