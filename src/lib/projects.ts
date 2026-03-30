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
}

export interface ProjectPayload {
  name: string;
  description: string;
  startDate: string;
  endDate: string;
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

  update: async (id: string, payload: ProjectPayload): Promise<Project> => {
    const data = await api.put<BackendProject>(`/projects?projectId=${id}`, payload);
    return fromBackend(data);
  },

  archive: async (id: string): Promise<void> => {
    await api.put<void>(`/projects/archive?projectId=${id}`);
  },

  delete: async (id: string): Promise<void> => {
    await api.delete<void>(`/projects?projectId=${id}`);
  },
};
