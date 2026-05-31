import { api } from "./api";
import type { Project } from "@/components/proyectos/types";

// Shape returned by the Quarkus backend
export interface BackendProject {
  id: string;
  name: string;
  description: string;
  projectActive: boolean;
  startDate: string;
  endDate: string;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  archivedAt: string | null;
  repoUrl: string | null;
}

export interface ProjectPayload {
  name: string;
  description: string;
  startDate: string;
  endDate: string;
  githubUsernames?: string[];
}

export interface GitHubStats {
  commits: number;
  pullRequests: number;
  linked: number;
}

export interface GitHubCollaborator {
  login: string;
  avatarUrl?: string | null;
  htmlUrl?: string | null;
  permission: string;
}

function fromBackend(p: BackendProject): Project {
  let status: Project["status"];
  if (p.archivedAt !== null) {
    status = "archivado";
  } else if (p.projectActive) {
    status = "activo";
  } else {
    status = "planificacion";
  }
  return {
    id: p.id,
    name: p.name,
    description: p.description,
    status,
    startDate: p.startDate,
    endDate: p.endDate,
    totalTasks: 0,
    completedTasks: 0,
    members: [],
    createdBy: p.createdBy,
    repoUrl: p.repoUrl ?? undefined,
  };
}

export const projectsService = {
  getAll: async (): Promise<Project[]> => {
    const data = await api.get<BackendProject[]>("/projects/all");
    return data.map(fromBackend);
  },

  getById: async (id: string): Promise<Project> => {
    const data = await api.get<BackendProject[]>("/projects/all");
    const found = data.find((p) => p.id === id);
    if (!found) throw new Error(`Proyecto no encontrado: ${id}`);
    return fromBackend(found);
  },

  create: async (payload: ProjectPayload): Promise<Project> => {
    const data = await api.post<BackendProject>("/projects", payload);
    return fromBackend(data);
  },

  createGitHubRepository: async (id: string): Promise<Project> => {
    const data = await api.post<BackendProject>(`/projects/${id}/github/repository`, {});
    return fromBackend(data);
  },

  addGitHubCollaborator: async (id: string, githubUsername: string): Promise<void> => {
    await api.post<void>(`/projects/${id}/github/collaborators`, { githubUsername });
  },

  getGitHubStats: async (id: string): Promise<GitHubStats> => {
    return api.get<GitHubStats>(`/projects/${id}/github/stats`);
  },

  getGitHubCollaborators: async (id: string): Promise<GitHubCollaborator[]> => {
    return api.get<GitHubCollaborator[]>(`/projects/${id}/github/collaborators`);
  },

  update: async (id: string, payload: ProjectPayload): Promise<Project> => {
    const data = await api.put<BackendProject>(`/projects/${id}`, payload);
    return fromBackend(data);
  },

  archive: async (id: string): Promise<void> => {
    await api.put<void>(`/projects/archive/${id}`);
  },

  unarchive: async (id: string): Promise<void> => {
    await api.put<void>(`/projects/unarchive/${id}`);
  },

  delete: async (id: string): Promise<void> => {
    await api.delete<void>(`/projects/${id}`);
  },

  // Team management
  getMembers: async (projectId: string): Promise<any[]> => {
    return api.get<any[]>(`/projects/${projectId}/members`);
  },

  addMember: async (projectId: string, userId: string, githubUsername?: string): Promise<void> => {
    const query = githubUsername ? `?githubUsername=${encodeURIComponent(githubUsername)}` : '';
    await api.post<void>(`/projects/${projectId}/members/${userId}${query}`, {});
  },

  updateMemberGitHubUsername: async (projectId: string, userId: string, githubUsername: string): Promise<any> => {
    return api.put<any>(`/projects/${projectId}/members/${userId}/github`, { githubUsername });
  },

  removeMember: async (projectId: string, userId: string): Promise<void> => {
    await api.delete<void>(`/projects/${projectId}/members/${userId}`);
  },
};
