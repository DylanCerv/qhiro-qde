import { useEffect, useState } from 'react';
import { api } from '../api/client';
import { qdeGlossary } from '../data/glossary.js';
import FieldHint from '../components/FieldHint.jsx';
import PageHeader from '../components/PageHeader.jsx';

const costFields = [
  ['nidoUsd', qdeGlossary.nidoUsd],
  ['cabecillaUsd', qdeGlossary.cabecillaUsd],
  ['peonUsd', qdeGlossary.peonUsd],
  ['qdnUsd', qdeGlossary.qdnUsd],
  ['pipePerMeterUsd', qdeGlossary.pipePerMeterUsd],
  ['installPerNodeUsd', qdeGlossary.installPerNodeUsd],
];

export default function DefaultCosts() {
  const [costs, setCosts] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    api
      .getDefaultCosts()
      .then((response) => setCosts(response.costs))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError(null);
    setSaved(false);
    try {
      const response = await api.saveDefaultCosts(costs);
      setCosts(response.costs);
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
        <p>Cargando precios base…</p>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        eyebrow="Configuración global"
        title="Precios base de equipos"
        description="Estos valores se aplican por defecto a cada plano nuevo. En cada proyecto puedes ajustarlos si hace falta un cambio puntual."
      />

      {error ? <div className="alert-error">{error}</div> : null}
      {saved ? <div className="alert-success" style={{ marginBottom: '1rem' }}>Precios base guardados en Firestore.</div> : null}

      <form className="card card--flat" onSubmit={handleSave}>
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
                value={costs[key]}
                onChange={(e) =>
                  setCosts((prev) => ({ ...prev, [key]: Number(e.target.value) || 0 }))
                }
              />
            </label>
          ))}
        </div>

        <button type="submit" className="btn btn-primary" style={{ marginTop: '1.25rem' }} disabled={saving}>
          <span className="material-symbols-outlined">save</span>
          {saving ? 'Guardando…' : 'Guardar precios base'}
        </button>
      </form>
    </div>
  );
}
