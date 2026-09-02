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

export default function Projects() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    api
      .getProjects()
      .then((response) => setProjects(response.projects ?? []))
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const activeCount = projects.filter((p) => p.status === 'active').length;
  const draftCount = projects.filter((p) => p.status === 'draft').length;

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
          <Link to="/app/nuevo" className="btn btn-primary">
            <span className="material-symbols-outlined">add</span>
            Nuevo plano
          </Link>
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
                  <th>Plano</th>
                  <th>Cliente</th>
                  <th>Parcela</th>
                  <th>Estado</th>
                  <th>Versión</th>
                  <th>Actualizado</th>
                </tr>
              </thead>
              <tbody>
                {projects.map((project) => (
                  <tr key={project.projectId}>
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
          </div>
        )}
      </div>
    </div>
  );
}
