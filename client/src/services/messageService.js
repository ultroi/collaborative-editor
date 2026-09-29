import { api } from './api';

export async function getMessages(projectId, { before } = {}) {
  const { data } = await api.get(`/projects/${projectId}/messages`, {
    params: before ? { before } : undefined,
  });
  return data.data.messages; // newest-first
}