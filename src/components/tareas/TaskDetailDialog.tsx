import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogFooter } from "@/components/ui/dialog";
import type { Task, TaskStatus } from "./types";
import { PRIORITY_CONFIG, STATUS_CONFIG } from "./types";

interface Props {
  open: boolean;
  onClose: () => void;
  task: Task | null;
  onStatusChange: (id: string, status: TaskStatus) => void;
  onUploadEvidence: (id: string) => void;
}

export function TaskDetailDialog({ open, onClose, task, onStatusChange, onUploadEvidence }: Props) {
  if (!task) return null;
  const pc = PRIORITY_CONFIG[task.priority];

  const history = [
    { text: <>Estado cambiado a <span className="text-primary">En Proceso</span></>, sub: "Hace 3 horas por Alex Rivera" },
    { text: <>Se adjuntó <strong>dashboard_mockup.png</strong></>, sub: "Hace 5 horas por Marta S." },
    { text: <>Tarea creada</>, sub: `${task.createdAt} por ${task.createdBy}` },
  ];

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-[740px] max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="space-y-2">
            <div className="flex items-center gap-3">
              <Badge variant="outline" className={pc.color}>{pc.label}</Badge>
              <span className="text-sm text-muted-foreground flex items-center gap-1">
                <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg>
                Vence: {task.dueDate}
              </span>
            </div>
            <h2 className="text-xl font-bold">{task.title}</h2>
            <Badge variant="outline" className="text-xs border-primary/30 text-primary">SynchroCode Development</Badge>
          </div>
          <Select value={task.status} onValueChange={(v) => onStatusChange(task.id, v as TaskStatus)}>
            <SelectTrigger className={`w-[150px] ${STATUS_CONFIG[task.status].color} border-0`}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pendiente">Pendiente</SelectItem>
              <SelectItem value="en_proceso">En Proceso</SelectItem>
              <SelectItem value="terminado">Terminado</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="grid grid-cols-[1fr_260px] gap-6 mt-4">
          {/* Left: description + evidence */}
          <div className="space-y-6">
            <div className="space-y-2">
              <h3 className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/></svg>
                Descripción
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{task.description}</p>
            </div>

            <div className="space-y-3">
              <h3 className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m21.44 11.05-9.19 9.19a6 6 0 0 1-8.49-8.49l8.57-8.57A4 4 0 1 1 18 8.84l-8.59 8.57a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>
                Evidencia adjunta
              </h3>
              {task.evidence.map((e, i) => (
                <div key={i} className="flex items-center gap-3 rounded-lg border p-3">
                  <div className={`flex size-9 items-center justify-center rounded-lg ${e.name.endsWith(".png") || e.name.endsWith(".jpg") ? "bg-blue-500/15 text-blue-500" : "bg-rose-500/15 text-rose-500"}`}>
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/></svg>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{e.name}</div>
                    <div className="text-xs text-muted-foreground">{e.size}</div>
                  </div>
                  <Button variant="ghost" size="icon-sm">
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/></svg>
                  </Button>
                </div>
              ))}
              <button onClick={() => onUploadEvidence(task.id)} className="flex w-full items-center justify-center gap-2 rounded-lg border border-dashed p-3 text-sm text-muted-foreground hover:text-foreground hover:border-primary/50 transition-colors">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
                Subir evidencia
              </button>
            </div>
          </div>

          {/* Right sidebar */}
          <div className="space-y-6">
            <div className="rounded-lg border p-4 space-y-4 text-sm">
              <div>
                <p className="text-xs uppercase text-muted-foreground">Responsable</p>
                <div className="flex items-center gap-2 mt-1">
                  <div className="flex size-7 items-center justify-center rounded-full bg-amber-500/20 text-amber-500 text-[10px] font-medium">AR</div>
                  <span className="font-medium">{task.assignee || "Sin asignar"}</span>
                </div>
              </div>
              <div>
                <p className="text-xs uppercase text-muted-foreground">Prioridad</p>
                <div className="flex items-center gap-1.5 mt-1">
                  <span className={`size-2 rounded-full ${task.priority === "alta" ? "bg-rose-500" : task.priority === "media" ? "bg-amber-500" : "bg-muted-foreground"}`} />
                  <span className={task.priority === "alta" ? "text-rose-500" : task.priority === "media" ? "text-amber-500" : ""}>{pc.label.charAt(0) + pc.label.slice(1).toLowerCase()}</span>
                </div>
              </div>
              <div>
                <p className="text-xs uppercase text-muted-foreground">Fecha de entrega</p>
                <p className="mt-1 font-medium">{task.dueDate}</p>
              </div>
              <div>
                <p className="text-xs uppercase text-muted-foreground">Proyecto</p>
                <p className="mt-1 text-primary">SynchroCode Dev</p>
              </div>
              <div>
                <p className="text-xs uppercase text-muted-foreground">Creada por</p>
                <p className="mt-1">{task.createdBy} · {task.createdAt}</p>
              </div>
            </div>

            {/* History */}
            <div className="space-y-3">
              <h3 className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                Historial
              </h3>
              <div className="space-y-3 border-l-2 border-muted pl-4">
                {history.map((h, i) => (
                  <div key={i}>
                    <p className="text-sm">{h.text}</p>
                    <p className="text-xs text-muted-foreground">{h.sub}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button onClick={onClose}>Guardar cambios</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
