import { api } from "./api";

/**
 * GitHub repository integration for the Dashboard.
 *
 * Backend routes:
 *   GET  /auth/github/status
 *   GET  /auth/github/repositories
 *   POST /auth/github/import
 */

export async function getGithubStatus() {
  const { data } = await api.get("/auth/github/status");
  return data?.data ?? data;
}

export function startGithubConnection() {
  const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
  window.location.assign(`${apiUrl}/auth/github`);
}

export async function listGithubRepositories(params = {}) {
  const { data } = await api.get("/auth/github/repositories", { params });
  return data?.data ?? data;
}

export async function importGithubRepository(payload) {
  const { data } = await api.post("/auth/github/import", payload);
  return data?.data ?? data;
}

export default {
  getGithubStatus,
  startGithubConnection,
  listGithubRepositories,
  importGithubRepository,
};
