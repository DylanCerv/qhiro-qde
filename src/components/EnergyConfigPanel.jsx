import { qdeGlossary } from '../data/glossary.js';
import FieldHint from './FieldHint.jsx';

const defaultEnergy = {
  peonEffectiveRadiusM: 12,
  cabecillaEffectiveRadiusM: 12,
  nidoPumpMaxFlowLpm: 120,
  nidoControlRadiusM: 450,
  nidoSupplyVoltageV: 48,
  minVoltageAtSentinelV: 42,
  electricalLossPctPer100m: 2.5,
  pipePressureLossBarPer100m: 0.35,
  maxHydraulicReachM: 380,
};

export function mergeEnergyConfig(energy, sprayRa = 12) {
  return {
    ...defaultEnergy,
    peonEffectiveRadiusM: sprayRa,
    cabecillaEffectiveRadiusM: sprayRa,
    ...energy,
  };
}

export default function EnergyConfigPanel({ inputs, onChange, readOnly = false, embedded = false }) {
  if (!inputs) return null;

  const energy = mergeEnergyConfig(inputs.energy, inputs.sprayProfile?.ra);

  const updateEnergy = (key, value) => {
    onChange({
      ...inputs,
      energy: {
        ...energy,
        [key]: Number(value) || 0,
      },
    });
  };

  const syncRadiiFromSpray = () => {
    const ra = inputs.sprayProfile.ra;
    onChange({
      ...inputs,
      energy: {
        ...energy,
        peonEffectiveRadiusM: ra,
        cabecillaEffectiveRadiusM: ra,
      },
    });
  };

  const fields = [
    ['peonEffectiveRadiusM', qdeGlossary.peonEffectiveRadiusM],
    ['cabecillaEffectiveRadiusM', qdeGlossary.cabecillaEffectiveRadiusM],
    ['nidoPumpMaxFlowLpm', qdeGlossary.nidoPumpMaxFlowLpm],
    ['nidoControlRadiusM', qdeGlossary.nidoControlRadiusM],
    ['nidoSupplyVoltageV', qdeGlossary.nidoSupplyVoltageV],
    ['minVoltageAtSentinelV', qdeGlossary.minVoltageAtSentinelV],
    ['electricalLossPctPer100m', qdeGlossary.electricalLossPctPer100m],
    ['pipePressureLossBarPer100m', qdeGlossary.pipePressureLossBarPer100m],
    ['maxHydraulicReachM', qdeGlossary.maxHydraulicReachM],
  ];

  const Wrapper = embedded ? 'div' : 'section';
  const wrapperClass = embedded ? 'plan-devices-section' : 'card card--flat';

  return (
    <Wrapper className={wrapperClass}>
      <div className="section-head">
        <div className="card__label" style={{ marginBottom: 0 }}>
          <span className="material-symbols-outlined">electrical_services</span>
          Energía, radio efectivo y red
        </div>
        <button type="button" className="btn btn-secondary" onClick={syncRadiiFromSpray} disabled={readOnly}>
          <span className="material-symbols-outlined">sync</span>
          Radios = R_a
        </button>
      </div>

      {!readOnly ? (
        <p className="result-summary" style={{ marginBottom: '1rem' }}>
          Define el radio efectivo de cada Centinela, la capacidad del Nido y las pérdidas de
          energía/presión. El motor usa estos valores para cubrir todo el polígono y validar que
          ningún equipo quede fuera de alcance.
        </p>
      ) : null}

      <div className="form-grid form-grid--2">
        {fields.map(([key, term]) => (
          <label key={key} className="field">
            <FieldHint term={term} />
            {readOnly ? (
              <div className="field-readonly">{energy[key]}</div>
            ) : (
              <input
                type="number"
                step="0.1"
                min="0"
                value={energy[key]}
                onChange={(e) => updateEnergy(key, e.target.value)}
              />
            )}
          </label>
        ))}
      </div>
    </Wrapper>
  );
}
