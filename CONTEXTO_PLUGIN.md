# SynchroCode — Contexto para el Plugin de VS Code (M8)

Este documento existe para darle contexto a Claude Code al trabajar en el repositorio del plugin de VS Code de SynchroCode, que es un proyecto separado del frontend web.

---

## ¿Qué es SynchroCode?

Plataforma de gestión de proyectos de software con las siguientes capas:

- **Frontend web**: Astro 5 + React 19 + Tailwind CSS v4 + Shadcn/ui (este repo)
- **Backend**: Supabase (Auth, PostgreSQL, Storage, Realtime) + Lambda AWS (webhooks, archivos ZIP)
- **Plugin**: Extensión de VS Code (repo separado) — M8 del sistema

---

## Estado del frontend web (este repo)

Todos los módulos del frontend están implementados con datos mock, listos para conectar a Supabase:

| Módulo | Páginas | Estado |
|--------|---------|--------|
| M1 - Auth | `/login`, `/setup`, `/auth/github`, `/recuperar-contrasena`, `/activar-cuenta` | ✅ UI completa |
| M2 - Roles RBAC | `/configuracion/roles` | ✅ UI completa |
| M3 - Usuarios | `/usuarios`, `/perfil` | ✅ UI completa |
| M4 - Proyectos | `/proyectos`, `/proyectos/[id]` (tabs: Resumen, Tareas, Equipo, Métricas) | ✅ UI completa |
| M5 - Tareas Kanban | `/tareas`, tab Tareas en proyecto | ✅ UI completa |
| M6 - GitHub | Tab GitHub en `/proyectos/[id]` | ✅ UI completa |
| M7 - Chat + Notificaciones | Tab Chat en proyecto + campana en sidebar | ✅ UI completa |
| M8 - Dashboard | `/dashboard` | ✅ UI completa |

**Todos los componentes usan datos hardcodeados (mock).** El siguiente paso natural es conectar Supabase, pero eso no es bloqueante para el plugin.

---

## Esquema de base de datos (Supabase / PostgreSQL)

El plugin necesita conocer estas tablas para sus queries:

```sql
-- Usuarios (extiende auth.users de Supabase)
profiles (
  id uuid PRIMARY KEY REFERENCES auth.users,
  name text,
  email text,
  role_id uuid REFERENCES roles,
  active boolean DEFAULT true,
  avatar_url text,
  created_at timestamptz
)

-- Roles
roles (id uuid, name text, created_at timestamptz)
role_permissions (role_id uuid, module text, can_read bool, can_write bool, can_delete bool)

-- Proyectos
projects (
  id uuid PRIMARY KEY,
  name text,
  description text,
  status text CHECK (status IN ('activo','en_revision','planificacion','archivado')),
  start_date date,
  end_date date,
  created_by uuid REFERENCES profiles,
  repo_full_name text,       -- GitHub: "org/repo"
  webhook_secret text,
  created_at timestamptz
)

project_members (project_id uuid, user_id uuid, joined_at timestamptz)

-- Tareas
tasks (
  id uuid PRIMARY KEY,
  project_id uuid REFERENCES projects,
  title text,
  description text,
  status text CHECK (status IN ('pendiente','en_proceso','terminado')),
  priority text CHECK (priority IN ('alta','media','baja')),
  assignee_id uuid REFERENCES profiles,
  due_date date,
  created_by uuid REFERENCES profiles,
  created_at timestamptz,
  updated_at timestamptz
)

task_evidence (id uuid, task_id uuid, file_name text, file_url text, size_bytes int, uploaded_by uuid, uploaded_at timestamptz)

-- GitHub
github_commits (id uuid, project_id uuid, task_id uuid, hash text, message text, author text, committed_at timestamptz, merged bool)
github_prs (id uuid, project_id uuid, number int, title text, author text, status text, created_at timestamptz)

-- Chat
channels (id uuid, project_id uuid, name text, created_at timestamptz)
messages (id uuid, channel_id uuid, user_id uuid, content text, created_at timestamptz)

-- Notificaciones
notifications (id uuid, user_id uuid, type text, title text, body text, read bool DEFAULT false, href text, created_at timestamptz)

-- Actividad (audit log)
activity_log (id uuid, user_id uuid, action text, entity_type text, entity_id uuid, metadata jsonb, created_at timestamptz)
```

---

## Autenticación

Supabase Auth con dos métodos:
- **Email/password**: `supabase.auth.signInWithPassword({ email, password })`
- **OAuth GitHub**: `supabase.auth.signInWithOAuth({ provider: 'github' })`

El JWT de sesión se pasa como Bearer token en cada request. El plugin debe almacenar la sesión de forma segura usando la API `SecretStorage` de VS Code.

```typescript
// Guardar sesión
await context.secrets.store('supabase_session', JSON.stringify(session));

// Leer sesión
const raw = await context.secrets.get('supabase_session');
const session = raw ? JSON.parse(raw) : null;
```

---

## M8 — Plugin VS Code: especificación completa

### Casos de uso (CU-036 a CU-041)

| CU | Nombre | Descripción |
|----|--------|-------------|
| CU-036 | Autenticar desde VS Code | Login con email/password o token de sesión existente |
| CU-037 | Ver mis tareas | Lista de tareas asignadas al usuario autenticado |
| CU-038 | Cambiar estado de tarea | Mover tarea entre Pendiente / En Proceso / Terminado |
| CU-039 | Chat mini | Ver y enviar mensajes en canales del proyecto activo |
| CU-040 | Sincronización Realtime | Las tareas y mensajes se actualizan en tiempo real via Supabase Realtime |
| CU-041 | Sesión colaborativa con lock | Al abrir un archivo vinculado a una tarea, bloquea la tarea para otros usuarios |

