import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { UserFormDialog } from "./UserFormDialog";
import { DeactivateUserDialog } from "./DeactivateUserDialog";
import type { User } from "./types";
import { getInitials, getAvatarColor } from "./types";

const initialUsers: User[] = [
  { id: "1", name: "Juan Pérez", email: "juan.perez@synchrocode.com", role: "Administrador", status: "activo", activeTasks: 2 },
  { id: "2", name: "Ana López", email: "ana.lopez@synchrocode.com", role: "Gerente de Proyecto", status: "activo", activeTasks: 5 },
  { id: "3", name: "Carlos García", email: "carlos.garcia@synchrocode.com", role: "Desarrollador Senior", status: "inactivo", activeTasks: 3 },
  { id: "4", name: "María Rodríguez", email: "maria.rodriguez@synchrocode.com", role: "Invitado / Cliente", status: "activo", activeTasks: 0 },
  { id: "5", name: "Luis Martínez", email: "luis.martinez@synchrocode.com", role: "Desarrollador Senior", status: "activo", activeTasks: 4 },
];

const ROLES_FILTER = ["Administrador", "Gerente de Proyecto", "Desarrollador Senior", "Desarrollador Junior", "Invitado / Cliente"];

export function UsersPage() {
  const [users, setUsers] = useState<User[]>(initialUsers);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const [formOpen, setFormOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [deactivateOpen, setDeactivateOpen] = useState(false);
  const [deactivatingUser, setDeactivatingUser] = useState<User | null>(null);

  const filtered = useMemo(() => {
    return users.filter((u) => {
      const matchSearch = !search || u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase());
      const matchRole = roleFilter === "all" || u.role === roleFilter;
      const matchStatus = statusFilter === "all" || u.status === statusFilter;
      return matchSearch && matchRole && matchStatus;
    });
  }, [users, search, roleFilter, statusFilter]);

  function handleSave(data: Omit<User, "id" | "activeTasks">) {
    if (editingUser) {
      setUsers((prev) => prev.map((u) => (u.id === editingUser.id ? { ...u, ...data } : u)));
    } else {
      setUsers((prev) => [...prev, { id: crypto.randomUUID(), activeTasks: 0, ...data }]);
    }
    setEditingUser(null);
  }

  function handleDeactivate(userId: string) {
    setUsers((prev) => prev.map((u) => (u.id === userId ? { ...u, status: "inactivo" as const } : u)));
  }

  function clearFilters() {
    setSearch("");
    setRoleFilter("all");
    setStatusFilter("all");
  }

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Breadcrumb */}
      <div className="text-sm text-muted-foreground">
        Admin &gt; <span className="text-foreground font-medium">Usuarios</span>
      </div>

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Gestión de Usuarios</h1>
          <p className="text-sm text-muted-foreground">
            Administra los permisos y accesos de los miembros del equipo.
          </p>
        </div>
        <Button onClick={() => { setEditingUser(null); setFormOpen(true); }}>
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
          Nuevo Usuario
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3 rounded-lg border p-4">
        <div className="relative flex-1 min-w-[200px]">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
          <Input
            placeholder="Buscar usuario..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filtrar por rol" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Filtrar por rol</SelectItem>
            {ROLES_FILTER.map((r) => (
              <SelectItem key={r} value={r}>{r}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[140px]">
            <SelectValue placeholder="Estado" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Estado</SelectItem>
            <SelectItem value="activo">Activo</SelectItem>
            <SelectItem value="inactivo">Inactivo</SelectItem>
          </SelectContent>
        </Select>
        <button onClick={clearFilters} className="text-sm text-muted-foreground hover:text-foreground underline underline-offset-2">
          Limpiar filtros
        </button>
      </div>

      {/* Table */}
      <div className="rounded-lg border overflow-hidden">
        <div className="grid grid-cols-[50px_1fr_1.5fr_120px_100px_100px] gap-4 border-b bg-muted/50 px-6 py-3 text-xs font-medium uppercase tracking-wide text-muted-foreground">
          <span>Avatar</span>
          <span>Nombre completo</span>
          <span>Correo electrónico</span>
          <span>Rol</span>
          <span>Estado</span>
          <span className="text-right">Acciones</span>
        </div>

        {filtered.map((user) => (
          <div
            key={user.id}
            className="grid grid-cols-[50px_1fr_1.5fr_120px_100px_100px] gap-4 border-b last:border-b-0 px-6 py-4 items-center"
          >
            <div className={`flex size-9 items-center justify-center rounded-full text-xs font-medium ${getAvatarColor(user.name)}`}>
              {getInitials(user.name)}
            </div>
            <span className="font-medium">{user.name}</span>
            <span className="text-sm text-muted-foreground truncate">{user.email}</span>
            <Badge variant="outline" className="text-xs w-fit">{user.role.split(" ")[0]}</Badge>
            <div className="flex items-center gap-1.5">
              <span className={`size-2 rounded-full ${user.status === "activo" ? "bg-emerald-500" : "bg-muted-foreground"}`} />
              <span className={`text-sm ${user.status === "activo" ? "text-emerald-500" : "text-muted-foreground"}`}>
                {user.status === "activo" ? "Activo" : "Inactivo"}
              </span>
            </div>
            <div className="flex justify-end gap-1">
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={() => { setEditingUser(user); setFormOpen(true); }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21.174 6.812a1 1 0 0 0-3.986-3.987L3.842 16.174a2 2 0 0 0-.5.83l-1.321 4.352a.5.5 0 0 0 .623.622l4.353-1.32a2 2 0 0 0 .83-.497z"/></svg>
              </Button>
              {user.status === "activo" && (
                <Button
                  variant="ghost"
                  size="icon-sm"
                  className="text-destructive hover:text-destructive hover:bg-destructive/10"
                  onClick={() => { setDeactivatingUser(user); setDeactivateOpen(true); }}
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="m15 9-6 6"/><path d="m9 9 6 6"/></svg>
                </Button>
              )}
            </div>
          </div>
        ))}

        {filtered.length === 0 && (
          <div className="px-6 py-12 text-center text-muted-foreground">
            No hay usuarios para mostrar.
          </div>
        )}
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>
          Mostrando <strong className="text-foreground">1</strong> a <strong className="text-foreground">{filtered.length}</strong> de <strong className="text-foreground">{users.length}</strong> resultados
        </span>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" disabled>Anterior</Button>
          <Button variant="outline" size="sm" disabled>Siguiente</Button>
        </div>
      </div>

      {/* Dialogs */}
      <UserFormDialog
        open={formOpen}
        onClose={() => { setFormOpen(false); setEditingUser(null); }}
        onSave={handleSave}
        user={editingUser}
      />
      <DeactivateUserDialog
        open={deactivateOpen}
        onClose={() => { setDeactivateOpen(false); setDeactivatingUser(null); }}
        onConfirm={handleDeactivate}
        user={deactivatingUser}
      />
    </div>
  );
}
