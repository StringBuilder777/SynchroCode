import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import type { TeamMember } from "./types";
import { getInitials, getAvatarColor } from "./types";

const ALL_USERS: TeamMember[] = [
  { id: "u1", name: "Ana García", email: "ana.garcia@synchro.com", role: "Frontend Dev" },
  { id: "u2", name: "Andrés Luna", email: "a.luna@synchro.com", role: "Backend Dev" },
  { id: "u3", name: "Ana Martínez", email: "amartinez@synchro.com", role: "QA Tester" },
  { id: "u4", name: "Pedro Sánchez", email: "p.sanchez@synchro.com", role: "UI Designer" },
];

interface Props {
  open: boolean;
  onClose: () => void;
  onAdd: (member: TeamMember) => void;
  existingIds: string[];
}

export function AddMemberDialog({ open, onClose, onAdd, existingIds }: Props) {
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<TeamMember | null>(null);

  const filtered = ALL_USERS.filter(
    (u) => !existingIds.includes(u.id) && (u.name.toLowerCase().includes(search.toLowerCase()) || u.email.toLowerCase().includes(search.toLowerCase()))
  );

  function handleAdd() {
    if (selected) { onAdd(selected); setSelected(null); setSearch(""); onClose(); }
  }

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) { onClose(); setSelected(null); setSearch(""); } }}>
      <DialogContent className="max-w-[460px]">
        <DialogHeader>
          <DialogTitle>Agregar miembro al proyecto</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="relative">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
            <Input placeholder="Buscar por nombre o correo..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
          </div>

          {search && (
            <div className="space-y-1">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Resultados de búsqueda</p>
              {filtered.map((u) => (
                <button
                  key={u.id}
                  onClick={() => setSelected(u)}
                  className={`flex w-full items-center gap-3 rounded-lg p-3 text-left transition-colors ${selected?.id === u.id ? "border border-primary bg-primary/5" : "hover:bg-accent"}`}
                >
                  <div className={`flex size-9 items-center justify-center rounded-full text-xs font-medium ${getAvatarColor(u.name)}`}>
                    {getInitials(u.name)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium">{u.name}</div>
                    <div className="text-xs text-muted-foreground">{u.email}</div>
                  </div>
                  {selected?.id === u.id && (
                    <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-primary"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><path d="m9 11 3 3L22 4"/></svg>
                  )}
                </button>
              ))}
              {filtered.length === 0 && (
                <p className="py-4 text-center text-sm text-muted-foreground">No se encontraron usuarios.</p>
              )}
            </div>
          )}

          {selected && (
            <div className="flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 py-1 w-fit text-xs text-primary font-medium">
              <span className="size-1.5 rounded-full bg-primary" />
              {selected.name} seleccionada
            </div>
          )}
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={handleAdd} disabled={!selected}>Agregar al proyecto</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
