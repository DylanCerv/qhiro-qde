import { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams } from 'react-router-dom';
import { api } from '../api/client';
import PageHeader from '../components/PageHeader.jsx';
import DeploymentMap from '../components/DeploymentMap.jsx';
import InputsForm from '../components/InputsForm.jsx';
import PlanExport from '../components/PlanExport.jsx';
import PlanDevicesPanel from '../components/PlanDevicesPanel.jsx';
import TerrainMapEditor from '../components/TerrainMapEditor.jsx';
import { calculateUsefulAreaHa, polygonCentroid } from '../utils/geo.js';

function altBadge(status) {
  const map = {
    selected: ['badge-selected', 'Seleccionada'],
    feasible_not_optimal: ['badge-feasible', 'Factible no óptima'],
    not_feasible: ['badge-rejected', 'No factible'],
    experimental: ['badge-draft', 'Experimental'],
  };
  const [cls, label] = map[status] ?? ['badge-draft', status];
  return <span className={`badge ${cls}`}>{label}</span>;
}

function versionBadge(status) {
  const map = {
    draft: ['badge-draft', 'Borrador'],
    computed: ['badge-feasible', 'Calculada'],
    selected: ['badge-selected', 'Seleccionada'],
    superseded: ['badge-rejected', 'Reemplazada'],
  };
  const [cls, label] = map[status] ?? ['badge-draft', status];
  return <span className={`badge ${cls}`}>{label}</span>;
}

