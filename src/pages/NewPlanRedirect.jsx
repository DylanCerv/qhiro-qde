import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../api/client';

export default function NewPlanRedirect() {
  const navigate = useNavigate();
  const [error, setError] = useState(null);

  useEffect(() => {
    api
      .createProject({ name: 'Nuevo plano' })
      .then((response) => {
        navigate(`/app/projects/${response.project.projectId}`, { replace: true });
      })
      .catch((err) => setError(err.message));
  }, [navigate]);

  if (error) {
    return <div className="alert-error">{error}</div>;
  }

  return (
    <div className="loading-screen">
      <div className="loading-spinner" />
      <p>Preparando editor de plano…</p>
    </div>
  );
}
