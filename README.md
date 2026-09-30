# TepozTours

Sitio público (español e inglés) y panel de administración de TepozTours, agencia de tours en Tepoztlán, Morelos.

- **Framework:** Next.js 16 (App Router, TypeScript)
- **Hosting:** Cloudflare Workers con [`@opennextjs/cloudflare`](https://opennext.js.org/cloudflare)
- **Datos, login y fotos:** Supabase (Postgres, Auth y Storage)
- **Estilos:** CSS propio (tokens en `src/app/globals.css` y CSS Modules por componente)

## Estructura

```
src/
  app/
    [lang]/                 sitio público: /es y /en
      page.tsx              inicio
      tours/[slug]/         detalle de tour
    admin/                  panel privado
  components/
    site/                   secciones del sitio (hero, tours, explorar…)
    admin/                  componentes del panel
  lib/
    types.ts                modelo de datos
    seed.ts                 datos iniciales (del diseño aprobado)
    site.ts                 lectura del contenido publicado y armado por idioma
    i18n.ts                 textos de la interfaz en ES/EN
supabase/migrations/        esquema de la base de datos
```

## Desarrollo

```bash
npm install
npm run dev
```

Abre http://localhost:3000 (redirige a `/es` o `/en` según el idioma del navegador).

## Despliegue

Cloudflare Workers compila el repositorio en cada push a `main`:

- Comando de compilación: `npx opennextjs-cloudflare build`
- Comando de despliegue: `npx opennextjs-cloudflare deploy`

Las variables públicas de Supabase están en `.env.production` (la clave publicable es segura en el navegador; los datos se protegen con RLS).

## Pendientes del cliente

Fotos reales, número de WhatsApp, correo, dirección, horario, testimonios reales y dominio. Precios, duraciones e itinerarios son de ejemplo.
