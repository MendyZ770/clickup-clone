import Link from "next/link";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Politique de confidentialité — Done",
  description: "Politique de confidentialité de l'application Done.",
};

export default function PrivacyPage() {
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
          Politique de confidentialité
        </h1>
        <p className="mt-2 text-white/40 text-sm">
          Dernière mise à jour : 26 mai 2026
        </p>

        <div className="mt-10 space-y-10 text-white/70 leading-relaxed">
          <section>
            <h2 className="text-xl font-semibold text-white/90 mb-3">
              Données collectées
            </h2>
            <p>
              Nous collectons uniquement les données nécessaires au fonctionnement
              de l'application :
            </p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>
                <strong>Email et mot de passe</strong> : création de compte et
                authentification (hashé avec bcrypt).
              </li>
              <li>
                <strong>Cookies de session</strong> : gestion de la connexion via
                NextAuth.
              </li>
              <li>
                <strong>Données financières</strong> : comptes bancaires et
                transactions que vous saisissez manuellement dans l'application.
              </li>
              <li>
                <strong>Push notifications</strong> : token d'appareil via VAPID
                pour les notifications web/mobile.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white/90 mb-3">
              Intégrations tierces
            </h2>
            <p>
              L'application peut synchroniser votre calendrier via{" "}
              <strong>Google Calendar</strong>. L'authentification OAuth utilise
              le scope <code>readonly</code> sur les événements uniquement. Nous
              ne stockons pas vos données de calendrier, nous les lisons
              temporairement pour la synchronisation.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white/90 mb-3">
              Hébergement et localisation des données
            </h2>
            <p>
              L'application est hébergée sur <strong>Vercel</strong> (Edge
              Network mondial) et la base de données sur <strong>Neon</strong>{" "}
              (PostgreSQL). Les données peuvent transiter ou être stockées dans
              l'Union européenne et les États-Unis. Nous avons signé des DPA
              (Data Processing Addendum) avec nos fournisseurs.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white/90 mb-3">
              Vos droits (RGPD)
            </h2>
            <p>
              Conformément au RGPD, vous disposez des droits suivants :
            </p>
            <ul className="list-disc list-inside mt-2 space-y-1">
              <li>
                <strong>Droit d'accès</strong> : obtenir une copie de vos données.
              </li>
              <li>
                <strong>Droit de rectification</strong> : corriger des données
                inexactes.
              </li>
              <li>
                <strong>Droit à l'effacement</strong> : demander la suppression
                de votre compte et de vos données.
              </li>
              <li>
                <strong>Droit à la portabilité</strong> : récupérer vos données
                dans un format structuré.
              </li>
            </ul>
            <p className="mt-3">
              Pour exercer ces droits, contactez-nous à{" "}
              <a
                href="mailto:support@done.app"
                className="text-purple-400 hover:text-purple-300"
              >
                support@done.app
              </a>
              .
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white/90 mb-3">
              Conservation des données
            </h2>
            <p>
              Vos données sont conservées tant que votre compte est actif. En cas
              de suppression de compte, nous supprimons vos données dans un délai
              de 30 jours, sauf obligation légale de conservation.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white/90 mb-3">
              Pas de tracking tiers
            </h2>
            <p>
              Nous n'utilisons pas de pixels de tracking, de publicité ciblée, ni
              d'analytics tiers. Les seules données collectées sont celles que
              vous saisissez volontairement dans l'application.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white/90 mb-3">
              Pas de revente
            </h2>
            <p>
              Nous ne revendons, ne louons et ne partageons pas vos données
              personnelles avec des tiers à des fins commerciales.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-white/90 mb-3">
              Contact
            </h2>
            <p>
              Pour toute question relative à cette politique, contactez-nous à{" "}
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

