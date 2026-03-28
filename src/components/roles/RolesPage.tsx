import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RoleFormDialog } from "./RoleFormDialog";
import { DeleteRoleDialog } from "./DeleteRoleDialog";
import {
  type Role,
  createEmptyPermissions,
  getPermissionSummary,
} from "./types";

// Mock data — se reemplaza con consulta a PostgreSQL
const initialRoles: Role[] = [
  {
    id: "1",
    name: "Administrador",
    description: "Acceso total al sistema y configuración",
    permissions: (() => {
      const p = createEmptyPermissions();
      for (const mod of Object.keys(p) as Array<keyof typeof p>) {
        p[mod] = { leer: true, crear: true, editar: true, eliminar: true };
      }
      return p;
    })(),
    userCount: 2,
  },
  {
    id: "2",
    name: "Gerente de Proyecto",
    description: "Gestión de proyectos, equipos y reportes",
    permissions: (() => {
      const p = createEmptyPermissions();
      p.proyectos = { leer: true, crear: true, editar: true, eliminar: false };
      p.tareas = { leer: true, crear: true, editar: true, eliminar: false };
      p.reportes = { leer: true, crear: false, editar: false, eliminar: false };
      p.chat = { leer: true, crear: true, editar: false, eliminar: false };
      return p;
    })(),
    userCount: 3,
  },
  {
    id: "3",
    name: "Desarrollador Senior",
    description: "Acceso a repositorios, tareas y despliegues",
    permissions: (() => {
      const p = createEmptyPermissions();
      p.tareas = { leer: true, crear: true, editar: true, eliminar: false };
      p.github = { leer: true, crear: true, editar: false, eliminar: false };
      p.chat = { leer: true, crear: true, editar: false, eliminar: false };
      return p;
    })(),
    userCount: 5,
  },
  {
    id: "4",
    name: "Desarrollador Junior",
    description: "Acceso limitado a tareas asignadas",
    permissions: (() => {
      const p = createEmptyPermissions();
      p.tareas = { leer: true, crear: false, editar: false, eliminar: false };
      p.chat = { leer: true, crear: true, editar: false, eliminar: false };
      return p;
    })(),
    userCount: 8,
  },
  {
    id: "5",
    name: "Invitado / Cliente",
    description: "Solo visualización de avances",
    permissions: (() => {
      const p = createEmptyPermissions();
      p.proyectos = { leer: true, crear: false, editar: false, eliminar: false };
      p.reportes = { leer: true, crear: false, editar: false, eliminar: false };
      return p;
    })(),
    userCount: 0,
  },
];

export function RolesPage() {
  const [roles, setRoles] = useState<Role[]>(initialRoles);
  const [formOpen, setFormOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deletingRole, setDeletingRole] = useState<Role | null>(null);

  function handleSave(data: Omit<Role, "id" | "userCount">) {
    if (editingRole) {
      setRoles((prev) =>
        prev.map((r) => (r.id === editingRole.id ? { ...r, ...data } : r))
      );
    } else {
      const newRole: Role = {
        id: crypto.randomUUID(),
        userCount: 0,
        ...data,
      };
      setRoles((prev) => [...prev, newRole]);
    }
    setEditingRole(null);
  }

  function handleDelete(roleId: string) {
    setRoles((prev) => prev.filter((r) => r.id !== roleId));
  }

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Gestión de Roles</h1>
          <p className="text-sm text-muted-foreground">
            Administra los roles de usuario y sus permisos de acceso.
          </p>
        </div>
        <Button onClick={() => { setEditingRole(null); setFormOpen(true); }}>
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
          Nuevo Rol
        </Button>
      </div>

      {/* Table */}
      <div className="rounded-lg border overflow-hidden">
        {/* Header */}
        <div className="grid grid-cols-[1fr_1.5fr_1fr_120px] gap-4 border-b bg-muted/50 px-6 py-3 text-sm font-medium text-muted-foreground">
          <span>Nombre</span>
          <span>Descripción</span>
          <span>Permisos</span>
          <span className="text-right">Acciones</span>
        </div>

        {/* Rows */}
        {roles.map((role) => {
          const tags = getPermissionSummary(role.permissions);
          const remaining = tags.length > 2 ? tags.length - 2 : 0;
          const displayTags = tags.slice(0, 2);

          return (
            <div
              key={role.id}
              className="grid grid-cols-[1fr_1.5fr_1fr_120px] gap-4 border-b last:border-b-0 px-6 py-4 items-center"
            >
              <span className="font-medium">{role.name}</span>
              <span className="text-sm text-muted-foreground">{role.description}</span>
              <div className="flex flex-wrap gap-1.5">
                {displayTags.map((tag) => (
                  <Badge key={tag} variant="outline" className="text-xs">
                    {tag}
                  </Badge>
                ))}
                {remaining > 0 && (
                  <Badge variant="secondary" className="text-xs">
                    +{remaining} Módulos
                  </Badge>
                )}
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => { setEditingRole(role); setFormOpen(true); }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z"/></svg>
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                  onClick={() => { setDeletingRole(role); setDeleteOpen(true); }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                </Button>
              </div>
            </div>
          );
        })}

        {roles.length === 0 && (
          <div className="px-6 py-12 text-center text-muted-foreground">
            No hay roles creados. Crea el primero con el botón + Nuevo Rol.
          </div>
        )}
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>Mostrando {roles.length} de {roles.length} roles</span>
        <div className="flex gap-1">
          <Button variant="outline" size="icon-sm" disabled>
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
          </Button>
          <Button variant="outline" size="icon-sm" disabled>
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
          </Button>
        </div>
      </div>

      {/* Dialogs */}
      <RoleFormDialog
        open={formOpen}
        onClose={() => { setFormOpen(false); setEditingRole(null); }}
        onSave={handleSave}
        role={editingRole}
      />
      <DeleteRoleDialog
        open={deleteOpen}
        onClose={() => { setDeleteOpen(false); setDeletingRole(null); }}
        onConfirm={handleDelete}
        role={deletingRole}
      />
    </div>
  );
}
