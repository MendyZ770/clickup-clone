import Link from "next/link";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Conditions d'utilisation — Done",
  description: "Conditions d'utilisation de l'application Done.",
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      <div className="max-w-3xl mx-auto px-6 py-16">
        <Link
          href="/"
          className="text-sm text-white/40 hover:text-white/70 transition-colors"
        >
          ← Retour à l'accueil
        </Link>

        <h1 className="mt-6 text-3xl font-bold tracking-tight">
          Conditions d'utilisation
        </h1>
        <p className="mt-2 text-white/40 text-sm">
          Dernière mise à jour : 26 mai 2026
        </p>

        <div className="mt-10 space-y-10 text-white/70 leading-relaxed">
          <section>
            <h2 className="text-xl font-semibold text-white/90 mb-3">
              Objet du service
            </h2>
            <p>
              Done est un outil de gestion de projets et de finances destiné aux
              développeurs web, accessible en SaaS. L'utilisation du service est
              réservée à un usage personnel ou professionnel licite.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white/90 mb-3">
              Propriété des données
            </h2>
            <p>
              Vous restez propriétaire de l'ensemble des données que vous saisissez
              dans Done (projets, tâches, transactions financières, etc.). Nous ne
              revendons aucune donnée utilisateur à des tiers.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white/90 mb-3">
              Interdictions
            </h2>
            <p>Il est strictement interdit de :</p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>Procéder au reverse engineering de l'application.</li>
              <li>Tenter d'accéder aux données d'autres utilisateurs.</li>
              <li>Utiliser le service à des fins illégales ou malveillantes.</li>
              <li>
                Surcharger volontairement les serveurs (DDoS, scraping intensif,
                etc.).
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white/90 mb-3">
              Disponibilité
            </h2>
            <p>
              Le service est fourni en l'état (best-effort). Nous ne garantissons
              pas une disponibilité à 100 % et nous réservons le droit de
              suspendre temporairement l'accès pour maintenance.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white/90 mb-3">
              Juridiction
            </h2>
            <p>
              Les présentes conditions sont régies par le droit français. En cas
              de litige, les tribunaux compétents sont ceux du ressort de Paris.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white/90 mb-3">
              Contact
            </h2>
            <p>
              Pour toute question juridique, contactez-nous à{" "}
              <a
                href="mailto:support@done.app"
                className="text-purple-400 hover:text-purple-300"
              >
                support@done.app
              </a>
              .
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}
