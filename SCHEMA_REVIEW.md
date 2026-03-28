# SynchroCode — Revisión del esquema de base de datos

Supabase / PostgreSQL · generado 2026-03-23

---

## Opinión general

El esquema está bien estructurado y toma buenas decisiones de diseño. La separación entre tablas de entidad (UUID PK) y tablas de catálogo (smallint PK), el uso de `jsonb` para datos flexibles, los soft-deletes y las constraints en DB son señales de un diseño maduro. Hay algunos puntos a corregir antes de conectar el frontend.

---

## Lo que está bien ✅

| Decisión | Por qué es correcta |
|----------|---------------------|
| `User.id uuid` sin `GENERATED` | Mapea directo a `auth.users.id` de Supabase Auth, sin duplicar identidad |
| PKs `smallint` en catálogos | `TaskStatus`, `TaskPriority`, `Role`, etc. son tablas fijas — smallint ahorra espacio y es semántico |
| `Task.jira_task_id` único | Da IDs legibles tipo `SC-041` para mencionar en commits/PRs |
| `GitHubRepositoryLink.github_installation_id` | Indica GitHub App (no OAuth personal) — correcto para webhooks a nivel organización |
| `GitHubRepositoryLink.unlinked_at` | Soft-delete: conserva el historial de vinculaciones anteriores |
| `TaskEvidence` con check `<= 52428800` | Límite de 50MB aplicado en BD, no solo en frontend |
| `ChatMessage.body` check `1-4000` | Validación de contenido en BD como segunda línea de defensa |
| `User.notification_prefs jsonb` | Extensible sin migraciones para agregar canales (Slack, email, etc.) |
| `ProjectBackup.is_archival` | Distingue backups manuales de backups generados al archivar |
| `CollaborativeSession.last_heartbeat_at` | Permite detectar sesiones fantasma y limpiarlas automáticamente |
| `AuditLog.meta jsonb` | Datos variables por tipo de acción sin romper el esquema |

---

## Problemas a corregir ⚠️

### 1. `Project` no tiene campo de estado explícito

**Problema:** El frontend usa 4 estados: `activo | en_revision | planificacion | archivado`. La tabla solo tiene `project_active boolean` y `archived_at`. No hay forma de representar `en_revision` o `planificacion`.

**Fix:** Agregar FK a una tabla de catálogo, igual que `Task.status_id`:

```sql
CREATE TABLE public.ProjectStatus (
  id   smallint NOT NULL,
  name character varying NOT NULL UNIQUE,
  CONSTRAINT ProjectStatus_pkey PRIMARY KEY (id)
);
-- Seed: 1=planificacion, 2=activo, 3=en_revision, 4=archivado

ALTER TABLE public.Project
  ADD COLUMN status_id smallint NOT NULL DEFAULT 2
    REFERENCES public.ProjectStatus(id);

-- project_active y archived_at pueden derivarse de status_id
-- o mantenerse como columnas computadas/desnormalizadas para queries rápidas
```

---

### 2. `ChatMessage` no tiene canales

**Problema:** El frontend muestra canales por proyecto (`#general`, `#diseño-ui`, `#backend`). La tabla solo tiene `project_id` — todos los mensajes del proyecto van a un solo hilo.

**Fix:** Agregar tabla `Channel` con FK en `ChatMessage`:

```sql
CREATE TABLE public.Channel (
  id         uuid NOT NULL DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.Project(id),
  name       character varying NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT Channel_pkey PRIMARY KEY (id),
  CONSTRAINT uq_Channel_project_name UNIQUE (project_id, name)
);

ALTER TABLE public.ChatMessage
  ADD COLUMN channel_id uuid REFERENCES public.Channel(id);
```

Si no quieres canales por ahora, al menos agrega `channel character varying DEFAULT 'general'` para poder filtrar después sin migración destructiva.

---

### 3. `Task.jira_task_id` — nombre engañoso

**Problema:** Se llama `jira_task_id` pero es el ID propio de SynchroCode (`SC-041`). El nombre implica integración con Jira que no existe.

**Fix:**
```sql
ALTER TABLE public.Task RENAME COLUMN jira_task_id TO task_code;
```

---

