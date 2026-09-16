import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api/client';
import PageHeader from '../components/PageHeader';

function statusBadge(status) {
  const map = {
    draft: ['badge-draft', 'Borrador'],
    active: ['badge-selected', 'Activo'],
    archived: ['badge-feasible', 'Archivado'],
  };
  const [cls, label] = map[status] ?? ['badge-draft', status];
  return <span className={`badge ${cls}`}>{label}</span>;
}

function withLocalDraftName(project) {
  try {
    const draft = JSON.parse(localStorage.getItem(`qde_project_draft_${project.projectId}`) ?? 'null');
    const localName = draft?.projectName?.trim();
    return localName && localName.toLowerCase() !== 'nuevo plano'
      ? { ...project, name: localName, hasLocalDraft: true }
      : project;
  } catch {
    return project;
  }
}

export default function Projects() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedProjectIds, setSelectedProjectIds] = useState([]);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    api
      .getProjects()
      .then((response) => setProjects((response.projects ?? []).map(withLocalDraftName)))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const activeCount = projects.filter((p) => p.status === 'active').length;
  const draftCount = projects.filter((p) => p.status === 'draft').length;
  const visibleProjects = statusFilter === 'all'
    ? projects
    : projects.filter((project) => project.status === statusFilter);
  const selectedProjects = projects.filter((project) => selectedProjectIds.includes(project.projectId));
  const allProjectsSelected = visibleProjects.length > 0 && visibleProjects.every((project) => selectedProjectIds.includes(project.projectId));

  const toggleProject = (projectId) => {
    setSelectedProjectIds((current) =>
      current.includes(projectId)
        ? current.filter((id) => id !== projectId)
        : [...current, projectId],
    );
  };

  const toggleAllProjects = () => {
    setSelectedProjectIds((current) =>
      allProjectsSelected
        ? current.filter((id) => !visibleProjects.some((project) => project.projectId === id))
        : [...new Set([...current, ...visibleProjects.map((project) => project.projectId)])],
    );
  };

  const changeStatusFilter = (filter) => {
    setStatusFilter(filter);
    setSelectedProjectIds([]);
  };

  const deleteSelectedProjects = async () => {
    if (selectedProjectIds.length === 0) return;
    setDeleting(true);
    setError(null);
    try {
      await Promise.all(selectedProjectIds.map((projectId) => api.deleteProject(projectId)));
      setProjects((current) =>
        current.filter((project) => !selectedProjectIds.includes(project.projectId)),
      );
      setSelectedProjectIds([]);
      setDeleteDialogOpen(false);
    } catch (err) {
      setError(`No se pudieron eliminar todos los planos: ${err.message}`);
    } finally {
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner" />
        <p>Cargando planos…</p>
      </div>
    );
  }

  return (
    <div>
      <PageHeader
        eyebrow="QDE · Ingeniería"
        title="Planos de despliegue"
        description="Biblioteca de diseños versionados con presupuesto, coordenadas y trazabilidad técnica."
        actions={
          <>
            {selectedProjectIds.length > 0 ? (
              <button
                type="button"
                className="btn btn-danger"
                onClick={() => setDeleteDialogOpen(true)}
              >
                <span className="material-symbols-outlined">delete</span>
                Eliminar {selectedProjectIds.length === 1 ? 'plano' : `${selectedProjectIds.length} planos`}
              </button>
            ) : null}
            <Link to="/app/nuevo" className="btn btn-primary">
              <span className="material-symbols-outlined">add</span>
              Nuevo plano
            </Link>
          </>
        }
      />

      {error ? <div className="alert-error">{error}</div> : null}

      <div className="stats-row">
        <div className="stat-card">
          <div className="stat-card__value">{projects.length}</div>
          <div className="stat-card__label">Planos totales</div>
        </div>
        <div className="stat-card">
          <div className="stat-card__value">{activeCount}</div>
          <div className="stat-card__label">Aprobados</div>
        </div>
        <div className="stat-card">
          <div className="stat-card__value">{draftCount}</div>
          <div className="stat-card__label">En borrador</div>
        </div>
      </div>

      <div className="card card--flat">
        <div className="project-filters" role="group" aria-label="Filtrar planos por estado">
          {[
            ['all', `Todos (${projects.length})`],
            ['draft', `Borradores (${draftCount})`],
            ['active', `Aprobados (${activeCount})`],
          ].map(([filter, label]) => (
            <button
              key={filter}
              type="button"
              className={`btn ${statusFilter === filter ? 'btn-primary' : 'btn-secondary'}`}
              onClick={() => changeStatusFilter(filter)}
            >
              {label}
            </button>
          ))}
        </div>

        {projects.length === 0 ? (
          <div className="empty-state">
            <span className="material-symbols-outlined">map</span>
            <p>Aún no hay planos registrados. Crea el primero para empezar a dimensionar.</p>
            <Link to="/app/nuevo" className="btn btn-primary">
              Crear primer plano
            </Link>
          </div>
        ) : (
          <div className="data-table-wrap">
            <table className="data-table">
              <thead>
                <tr>
                  <th className="selection-cell">
                    <input
                      type="checkbox"
                      checked={allProjectsSelected}
                      onChange={toggleAllProjects}
                      aria-label="Seleccionar todos los planos"
                    />
                  </th>
                  <th>Plano</th>
                  <th>Cliente</th>
                  <th>Parcela</th>
                  <th>Estado</th>
                  <th>Versión</th>
                  <th>Actualizado</th>
                </tr>
              </thead>
              <tbody>
                {visibleProjects.map((project) => (
                  <tr key={project.projectId}>
                    <td className="selection-cell">
                      <input
                        type="checkbox"
                        checked={selectedProjectIds.includes(project.projectId)}
                        onChange={() => toggleProject(project.projectId)}
                        aria-label={`Seleccionar ${project.name}`}
                      />
                    </td>
                    <td>
                      <Link to={`/app/projects/${project.projectId}`} className="data-table__link">
                        {project.name}
                      </Link>
                    </td>
                    <td>{project.clientName ?? '—'}</td>
                    <td>{project.parcelName ?? '—'}</td>
                    <td>{statusBadge(project.status)}</td>
                    <td>v{project.currentVersionNumber}</td>
                    <td>{new Date(project.updatedAt).toLocaleDateString('es-DO')}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {visibleProjects.length === 0 ? (
              <div className="empty-state project-filter-empty">
                <span className="material-symbols-outlined">filter_alt_off</span>
                <p>No hay planos en este estado.</p>
              </div>
            ) : null}
          </div>
        )}
      </div>

      {deleteDialogOpen ? (
        <div className="qde-modal-backdrop" role="presentation" onMouseDown={() => !deleting && setDeleteDialogOpen(false)}>
          <section
            className="qde-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-projects-title"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="qde-modal__icon" aria-hidden="true">
              <span className="material-symbols-outlined">warning</span>
            </div>
            <h2 id="delete-projects-title">
              {selectedProjects.length === 1 ? '¿Eliminar este plano?' : `¿Eliminar ${selectedProjects.length} planos?`}
            </h2>
            <p>
              Esta acción elimina el plano y todas sus versiones, inputs, polígonos, resultados,
              nodos de despliegue, presupuestos y trazabilidad. <strong>No se puede recuperar.</strong>
            </p>
            <ul className="qde-modal__list">
              {selectedProjects.map((project) => <li key={project.projectId}>{project.name}</li>)}
            </ul>
            <div className="qde-modal__actions">
              <button type="button" className="btn btn-secondary" onClick={() => setDeleteDialogOpen(false)} disabled={deleting}>
                Cancelar
              </button>
              <button type="button" className="btn btn-danger" onClick={deleteSelectedProjects} disabled={deleting}>
                <span className="material-symbols-outlined">delete_forever</span>
                {deleting ? 'Eliminando…' : 'Eliminar definitivamente'}
              </button>
            </div>
          </section>
        </div>
      ) : null}
    </div>
  );
}
