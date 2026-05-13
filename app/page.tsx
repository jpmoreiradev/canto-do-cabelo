import Link from 'next/link'

export default function Home() {
  return (
    <main className="min-h-screen bg-zinc-950 text-zinc-100 flex flex-col">

      {/* ── Hero ── */}
      <section className="flex flex-col items-center justify-center px-6 pt-20 pb-16 text-center relative overflow-hidden">
        {/* glow de fundo */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-96 h-96 rounded-full bg-amber-500/5 blur-3xl" />
        </div>

        <img
          src="/image.png"
          alt="Canto do Cabelo"
          className="h-28 w-auto rounded-3xl mb-8 shadow-2xl ring-1 ring-zinc-800 relative"
        />
        <h1 className="text-5xl md:text-6xl font-black tracking-tight mb-4 relative">
          Canto do Cabelo
        </h1>
        <p className="text-zinc-400 text-lg md:text-xl max-w-sm leading-relaxed relative">
          Fila de espera digital. Cliente acompanha pelo celular, TV mostra em tempo real.
        </p>
      </section>

      {/* ── Como funciona ── */}
      <section className="px-6 pb-16 max-w-xl mx-auto w-full">
        <p className="text-xs font-semibold text-zinc-600 uppercase tracking-widest mb-8 text-center">
          Como funciona
        </p>

        <div className="relative">
          {/* linha vertical conectando os steps */}
          <div className="absolute left-4 top-4 bottom-4 w-px bg-zinc-800" />

          <ol className="space-y-0">
            {steps.map((s, i) => (
              <li key={i} className="flex gap-5 relative pb-8 last:pb-0">
                <span className="relative z-10 shrink-0 w-8 h-8 rounded-full bg-zinc-900 border border-zinc-700 flex items-center justify-center text-amber-400 font-black text-sm">
                  {i + 1}
                </span>
                <div className="pt-0.5 pb-2">
                  <p className="text-zinc-100 font-semibold">{s.title}</p>
                  <p className="text-zinc-500 text-sm mt-1 leading-relaxed">{s.desc}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ── Funcionalidades ── */}
      <section className="px-6 pb-16 max-w-xl mx-auto w-full">
        <p className="text-xs font-semibold text-zinc-600 uppercase tracking-widest mb-6 text-center">
          Funcionalidades
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {features.map((f, i) => (
            <div key={i} className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 flex items-start gap-3">
              <span className="text-xl shrink-0">{f.emoji}</span>
              <div>
                <p className="text-zinc-200 font-semibold text-sm">{f.title}</p>
                <p className="text-zinc-500 text-xs mt-0.5 leading-relaxed">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Acessos ── */}
      <section className="px-6 pb-20 max-w-xl mx-auto w-full">
        <p className="text-xs font-semibold text-zinc-600 uppercase tracking-widest mb-8 text-center">
          Acessos
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {links.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              target="_blank"
              className="group flex items-center gap-4 bg-zinc-900 border border-zinc-700 hover:border-amber-500 hover:bg-amber-500/5 rounded-2xl p-5 transition-all cursor-pointer active:scale-95"
            >
              <span className="text-2xl leading-none shrink-0">{l.emoji}</span>
              <div className="min-w-0 flex-1">
                <p className="font-bold text-amber-400">{l.label}</p>
                <p className="text-zinc-500 text-sm mt-0.5 leading-snug">{l.desc}</p>
                <span className="inline-flex items-center gap-1 text-xs text-zinc-400 group-hover:text-amber-400 mt-2 transition-colors">
                  Clique aqui para acessar
                  <svg className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      <footer className="mt-auto text-center text-zinc-800 text-xs pb-8">
        Canto do Cabelo
      </footer>
    </main>
  )
}

const steps = [
  {
    title: 'Escaneie o QR code na TV',
    desc: 'Ao chegar no salão, aponte a câmera do celular para o QR code exibido na tela.',
  },
  {
    title: 'Digite seu nome e entre na fila',
    desc: 'Escolha os serviços desejados e confirme. Você entra na fila na hora.',
  },
  {
    title: 'Acompanhe sua posição',
    desc: 'A TV mostra a fila em tempo real. Fique de olho em quando é a sua vez.',
  },
  {
    title: 'Aguarde ser chamado',
    desc: 'Quando chegar sua hora, seu nome aparece na tela como próximo a ser atendido.',
  },
]

const features = [
  {
    emoji: '📱',
    title: 'Acompanhe de fora',
    desc: 'Receba o link pelo WhatsApp e veja sua posição na fila sem precisar ficar no salão.',
  },
  {
    emoji: '⏱️',
    title: 'Tempo estimado',
    desc: 'O sistema calcula automaticamente quanto tempo falta até o seu atendimento.',
  },
  {
    emoji: '📺',
    title: 'TV em tempo real',
    desc: 'A tela do salão atualiza sozinha mostrando quem está sendo atendido e quem é o próximo.',
  },
  {
    emoji: '✂️',
    title: 'Múltiplos serviços',
    desc: 'Escolha corte, barba, sobrancelha e mais — tudo na mesma entrada na fila.',
  },
]

const links = [
  {
    emoji: '📺',
    label: 'Tela da TV',
    desc: 'Exibe a fila e o QR code de cadastro no salão.',
    href: '/tv',
  },
  {
    emoji: '🔧',
    label: 'Painel',
    desc: 'Gerenciar fila, clientes e configurações.',
    href: '/admin',
  },
]
