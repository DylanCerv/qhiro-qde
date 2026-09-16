const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3001/api';

let authToken = null;

async function request(path, options = {}) {
  const headers = {
    'Content-Type': 'application/json',
    ...options.headers,
  };

  if (authToken) {
    headers.Authorization = `Bearer ${authToken}`;
  }

  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: response.statusText }));
    throw new Error(error.error ?? 'Request failed');
  }

  return response.json();
}

export const api = {
  setToken(token) {
    authToken = token;
  },

  login: (payload) =>
    request('/users/login', { method: 'POST', body: JSON.stringify(payload) }),

  getMe: () => request('/users/me'),
  getClients: () => request('/admin/clients'),
  getClientParcels: (userId) => request(`/admin/clients/${userId}/parcels`),
  getMontePlataPreset: () => request('/qde/presets/monte-plata'),
  computePlan: (inputs) => request('/qde/compute', { method: 'POST', body: JSON.stringify(inputs) }),
  getProfiles: () => request('/qde/profiles'),

  getProjects: () => request('/qde/projects'),
  createProject: (payload = {}) =>
    request('/qde/projects', { method: 'POST', body: JSON.stringify(payload) }),
  updateProject: (projectId, payload) =>
    request(`/qde/projects/${projectId}`, { method: 'PUT', body: JSON.stringify(payload) }),
  getDefaultCosts: () => request('/qde/settings/costs'),
  saveDefaultCosts: (costs) =>
    request('/qde/settings/costs', { method: 'PUT', body: JSON.stringify(costs) }),
  getDefaultSettings: () => request('/qde/settings/defaults'),
  saveDefaultSettings: (defaults) =>
    request('/qde/settings/defaults', { method: 'PUT', body: JSON.stringify(defaults) }),
  applyParcel: (projectId, clientUserId, parcelId) =>
    request(`/qde/projects/${projectId}/apply-parcel`, {
      method: 'POST',
      body: JSON.stringify({ clientUserId, parcelId }),
    }),
  getProject: (projectId) => request(`/qde/projects/${projectId}`),
  deleteProject: (projectId) =>
    request(`/qde/projects/${projectId}`, { method: 'DELETE' }),

  getVersions: (projectId) => request(`/qde/projects/${projectId}/versions`),
  createVersion: (projectId, payload) =>
    request(`/qde/projects/${projectId}/versions`, {
      method: 'POST',
      body: JSON.stringify(payload),
    }),
  getVersion: (projectId, versionId) =>
    request(`/qde/projects/${projectId}/versions/${versionId}`),
  updateVersionInputs: (projectId, versionId, inputs) =>
    request(`/qde/projects/${projectId}/versions/${versionId}/inputs`, {
      method: 'PUT',
      body: JSON.stringify(inputs),
    }),
  runVersion: (projectId, versionId) =>
    request(`/qde/projects/${projectId}/versions/${versionId}/run`, {
      method: 'POST',
    }),
  saveManualLayout: (projectId, versionId, output) =>
    request(`/qde/projects/${projectId}/versions/${versionId}/output`, {
      method: 'PUT',
      body: JSON.stringify({ output }),
    }),
  selectVersion: (projectId, versionId) =>
    request(`/qde/projects/${projectId}/versions/${versionId}/select`, {
      method: 'POST',
    }),
  loadFromParcel: (projectId, parcelId, clientUserId) =>
    request(`/qde/projects/${projectId}/from-parcel/${parcelId}`, {
      method: 'POST',
      body: JSON.stringify({ clientUserId }),
    }),
};
