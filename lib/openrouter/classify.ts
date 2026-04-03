import { chatCompletion } from './chat'
import { Message } from '@/lib/supabase/types'

export type ClassificationResult = {
  intent: string
  sentiment: 'positivo' | 'neutro' | 'negativo'
  urgency: 'alta' | 'media' | 'baja'
  topics: string[]
  resolution: 'resuelto' | 'sin_resolver' | 'escalado' | 'fuera_de_scope'
  satisfaction_score: number
  summary: string
  improvement_notes: string
}

export async function classifyConversation(
  messages: Pick<Message, 'role' | 'content'>[],
  businessContext: string = ''
): Promise<ClassificationResult> {
  const conversationText = messages
    .filter(m => m.role !== 'system')
    .map(m => `${m.role === 'user' ? 'Cliente' : 'Agente'}: ${m.content}`)
    .join('\n')

  const prompt = `Eres un clasificador experto de conversaciones de servicio al cliente.
Analiza la siguiente conversación y devuelve ÚNICAMENTE un JSON válido sin markdown.

CONVERSACIÓN:
${conversationText}

${businessContext ? `CONTEXTO DEL NEGOCIO:\n${businessContext}\n` : ''}

Devuelve este JSON exacto (sin markdown, sin explicaciones extra):
{
  "intent": "<categoría principal de lo que quería el usuario, en español, máx 30 caracteres>",
  "sentiment": "positivo|neutro|negativo",
  "urgency": "alta|media|baja",
  "topics": ["<tema1>", "<tema2>", "<tema3>"],
  "resolution": "resuelto|sin_resolver|escalado|fuera_de_scope",
  "satisfaction_score": <número decimal entre 1.0 y 5.0>,
  "summary": "<resumen en 1-2 oraciones de qué pasó en la conversación>",
  "improvement_notes": "<qué podría hacer mejor el agente en esta situación específica>"
}`

  const model = process.env.OPENROUTER_CLASSIFY_MODEL ?? 'openai/gpt-4o-mini'

  const result = await chatCompletion({
    model,
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.1,
    maxTokens: 500,
  })

  const raw = result.content.trim()
  // Extraer JSON si viene envuelto en código markdown
  const jsonMatch = raw.match(/\{[\s\S]*\}/)
  if (!jsonMatch) throw new Error('Clasificador no devolvió JSON válido')

  const parsed = JSON.parse(jsonMatch[0]) as ClassificationResult

  // Validar campos críticos
  if (!['positivo', 'neutro', 'negativo'].includes(parsed.sentiment)) {
    parsed.sentiment = 'neutro'
  }
  if (!['alta', 'media', 'baja'].includes(parsed.urgency)) {
    parsed.urgency = 'media'
  }
  if (!['resuelto', 'sin_resolver', 'escalado', 'fuera_de_scope'].includes(parsed.resolution)) {
    parsed.resolution = 'sin_resolver'
  }
  parsed.satisfaction_score = Math.min(5, Math.max(1, Number(parsed.satisfaction_score) || 3))
  if (!Array.isArray(parsed.topics)) parsed.topics = []

  return parsed
}

export async function generatePromptSuggestion(
  agentName: string,
  currentPrompt: string,
  improvementNotes: string[]
): Promise<{ suggestion: string; reasoning: string }> {
  const model = process.env.OPENROUTER_CLASSIFY_MODEL ?? 'openai/gpt-4o-mini'

  const prompt = `Eres un experto en optimización de system prompts para agentes de IA conversacionales.

El agente "${agentName}" tiene el siguiente system prompt:
---
${currentPrompt}
---

En las últimas conversaciones analizadas, se detectaron estas áreas de mejora:
${improvementNotes.map((note, i) => `${i + 1}. ${note}`).join('\n')}

Genera UNA sugerencia concreta y accionable para mejorar el system prompt.
Devuelve SOLO un JSON:
{
  "suggestion": "<la sugerencia específica, máx 200 caracteres>",
  "reasoning": "<por qué esta mejora tendría impacto, máx 150 caracteres>"
}`

  const result = await chatCompletion({
    model,
    messages: [{ role: 'user', content: prompt }],
    temperature: 0.3,
    maxTokens: 300,
  })

  const jsonMatch = result.content.trim().match(/\{[\s\S]*\}/)
  if (!jsonMatch) throw new Error('No se pudo generar sugerencia')
  return JSON.parse(jsonMatch[0])
}
