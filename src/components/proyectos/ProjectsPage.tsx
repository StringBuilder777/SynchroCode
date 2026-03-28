import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ProjectFormDialog } from "./ProjectFormDialog";
import type { Project } from "./types";
import { STATUS_CONFIG, getInitials, getAvatarColor } from "./types";

const initialProjects: Project[] = [
  { id: "1", name: "Redesign Website 2024", description: "Actualización completa de la identidad visual y experiencia de usuario del sitio web corporativo.", status: "activo", startDate: "2024-01-01", endDate: "2024-06-30", totalTasks: 20, completedTasks: 12, members: [{ name: "Sarah Connor", role: "PM" }, { name: "James Reese", role: "Dev" }, { name: "Marcus Chen", role: "Dev" }], createdBy: "Admin User" },
  { id: "2", name: "Mobile App V2", description: "Desarrollo de nuevas funcionalidades para la aplicación móvil iOS y Android.", status: "en_revision", startDate: "2024-02-15", endDate: "2024-05-20", totalTasks: 48, completedTasks: 45, members: [{ name: "Ana López", role: "PM" }, { name: "Luis M.", role: "Dev" }], createdBy: "Admin User" },
  { id: "3", name: "API Integration Hub", description: "Conexión de servicios de terceros para centralizar datos de clientes.", status: "activo", startDate: "2024-04-01", endDate: "2024-09-30", totalTasks: 30, completedTasks: 5, members: [{ name: "Carlos G.", role: "Dev" }, { name: "Elena L.", role: "Dev" }, { name: "Pedro S.", role: "QA" }], createdBy: "Admin User" },
  { id: "4", name: "Marketing Q3 Campaign", description: "Preparación de assets digitales y landing pages para la campaña de marketing Q3.", status: "planificacion", startDate: "2024-07-01", endDate: "2024-08-31", totalTasks: 15, completedTasks: 0, members: [], createdBy: "Admin User" },
  { id: "5", name: "Internal Dashboard", description: "Herramienta interna para métricas de rendimiento del equipo.", status: "activo", startDate: "2024-03-10", endDate: "2024-08-10", totalTasks: 40, completedTasks: 28, members: [{ name: "Sarah C.", role: "PM" }, { name: "James R.", role: "Dev" }, { name: "Marcus C.", role: "Dev" }], createdBy: "Admin User" },
];

const TABS = [
  { key: "activos", label: "Activos" },
  { key: "archivados", label: "Archivados" },
  { key: "todos", label: "Todos" },
];

export function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>(initialProjects);
  const [tab, setTab] = useState("activos");
  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);

  const filtered = useMemo(() => {
    return projects.filter((p) => {
      const matchTab = tab === "todos" || (tab === "activos" ? p.status !== "archivado" : p.status === "archivado");
      const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase());
      return matchTab && matchSearch;
    });
  }, [projects, tab, search]);

  function handleSave(data: Pick<Project, "name" | "description" | "startDate" | "endDate">) {
    if (editingProject) {
      setProjects((prev) => prev.map((p) => (p.id === editingProject.id ? { ...p, ...data } : p)));
    } else {
      setProjects((prev) => [...prev, {
        id: crypto.randomUUID(), status: "activo", totalTasks: 0, completedTasks: 0, members: [], createdBy: "Admin User", ...data,
      }]);
    }
    setEditingProject(null);
  }

  function formatDate(d: string) {
    if (!d) return "";
    const date = new Date(d + "T00:00:00");
    return date.toLocaleDateString("es", { day: "2-digit", month: "short" });
  }

  function getProgressColor(completed: number, total: number) {
    if (total === 0) return "bg-muted";
    const pct = completed / total;
    if (pct >= 0.9) return "bg-amber-500";
    if (pct >= 0.5) return "bg-primary";
    return "bg-primary";
  }

  return (
    <div className="p-6 lg:p-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Proyectos</h1>
          <p className="text-sm text-muted-foreground">Gestiona y monitorea el progreso de tus proyectos activos.</p>
        </div>
        <Button onClick={() => { setEditingProject(null); setFormOpen(true); }}>
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
          Nuevo Proyecto
        </Button>
      </div>

      {/* Tabs + Search */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex gap-1 rounded-lg border p-1">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`rounded-md px-4 py-1.5 text-sm font-medium transition-colors ${tab === t.key ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}
            >
              {t.label}
            </button>
          ))}
        </div>
        <div className="relative w-64">
          <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
          <Input placeholder="Buscar proyecto..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
      </div>

      {/* Cards grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map((p) => {
          const cfg = STATUS_CONFIG[p.status];
          const pct = p.totalTasks > 0 ? Math.round((p.completedTasks / p.totalTasks) * 100) : 0;
          return (
            <a key={p.id} href={`/proyectos/${p.id}`} className="group rounded-xl border p-5 space-y-4 hover:border-primary/50 transition-colors">
              <Badge variant="outline" className={`text-xs ${cfg.color}`}>{cfg.label}</Badge>
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
                  <div className={`h-full rounded-full transition-all ${getProgressColor(p.completedTasks, p.totalTasks)}`} style={{ width: `${pct}%` }} />
                </div>
              </div>
              {/* Footer */}
              <div className="flex items-center justify-between">
                <div className="flex -space-x-2">
                  {p.members.slice(0, 3).map((m, i) => (
                    <div key={i} className={`flex size-7 items-center justify-center rounded-full border-2 border-card text-[10px] font-medium ${getAvatarColor(m.name)}`}>
                      {getInitials(m.name)}
                    </div>
                  ))}
                  {p.members.length > 3 && (
                    <div className="flex size-7 items-center justify-center rounded-full border-2 border-card bg-secondary text-[10px] font-medium text-muted-foreground">
                      +{p.members.length - 3}
                    </div>
                  )}
                  {p.members.length === 0 && (
                    <div className="flex size-7 items-center justify-center rounded-full border-2 border-dashed border-muted-foreground text-muted-foreground">
                      <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
                    </div>
                  )}
                </div>
                <span className="text-xs text-muted-foreground">{formatDate(p.startDate)} - {formatDate(p.endDate)}</span>
              </div>
            </a>
          );
        })}

        {/* New project card */}
        <button
          onClick={() => { setEditingProject(null); setFormOpen(true); }}
          className="flex flex-col items-center justify-center gap-3 rounded-xl border border-dashed p-8 text-muted-foreground hover:border-primary/50 hover:text-foreground transition-colors"
        >
          <div className="flex size-12 items-center justify-center rounded-full bg-secondary">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
          </div>
          <div className="text-center">
            <div className="font-semibold">Nuevo Proyecto</div>
            <div className="text-sm">Crea un nuevo espacio de trabajo y asigna equipo.</div>
          </div>
        </button>
      </div>

      {filtered.length === 0 && (
        <div className="py-12 text-center text-muted-foreground">
          No hay proyectos disponibles.
        </div>
      )}

      <ProjectFormDialog open={formOpen} onClose={() => { setFormOpen(false); setEditingProject(null); }} onSave={handleSave} project={editingProject} />
    </div>
  );
}
