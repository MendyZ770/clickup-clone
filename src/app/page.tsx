import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import Link from "next/link";

export default async function Home() {
  const session = await getServerSession(authOptions);

  if (session) {
    redirect("/dashboard");
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white overflow-hidden relative grain-overlay">
      {/* Ambient gradient blobs */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -left-40 w-[600px] h-[600px] rounded-full bg-purple-500/15 blur-[120px] animate-gradient" />
        <div className="absolute top-1/3 -right-20 w-[500px] h-[500px] rounded-full bg-indigo-500/10 blur-[100px] animate-gradient" style={{ animationDelay: "2s" }} />
        <div className="absolute -bottom-40 left-1/3 w-[500px] h-[500px] rounded-full bg-fuchsia-500/10 blur-[100px] animate-gradient" style={{ animationDelay: "4s" }} />
      </div>

      {/* Navigation */}
      <nav className="relative z-10 flex items-center justify-between px-6 lg:px-12 py-5">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-purple-500/25">
            <span className="text-white font-bold text-sm">D</span>
          </div>
          <span className="text-lg font-semibold tracking-tight">DevFlow</span>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/login"
            className="px-5 py-2 text-sm font-medium text-white/70 hover:text-white transition-colors rounded-full"
          >
            Se connecter
          </Link>
          <Link
            href="/register"
            className="px-5 py-2 text-sm font-medium rounded-full bg-white text-[#0a0a0f] hover:bg-white/90 transition-all shadow-lg shadow-white/10 hover:shadow-white/20"
          >
            Essai gratuit
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <main className="relative z-10">
        <section className="max-w-6xl mx-auto px-6 pt-20 pb-10 text-center stagger-children">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-white/10 bg-white/5 text-sm font-medium text-purple-300 backdrop-blur-sm">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Concu pour les developpeurs
          </div>

          {/* Title */}
          <h1 className="mt-8 text-5xl sm:text-6xl lg:text-7xl xl:text-8xl font-bold tracking-tight leading-[1.05]">
            <span className="bg-gradient-to-r from-purple-300 via-fuchsia-300 to-indigo-300 bg-clip-text text-transparent">
              Gerez vos projets.
            </span>
            <br />
            <span className="text-white">
              Livrez plus vite.
            </span>
          </h1>

          {/* Subtitle */}
          <p className="mt-6 text-lg sm:text-xl text-white/50 max-w-2xl mx-auto leading-relaxed font-light">
            L&apos;outil de gestion de projets pensé pour les développeurs web.
            Sprints, time tracking, kanban, calendrier — tout ce qu&apos;il faut
            pour livrer vos projets clients dans les temps.
          </p>

          {/* CTA */}
          <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/register"
              className="group w-full sm:w-auto px-8 py-3.5 text-base font-semibold rounded-full bg-gradient-to-r from-purple-500 to-indigo-600 text-white hover:from-purple-400 hover:to-indigo-500 transition-all shadow-xl shadow-purple-500/25 hover:shadow-purple-500/40 hover:-translate-y-0.5"
            >
              Commencer gratuitement
              <span className="inline-block ml-2 transition-transform group-hover:translate-x-1">→</span>
            </Link>
            <Link
              href="/login"
              className="w-full sm:w-auto px-8 py-3.5 text-base font-medium rounded-full border border-white/15 text-white/80 hover:text-white hover:border-white/30 hover:bg-white/5 transition-all"
            >
              Se connecter
            </Link>
          </div>
        </section>

        {/* Mac Mockup */}
        <section className="max-w-5xl mx-auto px-6 pt-16 pb-4 animate-fade-in-up" style={{ animationDelay: "0.6s", opacity: 0 }}>
          <div className="relative">
            {/* Glow behind Mac */}
            <div className="absolute inset-0 -z-10 blur-[80px] opacity-40">
              <div className="absolute inset-x-10 top-10 bottom-0 bg-gradient-to-b from-purple-500/50 via-indigo-500/30 to-transparent rounded-3xl" />
            </div>

            {/* Mac Frame */}
            <div className="relative rounded-2xl overflow-hidden border border-white/10 shadow-2xl shadow-purple-900/30">
              {/* Mac Top Bar */}
              <div className="bg-[#1c1c1e]/90 backdrop-blur-xl px-4 py-2.5 flex items-center gap-2 border-b border-white/5">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-[#ff5f57]" />
                  <div className="w-3 h-3 rounded-full bg-[#febc2e]" />
                  <div className="w-3 h-3 rounded-full bg-[#28c840]" />
                </div>
                <div className="flex-1 flex justify-center">
                  <div className="px-12 py-1 rounded-md bg-white/5 text-xs text-white/40 font-mono">
                    devflow.app/dashboard
                  </div>
                </div>
                <div className="w-14" />
              </div>

              {/* Mac Screen Content - App Preview */}
              <div className="bg-[#0f0f14] p-0">
                <div className="flex h-[420px] sm:h-[480px]">
                  {/* Sidebar Preview */}
                  <div className="w-56 bg-[#12121a] border-r border-white/5 p-4 hidden sm:block">
                    <div className="flex items-center gap-2 mb-6">
                      <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-purple-500 to-indigo-600" />
                      <span className="text-sm font-medium text-white/80">Mon Agence</span>
                    </div>
                    <div className="space-y-1">
                      {["Dashboard", "Projets clients", "Time tracking"].map((item, i) => (
                        <div key={item} className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs ${i === 1 ? "bg-white/5 text-white" : "text-white/40"}`}>
                          <div className={`w-1.5 h-1.5 rounded-full ${i === 1 ? "bg-purple-400" : "bg-white/20"}`} />
                          {item}
                        </div>
                      ))}
                    </div>
                    <div className="mt-6 mb-2 text-[10px] font-medium text-white/25 uppercase tracking-wider px-3">Espaces</div>
                    {["Frontend", "Backend", "DevOps"].map((space, i) => (
                      <div key={space} className="flex items-center gap-2 px-3 py-1.5 text-xs text-white/40">
                        <div className={`w-2 h-2 rounded-sm ${["bg-blue-400", "bg-emerald-400", "bg-orange-400"][i]}`} />
                        {space}
                      </div>
                    ))}
                  </div>

                  {/* Main Content - Kanban Preview */}
                  <div className="flex-1 p-5">
                    <div className="flex items-center justify-between mb-5">
                      <div>
                        <div className="text-sm font-semibold text-white/90">Sprint 12 — Site e-commerce</div>
                        <div className="text-[11px] text-white/30 mt-0.5">12 taches · 3 assignes</div>
                      </div>
                      <div className="flex gap-1.5">
                        {["List", "Board", "Cal"].map((v, i) => (
                          <div key={v} className={`px-3 py-1 rounded-md text-[10px] font-medium ${i === 1 ? "bg-purple-500/20 text-purple-300" : "text-white/30"}`}>{v}</div>
                        ))}
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-3 h-[calc(100%-60px)]">
                      {[
                        { title: "A faire", color: "bg-slate-500", cards: ["Setup CI/CD pipeline", "Config Tailwind v4", "API endpoints auth"] },
                        { title: "En cours", color: "bg-blue-500", cards: ["Composants UI", "Integration Stripe"] },
                        { title: "Termine", color: "bg-emerald-500", cards: ["Maquettes Figma", "Schema DB", "Setup Next.js 14", "Tests unitaires"] },
                      ].map((col) => (
                        <div key={col.title} className="flex flex-col">
                          <div className="flex items-center gap-2 mb-3">
                            <div className={`w-2 h-2 rounded-full ${col.color}`} />
                            <span className="text-[11px] font-medium text-white/60">{col.title}</span>
                            <span className="text-[10px] text-white/20 ml-auto">{col.cards.length}</span>
                          </div>
                          <div className="space-y-2 flex-1">
                            {col.cards.map((card) => (
                              <div key={card} className="p-3 rounded-lg bg-white/[0.03] border border-white/5 hover:border-white/10 transition-colors group">
                                <div className="text-[11px] text-white/70 font-medium leading-snug">{card}</div>
                                <div className="flex items-center gap-2 mt-2">
                                  <div className="w-4 h-4 rounded-full bg-gradient-to-br from-purple-400 to-pink-400" />
                                  <div className="text-[9px] text-white/25">2j</div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Mac Stand/Chin - Realistic effect */}
            <div className="mx-auto w-1/4 h-4 bg-gradient-to-b from-[#2a2a2e] to-[#1c1c1e] rounded-b-lg border-x border-b border-white/5" />
            <div className="mx-auto w-1/3 h-1 bg-gradient-to-r from-transparent via-white/5 to-transparent" />
          </div>
        </section>

        {/* Features Grid */}
        <section className="max-w-6xl mx-auto px-6 py-24">
          <div className="text-center mb-16 stagger-children">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
              Tout ce dont un{" "}
              <span className="bg-gradient-to-r from-purple-300 to-indigo-300 bg-clip-text text-transparent">dev</span>{" "}
              a besoin
            </h2>
            <p className="mt-4 text-white/40 max-w-xl mx-auto">
              Fini les outils eparpilles. Un seul espace pour planifier, developper et livrer.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              {
                icon: "📋",
                title: "Kanban & Sprints",
                desc: "Vue board, liste ou calendrier. Organisez vos sprints comme vous voulez.",
                gradient: "from-purple-500/10 to-indigo-500/10",
              },
              {
                icon: "⏱",
                title: "Time Tracking",
                desc: "Chronometrez votre temps par tache. Generez des rapports pour vos clients.",
                gradient: "from-blue-500/10 to-cyan-500/10",
              },
              {
                icon: "🔗",
                title: "Dependances",
                desc: "Gerez les blocages entre taches. Visualisez le chemin critique de vos projets.",
                gradient: "from-emerald-500/10 to-teal-500/10",
              },
              {
                icon: "📅",
                title: "Sync Calendrier",
                desc: "Synchronisez avec Apple Calendar, Google Calendar ou Samsung Calendar.",
                gradient: "from-orange-500/10 to-amber-500/10",
              },
              {
                icon: "🎨",
                title: "Champs personnalises",
                desc: "Ajoutez vos propres champs : budget, stack technique, lien Figma...",
                gradient: "from-pink-500/10 to-rose-500/10",
              },
              {
                icon: "📊",
                title: "Dashboard analytics",
                desc: "Suivez la progression de vos projets avec des graphiques en temps reel.",
                gradient: "from-violet-500/10 to-purple-500/10",
              },
            ].map((feature) => (
              <div
                key={feature.title}
                className={`group relative p-6 rounded-2xl bg-gradient-to-br ${feature.gradient} border border-white/5 hover:border-white/10 transition-all duration-300 hover:-translate-y-1`}
              >
                <div className="text-2xl mb-3">{feature.icon}</div>
                <h3 className="text-base font-semibold text-white/90 mb-1">{feature.title}</h3>
                <p className="text-sm text-white/40 leading-relaxed">{feature.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Social proof / Stats */}
        <section className="max-w-4xl mx-auto px-6 py-16">
          <div className="grid grid-cols-3 gap-8 text-center">
            {[
              { value: "150+", label: "Fichiers source" },
              { value: "25+", label: "API endpoints" },
              { value: "100%", label: "TypeScript" },
            ].map((stat) => (
              <div key={stat.label}>
                <div className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-purple-300 to-indigo-300 bg-clip-text text-transparent">
                  {stat.value}
                </div>
                <div className="text-sm text-white/30 mt-1">{stat.label}</div>
              </div>
            ))}
          </div>
        </section>

        {/* Final CTA */}
        <section className="max-w-3xl mx-auto px-6 py-20 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight mb-4">
            Pret a{" "}
            <span className="bg-gradient-to-r from-purple-300 via-fuchsia-300 to-indigo-300 bg-clip-text text-transparent">
              booster
            </span>{" "}
            vos projets ?
          </h2>
          <p className="text-white/40 mb-8 max-w-lg mx-auto">
            Rejoignez des developpeurs qui gerent leurs projets clients plus efficacement.
          </p>
          <Link
            href="/register"
            className="inline-flex items-center gap-2 px-8 py-3.5 text-base font-semibold rounded-full bg-gradient-to-r from-purple-500 to-indigo-600 text-white hover:from-purple-400 hover:to-indigo-500 transition-all shadow-xl shadow-purple-500/25 hover:shadow-purple-500/40 hover:-translate-y-0.5"
          >
            Commencer gratuitement
            <span>→</span>
          </Link>
        </section>
      </main>

      {/* Footer */}
      <footer className="relative z-10 px-6 py-8 text-center text-sm text-white/20 border-t border-white/5">
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 rounded-md bg-gradient-to-br from-purple-500 to-indigo-600" />
            <span className="font-medium text-white/40">DevFlow</span>
          </div>
          <p>Construit avec Next.js, Tailwind CSS et Prisma</p>
        </div>
      </footer>
    </div>
  );
}
