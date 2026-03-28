import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  activo: { label: "Activo", color: "bg-emerald-500/15 text-emerald-500 border-emerald-500/30" },
  en_revision: { label: "En revisión", color: "bg-amber-500/15 text-amber-500 border-amber-500/30" },
  planificacion: { label: "Planificación", color: "bg-muted-foreground/15 text-muted-foreground border-muted-foreground/30" },
};

const COLORS = ["bg-blue-500/20 text-blue-500", "bg-purple-500/20 text-purple-500", "bg-amber-500/20 text-amber-500", "bg-emerald-500/20 text-emerald-500", "bg-rose-500/20 text-rose-500"];
function avatarColor(name: string) { let h = 0; for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h); return COLORS[Math.abs(h) % COLORS.length]; }
function initials(name: string) { return name.split(" ").map((w) => w[0]).join("").toUpperCase().slice(0, 2); }

const projects = [
  { id: "1", name: "Redesign Website 2024", description: "Actualización completa de la identidad visual y experiencia de usuario del sitio web corporativo.", status: "activo", totalTasks: 20, completedTasks: 12, pendingTasks: 3, inProgressTasks: 5, members: ["Sarah Connor", "James Reese", "Marcus Chen"], startDate: "01 Ene", endDate: "30 Jun" },
  { id: "2", name: "Mobile App V2", description: "Desarrollo de nuevas funcionalidades para la aplicación móvil iOS y Android.", status: "en_revision", totalTasks: 48, completedTasks: 45, pendingTasks: 1, inProgressTasks: 2, members: ["Ana López", "Luis M."], startDate: "15 Feb", endDate: "20 May" },
  { id: "3", name: "API Integration Hub", description: "Conexión de servicios de terceros para centralizar datos de clientes.", status: "activo", totalTasks: 30, completedTasks: 5, pendingTasks: 15, inProgressTasks: 10, members: ["Carlos G.", "Elena L.", "Pedro S."], startDate: "01 Abr", endDate: "30 Sep" },
  { id: "4", name: "Marketing Q3 Campaign", description: "Preparación de assets digitales y landing pages para la campaña de marketing Q3.", status: "planificacion", totalTasks: 15, completedTasks: 0, pendingTasks: 15, inProgressTasks: 0, members: [], startDate: "01 Jul", endDate: "31 Ago" },
  { id: "5", name: "Internal Dashboard", description: "Herramienta interna para métricas de rendimiento del equipo.", status: "activo", totalTasks: 40, completedTasks: 28, pendingTasks: 4, inProgressTasks: 8, members: ["Sarah C.", "James R.", "Marcus C."], startDate: "10 Mar", endDate: "10 Ago" },
];

export function TasksProjectsPage() {
  const [search, setSearch] = useState("");

  const filtered = useMemo(() => {
    if (!search) return projects;
    return projects.filter((p) => p.name.toLowerCase().includes(search.toLowerCase()));
  }, [search]);

  return (
    <div className="p-6 lg:p-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Tareas</h1>
        <p className="text-sm text-muted-foreground">Selecciona un proyecto para ver su tablero Kanban.</p>
      </div>

      <div className="relative w-72">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
        <Input placeholder="Buscar proyecto..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map((p) => {
          const cfg = STATUS_CONFIG[p.status];
          const pct = p.totalTasks > 0 ? Math.round((p.completedTasks / p.totalTasks) * 100) : 0;
          return (
            <a key={p.id} href={`/proyectos/${p.id}?tab=tareas`} className="group rounded-xl border p-5 space-y-4 hover:border-primary/50 transition-colors">
              <div className="flex items-center justify-between">
                <Badge variant="outline" className={`text-xs ${cfg.color}`}>{cfg.label}</Badge>
                <div className="flex gap-3 text-xs text-muted-foreground">
                  <span className="text-amber-500">{p.inProgressTasks} en proceso</span>
                  <span>{p.pendingTasks} pendientes</span>
                </div>
              </div>
              <div>
                <h3 className="font-semibold group-hover:text-primary transition-colors">{p.name}</h3>
                <p className="text-sm text-muted-foreground line-clamp-2 mt-1">{p.description}</p>
              </div>
              {/* Progress */}
              <div className="space-y-1.5">
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Progreso</span>
                  <span>{p.completedTasks}/{p.totalTasks} tareas</span>
                </div>
                <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
                  <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${pct}%` }} />
                </div>
              </div>
              {/* Footer */}
              <div className="flex items-center justify-between">
                <div className="flex -space-x-2">
                  {p.members.slice(0, 3).map((m, i) => (
                    <div key={i} className={`flex size-7 items-center justify-center rounded-full border-2 border-card text-[10px] font-medium ${avatarColor(m)}`}>
                      {initials(m)}
                    </div>
                  ))}
                  {p.members.length > 3 && (
                    <div className="flex size-7 items-center justify-center rounded-full border-2 border-card bg-secondary text-[10px] font-medium text-muted-foreground">+{p.members.length - 3}</div>
                  )}
                </div>
                <span className="text-xs text-muted-foreground">{p.startDate} - {p.endDate}</span>
              </div>
            </a>
          );
        })}
      </div>
    </div>
  );
}
