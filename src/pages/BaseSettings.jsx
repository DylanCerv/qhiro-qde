import { useEffect, useState } from 'react';
import { api } from '../api/client';
import { qdeGlossary } from '../data/glossary.js';
import FieldHint from '../components/FieldHint.jsx';
import PageHeader from '../components/PageHeader.jsx';
import { mergeEnergyConfig } from '../components/EnergyConfigPanel.jsx';

const costFields = [
  ['nidoUsd', qdeGlossary.nidoUsd],
  ['cabecillaUsd', qdeGlossary.cabecillaUsd],
  ['peonUsd', qdeGlossary.peonUsd],
  ['qdnUsd', qdeGlossary.qdnUsd],
  ['pipePerMeterUsd', qdeGlossary.pipePerMeterUsd],
  ['installPerNodeUsd', qdeGlossary.installPerNodeUsd],
];

const energyFields = [
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

export default function BaseSettings() {
  const [tab, setTab] = useState('costs');
  const [defaults, setDefaults] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    api
      .getDefaultSettings()
      .then((response) => setDefaults(response.defaults))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      const response = await api.saveDefaultSettings(defaults);
      setDefaults(response.defaults);
      setSaved(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner" />
        <p>Cargando configuración base…</p>
      </div>
    );
  }

  const energy = mergeEnergyConfig(defaults.energy);

  return (
    <div>
      <PageHeader
        eyebrow="Configuración global · Firestore"
        title="Equipos y valores base"
        description="Precios unitarios y radios/energía por defecto para cada plano nuevo. Cada versión guarda sus propios valores si activas edición en el plano."
      />

      {error ? <div className="alert-error">{error}</div> : null}
      {saved ? (
        <div className="alert-success" style={{ marginBottom: '1rem' }}>
          Configuración base guardada en Firestore.
        </div>
      ) : null}

      <div className="settings-tabs">
        <button
          type="button"
          className={`settings-tab${tab === 'costs' ? ' is-active' : ''}`}
          onClick={() => setTab('costs')}
        >
          Precios (CAPEX)
        </button>
        <button
          type="button"
          className={`settings-tab${tab === 'energy' ? ' is-active' : ''}`}
          onClick={() => setTab('energy')}
        >
          Radios y energía
        </button>
      </div>

      <form className="card card--flat" onSubmit={handleSave}>
        {tab === 'costs' ? (
          <>
            <div className="card__label">
              <span className="material-symbols-outlined">payments</span>
              Tarifas unitarias (USD)
            </div>
            <div className="form-grid form-grid--2">
              {costFields.map(([key, term]) => (
                <label key={key} className="field">
                  <FieldHint term={term} />
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={defaults.costs[key]}
                    onChange={(e) =>
                      setDefaults((prev) => ({
                        ...prev,
                        costs: { ...prev.costs, [key]: Number(e.target.value) || 0 },
                      }))
                    }
                  />
                </label>
              ))}
            </div>
          </>
        ) : (
          <>
            <div className="card__label">
              <span className="material-symbols-outlined">electrical_services</span>
              Radios efectivos y red eléctrica/hidráulica
            </div>
            <div className="form-grid form-grid--2">
              {energyFields.map(([key, term]) => (
                <label key={key} className="field">
                  <FieldHint term={term} />
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    value={energy[key]}
                    onChange={(e) =>
                      setDefaults((prev) => ({
                        ...prev,
                        energy: { ...mergeEnergyConfig(prev.energy), [key]: Number(e.target.value) || 0 },
                      }))
                    }
                  />
                </label>
              ))}
            </div>
          </>
        )}

        <button type="submit" className="btn btn-primary" style={{ marginTop: '1.25rem' }} disabled={saving}>
          <span className="material-symbols-outlined">save</span>
          {saving ? 'Guardando…' : 'Guardar configuración base'}
        </button>
      </form>
    </div>
  );
}
