import Link from 'next/link'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 flex items-center justify-center">
      <div className="max-w-4xl mx-auto px-6 text-center">
        <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 rounded-full px-4 py-1.5 text-blue-400 text-sm font-medium mb-8">
          <span className="w-1.5 h-1.5 bg-blue-400 rounded-full animate-pulse" />
          Powered by OpenRouter + Supabase
        </div>

        <h1 className="text-5xl font-bold text-white mb-6 leading-tight">
          Agentes de IA para
          <span className="text-blue-400"> cualquier negocio</span>
        </h1>

        <p className="text-xl text-slate-400 mb-12 max-w-2xl mx-auto leading-relaxed">
          Despliega agentes conversacionales inteligentes en minutos.
          Con analíticas automáticas y mejora continua del sistema.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-20">
          <Link
            href="/register"
            className="inline-flex items-center justify-center h-12 px-8 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl transition-colors"
          >
            Empezar gratis
          </Link>
          <Link
            href="/login"
            className="inline-flex items-center justify-center h-12 px-8 bg-white/10 hover:bg-white/15 text-white font-semibold rounded-xl transition-colors border border-white/10"
          >
            Iniciar sesión
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-left">
          {[
            {
              icon: '💬',
              title: 'Widget embebible',
              desc: 'Una línea de código para integrarlo en cualquier web',
            },
            {
              icon: '📊',
              title: 'Analíticas automáticas',
              desc: 'Intenciones, sentimiento y temas detectados en cada conversación',
            },
            {
              icon: '🧠',
              title: 'Mejora continua',
              desc: 'Sugerencias automáticas para optimizar tu system prompt',
            },
          ].map(feat => (
            <div key={feat.title} className="bg-white/5 border border-white/10 rounded-2xl p-6">
              <div className="text-3xl mb-3">{feat.icon}</div>
              <h3 className="text-white font-semibold mb-2">{feat.title}</h3>
              <p className="text-slate-400 text-sm leading-relaxed">{feat.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