export default function ProjectDetail() {
  const { projectId } = useParams();
  const [project, setProject] = useState(null);
  const [projectName, setProjectName] = useState('');
  const [versions, setVersions] = useState([]);
  const [activeVersionId, setActiveVersionId] = useState(null);
  const [inputs, setInputs] = useState(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(null);
  const [clients, setClients] = useState([]);
  const [parcels, setParcels] = useState([]);
  const [clientUserId, setClientUserId] = useState('');
  const [parcelId, setParcelId] = useState('');
  const [baseDefaults, setBaseDefaults] = useState(null);
  const [deviceEditEnabled, setDeviceEditEnabled] = useState(false);
  const [draftOutput, setDraftOutput] = useState(undefined);
  const [invalidFields, setInvalidFields] = useState([]);
  const [manualLayout, setManualLayout] = useState(false);
  const [manualNotice, setManualNotice] = useState(false);
  const [terrainAccordionOpen, setTerrainAccordionOpen] = useState(true);

  const activeVersion = useMemo(
    () => versions.find((version) => version.versionId === activeVersionId) ?? null,
    [versions, activeVersionId],
  );
  const draftStorageKey = `qde_project_draft_${projectId}`;

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [projectResponse, versionsResponse, clientsResponse, defaultsResponse] = await Promise.all([
        api.getProject(projectId),
        api.getVersions(projectId),
        api.getClients(),
        api.getDefaultSettings(),
      ]);
      setProject(projectResponse.project);
      // "Nuevo plano" is only the server-side placeholder for a draft. It
      // must never be prefilled into the title field the engineer edits.
      setProjectName(projectResponse.project.name === 'Nuevo plano' ? '' : projectResponse.project.name);
      setClients(clientsResponse.clients ?? []);
      setBaseDefaults(defaultsResponse.defaults);
      const nextVersions = versionsResponse.versions ?? [];
      setVersions(nextVersions);
      setClientUserId(projectResponse.project.clientUserId ?? '');
      setParcelId(projectResponse.project.parcelId ?? '');
      // Al reabrir, el plano calculado/aprobado es el resultado útil. Un borrador
      // posterior permanece disponible en la lista, pero no debe ocultar el plano
      // y sus nodos, mapa y presupuesto ya persistidos en Firestore.
      const preferredVersion =
        nextVersions.find((version) => version.status === 'selected') ??
        nextVersions.find((version) => version.output) ??
        nextVersions[0];
      if (preferredVersion) {
        setActiveVersionId(preferredVersion.versionId);
        setInputs(preferredVersion.inputs);
      }
      setDraftOutput(undefined);
      setManualLayout(false);
      setManualNotice(false);
      const cachedDraft = localStorage.getItem(draftStorageKey);
      if (cachedDraft) {
        try {
          const draft = JSON.parse(cachedDraft);
          if (draft.inputs) setInputs(draft.inputs);
          if (draft.projectName) setProjectName(draft.projectName);
          if (draft.output) setDraftOutput(draft.output);
        } catch {
          localStorage.removeItem(draftStorageKey);
        }
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [draftStorageKey, projectId]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (activeVersion) {
      setInputs(activeVersion.inputs);
      setManualLayout(false);
      setManualNotice(false);
      setDeviceEditEnabled(false);
    }
  }, [activeVersion]);

  useEffect(() => {
    if (!clientUserId) {
      setParcels([]);
      return;
    }
    api.getClientParcels(clientUserId).then((response) => setParcels(response.parcels ?? []));
  }, [clientUserId]);

  useEffect(() => {
    if (loading || !inputs) return;
    localStorage.setItem(draftStorageKey, JSON.stringify({ projectName, inputs, output: draftOutput }));
  }, [draftOutput, draftStorageKey, inputs, loading, projectName]);

  const saveProjectMeta = async () => {
    const response = await api.updateProject(projectId, {
      name: projectName.trim() || 'Nuevo plano',
      clientUserId: clientUserId || null,
      parcelId: parcelId || null,
    });
    setProject(response.project);
    setProjectName(response.project.name);
    setClientUserId(response.project.clientUserId ?? '');
    setParcelId(response.project.parcelId ?? '');
  };

  const handleSaveInputs = async () => {
    if (!activeVersionId || !inputs) return;
    if (!projectName.trim() || projectName.trim().toLowerCase() === 'nuevo plano') {
      setError('Asigna un nombre al plano antes de guardarlo.');
      return;
    }
    setBusy(true);
    setError(null);
    try {
      await saveProjectMeta();
      const response = await api.updateVersionInputs(projectId, activeVersionId, inputs);
      let savedVersion = response.version;
      if (manualLayout && draftOutput) {
        const manual = await api.saveManualLayout(projectId, activeVersionId, draftOutput);
        savedVersion = manual.version;
      } else if (draftOutput) {
        const computed = manualLayout
          ? await api.saveManualLayout(projectId, activeVersionId, draftOutput)
          : await api.runVersion(projectId, activeVersionId);
        savedVersion = computed.version;
      }
      setVersions((prev) =>
        prev.map((version) =>
          version.versionId === activeVersionId ? savedVersion : version,
        ),
      );
      setDraftOutput(undefined);
      setManualLayout(false);
      setManualNotice(false);
      localStorage.removeItem(draftStorageKey);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const handleApplyParcel = async () => {
    if (!parcelId || !clientUserId) return;
    setBusy(true);
    setError(null);
    try {
      const response = await api.applyParcel(projectId, clientUserId, parcelId);
      setProject(response.project);
      setProjectName(response.project.name);
      setInputs(response.inputs);
      if (activeVersionId) {
        const saved = await api.updateVersionInputs(projectId, activeVersionId, response.inputs);
        setVersions((prev) =>
          prev.map((version) =>
            version.versionId === activeVersionId ? saved.version : version,
          ),
        );
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const handleRun = async () => {
    if (!activeVersionId) return;
    if (!projectName.trim() || projectName.trim().toLowerCase() === 'nuevo plano') {
      setError('Asigna un nombre al plano antes de generarlo.');
      return;
    }
    if (!terrainReady) {
      setError('Delimita la parcela en el mapa (mínimo 3 vértices) antes de generar el plano.');
      return;
    }
    const required = [
      'terrain.name', 'terrain.grossAreaHa', 'terrain.usefulAreaHa', 'crop.species', 'crop.stage',
      'crop.canopyHeightM', 'crop.mission', 'sprayProfile.ra', 'sprayProfile.fo',
      'sprayProfile.pa', 'sprayProfile.qa', 'constraints.minCoveragePct',
      'constraints.maxSimultaneousHeads', 'constraints.minTerminalPressureBar',
    ];
    const missing = required.filter((path) => {
      const value = path.split('.').reduce((current, key) => current?.[key], inputs);
      return value === '' || value === null || value === undefined || Number.isNaN(value);
    });
    if (missing.length > 0) {
      setInvalidFields(missing);
      setError('Completa los campos marcados en rojo antes de generar el plano.');
      return;
    }
    setInvalidFields([]);
    setBusy(true);
    setError(null);
    try {
      const response = await api.computePlan(inputs);
      setDraftOutput(response.output);
      setManualLayout(false);
      setManualNotice(false);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const handleNewVersion = async () => {
    setBusy(true);
    setError(null);
    try {
      const response = await api.createVersion(projectId, {
        label: `v${(project?.currentVersionNumber ?? 0) + 1} — revisión`,
        copyFromVersionId: activeVersionId ?? undefined,
      });
      setVersions((prev) => [response.version, ...prev]);
      setActiveVersionId(response.version.versionId);
      setInputs(response.version.inputs);
      setProject((prev) =>
        prev
          ? {
              ...prev,
              currentVersionNumber: response.version.versionNumber,
              latestVersionId: response.version.versionId,
            }
          : prev,
      );
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const handleSelectPlan = async () => {
    if (!activeVersionId) return;
    setBusy(true);
    setError(null);
    try {
      // A generated draft lives locally until the engineer explicitly saves it.
      // Approval must first persist/recompute that draft, otherwise the API only
      // sees the previous empty version and correctly refuses to approve it.
      let versionToApprove = activeVersionId;
      if (draftOutput) {
        await saveProjectMeta();
        await api.updateVersionInputs(projectId, activeVersionId, inputs);
        const computed = await api.runVersion(projectId, activeVersionId);
        versionToApprove = computed.version.versionId;
        setVersions((prev) =>
          prev.map((version) =>
            version.versionId === computed.version.versionId ? computed.version : version,
          ),
        );
        setDraftOutput(undefined);
        setManualLayout(false);
        setManualNotice(false);
      }
      const response = await api.selectVersion(projectId, versionToApprove);
      setVersions((prev) =>
        prev.map((version) => {
          if (version.versionId === response.version.versionId) return response.version;
          if (version.status === 'selected') return { ...version, status: 'superseded' };
          return version;
        }),
      );
      setProject((prev) => (prev ? { ...prev, status: 'active' } : prev));
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const handleRestoreBaseDevices = () => {
    if (!baseDefaults) return;
    setInputs((prev) =>
      prev
        ? {
            ...prev,
            costs: { ...baseDefaults.costs },
            energy: { ...baseDefaults.energy },
          }
        : prev,
    );
  };

  const handleTerrainCoordinatesChange = (coordinates) => {
    setInputs((prev) => {
      if (!prev) return prev;
      const grossAreaHa = calculateUsefulAreaHa(coordinates, 1);
      const usefulAreaHa = calculateUsefulAreaHa(coordinates, 0.95);
      return {
        ...prev,
        terrain: {
          ...prev.terrain,
          coordinates,
          grossAreaHa: grossAreaHa || prev.terrain.grossAreaHa,
          usefulAreaHa: usefulAreaHa || prev.terrain.usefulAreaHa,
        },
      };
    });
  };

  const terrainPoints = inputs?.terrain?.coordinates ?? [];
  const terrainReady = terrainPoints.length >= 3;
  const dataComplete = Boolean(
    inputs &&
      [
        'terrain.name', 'terrain.grossAreaHa', 'terrain.usefulAreaHa', 'crop.species', 'crop.stage',
        'crop.canopyHeightM', 'crop.mission', 'sprayProfile.ra', 'sprayProfile.fo',
        'sprayProfile.pa', 'sprayProfile.qa', 'constraints.minCoveragePct',
        'constraints.maxSimultaneousHeads', 'constraints.minTerminalPressureBar',
      ].every((path) => {
        const value = path.split('.').reduce((current, key) => current?.[key], inputs);
        return value !== '' && value !== null && value !== undefined && !Number.isNaN(value);
      }),
  );
  const needsProjectName = !projectName.trim() || projectName.trim().toLowerCase() === 'nuevo plano';
  const terrainMapCenter = useMemo(() => {
    if (terrainPoints.length >= 1) return polygonCentroid(terrainPoints) ?? terrainPoints[0];
    return null;
  }, [terrainPoints]);

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner" />
        <p>Cargando plano…</p>
      </div>
    );
  }
  if (!project) return <div className="alert-error">Proyecto no encontrado.</div>;

  const output = draftOutput ?? activeVersion?.output;
  const handleManualNodesChange = (deploymentNodes) => {
    setDraftOutput((current) => ({
      ...(current ?? activeVersion?.output),
      deploymentNodes,
    }));
    setManualLayout(true);
    setManualNotice(true);
  };

  const restoreCalculatedLayout = () => {
    setDraftOutput(undefined);
    setManualLayout(false);
    setManualNotice(false);
  };

  return (
    <div>
      <PageHeader
        eyebrow={`Versión ${activeVersion?.versionNumber ?? 1} · ${activeVersion?.label ?? 'borrador'}`}
        title={projectName || 'Plano sin título'}
        description="Completa identificación, datos técnicos y presupuesto. Genera el plano para ver mapa, coordenadas y CAPEX."
        meta={
          <>
            {project.clientName ? <span className="badge badge-draft">Cliente: {project.clientName}</span> : null}
            {project.parcelName ? <span className="badge badge-feasible">Parcela: {project.parcelName}</span> : null}
            {activeVersion ? versionBadge(activeVersion.status) : null}
          </>
        }
        actions={
          <>
            <button type="button" className="btn btn-secondary" onClick={handleNewVersion} disabled={busy}>
              <span className="material-symbols-outlined">history</span>
              Nueva versión
            </button>
            <button
              type="button"
              className="btn btn-primary"
              onClick={handleRun}
              disabled={busy || !terrainReady || needsProjectName}
              title={needsProjectName ? 'Asigna un nombre al plano antes de generarlo' : !terrainReady ? 'Delimita la parcela en el mapa primero' : undefined}
            >
              <span className="material-symbols-outlined">architecture</span>
              {busy ? 'Calculando…' : 'Generar plano'}
            </button>
          </>
        }
      />

      {error ? <div className="alert-error">{error}</div> : null}
      {!terrainReady ? (
        <div className="alert-error" style={{ marginBottom: '1rem', background: 'rgba(243,204,84,0.1)', borderColor: 'rgba(243,204,84,0.35)', color: 'var(--yellow)' }}>
          Delimita la parcela en el mapa (mínimo 3 vértices) para poder generar el plano de despliegue.
        </div>
      ) : null}
      {needsProjectName ? (
        <div className="alert-error" style={{ marginBottom: '1rem' }}>
          <span className="material-symbols-outlined">info</span>
          Asigna un nombre al plano antes de calcular o guardar una versión.
        </div>
      ) : null}
      {manualNotice ? (
        <div className="manual-layout-alert">
          <span className="material-symbols-outlined">edit_location_alt</span>
          <div>
            <strong>Plano ajustado manualmente.</strong> Las posiciones movidas se conservarán si guardas esta versión; revisa cobertura, presión y acceso antes de aprobarlo.
          </div>
          <button type="button" className="btn btn-secondary" onClick={restoreCalculatedLayout}>Volver al plano calculado</button>
          <button type="button" className="btn btn-primary" onClick={() => setManualNotice(false)}>Mantener ajuste</button>
        </div>
      ) : null}

      <div className="editor-layout">
        <aside className="card card--flat">
          <div className="card__label">
            <span className="material-symbols-outlined">layers</span>
            Versiones
          </div>
          <div className="version-list">
            {versions.map((version) => (
              <button
                key={version.versionId}
                type="button"
                className={`version-item${version.versionId === activeVersionId ? ' is-active' : ''}`}
                onClick={() => {
                  setDraftOutput(undefined);
                  setActiveVersionId(version.versionId);
                }}
              >
                <div className="version-item__title">
                  v{version.versionNumber} — {version.label}
                </div>
                <div className="version-item__meta">{versionBadge(version.status)}</div>
              </button>
            ))}
          </div>
        </aside>

        <div className="editor-workspace">
          <section className="card card--flat">
            <div className="card__label">
              <span className="material-symbols-outlined">badge</span>
              Identificación
            </div>
            <div className="form-grid form-grid--2">
              <label className="field" style={{ gridColumn: '1 / -1' }}>
                <span>Título del plano</span>
                <input
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  placeholder="Ej. Guineo Monte Plata — diseño v1"
                />
              </label>
              <label className="field">
                <span>Cliente (opcional)</span>
                <select
                  value={clientUserId}
                  onChange={(e) => {
                    setClientUserId(e.target.value);
                    setParcelId('');
                  }}
                >
                  <option value="">— Sin cliente —</option>
                  {clients.map((client) => (
                    <option key={client.userId} value={client.userId}>
                      {client.displayName} · {client.email}
                    </option>
                  ))}
                </select>
              </label>
              <label className="field">
                <span>Parcela (opcional)</span>
                <select
                  value={parcelId}
                  onChange={(e) => setParcelId(e.target.value)}
                  disabled={!clientUserId}
                >
                  <option value="">
                    {clientUserId ? '— Sin parcela —' : '— Elige un cliente primero —'}
                  </option>
                  {parcels.map((parcel) => (
                    <option key={parcel.parcelId} value={parcel.parcelId}>
                      {parcel.name} {parcel.cropType ? `· ${parcel.cropType}` : ''}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            {parcelId && clientUserId ? (
              <button
                type="button"
                className="btn btn-secondary"
                style={{ marginTop: '1rem' }}
                onClick={handleApplyParcel}
                disabled={busy}
              >
                <span className="material-symbols-outlined">download</span>
                Cargar datos de la parcela
              </button>
            ) : null}
          </section>

          <section className="card card--flat">
            <details
              className="editor-accordion"
              open={terrainAccordionOpen}
              onToggle={(event) => setTerrainAccordionOpen(event.currentTarget.open)}
            >
              <summary>
                <span className="material-symbols-outlined">draw</span>
                <span>Delimitar terreno en mapa</span>
                {terrainReady ? (
                  <span className="editor-accordion__summary">{inputs?.terrain?.grossAreaHa} ha · {terrainPoints.length} vértices</span>
                ) : (
                  <span className="badge badge-feasible">Sin parcela — dibuja el lote</span>
                )}
                <span className="material-symbols-outlined editor-accordion__chevron">expand_more</span>
              </summary>
              <p className="result-summary" style={{ marginBottom: '1rem' }}>
                Marca los vértices del terreno como en Symbiotic. El área bruta y útil se calculan
                automáticamente y alimentan el motor de dimensionamiento.
              </p>
              {inputs ? (
                <TerrainMapEditor
                  points={terrainPoints}
                  onChange={handleTerrainCoordinatesChange}
                  defaultCenter={terrainMapCenter}
                />
              ) : null}
            </details>
          </section>

          <section className="card card--flat">
            <details className="editor-accordion" open={!dataComplete}>
              <summary>
                <span className="material-symbols-outlined">terrain</span>
                <span>Datos del terreno y misión</span>
                {dataComplete ? <span className="editor-accordion__summary">Datos completos</span> : <span className="badge badge-draft">Pendiente</span>}
                <span className="material-symbols-outlined editor-accordion__chevron">expand_more</span>
              </summary>
              <div className="section-head" style={{ marginTop: '1rem' }}>
                <span className="result-summary">Edita los parámetros del terreno, cultivo y misión.</span>
                <button type="button" className="btn btn-secondary" onClick={handleSaveInputs} disabled={busy}>
                  <span className="material-symbols-outlined">save</span>
                  Guardar
                </button>
              </div>
              <InputsForm
                inputs={inputs}
                onChange={setInputs}
                terrainFromMap={terrainPoints.length >= 3}
                invalidFields={invalidFields}
              />
            </details>
          </section>

          <PlanDevicesPanel
            inputs={inputs}
            output={output}
            baseDefaults={baseDefaults}
            deviceEditEnabled={deviceEditEnabled}
            onToggleEdit={() => setDeviceEditEnabled((prev) => !prev)}
            onChange={setInputs}
            onRestoreBase={handleRestoreBaseDevices}
          />

          {output ? (
            <>
              <section className="card card--flat editor-result-card">
                <div className="card__label">
                  <span className="material-symbols-outlined">analytics</span>
                  Resultado del plano
                </div>
                <p className="result-summary">{output.summary}</p>

                {output.coverageAnalysis ? (
                  <div className="stats-row" style={{ marginTop: '1rem' }}>
                    <div className="stat-card">
                      <div className="stat-card__value">{output.coverageAnalysis.measuredCoveragePct}%</div>
                      <div className="stat-card__label">Cobertura medida en polígono</div>
                    </div>
                    <div className="stat-card">
                      <div className="stat-card__value">{output.coverageAnalysis.gapCount}</div>
                      <div className="stat-card__label">Huecos detectados</div>
                    </div>
                    {output.energySummary ? (
                      <>
                        <div className="stat-card">
                          <div className="stat-card__value">{output.energySummary.worstDistanceM} m</div>
                          <div className="stat-card__label">Dist. máx. al Nido</div>
                        </div>
                        <div className="stat-card">
                          <div className="stat-card__value">{output.energySummary.worstVoltageV} V</div>
                          <div className="stat-card__label">Voltaje mín. estimado</div>
                        </div>
                      </>
                    ) : null}
                  </div>
                ) : null}

                {output.selectedAlternative ? (
                  <div className="stats-row" style={{ marginTop: '1rem' }}>
                    <div className="stat-card">
                      <div className="stat-card__value">{output.selectedAlternative.totalNodes}</div>
                      <div className="stat-card__label">Nodos totales</div>
                    </div>
                    <div className="stat-card">
                      <div className="stat-card__value">{output.selectedAlternative.coveragePct}%</div>
                      <div className="stat-card__label">Cobertura</div>
                    </div>
                    <div className="stat-card">
                      <div className="stat-card__value">
                        US${output.selectedAlternative.capexUsd.toLocaleString()}
                      </div>
                      <div className="stat-card__label">CAPEX seleccionado</div>
                    </div>
                    <div className="stat-card">
                      <div className="stat-card__value">
                        {output.selectedAlternative.cabecillas} / {output.selectedAlternative.peones}
                      </div>
                      <div className="stat-card__label">Cabecillas / Peones</div>
                    </div>
                  </div>
                ) : null}

                <div className="data-table-wrap" style={{ marginTop: '1.25rem' }}>
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Alternativa</th>
                        <th>Nodos</th>
                        <th>C / P</th>
                        <th>Cobertura</th>
                        <th>CAPEX</th>
                        <th>Estado</th>
                      </tr>
                    </thead>
                    <tbody>
                      {output.alternatives.map((alt) => (
                        <tr key={alt.alternativeId}>
                          <td>
                            <strong style={{ color: 'var(--text)' }}>{alt.alternativeId}</strong>
                          </td>
                          <td>{alt.totalNodes}</td>
                          <td>
                            {alt.cabecillas} / {alt.peones}
                          </td>
                          <td>{alt.coveragePct}%</td>
                          <td>US${alt.capexUsd.toLocaleString()}</td>
                          <td>{altBadge(alt.status)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {output.selectedAlternative ? (
                  <button
                    type="button"
                    className="btn btn-primary"
                    style={{ marginTop: '1.25rem' }}
                    onClick={handleSelectPlan}
                    disabled={busy}
                  >
                    <span className="material-symbols-outlined">verified</span>
                    Marcar versión como plano aprobado
                  </button>
                ) : null}
              </section>

              <section className="card card--flat editor-deployment-card">
                <div className="section-head">
                  <div className="card__label" style={{ marginBottom: 0 }}>
                    <span className="material-symbols-outlined">map</span>
                    Plano de despliegue
                  </div>
                  <PlanExport
                    projectName={projectName}
                    inputs={inputs}
                    output={output}
                    versionLabel={`v${activeVersion?.versionNumber ?? 1} — ${activeVersion?.label ?? 'borrador'}`}
                  />
                </div>
                <DeploymentMap
                  inputs={inputs}
                  output={output}
                  editable
                  onNodesChange={handleManualNodesChange}
                />
              </section>

              <section className="card card--flat editor-trace-card">
                <details className="trace-accordion">
                  <summary>
                  <span className="material-symbols-outlined">timeline</span>
                  Trazabilidad — por qué salió así
                    <span className="trace-accordion__count">{output.trace.length} pasos</span>
                    <span className="material-symbols-outlined trace-accordion__chevron">expand_more</span>
                  </summary>
                <ol className="trace-list">
                  {output.trace.map((step) => (
                    <li key={step.step} className="trace-step">
                      <div className="trace-step__phase">
                        Paso {step.step} · {step.phase}
                      </div>
                      <div className="trace-step__title">{step.title}</div>
                      <p>{step.detail}</p>
                    </li>
                  ))}
                </ol>
                </details>
              </section>
            </>
          ) : (
            <section className="card card--flat">
              <div className="empty-state" style={{ padding: '2rem 1rem' }}>
                <span className="material-symbols-outlined">architecture</span>
                <p>
                  Completa identificación, datos técnicos y presupuesto. Luego pulsa{' '}
                  <strong>Generar plano</strong> para ver alternativas, mapa y CAPEX.
                </p>
              </div>
            </section>
          )}
        </div>
      </div>

    </div>
  );
}
