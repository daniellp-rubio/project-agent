# AgentHub - Plataforma de Agentes Conversacionales

## Qué es este proyecto
Plataforma multi-tenant para desplegar agentes de IA conversacionales en cualquier negocio.
Incluye widget embebible, dashboard de administración y clasificador automático de conversaciones
que genera analíticas y sugerencias para mejorar los system prompts.

## Stack
- **Next.js 16** (App Router, TypeScript, Tailwind CSS v4)
- **Supabase** — Postgres + Auth + RLS (proyecto: tfcgggbnxfdmufddpdnx)
- **OpenRouter** — chat streaming SSE + clasificador background
- **Recharts** — gráficas en el dashboard
- **Zustand** — estado cliente (disponible pero no usado aún)
- **Zod v4** — validación en API routes

## Estructura del proyecto
```
app/
  (auth)/login|register     — Auth con Supabase client-side
  dashboard/                — Panel admin (Server Components + client islands)
    agents/[id]/            — CRUD agentes + editor system prompt + página embed
    conversations/[id]/     — Timeline + clasificación de cada conv
    analytics/              — Gráficas con AnalyticsDashboard.tsx (client)
  api/
    chat/route.ts           — POST streaming SSE → OpenRouter, guarda mensajes
    classify/route.ts       — POST interno (protegido con CLASSIFY_SECRET)
    agents/route.ts         — CRUD agentes
    analytics/route.ts      — GET analíticas agregadas
    suggestions/route.ts    — PATCH estado sugerencias
  chat/[agentId]/page.tsx   — Widget standalone para iframe/embed
lib/
  supabase/client.ts        — Browser client (createBrowserClient)
  supabase/server.ts        — Server client con cookies (createServerClient)
  supabase/admin.ts         — Service role client (solo en API routes)
  supabase/types.ts         — Tipos completos de BD — actualizar si cambia el schema
  openrouter/chat.ts        — streamChat() y chatCompletion()
  openrouter/classify.ts    — classifyConversation() y generatePromptSuggestion()
components/
  chat/ChatWidget.tsx       — Widget principal con streaming y FAB
  dashboard/Sidebar.tsx     — Navegación del dashboard
  dashboard/AnalyticsDashboard.tsx — Gráficas (recharts, client component)
  dashboard/CopyButton.tsx  — Botón copiar con feedback visual
hooks/
  useChat.ts                — Hook del chat: streaming SSE, historial, sessionId
supabase/migrations/
  001_initial_schema.sql    — Schema completo con RLS y triggers
public/
  embed.js                  — Script embebible para terceros
```

## Convenciones importantes
- **Server Components por defecto** — `'use client'` solo cuando hay estado/interactividad
- **Supabase queries**: `createClient()` en componentes server, `createAdminClient()` en API routes
- **Joins Supabase**: NO usar `.select('*, rel:tabla(*)')` — hacer queries separadas (da SelectQueryError)
- **Tipos**: todos los tipos de BD están en `lib/supabase/types.ts` con el helper `Tables<'nombre_tabla'>`

## Bugs conocidos y sus soluciones
- **Zod v4**: `z.record()` requiere 2 args → usar `z.record(z.string(), z.unknown())`
- **Supabase keys**: las claves `sb_publishable_` / `sb_secret_` NO funcionan con supabase-js v2 — usar JWTs `eyJ...` desde Settings → Data API
- **RLS organizations**: necesita política `FOR INSERT WITH CHECK (auth.uid() IS NOT NULL)`
- **trigger handle_new_user**: requiere `SET search_path = ''` y referencias con `public.profiles`

## Flujo del chat (crítico)
1. Cliente llama `POST /api/chat` con `{agentId, sessionId, message, history}`
2. API carga el agente de Supabase (con service role), valida origen
3. Crea/recupera conversación por `(agent_id, session_id)`
4. Llama OpenRouter con streaming, hace pipe del SSE al cliente
5. Al terminar guarda mensaje del asistente en Supabase
6. Cada 4 mensajes dispara `POST /api/classify` en background (fire & forget)

## Clasificador
- Modelo económico (configurable con `OPENROUTER_CLASSIFY_MODEL`)
- Devuelve JSON: intent, sentiment, urgency, topics, resolution, satisfaction_score, summary, improvement_notes
- Cada 10 clasificaciones genera una `prompt_suggestion` para el agente
- Protegido con header `x-classify-secret`

## Variables de entorno necesarias
```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY      ← JWT eyJ... desde Supabase Settings → Data API
SUPABASE_SERVICE_ROLE_KEY          ← JWT eyJ... desde Supabase Settings → Data API
OPENROUTER_API_KEY
OPENROUTER_CHAT_MODEL=openai/gpt-4o-mini
OPENROUTER_CLASSIFY_MODEL=openai/gpt-4o-mini
NEXT_PUBLIC_APP_URL=http://localhost:3000
CLASSIFY_SECRET                    ← string aleatorio para proteger /api/classify
```

## Flujo de trabajo
1. Cuando agregues funcionalidades, arregles problemas o hagas cambios importantes al sistema, debes documentarlas en README.md y actualizar la versión del proyecto
2. Cuando agregues funcionalidades, arregles problemas o hagas cambios importantes al sistema tienes que crear un commit en base a las reglas de commit de conventional commits (https://www.conventionalcommits.org/en/v1.0.0/), cuando termines de trabajar en una funcionalidad o arreglo de problemas debes crear un pull request para que pueda ser revisado y aprobado por otro desarrollador
3. Debes de comprobar que el sistema funciona correctamente después de cada cambio importante, de lo contrario hasta que el sistema no funcione correctamente no debes de subir ningun cambio

## Estado actual
- ✅ Schema SQL desplegado en Supabase con RLS y triggers
- ✅ Auth funcionando (registro + login)
- ✅ Dashboard con sidebar, overview, analytics, conversations, agents
- ✅ API routes: chat (streaming), classify, agents CRUD, analytics, suggestions
- ✅ ChatWidget con streaming SSE y hook useChat
- ✅ embed.js para integración en terceros
- 🔄 Pendiente verificar flujo completo: crear agente → chat → clasificación → analíticas
