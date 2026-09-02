import { qdeGlossary } from '../data/glossary.js';
import FieldHint from './FieldHint.jsx';

export default function InputsForm({ inputs, onChange, terrainFromMap = false }) {
  const update = (section, key, value) => {
    onChange({
      ...inputs,
      [section]: { ...inputs[section], [key]: value },
    });
  };

  if (!inputs) return null;

  return (
    <div className="form-grid form-grid--2">
      <details className="glossary-box" style={{ gridColumn: '1 / -1' }} open>
        <summary>Glosario rápido — qué significa cada dato</summary>
        <p>
          Pasa el cursor sobre <strong>?</strong> en cada campo para ver la explicación. Los
          símbolos R_a, F_o, P_a y Q_a vienen del documento técnico QDE.
        </p>
      </details>

      <label className="field" style={{ gridColumn: '1 / -1' }}>
        <FieldHint term={qdeGlossary.terrainName} />
        <input
          value={inputs.terrain.name}
          onChange={(e) => update('terrain', 'name', e.target.value)}
        />
      </label>
      <label className="field">
        <FieldHint term={qdeGlossary.grossAreaHa} />
        <input
          type="number"
          step="0.01"
          value={inputs.terrain.grossAreaHa}
          onChange={(e) => update('terrain', 'grossAreaHa', Number(e.target.value))}
        />
        {terrainFromMap ? <span className="field-note">Calculado del mapa — editable</span> : null}
      </label>
      <label className="field">
        <FieldHint term={qdeGlossary.usefulAreaHa} />
        <input
          type="number"
          step="0.01"
          value={inputs.terrain.usefulAreaHa}
          onChange={(e) => update('terrain', 'usefulAreaHa', Number(e.target.value))}
        />
        {terrainFromMap ? <span className="field-note">Calculado del mapa — editable</span> : null}
      </label>
      <label className="field">
        <FieldHint term={qdeGlossary.species} />
        <input
          value={inputs.crop.species}
          onChange={(e) => update('crop', 'species', e.target.value)}
        />
      </label>
      <label className="field">
        <FieldHint term={qdeGlossary.stage} />
        <input value={inputs.crop.stage} onChange={(e) => update('crop', 'stage', e.target.value)} />
      </label>
      <label className="field">
        <FieldHint term={qdeGlossary.canopyHeightM} />
        <input
          type="number"
          step="0.1"
          value={inputs.crop.canopyHeightM}
          onChange={(e) => update('crop', 'canopyHeightM', Number(e.target.value))}
        />
      </label>
      <label className="field">
        <FieldHint term={qdeGlossary.mission} />
        <input
          value={inputs.crop.mission}
          onChange={(e) => update('crop', 'mission', e.target.value)}
        />
      </label>
      <label className="field">
        <FieldHint term={qdeGlossary.ra} />
        <input
          type="number"
          step="0.1"
          value={inputs.sprayProfile.ra}
          onChange={(e) =>
            onChange({
              ...inputs,
              sprayProfile: { ...inputs.sprayProfile, ra: Number(e.target.value) },
            })
          }
        />
      </label>
      <label className="field">
        <FieldHint term={qdeGlossary.fo} />
        <input
          type="number"
          step="0.01"
          value={inputs.sprayProfile.fo}
          onChange={(e) =>
            onChange({
              ...inputs,
              sprayProfile: { ...inputs.sprayProfile, fo: Number(e.target.value) },
            })
          }
        />
      </label>
      <label className="field">
        <FieldHint term={qdeGlossary.pa} />
        <input
          type="number"
          step="0.1"
          value={inputs.sprayProfile.pa}
          onChange={(e) =>
            onChange({
              ...inputs,
              sprayProfile: { ...inputs.sprayProfile, pa: Number(e.target.value) },
            })
          }
        />
      </label>
      <label className="field">
        <FieldHint term={qdeGlossary.qa} />
        <input
          type="number"
          step="0.1"
          value={inputs.sprayProfile.qa}
          onChange={(e) =>
            onChange({
              ...inputs,
              sprayProfile: { ...inputs.sprayProfile, qa: Number(e.target.value) },
            })
          }
        />
      </label>
      <label className="field">
        <FieldHint term={qdeGlossary.minCoveragePct} />
        <input
          type="number"
          value={inputs.constraints.minCoveragePct}
          onChange={(e) =>
            onChange({
              ...inputs,
              constraints: { ...inputs.constraints, minCoveragePct: Number(e.target.value) },
            })
          }
        />
      </label>
      <label className="field">
        <FieldHint term={qdeGlossary.maxSimultaneousHeads} />
        <input
          type="number"
          value={inputs.constraints.maxSimultaneousHeads}
          onChange={(e) =>
            onChange({
              ...inputs,
              constraints: {
                ...inputs.constraints,
                maxSimultaneousHeads: Number(e.target.value),
              },
            })
          }
        />
      </label>
      <label className="field" style={{ gridColumn: '1 / -1' }}>
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
                minTerminalPressureBar: Number(e.target.value),
              },
            })
          }
        />
      </label>
    </div>
  );
}
