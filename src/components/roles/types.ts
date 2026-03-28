export const MODULES = [
  { key: "proyectos", label: "Proyectos", icon: "folder" },
  { key: "tareas", label: "Tareas", icon: "check" },
  { key: "usuarios", label: "Usuarios", icon: "users" },
  { key: "roles", label: "Roles", icon: "shield" },
  { key: "reportes", label: "Reportes", icon: "chart" },
  { key: "github", label: "GitHub", icon: "code" },
  { key: "chat", label: "Chat", icon: "message" },
] as const;

export const ACTIONS = ["leer", "crear", "editar", "eliminar"] as const;

export type ModuleKey = (typeof MODULES)[number]["key"];
export type ActionKey = (typeof ACTIONS)[number];

export type PermissionMatrix = Record<ModuleKey, Record<ActionKey, boolean>>;

export interface Role {
  id: string;
  name: string;
  description: string;
  permissions: PermissionMatrix;
  userCount: number;
}

export function createEmptyPermissions(): PermissionMatrix {
  const matrix = {} as PermissionMatrix;
  for (const mod of MODULES) {
    matrix[mod.key] = { leer: false, crear: false, editar: false, eliminar: false };
  }
  return matrix;
}

export function getPermissionSummary(permissions: PermissionMatrix): string[] {
  const tags: string[] = [];
  const allTrue = Object.values(permissions).every((actions) =>
    Object.values(actions).every(Boolean)
  );
  if (allTrue) return ["Acceso Total"];

  for (const mod of MODULES) {
    const actions = permissions[mod.key];
    if (actions.leer && actions.crear && actions.editar && actions.eliminar) {
      tags.push(mod.label);
    } else if (actions.leer) {
      tags.push("Leer");
    } else if (actions.crear) {
      tags.push("Crear");
    } else if (actions.editar) {
      tags.push("Editar");
    }
  }
  return [...new Set(tags)].slice(0, 3);
}
