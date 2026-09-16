import { Link } from 'react-router-dom';
import { qdeGlossary } from '../data/glossary.js';
import FieldHint from './FieldHint.jsx';

function formatUsd(value) {
  return `US$${Number(value ?? 0).toLocaleString()}`;
}

export default function BudgetPanel({
  inputs,
  output,
  onChangeCosts,
  onRestoreBaseCosts,
  readOnly = false,
  embedded = false,
}) {
  const costs = inputs?.costs;
  if (!costs) return null;

  const updateCost = (key, value) => {
    onChangeCosts({
      ...costs,
      [key]: Number(value) || 0,
    });
  };

  const costFields = [
    ['nidoUsd', qdeGlossary.nidoUsd],
    ['cabecillaUsd', qdeGlossary.cabecillaUsd],
    ['peonUsd', qdeGlossary.peonUsd],
    ['qdnUsd', qdeGlossary.qdnUsd],
    ['pipePerMeterUsd', qdeGlossary.pipePerMeterUsd],
    ['installPerNodeUsd', qdeGlossary.installPerNodeUsd],
  ];

  const Wrapper = embedded ? 'div' : 'section';
  const wrapperClass = embedded ? 'plan-devices-section' : 'card card--flat budget-panel';

  return (
    <Wrapper className={wrapperClass}>
      <div className="section-head">
        <div className="card__label" style={{ marginBottom: 0 }}>
          <span className="material-symbols-outlined">account_balance_wallet</span>
          Presupuesto de este plano
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          {!readOnly && onRestoreBaseCosts ? (
            <button type="button" className="btn btn-secondary" onClick={onRestoreBaseCosts}>
              <span className="material-symbols-outlined">restart_alt</span>
              Usar precios base
            </button>
          ) : null}
          <span className={`badge ${readOnly ? 'badge-feasible' : 'badge-draft'}`}>
            {readOnly ? 'Valores base del plano' : 'Editable'}
          </span>
        </div>
      </div>

      {!readOnly ? (
        <p className="result-summary">
          Precios para <strong>este plano</strong>. Los valores por defecto se configuran en{' '}
          <Link to="/app/configuracion">Configuración base</Link>. Aquí puedes ajustarlos si aplica un
          cambio puntual.
        </p>
      ) : null}

      <div className="form-grid form-grid--6" style={{ marginTop: readOnly ? 0 : '1rem' }}>
        {costFields.map(([key, term]) => (
          <label key={key} className="field">
            <FieldHint term={term} />
            {readOnly ? (
              <div className="field-readonly">{formatUsd(costs[key])}</div>
            ) : (
              <input
                type="number"
                min="0"
                step="1"
                value={costs[key]}
                onChange={(e) => updateCost(key, e.target.value)}
              />
            )}
          </label>
        ))}
      </div>

      {output?.budgetBreakdown ? (
        <div className="budget-result">
          <div className="card__label">
            <span className="material-symbols-outlined">receipt_long</span>
            Desglose del plano seleccionado
          </div>

          <div className="data-table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Concepto</th>
                  <th>Cant.</th>
                  <th>Unit.</th>
                  <th>Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {output.budgetBreakdown.lines.map((line) => (
                  <tr key={line.item}>
                    <td>{line.item}</td>
                    <td>{line.quantity}</td>
                    <td>{formatUsd(line.unitUsd)}</td>
                    <td>
                      <strong style={{ color: 'var(--text)' }}>{formatUsd(line.subtotalUsd)}</strong>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="budget-total">
            <span>Total CAPEX</span>
            <strong>{formatUsd(output.budgetBreakdown.totalUsd)}</strong>
          </div>

          <p className="result-summary" style={{ marginTop: '0.75rem' }}>
            Costo por hectárea útil:{' '}
            <strong>{formatUsd(output.budgetBreakdown.costPerUsefulHaUsd)}/ha</strong>
          </p>
        </div>
      ) : null}
    </Wrapper>
  );
}
