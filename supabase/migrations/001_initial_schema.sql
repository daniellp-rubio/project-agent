-- ============================================================
-- SCHEMA INICIAL - Plataforma de Agentes Conversacionales
-- ============================================================

-- Habilitar extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm"; -- Para búsqueda de texto

-- ============================================================
-- ORGANIZACIONES (multi-tenant)
-- ============================================================
CREATE TABLE organizations (
  id            uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  name          text NOT NULL,
  slug          text UNIQUE NOT NULL,
  logo_url      text,
  plan          text NOT NULL DEFAULT 'free' CHECK (plan IN ('free', 'pro', 'enterprise')),
  settings      jsonb NOT NULL DEFAULT '{}',
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- PERFILES DE USUARIO (vinculados a Supabase Auth)
-- ============================================================
CREATE TABLE profiles (
  id            uuid PRIMARY KEY REFERENCES auth.users ON DELETE CASCADE,
  org_id        uuid REFERENCES organizations ON DELETE SET NULL,
  full_name     text,
  avatar_url    text,
  role          text NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member')),
  created_at    timestamptz NOT NULL DEFAULT now(),
  updated_at    timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- AGENTES
-- ============================================================
CREATE TABLE agents (
  id              uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id          uuid NOT NULL REFERENCES organizations ON DELETE CASCADE,
  name            text NOT NULL,
  description     text,
  system_prompt   text NOT NULL DEFAULT 'Eres un asistente de atención al cliente amable y útil. Responde siempre en el idioma del usuario.',
  model           text NOT NULL DEFAULT 'openai/gpt-4o-mini',
  temperature     float NOT NULL DEFAULT 0.7 CHECK (temperature >= 0 AND temperature <= 2),
  max_tokens      int NOT NULL DEFAULT 1000 CHECK (max_tokens > 0 AND max_tokens <= 8000),
  language        text NOT NULL DEFAULT 'es',
  is_active       boolean NOT NULL DEFAULT true,
  widget_config   jsonb NOT NULL DEFAULT '{
    "primaryColor": "#2563eb",
    "position": "bottom-right",
    "welcomeMessage": "¡Hola! ¿En qué puedo ayudarte hoy?",
    "placeholder": "Escribe tu mensaje...",
    "agentName": "Asistente",
    "showBranding": true
  }',
  allowed_origins text[] NOT NULL DEFAULT ARRAY['*'],
  created_at      timestamptz NOT NULL DEFAULT now(),
  updated_at      timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- CONVERSACIONES
-- ============================================================
CREATE TABLE conversations (
  id              uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  agent_id        uuid NOT NULL REFERENCES agents ON DELETE CASCADE,
  session_id      text NOT NULL,
  visitor_id      text,
  channel         text NOT NULL DEFAULT 'web' CHECK (channel IN ('web', 'embed', 'api', 'whatsapp', 'telegram')),
  metadata        jsonb NOT NULL DEFAULT '{}',
  started_at      timestamptz NOT NULL DEFAULT now(),
  ended_at        timestamptz,
  message_count   int NOT NULL DEFAULT 0,
  is_resolved     boolean NOT NULL DEFAULT false,
  UNIQUE(agent_id, session_id)
);

CREATE INDEX idx_conversations_agent_id ON conversations(agent_id);
CREATE INDEX idx_conversations_started_at ON conversations(started_at DESC);
CREATE INDEX idx_conversations_session_id ON conversations(session_id);

-- ============================================================
-- MENSAJES
-- ============================================================
CREATE TABLE messages (
  id                uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id   uuid NOT NULL REFERENCES conversations ON DELETE CASCADE,
  role              text NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
  content           text NOT NULL,
  tokens_used       int,
  model_used        text,
  latency_ms        int,
  created_at        timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX idx_messages_created_at ON messages(created_at DESC);

-- ============================================================
-- CLASIFICACIONES DE CONVERSACIONES
-- ============================================================
CREATE TABLE classifications (
  id                  uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  conversation_id     uuid NOT NULL REFERENCES conversations ON DELETE CASCADE UNIQUE,
  intent              text,
  sentiment           text CHECK (sentiment IN ('positivo', 'neutro', 'negativo')),
  urgency             text CHECK (urgency IN ('alta', 'media', 'baja')),
  topics              text[] NOT NULL DEFAULT ARRAY[]::text[],
  resolution          text CHECK (resolution IN ('resuelto', 'sin_resolver', 'escalado', 'fuera_de_scope')),
  satisfaction_score  float CHECK (satisfaction_score >= 1 AND satisfaction_score <= 5),
  summary             text,
  improvement_notes   text,
  classified_at       timestamptz NOT NULL DEFAULT now(),
  model_used          text
);

CREATE INDEX idx_classifications_conversation_id ON classifications(conversation_id);

-- ============================================================
-- ANALÍTICAS DIARIAS (pre-calculadas)
-- ============================================================
CREATE TABLE analytics_daily (
  id                    uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  org_id                uuid NOT NULL REFERENCES organizations ON DELETE CASCADE,
  agent_id              uuid NOT NULL REFERENCES agents ON DELETE CASCADE,
  date                  date NOT NULL,
  total_conversations   int NOT NULL DEFAULT 0,
  total_messages        int NOT NULL DEFAULT 0,
  avg_messages_per_conv float NOT NULL DEFAULT 0,
  avg_latency_ms        float NOT NULL DEFAULT 0,
  resolved_count        int NOT NULL DEFAULT 0,
  unresolved_count      int NOT NULL DEFAULT 0,
  sentiment_positive    int NOT NULL DEFAULT 0,
  sentiment_neutral     int NOT NULL DEFAULT 0,
  sentiment_negative    int NOT NULL DEFAULT 0,
  top_intents           jsonb NOT NULL DEFAULT '[]',
  top_topics            jsonb NOT NULL DEFAULT '[]',
  UNIQUE(org_id, agent_id, date)
);

CREATE INDEX idx_analytics_daily_agent_date ON analytics_daily(agent_id, date DESC);
CREATE INDEX idx_analytics_daily_org_date ON analytics_daily(org_id, date DESC);

-- ============================================================
-- SUGERENCIAS DE MEJORA DEL PROMPT
-- ============================================================
CREATE TABLE prompt_suggestions (
  id                uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  agent_id          uuid NOT NULL REFERENCES agents ON DELETE CASCADE,
  suggestion        text NOT NULL,
  reasoning         text,
  based_on_convs    int NOT NULL DEFAULT 0,
  status            text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'applied', 'dismissed')),
  created_at        timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_prompt_suggestions_agent_id ON prompt_suggestions(agent_id, status);

-- ============================================================
-- FUNCIONES Y TRIGGERS
-- ============================================================

-- Auto-actualizar updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_organizations_updated_at
  BEFORE UPDATE ON organizations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_agents_updated_at
  BEFORE UPDATE ON agents
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER trg_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Incrementar message_count al insertar mensaje
CREATE OR REPLACE FUNCTION increment_message_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE conversations
  SET message_count = message_count + 1
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_increment_message_count
  AFTER INSERT ON messages
  FOR EACH ROW EXECUTE FUNCTION increment_message_count();

-- Auto-crear perfil al registrarse
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================

ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE agents ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE classifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_daily ENABLE ROW LEVEL SECURITY;
ALTER TABLE prompt_suggestions ENABLE ROW LEVEL SECURITY;

-- Helper: obtener org_id del usuario autenticado
CREATE OR REPLACE FUNCTION get_user_org_id()
RETURNS uuid AS $$
  SELECT org_id FROM profiles WHERE id = auth.uid();
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- Organizations: crear durante el registro + leer/editar miembros
CREATE POLICY "authenticated_users_can_create_org" ON organizations
  FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "org_members_read_org" ON organizations
  FOR SELECT USING (id = get_user_org_id());

CREATE POLICY "org_owners_update_org" ON organizations
  FOR UPDATE USING (
    id = get_user_org_id() AND
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('owner', 'admin'))
  );

-- Profiles: cada usuario ve su propio perfil + compañeros de org
CREATE POLICY "service_insert_profiles" ON profiles
  FOR INSERT WITH CHECK (true);

CREATE POLICY "users_read_own_profile" ON profiles
  FOR SELECT USING (id = auth.uid() OR org_id = get_user_org_id());

CREATE POLICY "users_update_own_profile" ON profiles
  FOR UPDATE USING (id = auth.uid());

-- Agents: solo la org propietaria
CREATE POLICY "org_members_read_agents" ON agents
  FOR SELECT USING (org_id = get_user_org_id());

CREATE POLICY "org_admins_write_agents" ON agents
  FOR ALL USING (
    org_id = get_user_org_id() AND
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role IN ('owner', 'admin'))
  );

