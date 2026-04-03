export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  public: {
    Tables: {
      organizations: {
        Row: {
          id: string
          name: string
          slug: string
          logo_url: string | null
          plan: 'free' | 'pro' | 'enterprise'
          settings: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          slug: string
          logo_url?: string | null
          plan?: 'free' | 'pro' | 'enterprise'
          settings?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          slug?: string
          logo_url?: string | null
          plan?: 'free' | 'pro' | 'enterprise'
          settings?: Json
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          id: string
          org_id: string | null
          full_name: string | null
          avatar_url: string | null
          role: 'owner' | 'admin' | 'member'
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          org_id?: string | null
          full_name?: string | null
          avatar_url?: string | null
          role?: 'owner' | 'admin' | 'member'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          org_id?: string | null
          full_name?: string | null
          avatar_url?: string | null
          role?: 'owner' | 'admin' | 'member'
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          }
        ]
      }
      agents: {
        Row: {
          id: string
          org_id: string
          name: string
          description: string | null
          system_prompt: string
          model: string
          temperature: number
          max_tokens: number
          language: string
          is_active: boolean
          widget_config: Json
          allowed_origins: string[]
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          org_id: string
          name: string
          description?: string | null
          system_prompt?: string
          model?: string
          temperature?: number
          max_tokens?: number
          language?: string
          is_active?: boolean
          widget_config?: Json
          allowed_origins?: string[]
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          org_id?: string
          name?: string
          description?: string | null
          system_prompt?: string
          model?: string
          temperature?: number
          max_tokens?: number
          language?: string
          is_active?: boolean
          widget_config?: Json
          allowed_origins?: string[]
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "agents_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          }
        ]
      }
      conversations: {
        Row: {
          id: string
          agent_id: string
          session_id: string
          visitor_id: string | null
          channel: 'web' | 'embed' | 'api' | 'whatsapp' | 'telegram'
          metadata: Json
          started_at: string
          ended_at: string | null
          message_count: number
          is_resolved: boolean
        }
        Insert: {
          id?: string
          agent_id: string
          session_id: string
          visitor_id?: string | null
          channel?: 'web' | 'embed' | 'api' | 'whatsapp' | 'telegram'
          metadata?: Json
          started_at?: string
          ended_at?: string | null
          message_count?: number
          is_resolved?: boolean
        }
        Update: {
          id?: string
          agent_id?: string
          session_id?: string
          visitor_id?: string | null
          channel?: 'web' | 'embed' | 'api' | 'whatsapp' | 'telegram'
          metadata?: Json
          started_at?: string
          ended_at?: string | null
          message_count?: number
          is_resolved?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "conversations_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          }
        ]
      }
      messages: {
        Row: {
          id: string
          conversation_id: string
          role: 'user' | 'assistant' | 'system'
          content: string
          tokens_used: number | null
          model_used: string | null
          latency_ms: number | null
          created_at: string
        }
        Insert: {
          id?: string
          conversation_id: string
          role: 'user' | 'assistant' | 'system'
          content: string
          tokens_used?: number | null
          model_used?: string | null
          latency_ms?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          conversation_id?: string
          role?: 'user' | 'assistant' | 'system'
          content?: string
          tokens_used?: number | null
          model_used?: string | null
          latency_ms?: number | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          }
        ]
      }
      classifications: {
        Row: {
          id: string
          conversation_id: string
          intent: string | null
          sentiment: 'positivo' | 'neutro' | 'negativo' | null
          urgency: 'alta' | 'media' | 'baja' | null
          topics: string[]
          resolution: 'resuelto' | 'sin_resolver' | 'escalado' | 'fuera_de_scope' | null
          satisfaction_score: number | null
          summary: string | null
          improvement_notes: string | null
          classified_at: string
          model_used: string | null
        }
        Insert: {
          id?: string
          conversation_id: string
          intent?: string | null
          sentiment?: 'positivo' | 'neutro' | 'negativo' | null
          urgency?: 'alta' | 'media' | 'baja' | null
          topics?: string[]
          resolution?: 'resuelto' | 'sin_resolver' | 'escalado' | 'fuera_de_scope' | null
          satisfaction_score?: number | null
          summary?: string | null
          improvement_notes?: string | null
          classified_at?: string
          model_used?: string | null
        }
        Update: {
          id?: string
          conversation_id?: string
          intent?: string | null
          sentiment?: 'positivo' | 'neutro' | 'negativo' | null
          urgency?: 'alta' | 'media' | 'baja' | null
          topics?: string[]
          resolution?: 'resuelto' | 'sin_resolver' | 'escalado' | 'fuera_de_scope' | null
          satisfaction_score?: number | null
          summary?: string | null
          improvement_notes?: string | null
          classified_at?: string
          model_used?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "classifications_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: true
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          }
        ]
      }
      analytics_daily: {
        Row: {
          id: string
          org_id: string
          agent_id: string
          date: string
          total_conversations: number
          total_messages: number
          avg_messages_per_conv: number
          avg_latency_ms: number
          resolved_count: number
          unresolved_count: number
          sentiment_positive: number
          sentiment_neutral: number
          sentiment_negative: number
          top_intents: Json
          top_topics: Json
        }
        Insert: {
          id?: string
          org_id: string
          agent_id: string
          date: string
          total_conversations?: number
          total_messages?: number
          avg_messages_per_conv?: number
          avg_latency_ms?: number
          resolved_count?: number
          unresolved_count?: number
          sentiment_positive?: number
          sentiment_neutral?: number
          sentiment_negative?: number
          top_intents?: Json
          top_topics?: Json
        }
        Update: {
          id?: string
          org_id?: string
          agent_id?: string
          date?: string
          total_conversations?: number
          total_messages?: number
          avg_messages_per_conv?: number
          avg_latency_ms?: number
          resolved_count?: number
          unresolved_count?: number
          sentiment_positive?: number
          sentiment_neutral?: number
          sentiment_negative?: number
          top_intents?: Json
          top_topics?: Json
        }
        Relationships: [
          {
            foreignKeyName: "analytics_daily_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "analytics_daily_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          }
        ]
      }
      prompt_suggestions: {
        Row: {
          id: string
          agent_id: string
          suggestion: string
          reasoning: string | null
          based_on_convs: number
          status: 'pending' | 'applied' | 'dismissed'
          created_at: string
        }
        Insert: {
          id?: string
          agent_id: string
          suggestion: string
          reasoning?: string | null
          based_on_convs?: number
          status?: 'pending' | 'applied' | 'dismissed'
          created_at?: string
        }
        Update: {
          id?: string
          agent_id?: string
          suggestion?: string
          reasoning?: string | null
          based_on_convs?: number
          status?: 'pending' | 'applied' | 'dismissed'
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "prompt_suggestions_agent_id_fkey"
            columns: ["agent_id"]
            isOneToOne: false
            referencedRelation: "agents"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

// Helper types para uso conveniente
export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row']

export type TablesInsert<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Insert']

export type TablesUpdate<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Update']

export type WidgetConfig = {
  primaryColor: string
  position: 'bottom-right' | 'bottom-left'
  welcomeMessage: string
  placeholder: string
  agentName: string
  showBranding: boolean
}

// Tipos de conveniencia
export type Organization = Tables<'organizations'>
export type Profile = Tables<'profiles'>
export type Agent = Tables<'agents'>
export type Conversation = Tables<'conversations'>
export type Message = Tables<'messages'>
export type Classification = Tables<'classifications'>
export type AnalyticsDaily = Tables<'analytics_daily'>
export type PromptSuggestion = Tables<'prompt_suggestions'>
