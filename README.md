# SynchroCode

Aplicación web de gestión de proyectos y equipos, construida con Astro 5 + React 19 + Tailwind CSS v4 + Shadcn/ui.

## Stack tecnológico

- **Framework**: Astro 5 (file-based routing)
- **UI interactiva**: React 19 via `@astrojs/react`
- **Estilos**: Tailwind CSS v4 con espacio de color OKLCH
- **Componentes**: Shadcn/ui (estilo New York, base neutral) + Radix UI + Lucide icons
- **Autenticación**: Supabase (JWT)
- **Backend**: Quarkus en `http://localhost:8080`
- **Lenguaje**: TypeScript (modo estricto)

## Requisitos previos

- Node.js 18+
- Backend Quarkus corriendo en `localhost:8080`
- Cuenta y proyecto en Supabase

## Configuración

Crea un archivo `.env` en la raíz del proyecto:

```env
PUBLIC_SUPABASE_URL=<tu-supabase-url>
PUBLIC_SUPABASE_ANON_KEY=<tu-supabase-anon-key>
PUBLIC_API_URL=http://localhost:8080
```

## Comandos

```bash
npm install             # Instalar dependencias
npm run dev             # Dev server en localhost:4321
npm run build           # Build de producción en ./dist/
npm run preview         # Preview del build localmente
npx shadcn add <comp>   # Agregar componente de Shadcn/ui
```

## Estructura del proyecto

```
src/
├── pages/              # Rutas (cada archivo = una ruta)
│   ├── index.astro
│   ├── login.astro
│   ├── dashboard.astro
│   ├── perfil.astro
│   ├── setup.astro
│   ├── tareas.astro
│   ├── activar-cuenta.astro
│   ├── auth/
│   ├── proyectos/
│   ├── usuarios/
│   ├── configuracion/
│   └── recuperar-contrasena/
├── components/         # Componentes reutilizables
│   ├── ui/             # Componentes Shadcn/ui
│   ├── auth/
│   ├── dashboard/
│   ├── layout/
│   ├── proyectos/
│   ├── roles/
│   ├── tareas/
│   └── usuarios/
├── lib/
│   ├── api.ts          # Cliente HTTP centralizado (maneja JWT automáticamente)
│   ├── projects.ts     # Servicio de proyectos
│   └── utils.ts        # Helper cn() para clases Tailwind
├── layouts/            # Wrappers HTML
└── styles/
    └── global.css      # Variables de tema (light/dark)
Pantallas/              # Mockups de pantallas (HTML + PNG) de referencia
Contexto/               # Documentos de requerimientos (.docx)
```

## Arquitectura

### Integración con el backend

El cliente HTTP en `src/lib/api.ts` adjunta automáticamente el JWT de Supabase en cada petición como `Authorization: Bearer <token>`. Para agregar un nuevo módulo del backend, crear un archivo de servicio en `src/lib/` siguiendo el patrón de `projects.ts`.

CORS requerido en `application.properties` de Quarkus:

```properties
quarkus.http.cors=true
quarkus.http.cors.origins=http://localhost:4321
quarkus.http.cors.methods=GET,PUT,POST,DELETE,OPTIONS
quarkus.http.cors.headers=accept, authorization, content-type, x-requested-with
```

### Modo oscuro

Soportado via clase `.dark` en el elemento raíz. Los temas se definen en `src/styles/global.css` con paletas separadas para light/dark.

### React en Astro

Los componentes React interactivos requieren directivas de hidratación de Astro:

```astro
<MiComponente client:load />
<MiComponente client:visible />
```

Los componentes estáticos no necesitan directiva.

### Path alias

`@/*` apunta a `./src/*`.
