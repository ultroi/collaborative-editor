import { api } from './api';

export async function getProject(projectId) {
  const { data } = await api.get(
    `/projects/${projectId}`
  );

  return data.data; // { project, role }
}

export async function getTree(projectId) {
  const { data } = await api.get(
    `/projects/${projectId}/files`
  );

  return data.data.nodes;
}

export async function createNode(
  projectId,
  { name, type, parentId }
) {
  const { data } = await api.post(
    `/projects/${projectId}/files`,
    {
      name,
      type,
      parentId,
    }
  );

  return data.data.node;
}

export async function getFileContent(
  projectId,
  fileId
) {
  const { data } = await api.get(
    `/projects/${projectId}/files/${fileId}/content`
  );

  return data.data; // { node, access }
}

export async function saveFileContent(
  projectId,
  fileId,
  content
) {
  const { data } = await api.patch(
    `/projects/${projectId}/files/${fileId}/content`,
    {
      content,
    }
  );

  return data.data.node;
}

export async function renameNode(
  projectId,
  fileId,
  name
) {
  const { data } = await api.patch(
    `/projects/${projectId}/files/${fileId}`,
    {
      name,
    }
  );

  return data.data.node;
}

export async function deleteNode(
  projectId,
  fileId
) {
  await api.delete(
    `/projects/${projectId}/files/${fileId}`
  );
}

export async function getLocks(projectId) {
  const { data } = await api.get(
    `/projects/${projectId}/files/locks`
  );

  return data.data.locks;
}

/*
 * ============================================================
 * PROJECT SETTINGS
 * ============================================================
 */

export async function getProjectSettings(
  projectId
) {
  const { data } = await api.get(
    `/projects/${projectId}/settings`
  );

  return data.data;
}

export async function updateProjectSettings(
  projectId,
  settings
) {
  const { data } = await api.patch(
    `/projects/${projectId}/settings`,
    settings
  );

  return data.data;
}

export async function resetProjectSettings(
  projectId
) {
  const { data } = await api.post(
    `/projects/${projectId}/settings/reset`
  );

  return data.data;
}

/*
 * ============================================================
 * PROJECT DETAILS
 * ============================================================
 */

export async function updateProject(
  projectId,
  payload
) {
  const { data } = await api.patch(
    `/projects/${projectId}`,
    payload
  );

  return data.data;
}