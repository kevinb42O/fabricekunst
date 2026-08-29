import { next } from "@vercel/functions";

export const config = {
  runtime: "nodejs",
  matcher: [
    "/rembrandt-project",
    "/en/rembrandt-project",
    "/fr/rembrandt-project",
  ],
};

const NOT_FOUND_COPY = {
  nl: ["Pagina niet gevonden", "Deze pagina is momenteel niet beschikbaar."],
  en: ["Page not found", "This page is currently unavailable."],
  fr: ["Page introuvable", "Cette page n’est actuellement pas disponible."],
};

const notFoundResponse = (request) => {
  const pathname = new URL(request.url).pathname;
  const language = pathname.startsWith("/en/")
    ? "en"
    : pathname.startsWith("/fr/")
      ? "fr"
      : "nl";
  const [title, description] = NOT_FOUND_COPY[language];
  const home = language === "nl" ? "/" : `/${language}`;
  const back = language === "en" ? "Back to home" : language === "fr" ? "Retour à l’accueil" : "Terug naar home";
  const html = `<!doctype html><html lang="${language}"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="robots" content="noindex,nofollow"><title>${title} — Atelier Rembrandt</title><style>html{color:#1c1a17;background:#fffefc;font-family:Georgia,serif}body{min-height:100vh;margin:0;display:grid;place-items:center}main{text-align:center;padding:2rem}img{width:min(280px,70vw);height:auto}h1{font-weight:400;font-size:clamp(2rem,5vw,3.5rem);margin:2rem 0 .75rem}p{color:#62594f;margin:0 0 2rem}a{color:#4a1521;text-transform:uppercase;letter-spacing:.14em;font:600 .75rem Arial,sans-serif;text-underline-offset:.4rem}</style></head><body><main><img src="/images/Atelier Rembrandt.png" alt="Atelier Rembrandt"><h1>${title}</h1><p>${description}</p><a href="${home}">${back}</a></main></body></html>`;
  return new Response(html, {
    status: 404,
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "private, no-store, max-age=0",
      "X-Robots-Tag": "noindex, nofollow",
    },
  });
};

export default async function rembrandtProjectGate(request) {
  try {
    const accessUrl = new URL(
      "/api/public-content?resource=rembrandt-project-access",
      request.url,
    );
    const response = await fetch(accessUrl, {
      method: "GET",
      cache: "no-store",
      headers: { Accept: "application/json" },
    });
    const access = await response.json().catch(() => null);
    if (response.ok && access?.enabled === true) return next();
  } catch {
    // Availability or configuration failures must never open a hidden route.
  }
  return notFoundResponse(request);
}
