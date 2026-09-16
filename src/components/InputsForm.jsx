import { qdeGlossary } from '../data/glossary.js';
import FieldHint from './FieldHint.jsx';

export default function InputsForm({ inputs, onChange, terrainFromMap = false, invalidFields = [] }) {
  const numericValue = (value) => (value === '' ? '' : Number(value));
  const fieldClass = (field) => `field${invalidFields.includes(field) ? ' field--invalid' : ''}`;
  const update = (section, key, value) => {
    onChange({
      ...inputs,
      [section]: { ...inputs[section], [key]: value },
    });
  };

  if (!inputs) return null;

  return (
    <div className="form-grid form-grid--6">
      <details className="glossary-box" style={{ gridColumn: '1 / -1' }}>
        <summary>Glosario rápido — qué significa cada dato</summary>
        <p>
          Pasa el cursor sobre <strong>?</strong> en cada campo para ver la explicación. Los
          símbolos R_a, F_o, P_a y Q_a vienen del documento técnico QDE.
        </p>
      </details>

      <label className={fieldClass('terrain.name')} style={{ gridColumn: '1 / -1' }}>
        <FieldHint term={qdeGlossary.terrainName} />
        <input
          value={inputs.terrain.name}
          onChange={(e) => update('terrain', 'name', e.target.value)}
        />
      </label>
      <label className={fieldClass('terrain.grossAreaHa')}>
        <FieldHint term={qdeGlossary.grossAreaHa} />
        <input
          type="number"
          step="0.01"
          value={inputs.terrain.grossAreaHa}
          onChange={(e) => update('terrain', 'grossAreaHa', numericValue(e.target.value))}
        />
        {terrainFromMap ? <span className="field-note">Calculado del mapa — editable</span> : null}
      </label>
      <label className={fieldClass('terrain.usefulAreaHa')}>
        <FieldHint term={qdeGlossary.usefulAreaHa} />
        <input
          type="number"
          step="0.01"
          value={inputs.terrain.usefulAreaHa}
          onChange={(e) => update('terrain', 'usefulAreaHa', numericValue(e.target.value))}
        />
        {terrainFromMap ? <span className="field-note">Calculado del mapa — editable</span> : null}
      </label>
      <label className={fieldClass('crop.species')}>
        <FieldHint term={qdeGlossary.species} />
        <input
          value={inputs.crop.species}
          onChange={(e) => update('crop', 'species', e.target.value)}
        />
      </label>
      <label className={fieldClass('crop.stage')}>
        <FieldHint term={qdeGlossary.stage} />
        <input value={inputs.crop.stage} onChange={(e) => update('crop', 'stage', e.target.value)} />
      </label>
      <label className={fieldClass('crop.canopyHeightM')}>
        <FieldHint term={qdeGlossary.canopyHeightM} />
        <input
          type="number"
          step="0.1"
          value={inputs.crop.canopyHeightM}
          onChange={(e) => update('crop', 'canopyHeightM', numericValue(e.target.value))}
        />
      </label>
      <label className={fieldClass('crop.mission')}>
        <FieldHint term={qdeGlossary.mission} />
        <input
          value={inputs.crop.mission}
          onChange={(e) => update('crop', 'mission', e.target.value)}
        />
      </label>
      <label className={fieldClass('sprayProfile.ra')}>
        <FieldHint term={qdeGlossary.ra} />
        <input
          type="number"
          step="0.1"
          value={inputs.sprayProfile.ra}
          onChange={(e) =>
            onChange({
              ...inputs,
              sprayProfile: { ...inputs.sprayProfile, ra: numericValue(e.target.value) },
            })
          }
        />
      </label>
      <label className={fieldClass('sprayProfile.fo')}>
        <FieldHint term={qdeGlossary.fo} />
        <input
          type="number"
          step="0.01"
          value={inputs.sprayProfile.fo}
          onChange={(e) =>
            onChange({
              ...inputs,
              sprayProfile: { ...inputs.sprayProfile, fo: numericValue(e.target.value) },
            })
          }
        />
      </label>
      <label className={fieldClass('sprayProfile.pa')}>
        <FieldHint term={qdeGlossary.pa} />
        <input
          type="number"
          step="0.1"
          value={inputs.sprayProfile.pa}
          onChange={(e) =>
            onChange({
              ...inputs,
              sprayProfile: { ...inputs.sprayProfile, pa: numericValue(e.target.value) },
            })
          }
        />
      </label>
      <label className={fieldClass('sprayProfile.qa')}>
        <FieldHint term={qdeGlossary.qa} />
        <input
          type="number"
          step="0.1"
          value={inputs.sprayProfile.qa}
          onChange={(e) =>
            onChange({
              ...inputs,
              sprayProfile: { ...inputs.sprayProfile, qa: numericValue(e.target.value) },
            })
          }
        />
      </label>
      <label className={fieldClass('constraints.minCoveragePct')}>
        <FieldHint term={qdeGlossary.minCoveragePct} />
        <input
          type="number"
          value={inputs.constraints.minCoveragePct}
          onChange={(e) =>
            onChange({
              ...inputs,
              constraints: { ...inputs.constraints, minCoveragePct: numericValue(e.target.value) },
            })
          }
        />
      </label>
      <label className={fieldClass('constraints.maxSimultaneousHeads')}>
        <FieldHint term={qdeGlossary.maxSimultaneousHeads} />
        <input
          type="number"
          value={inputs.constraints.maxSimultaneousHeads}
          onChange={(e) =>
            onChange({
              ...inputs,
              constraints: {
                ...inputs.constraints,
                maxSimultaneousHeads: numericValue(e.target.value),
              },
            })
          }
        />
      </label>
      <label className={fieldClass('constraints.minTerminalPressureBar')} style={{ gridColumn: '1 / -1' }}>
        <FieldHint term={qdeGlossary.minTerminalPressureBar} />
        <input
          type="number"
          step="0.1"
          value={inputs.constraints.minTerminalPressureBar}
          onChange={(e) =>
            onChange({
              ...inputs,
              constraints: {
                ...inputs.constraints,
                minTerminalPressureBar: numericValue(e.target.value),
              },
            })
          }
        />
      </label>
    </div>
  );
}
