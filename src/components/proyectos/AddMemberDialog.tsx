import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import type { TeamMember } from "./types";
import { getInitials, getAvatarColor } from "./types";
import { usersService } from "@/lib/users";
import { api } from "@/lib/api";
import type { BackendRole } from "@/components/roles/types";
import { normalizeUserError } from "@/lib/errors";

interface Props {
  open: boolean;
  onClose: () => void;
  onAdd: (member: TeamMember) => Promise<void>;
  existingIds: string[];
}

export function AddMemberDialog({ open, onClose, onAdd, existingIds }: Props) {
  const [search, setSearch] = useState("");
  const [allUsers, setAllUsers] = useState<TeamMember[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [roles, setRoles] = useState<string[]>([]);
  const [selected, setSelected] = useState<TeamMember | null>(null);
  const [loading, setLoading] = useState(false);
  const [adding, setAdding] = useState(false);
  const [githubUsername, setGithubUsername] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setLoading(true);
      setError(null);
      Promise.all([
        usersService.getAll(),
        usersService.getMe(),
        api.get<BackendRole[]>("/roles")
      ]).then(([usersData, me, rolesData]) => {
        setAllUsers(usersData.map(u => ({
          id: u.id,
          name: u.name,
          email: u.email,
          role: u.role
        })));
        setCurrentUserId(me.id);
        setRoles(rolesData.map(r => r.name));
      }).finally(() => setLoading(false));
    }
  }, [open]);

  const filtered = allUsers.filter(
    (u) => !existingIds.includes(u.id) && (u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase()))
  );

  // Show first 3 available users if no search is performed to "fill" the space
  const displayUsers = search ? filtered : allUsers.filter(u => !existingIds.includes(u.id)).slice(0, 3);

  function handleSelectUser(u: TeamMember) {
    if (u.id === currentUserId || u.role === "Administrador") return;
    setSelected(u);
    setError(null);
  }

  async function handleAdd() {
    if (selected) { 
      setAdding(true);
      setError(null);
      try {
        // Use the user's predefined role, no selection allowed here
        await onAdd({ ...selected, githubUsername: githubUsername.trim() || undefined }); 
        setSelected(null); 
        setSearch(""); 
        setGithubUsername("");
        onClose(); 
      } catch (e: unknown) {
        setError(
          normalizeUserError(e, {
            fallback: "No se pudo agregar el integrante al proyecto.",
            duplicateMessage: "Ese integrante ya forma parte del proyecto.",
            forbiddenMessage: "No tienes permisos para agregar integrantes.",
            notFoundMessage: "No se encontró el integrante seleccionado.",
            invalidDataMessage: "No se pudo agregar el integrante. Verifica los datos e inténtalo de nuevo.",
          }),
        );
      } finally {
        setAdding(false);
      }
    }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) { onClose(); setSelected(null); setSearch(""); setGithubUsername(""); setError(null); } }}>
      <DialogContent className="max-w-[460px]">
        <DialogHeader>
          <DialogTitle>Agregar miembro al proyecto</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {error && (
            <div className="flex items-center gap-3 rounded-lg border border-destructive/30 bg-destructive/10 p-3 text-destructive animate-in fade-in slide-in-from-top-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0"><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/></svg>
              <p className="text-sm font-medium">{error}</p>
            </div>
          )}

          <div className="relative">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
            <Input placeholder="Buscar por nombre o correo..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
          </div>

          {loading && <p className="text-center text-sm text-muted-foreground py-4">Cargando usuarios...</p>}

          {!loading && (
            <div className="space-y-1 max-h-[200px] overflow-y-auto">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {search ? "Resultados de búsqueda" : "Usuarios disponibles"}
              </p>
              {displayUsers.map((u) => {
                const isSelf = u.id === currentUserId;
                const isAdmin = u.role === "Administrador";
                const isRestricted = isSelf || isAdmin;

                return (
                  <button
                    key={u.id}
                    onClick={() => handleSelectUser(u)}
                    disabled={isRestricted}
                    className={`flex w-full items-center gap-3 rounded-lg p-3 text-left transition-colors ${selected?.id === u.id ? "border border-primary bg-primary/5" : "hover:bg-accent"} ${isRestricted ? "opacity-60 cursor-not-allowed grayscale" : ""}`}
                  >
                    <div className={`flex size-9 items-center justify-center rounded-full text-xs font-medium ${getAvatarColor(u.name)}`}>
                      {getInitials(u.name)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium flex items-center gap-2">
                        {u.name}
                        {isSelf && <span className="text-[10px] bg-secondary px-1.5 py-0.5 rounded text-muted-foreground font-normal">Tú</span>}
                      </div>
                      <div className="text-xs text-muted-foreground">{u.email}</div>
                    </div>
                    <div className="text-right">
                       <span className="text-[10px] border px-1.5 py-0.5 rounded text-muted-foreground block w-fit ml-auto">{u.role}</span>
                    </div>
                    {selected?.id === u.id && (
                      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="m9 11 3 3L22 4"/></svg>
                    )}
                  </button>
                );
              })}
              {displayUsers.length === 0 && (
                <p className="py-4 text-center text-sm text-muted-foreground">No hay usuarios disponibles.</p>
              )}
            </div>
          )}

          {/* Restriction Message */}
          {search && filtered.some(u => u.id === currentUserId || u.role === "Administrador") && (
            <div className="flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3">
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mt-0.5 shrink-0 text-amber-500"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>
              <p className="text-[11px] text-amber-600 leading-tight">
                Los Administradores gestionan todos los proyectos de forma global y no pueden ser asignados como miembros individuales.
              </p>
            </div>
          )}

          {selected && (
            <div className="space-y-3 rounded-lg border border-primary/20 bg-primary/5 p-4">
              <div className="flex items-center gap-3">
                <div className={`flex size-9 items-center justify-center rounded-full text-xs font-medium ${getAvatarColor(selected.name)}`}>
                  {getInitials(selected.name)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium">{selected.name}</div>
                  <div className="text-xs text-muted-foreground">{selected.email}</div>
                </div>
                <div className="text-right">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Rol Asignado</p>
                  <span className="text-xs font-semibold text-primary">{selected.role}</span>
                </div>
              </div>
            </div>
          )}

          {selected && (
            <div className="space-y-2 rounded-lg border p-4">
              <div className="flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="text-muted-foreground">
                  <path d="M12 0c-6.626 0-12 5.373-12 12 0 5.302 3.438 9.8 8.207 11.387.599.111.793-.261.793-.577v-2.234c-3.338.726-4.033-1.416-4.033-1.416-.546-1.387-1.333-1.756-1.333-1.756-1.089-.745.083-.729.083-.729 1.205.084 1.839 1.237 1.839 1.237 1.07 1.834 2.807 1.304 3.492.997.107-.775.418-1.305.762-1.604-2.665-.305-5.467-1.334-5.467-5.931 0-1.311.469-2.381 1.236-3.221-.124-.303-.535-1.524.117-3.176 0 0 1.008-.322 3.301 1.23.957-.266 1.983-.399 3.003-.404 1.02.005 2.047.138 3.006.404 2.291-1.552 3.297-1.23 3.297-1.23.653 1.653.242 2.874.118 3.176.77.84 1.235 1.911 1.235 3.221 0 4.609-2.807 5.624-5.479 5.921.43.372.823 1.102.823 2.222v3.293c0 .319.192.694.801.576 4.765-1.589 8.199-6.086 8.199-11.386 0-6.627-5.373-12-12-12z"/>
                </svg>
                <label className="text-sm font-medium">GitHub Username</label>
                <span className="text-[10px] bg-secondary px-1.5 py-0.5 rounded text-muted-foreground">Opcional</span>
              </div>
              <Input
                placeholder="ej: octocat"
                value={githubUsername}
                onChange={(e) => setGithubUsername(e.target.value)}
                className="font-mono text-sm"
              />
              <p className="text-[11px] text-muted-foreground">
                Si se proporciona, se agregará automáticamente como colaborador en el repositorio de GitHub del proyecto.
              </p>
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleAdd} disabled={!selected || adding}>
            {adding ? "Agregando..." : "Agregar al proyecto"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
