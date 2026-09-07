import { localizePath } from "./locales.js";
import { REMBRANDT_PROJECT_ROUTE } from "./rembrandtProject.js";

export function buildDesktopPrimaryNavigation({
  translate,
  language,
  showRembrandtProject,
}) {
  const links = [
    { id: "topstukken", label: translate("nav.topstukken"), path: "/topstukken" },
    { id: "catalogus", label: translate("nav.collectie"), path: "/collectie" },
    { id: "herkomst", label: translate("nav.herkomst"), path: "/herkomst" },
    { id: "rembrandt-project", label: translate("nav.rembrandtProject"), path: REMBRANDT_PROJECT_ROUTE },
  ];
  return links
    .filter((link) => link.id !== "rembrandt-project" || showRembrandtProject)
    .map(({ path, ...link }) => ({
      ...link,
      href: localizePath(path, language),
    }));
}
