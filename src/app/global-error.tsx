"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="fr">
      <body
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "100vh",
          margin: 0,
          background: "#0B0F19",
          color: "#E6E8EC",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <main style={{ maxWidth: "32rem", textAlign: "center", padding: "2rem" }}>
          <h1 style={{ fontSize: "1.25rem", marginBottom: "0.75rem" }}>
            Une erreur inattendue est survenue
          </h1>
          <p style={{ opacity: 0.75, marginBottom: "1.5rem" }}>
            L’application a rencontré un problème. Réessayez, sinon revenez au
            tableau de bord.
          </p>
          {error.digest ? (
            <p style={{ fontSize: "0.75rem", opacity: 0.5, marginBottom: "1rem" }}>
              Référence : {error.digest}
            </p>
          ) : null}
          <button
            type="button"
            onClick={reset}
            style={{
              background: "#7B68EE",
              color: "#fff",
              border: 0,
              borderRadius: "0.5rem",
              padding: "0.6rem 1.2rem",
              cursor: "pointer",
              fontWeight: 600,
            }}
          >
            Réessayer
          </button>
        </main>
      </body>
    </html>
  );
}