-- Conversations: lectura pública por agent_id (para el widget), escritura libre
CREATE POLICY "public_insert_conversations" ON conversations
  FOR INSERT WITH CHECK (true);

CREATE POLICY "org_members_read_conversations" ON conversations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM agents a
      WHERE a.id = agent_id AND a.org_id = get_user_org_id()
    )
  );

-- Messages: lectura pública (para el widget), escritura libre
CREATE POLICY "public_insert_messages" ON messages
  FOR INSERT WITH CHECK (true);

CREATE POLICY "public_read_own_conversation_messages" ON messages
  FOR SELECT USING (true);

-- Classifications: solo la org
CREATE POLICY "org_members_read_classifications" ON classifications
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM conversations c
      JOIN agents a ON a.id = c.agent_id
      WHERE c.id = conversation_id AND a.org_id = get_user_org_id()
    )
  );

CREATE POLICY "service_insert_classifications" ON classifications
  FOR INSERT WITH CHECK (true);

-- Analytics: solo la org
CREATE POLICY "org_members_read_analytics" ON analytics_daily
  FOR SELECT USING (org_id = get_user_org_id());

CREATE POLICY "service_upsert_analytics" ON analytics_daily
  FOR ALL WITH CHECK (true);

-- Prompt suggestions: solo la org
CREATE POLICY "org_members_read_suggestions" ON prompt_suggestions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM agents a
      WHERE a.id = agent_id AND a.org_id = get_user_org_id()
    )
  );

CREATE POLICY "org_admins_update_suggestions" ON prompt_suggestions
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM agents a
      WHERE a.id = agent_id AND a.org_id = get_user_org_id()
    )
  );

CREATE POLICY "service_insert_suggestions" ON prompt_suggestions
  FOR INSERT WITH CHECK (true);
