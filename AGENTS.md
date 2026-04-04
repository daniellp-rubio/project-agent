# AgentHub — Guía para Asistentes de IA

## Contexto del proyecto
Plataforma multi-tenant de agentes conversacionales con Next.js 16, Supabase y OpenRouter.
Antes de tocar cualquier archivo, lee CLAUDE.md para entender la arquitectura completa.

## Reglas críticas

### Next.js 16 (App Router)
- Todos los componentes son Server Components por defecto
- Usar `'use client'` solo cuando hay hooks de estado o eventos del DOM
- Las API routes usan `NextRequest` / `NextResponse`, no `req`/`res` de Express
- Los params de rutas dinámicas son `Promise<{id: string}>` — siempre hacer `await params`
- `cookies()` de `next/headers` es async — siempre `await cookies()`

### Supabase
- NUNCA usar `.select('*, rel:tabla(*)')` para joins — hacer queries separadas
- Client browser → `lib/supabase/client.ts`
- Client server (Server Components/actions) → `lib/supabase/server.ts`
- Client admin (API routes) → `lib/supabase/admin.ts` con service role key
- Los tipos están en `lib/supabase/types.ts` — usar `Tables<'nombre'>` para tipos de filas

### Zod v4
- `z.record()` requiere dos argumentos: `z.record(z.string(), z.unknown())`
- `z.string().uuid()` sigue funcionando igual

### TypeScript
- No usar `as any` — castear a tipos específicos definidos en `lib/supabase/types.ts`
- Para campos JSON de Supabase castear explícitamente: `field as MiTipo | null`

## Lo que NO hacer
- No exponer `SUPABASE_SERVICE_ROLE_KEY` en componentes cliente
- No hacer subqueries Supabase dentro de `.in()` — resolver el array primero
- No añadir `console.log` en producción
- No crear archivos de documentación (.md) adicionales sin que el usuario lo pida
- No añadir abstracciones innecesarias — mantener el código directo y simple
