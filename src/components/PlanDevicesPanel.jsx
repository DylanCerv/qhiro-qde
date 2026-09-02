import { Link } from 'react-router-dom';
import BudgetPanel from './BudgetPanel.jsx';
import EnergyConfigPanel, { mergeEnergyConfig } from './EnergyConfigPanel.jsx';

export default function PlanDevicesPanel({
  inputs,
  output,
  baseDefaults,
  deviceEditEnabled,
  onToggleEdit,
  onChange,
  onRestoreBase,
}) {
  if (!inputs) return null;

  const hasOverrides =
    baseDefaults &&
    (JSON.stringify(inputs.costs) !== JSON.stringify(baseDefaults.costs) ||
      JSON.stringify(mergeEnergyConfig(inputs.energy, inputs.sprayProfile?.ra)) !==
        JSON.stringify(mergeEnergyConfig(baseDefaults.energy, inputs.sprayProfile?.ra)));

  return (
    <section className="card card--flat plan-devices-panel">
      <div className="section-head">
        <div className="card__label" style={{ marginBottom: 0 }}>
          <span className="material-symbols-outlined">tune</span>
          Equipos de este plano
        </div>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
          {deviceEditEnabled && onRestoreBase ? (
            <button type="button" className="btn btn-secondary" onClick={onRestoreBase}>
              <span className="material-symbols-outlined">restart_alt</span>
              Restaurar valores base
            </button>
          ) : null}
          <button
            type="button"
            className={`btn ${deviceEditEnabled ? 'btn-ghost' : 'btn-primary'}`}
            onClick={onToggleEdit}
          >
            <span className="material-symbols-outlined">
              {deviceEditEnabled ? 'lock' : 'edit'}
            </span>
            {deviceEditEnabled ? 'Cerrar edición' : 'Activar edición de equipos'}
          </button>
        </div>
      </div>

      <p className="result-summary">
        {deviceEditEnabled ? (
          <>
            Editando precios y radios <strong>solo para esta versión</strong>. Guarda los inputs para
            persistir en Firestore y consultar versiones anteriores.
          </>
        ) : (
          <>
            Mostrando valores de esta versión. Los defaults globales están en{' '}
            <Link to="/app/configuracion">Configuración base</Link>.
            {hasOverrides ? (
              <>
                {' '}
                Esta versión tiene ajustes respecto a la base.
              </>
            ) : null}
          </>
        )}
      </p>

      <EnergyConfigPanel
        inputs={inputs}
        onChange={onChange}
        readOnly={!deviceEditEnabled}
        embedded
      />

      <BudgetPanel
        inputs={inputs}
        output={output}
        onChangeCosts={(costs) => onChange({ ...inputs, costs })}
        onRestoreBaseCosts={deviceEditEnabled ? onRestoreBase : undefined}
        readOnly={!deviceEditEnabled}
        embedded
      />
    </section>
  );
}
