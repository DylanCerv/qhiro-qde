import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import QhiroLogo from '../components/QhiroLogo';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { login, error, setError } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({ email: '', password: '' });
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    try {
      await login(form);
      navigate('/app');
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="login-page">
      <section className="login-hero">
        <span className="login-hero__badge">
          <span className="material-symbols-outlined" style={{ fontSize: '1rem' }}>
            engineering
          </span>
          Qhiro Symbiotic
        </span>
        <QhiroLogo variant="full" wordmark="QDE" size={48} />
        <h1>Motor de despliegue para instalaciones agrícolas de precisión</h1>
        <p>
          Dimensiona Centinelas, hidráulica y presupuesto antes de instalar. Planos versionados,
          trazables y listos para ingeniería.
        </p>
        <div className="login-hero__features">
          <div className="login-feature">
            <span className="material-symbols-outlined">grid_on</span>
            Cobertura, roles Cabecilla/Peón y sectores hidráulicos
          </div>
          <div className="login-feature">
            <span className="material-symbols-outlined">pin_drop</span>
            Coordenadas y criterio de ubicación en mapa
          </div>
          <div className="login-feature">
            <span className="material-symbols-outlined">receipt_long</span>
            CAPEX desglosado por equipo e instalación
          </div>
        </div>
      </section>

      <section className="login-panel">
        <div className="login-card card card--flat">
          <h2>Acceso de ingeniería</h2>
          <p>Solo administradores e ingeniería Qhiro pueden usar QDE.</p>
          <form className="login-form" onSubmit={handleSubmit}>
            <label className="field">
              <span>Correo corporativo</span>
              <input
                type="email"
                placeholder="nombre@qhiro.com"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
              />
            </label>
            <label className="field">
              <span>Contraseña</span>
              <div className="password-field">
                <input
                  type={passwordVisible ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={form.password}
                  onChange={(e) => setForm({ ...form, password: e.target.value })}
                  required
                />
                <button
                  type="button"
                  className="password-field__toggle"
                  onClick={() => setPasswordVisible((visible) => !visible)}
                  aria-label={passwordVisible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                  aria-pressed={passwordVisible}
                  title={passwordVisible ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                >
                  <span className="material-symbols-outlined">
                    {passwordVisible ? 'visibility_off' : 'visibility'}
                  </span>
                </button>
              </div>
            </label>
            {error ? <div className="alert-error">{error}</div> : null}
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              <span className="material-symbols-outlined">login</span>
              {submitting ? 'Verificando…' : 'Iniciar sesión'}
            </button>
          </form>
          <p className="login-footnote">
            Productores y clientes operan en el panel Symbiotic, no en QDE.
          </p>
        </div>
      </section>
    </div>
  );
}