### 4. `PullRequestLink.is_merged` es redundante con `status_id`

**Problema:** Si `status_id` apunta a `PullRequestStatus` (open/merged/closed), el campo `is_merged boolean` duplica información. Pueden quedar desincronizados.

**Fix:** Eliminar `is_merged` y derivarlo en una vista o en el cliente:
```sql
-- En queries, en lugar de is_merged usar:
prs.status_id = (SELECT id FROM PullRequestStatus WHERE name = 'merged')
```

O si quieres mantenerlo por rendimiento, agregar un trigger que lo mantenga sincronizado.

---

### 5. `CommitLink` no tiene `project_id`

**Problema:** Para listar todos los commits de un proyecto tienes que hacer JOIN a través de `Task`. En el frontend de GitHub tab esto se hace constantemente.

**Fix — opción A (desnormalización):**
```sql
ALTER TABLE public.CommitLink
  ADD COLUMN project_id uuid REFERENCES public.Project(id);
```

**Fix — opción B (vista):**
```sql
CREATE VIEW public.vw_CommitLink AS
  SELECT cl.*, t.project_id
  FROM   public.CommitLink cl
  JOIN   public.Task t ON t.id = cl.task_id;
```

Lo mismo aplica para `PullRequestLink`.

---

### 6. `CollaborativeSession.session_passcode` en texto plano

**Problema:** Un passcode guardado como `character varying` sin hashear es un riesgo si alguien con acceso a la BD puede leer sesiones activas.

**Fix:** Guardar el hash bcrypt/SHA-256 y comparar en la lógica de la extensión:
```sql
-- Cambiar tipo o al menos documentar que se almacena el hash
session_passcode_hash character varying NOT NULL
```

---

### 7. Sin RLS (Row Level Security)

**Problema:** En Supabase, si no hay políticas RLS, cualquier usuario con el `anon key` puede leer/escribir todas las filas. El esquema no las muestra (pueden estar configuradas en el dashboard pero no en el DDL).

**Políticas mínimas requeridas:**

```sql
-- Habilitar RLS en todas las tablas públicas
ALTER TABLE public.User              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.Project           ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.Task              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ChatMessage       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.Notification      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.CollaborativeSession ENABLE ROW LEVEL SECURITY;

-- Ejemplo: usuario solo ve sus propias notificaciones
CREATE POLICY notif_own ON public.Notification
  FOR ALL USING (user_id = auth.uid());

-- Ejemplo: usuario solo ve proyectos donde es miembro
CREATE POLICY project_member ON public.Project
  FOR SELECT USING (
    id IN (SELECT project_id FROM public.ProjectTeam WHERE user_id = auth.uid())
    OR created_by = auth.uid()
  );

-- Ejemplo: mensajes solo del mismo proyecto donde eres miembro
CREATE POLICY chat_member ON public.ChatMessage
  FOR ALL USING (
    project_id IN (SELECT project_id FROM public.ProjectTeam WHERE user_id = auth.uid())
  );
```

---

### 8. `Project.name UNIQUE` puede ser restrictivo

**Problema:** En un sistema multiequipo, dos proyectos con el mismo nombre (ej: "Dashboard interno") de distintos clientes no pueden coexistir.

**Consideración:** Si SynchroCode es para una sola organización, el UNIQUE está bien. Si escala a múltiples organizaciones/tenants, cambiar a `UNIQUE (name, created_by)` o agregar `org_id`.

---

## Mapeo frontend → BD

Cómo conectar los componentes React actuales (que tienen datos mock) a estas tablas:

| Componente | Query principal |
|------------|----------------|
| `DashboardPage.tsx` | `SELECT COUNT(*) FROM Project WHERE status_id=2` · `SELECT tasks con due_date próximo` |
| `ProjectsPage.tsx` | `SELECT p.*, COUNT(t) FROM Project p JOIN ProjectTeam pt ON... LEFT JOIN Task t ON...` |
| `ProjectDetailPage.tsx` — Resumen | `SELECT * FROM Project WHERE id=?` + task counts |
| `ProjectDetailPage.tsx` — Equipo | `SELECT u.* FROM ProjectTeam pt JOIN User u ON pt.user_id=u.id WHERE project_id=?` |
| `KanbanBoard.tsx` | `SELECT * FROM Task WHERE project_id=? ORDER BY status_id, created_at` |
| `TaskDetailDialog.tsx` | `SELECT t.*, u.full_name, te.* FROM Task t LEFT JOIN TaskEvidence te ON...` |
| `GitHubTab.tsx` — repo | `SELECT * FROM GitHubRepositoryLink WHERE project_id=? AND unlinked_at IS NULL` |
| `GitHubTab.tsx` — commits | `SELECT cl.* FROM CommitLink cl JOIN Task t ON cl.task_id=t.id WHERE t.project_id=?` |
| `GitHubTab.tsx` — PRs | `SELECT prl.* FROM PullRequestLink prl JOIN Task t ON prl.task_id=t.id WHERE t.project_id=?` |
| `ChatTab.tsx` | `SELECT * FROM ChatMessage WHERE project_id=? ORDER BY sent_at` (+ channel cuando exista) |
| `NotificationsDropdown.tsx` | `SELECT * FROM Notification WHERE user_id=auth.uid() ORDER BY created_at DESC LIMIT 20` |
| `RolesPage.tsx` | `SELECT * FROM Role ORDER BY id` |
| `UsersPage.tsx` | `SELECT u.*, r.name FROM User u JOIN Role r ON u.role_id=r.id WHERE is_active=true` |

---

## Datos de catálogo a insertar (seed)

```sql
-- TaskStatus
INSERT INTO TaskStatus VALUES (1,'pendiente'), (2,'en_proceso'), (3,'terminado');

-- TaskPriority
INSERT INTO TaskPriority VALUES (1,'baja'), (2,'media'), (3,'alta');

-- PullRequestStatus
INSERT INTO PullRequestStatus VALUES (1,'open'), (2,'merged'), (3,'closed');

-- Role
INSERT INTO Role (id, name, description, permissions) VALUES
  (1, 'admin',       'Acceso total al sistema',                '{"all": true}'::jsonb),
  (2, 'gerente_ti',  'Gestión de proyectos y equipo',          '{"projects": true, "users": true, "tasks": true}'::jsonb),
  (3, 'programador', 'Acceso a tareas y proyectos asignados',  '{"tasks": true}'::jsonb);

-- NotificationType
INSERT INTO NotificationType VALUES
  (1,'task_assigned'), (2,'task_status_changed'), (3,'comment'),
  (4,'pr_merged'), (5,'deadline_warning'), (6,'role_changed'), (7,'member_added');

-- AuditLogActionType (muestra)
INSERT INTO AuditLogActionType VALUES
  (1,  'auth',     'login',              'Usuario inició sesión'),
  (2,  'auth',     'logout',             'Usuario cerró sesión'),
  (3,  'users',    'user_created',       'Nuevo usuario creado'),
  (4,  'users',    'user_deactivated',   'Usuario desactivado'),
  (5,  'projects', 'project_created',    'Proyecto creado'),
  (6,  'projects', 'project_archived',   'Proyecto archivado'),
  (7,  'tasks',    'task_created',       'Tarea creada'),
  (8,  'tasks',    'task_status_changed','Estado de tarea cambiado'),
  (9,  'github',   'repo_linked',        'Repositorio vinculado'),
  (10, 'github',   'webhook_received',   'Webhook de GitHub recibido');
```

---

## Resumen de cambios prioritarios

| Prioridad | Cambio |
|-----------|--------|
| 🔴 Alta | Agregar `ProjectStatus` + `status_id` en `Project` — el frontend lo requiere |
| 🔴 Alta | Habilitar RLS en todas las tablas antes de conectar el frontend |
| 🟡 Media | Agregar `Channel` + `channel_id` en `ChatMessage` — el frontend ya muestra canales |
| 🟡 Media | Renombrar `Task.jira_task_id` → `task_code` |
| 🟡 Media | Agregar `project_id` en `CommitLink` y `PullRequestLink` (o crear vistas) |
| 🟢 Baja | Eliminar `PullRequestLink.is_merged` (redundante con `status_id`) |
| 🟢 Baja | Hashear `CollaborativeSession.session_passcode` |
