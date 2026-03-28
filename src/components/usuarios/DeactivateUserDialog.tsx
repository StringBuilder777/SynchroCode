import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
} from "@/components/ui/dialog";
import type { User } from "./types";
import { getInitials, getAvatarColor } from "./types";

interface Props {
  open: boolean;
  onClose: () => void;
  onConfirm: (userId: string) => void;
  user: User | null;
}

export function DeactivateUserDialog({ open, onClose, onConfirm, user }: Props) {
  if (!user) return null;

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-[460px]">
        <div className="space-y-5 text-center">
          {/* Warning icon */}
          <div className="flex justify-center">
            <div className="flex size-16 items-center justify-center rounded-full bg-amber-500/15">
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-amber-500"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>
            </div>
          </div>

          {/* Title */}
          <div className="space-y-2">
            <h2 className="text-xl font-bold">¿Desactivar usuario?</h2>
            <p className="text-sm text-muted-foreground">
              Esta acción revocará el acceso inmediatamente. El usuario no podrá iniciar sesión hasta que sea reactivado por un administrador.
            </p>
          </div>

          {/* Warning about active tasks */}
          {user.activeTasks > 0 && (
            <div className="flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-left">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="mt-0.5 shrink-0 text-amber-500"><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/></svg>
              <p className="text-sm text-amber-500">
                Atención: {user.name} tiene {user.activeTasks} tarea(s) en proceso. Al desactivarlo quedarán sin responsable.
              </p>
            </div>
          )}

          {/* User card */}
          <div className="flex items-center gap-3 rounded-lg border p-4 text-left">
            <div className={`flex size-10 items-center justify-center rounded-full text-sm font-medium ${getAvatarColor(user.name)}`}>
              {getInitials(user.name)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-medium">{user.name}</div>
              <div className="text-sm text-muted-foreground truncate">{user.email}</div>
            </div>
            <Badge variant="outline" className="uppercase text-xs">{user.role}</Badge>
          </div>

          {/* Actions */}
          <div className="space-y-2">
            <Button
              variant="destructive"
              className="w-full"
              onClick={() => { onConfirm(user.id); onClose(); }}
            >
              Desactivar usuario
            </Button>
            <Button variant="outline" className="w-full" onClick={onClose}>
              Cancelar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