### Pantallas diseñadas (en el repo web, carpeta `Pantallas/`)

Las pantallas del plugin NO están en mockups HTML, pero el flujo es:

1. **Vista login** — input email + password, botón "Iniciar sesión"
2. **Vista tareas** — lista de tareas con badges de estado y prioridad, botón para cambiar estado
3. **Vista tarea detalle** — título, descripción, estado, prioridad, fecha límite, proyecto
4. **Vista chat mini** — selector de canal, historial de mensajes, input de envío
5. **Vista configuración** — proyecto activo seleccionado, URL del servidor, cerrar sesión

### Estructura sugerida del plugin

```
synchrocode-vscode/
├── src/
│   ├── extension.ts          # activate(), registerCommands()
│   ├── auth/
│   │   ├── AuthProvider.ts   # maneja sesión, login, logout
│   │   └── LoginPanel.ts     # WebviewPanel para login
│   ├── tasks/
│   │   ├── TasksProvider.ts  # TreeDataProvider para la vista de tareas
│   │   └── TaskItem.ts       # TreeItem con badge de estado/prioridad
│   ├── chat/
│   │   └── ChatPanel.ts      # WebviewPanel para chat mini
│   ├── realtime/
│   │   └── RealtimeService.ts # suscripciones Supabase Realtime
│   ├── lock/
│   │   └── FileLockService.ts # bloqueo de archivos vinculados a tareas
│   └── lib/
│       └── supabase.ts       # createClient(url, anonKey)
├── package.json
└── tsconfig.json
```

### Comandos a registrar (`package.json` contributes)

```json
"commands": [
  { "command": "synchrocode.login",          "title": "SynchroCode: Iniciar sesión" },
  { "command": "synchrocode.logout",         "title": "SynchroCode: Cerrar sesión" },
  { "command": "synchrocode.openTasks",      "title": "SynchroCode: Ver mis tareas" },
  { "command": "synchrocode.changeStatus",   "title": "SynchroCode: Cambiar estado de tarea" },
  { "command": "synchrocode.openChat",       "title": "SynchroCode: Abrir chat del proyecto" },
  { "command": "synchrocode.setProject",     "title": "SynchroCode: Seleccionar proyecto activo" }
]
```

### Inputs / Outputs del plugin

| Acción | Input | Supabase call | Output |
|--------|-------|---------------|--------|
| Login | `email`, `password` | `auth.signInWithPassword()` | session JWT → `SecretStorage` |
| Listar tareas | sesión, `project_id?` | `SELECT tasks WHERE assignee_id = uid` | `TreeItem[]` en sidebar |
| Cambiar estado | `task_id`, nuevo `status` | `UPDATE tasks SET status = ?` | refresh TreeView |
| Cargar mensajes | `channel_id` | `SELECT messages WHERE channel_id ORDER BY created_at` | Webview HTML |
| Enviar mensaje | `content`, `channel_id` | `INSERT INTO messages` | append en Webview |
| Realtime tareas | suscripción activa | `supabase.channel('tasks').on('UPDATE', cb)` | refresh TreeView automático |
| Realtime chat | suscripción activa | `supabase.channel('messages').on('INSERT', cb)` | append en Webview |
| Lock archivo | `file_path`, `task_id` | `INSERT INTO file_locks` o UPDATE | decoración en editor (indicador visual) |
| Unlock archivo | al cerrar archivo | `DELETE FROM file_locks WHERE user_id = uid` | quita decoración |

### Tabla `file_locks` (extra, para CU-041)

```sql
file_locks (
  id uuid PRIMARY KEY,
  task_id uuid REFERENCES tasks,
  file_path text,
  locked_by uuid REFERENCES profiles,
  locked_at timestamptz DEFAULT now()
)
```

Realtime suscripción a `file_locks` permite mostrar a otros usuarios quién tiene bloqueado un archivo.

---

## Variables de entorno necesarias

Tanto en el frontend web como en el plugin:

```
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_ANON_KEY=eyJ...
```

En el plugin de VS Code se leen desde la configuración de la extensión (`vscode.workspace.getConfiguration('synchrocode')`):

```json
"configuration": {
  "properties": {
    "synchrocode.supabaseUrl":     { "type": "string" },
    "synchrocode.supabaseAnonKey": { "type": "string" }
  }
}
```
---

## Convenciones de nomenclatura

- IDs de tarea en commits/PRs: formato `SC-XXX` (ej: `closes SC-041`)
- Estados de tarea: `pendiente` | `en_proceso` | `terminado`
- Prioridades: `alta` | `media` | `baja`
- Estados de proyecto: `activo` | `en_revision` | `planificacion` | `archivado`
- Roles del sistema: `admin` | `gerente_ti` | `programador`

---

## Cómo usar este documento

Al abrir el repo del plugin en una nueva sesión de Claude Code, pega o referencia este archivo para que Claude entienda:
- Qué hace SynchroCode completo
- Qué tablas existen en Supabase
- Qué debe construir el plugin (CU-036 a CU-041)
- Cómo se autentican los usuarios
- Qué convenciones de nomenclatura seguir
