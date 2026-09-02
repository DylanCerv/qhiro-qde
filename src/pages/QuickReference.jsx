import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import { capexConcepts, deviceRoster, estimateQuickCapex } from '../data/deviceCatalog.js';
import { mergeEnergyConfig } from '../components/EnergyConfigPanel.jsx';
import PageHeader from '../components/PageHeader.jsx';

function formatUsd(value) {
  return `US$${Number(value ?? 0).toLocaleString()}`;
}

export default function QuickReference() {
  const [defaults, setDefaults] = useState(null);
  const [loading, setLoading] = useState(true);
  const [estimate, setEstimate] = useState({
    usefulAreaHa: 2.28,
    ra: 12,
    fo: 0.25,
  });

  useEffect(() => {
    api
      .getDefaultSettings()
      .then((response) => setDefaults(response.defaults))
      .catch(() => setDefaults(null))
      .finally(() => setLoading(false));
  }, []);

  const quickResult = useMemo(() => {
    if (!defaults?.costs) return null;
    return estimateQuickCapex({ ...estimate, costs: defaults.costs });
  }, [defaults, estimate]);

  const energy = defaults ? mergeEnergyConfig(defaults.energy) : null;

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner" />
        <p>Cargando referencia…</p>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        eyebrow="Consulta rápida"
        title="Referencia de equipos y CAPEX"
        description="Glosario de dispositivos, conceptos de presupuesto y estimador rápido sin abrir un plano."
      />

      <section className="card card--flat" style={{ marginBottom: '1.25rem' }}>
        <div className="card__label">
          <span className="material-symbols-outlined">devices</span>
          Equipos del sistema
        </div>
        <div className="device-roster">
          {deviceRoster.map((device) => (
            <article key={device.id} className="device-roster-card">
              <div className="device-roster-card__head">
                <span className="device-roster-card__icon" style={{ background: device.color }}>
                  {device.short}
                </span>
                <div>
                  <strong>{device.title}</strong>
                  <div className="device-roster-card__role">{device.role}</div>
                </div>
              </div>
              <p>{device.description}</p>
              {defaults && device.capexKey ? (
                <div className="device-roster-card__meta">
                  <span>Precio base: {formatUsd(defaults.costs[device.capexKey])}</span>
                  {device.radiusKey && energy ? (
                    <span>
                      {device.radiusLabel}: {energy[device.radiusKey]} m
                    </span>
                  ) : null}
                </div>
              ) : null}
            </article>
          ))}
        </div>
      </section>

      <section className="card card--flat" style={{ marginBottom: '1.25rem' }}>
        <div className="card__label">
          <span className="material-symbols-outlined">receipt_long</span>
          Conceptos del CAPEX
        </div>
        <div className="data-table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>Concepto</th>
                <th>Para qué sirve</th>
                <th>Unidad</th>
                {defaults ? <th>Precio base</th> : null}
              </tr>
            </thead>
            <tbody>
              {capexConcepts.map((row) => (
                <tr key={row.item}>
                  <td>
                    <strong style={{ color: 'var(--text)' }}>{row.item}</strong>
                  </td>
                  <td>{row.glossary.help}</td>
                  <td>{row.unit}</td>
                  {defaults ? <td>{formatUsd(defaults.costs[row.costKey])}</td> : null}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="map-meta" style={{ marginTop: '0.75rem' }}>
          Valores base editables en{' '}
          <Link to="/app/configuracion">Configuración base</Link>.
        </p>
      </section>

      <section className="card card--flat">
        <div className="card__label">
          <span className="material-symbols-outlined">calculate</span>
          Estimador rápido de CAPEX
        </div>
        <p className="result-summary" style={{ marginBottom: '1rem' }}>
          Aproximación orientativa usando precios base. Para un plano real con cobertura medida en
          polígono, usa el editor de plano.
        </p>
        <div className="form-grid form-grid--3">
          <label className="field">
            <span>Área útil (ha)</span>
            <input
              type="number"
              step="0.01"
              value={estimate.usefulAreaHa}
              onChange={(e) => setEstimate((p) => ({ ...p, usefulAreaHa: Number(e.target.value) }))}
            />
          </label>
          <label className="field">
            <span>R_a (m)</span>
            <input
              type="number"
              step="0.1"
              value={estimate.ra}
              onChange={(e) => setEstimate((p) => ({ ...p, ra: Number(e.target.value) }))}
            />
          </label>
          <label className="field">
            <span>F_o (0–1)</span>
            <input
              type="number"
              step="0.01"
              min="0"
              max="0.9"
              value={estimate.fo}
              onChange={(e) => setEstimate((p) => ({ ...p, fo: Number(e.target.value) }))}
            />
          </label>
        </div>

        {quickResult ? (
          <div className="stats-row" style={{ marginTop: '1.25rem' }}>
            <div className="stat-card">
              <div className="stat-card__value">{quickResult.baseNodes}</div>
              <div className="stat-card__label">Centinelas est.</div>
            </div>
            <div className="stat-card">
              <div className="stat-card__value">{quickResult.spacingM} m</div>
              <div className="stat-card__label">Separación malla</div>
            </div>
            <div className="stat-card">
              <div className="stat-card__value">{formatUsd(quickResult.totalUsd)}</div>
              <div className="stat-card__label">CAPEX estimado</div>
            </div>
            <div className="stat-card">
              <div className="stat-card__value">{formatUsd(quickResult.costPerHa)}/ha</div>
              <div className="stat-card__label">Costo por ha</div>
            </div>
          </div>
        ) : null}
      </section>
    </div>
  );
}
