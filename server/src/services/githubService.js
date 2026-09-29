import { api } from '../../../client/src/services/api';

export async function getGithubStatus() {
  const { data } = await api.get('/auth/github/status');
  return data.data;
}

export async function getGithubRepositories(params = {}) {
  const { data } = await api.get('/auth/github/repositories', { params });
  return data.data;
}

export async function importGithubRepository({ owner, repo, branch }) {
  const { data } = await api.post('/auth/github/import', {
    owner,
    repo,
    branch,
  });
  return data.data;
}

export function connectGithub() {
  window.location.assign('/api/auth/github');
}
