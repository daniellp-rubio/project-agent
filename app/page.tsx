import Link from 'next/link'

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="max-w-4xl mx-auto px-6 py-20 text-center">

        <div className="inline-flex items-center gap-2 bg-blue-50 border border-blue-100 text-blue-700 text-sm font-medium px-4 py-1.5 rounded-full mb-8">
          <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
          Plataforma de Agentes IA
        </div>

        <h1 className="text-5xl font-bold text-blue-900 mb-6 leading-tight tracking-tight">
          Agentes de Inteligencia Artificial (IA)
          <span className="text-blue-500"></span>
        </h1>

        <p className="text-xl text-gray-500 mb-12 max-w-2xl mx-auto leading-relaxed">
          Convierte chats en citas automáticamente.
          Agentes inteligentes que califican pacientes y te muestran por qué no están agendando.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-20">
          <Link
            href="/register"
            className="inline-flex items-center justify-center h-12 px-8 bg-emerald-500 hover:bg-emerald-400 text-white font-semibold rounded-xl transition-colors shadow-sm"
          >
            Empezar gratis
          </Link>
          <Link
            href="/login"
            className="inline-flex items-center justify-center h-12 px-8 bg-white hover:bg-gray-50 text-gray-900 font-semibold rounded-xl transition-colors border border-gray-200"
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
            <div key={feat.title} className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
              <div className="text-3xl mb-3">{feat.icon}</div>
              <h3 className="text-gray-900 font-semibold mb-2">{feat.title}</h3>
              <p className="text-gray-500 text-sm leading-relaxed">{feat.desc}</p>
            </div>
          ))}
        </div>

      </div>
    </div>
  )
}
